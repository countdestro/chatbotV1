import { AppSettings, Message, Persona } from '../types';
import { assembleContextPrompt } from './memory';
import { DEFAULT_OPENROUTER_KEY, DEFAULT_BACKUP_OPENROUTER_KEY } from './supabase';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_OUTPUT_TOKENS = 1000; // 1,000 output tokens (~4,000 characters for complete, expressive 2-3 paragraph replies)
const MAX_PROMPT_TOKENS = 5000; // 5,000 context tokens (5,000 context + 1,000 output = 6,000 total token budget)
const RETRYABLE_STATUSES = new Set([401, 402, 403, 429, 500, 502, 503, 504]);

export interface StreamChatOptions {
  persona: Persona;
  messages: Message[];
  settings: AppSettings;
  /** Optional cached summary string loaded by ChatScreen on mount. */
  cachedSummary?: string | null;
  onToken: (token: string, fullAccumulated: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

function splitKeys(values: Array<string | undefined>): string[] {
  return [...new Set(values
    .flatMap(value => (value || '').split(/[\n,]+/))
    .map(key => key.trim())
    .filter(Boolean))];
}

function getErrorMessage(body: unknown, status: number, statusText: string): string {
  const payload = body as { error?: { message?: string } | string; message?: string };
  if (typeof payload?.error === 'string') return payload.error;
  return payload?.error?.message || payload?.message || `Status ${status} ${statusText}`;
}

async function readError(response: Response): Promise<string> {
  try {
    return getErrorMessage(await response.json(), response.status, response.statusText);
  } catch {
    return `Status ${response.status} ${response.statusText}`;
  }
}

function trimRepeatedTail(text: string): string | null {
  const words = [...text.matchAll(/[\p{L}\p{N}']+/gu)].slice(-240);
  const maxPhraseLength = Math.min(80, Math.floor(words.length / 3));

  // Stop only on an exact phrase of at least 12 words repeated three times.
  for (let phraseLength = 12; phraseLength <= maxPhraseLength; phraseLength += 1) {
    const firstCopy = words.length - phraseLength * 3;
    let repeated = true;

    for (let offset = 0; offset < phraseLength && repeated; offset += 1) {
      const expected = words[firstCopy + offset][0].toLocaleLowerCase();
      for (let copy = 1; copy < 3; copy += 1) {
        if (words[firstCopy + copy * phraseLength + offset][0].toLocaleLowerCase() !== expected) {
          repeated = false;
          break;
        }
      }
    }

    if (repeated) {
      const firstCopyEnd = words[firstCopy + phraseLength - 1];
      return text.slice(0, firstCopyEnd.index! + firstCopyEnd[0].length).trimEnd();
    }
  }

  return null;
}

export function sanitizeFormatting(text: string): string {
  if (!text) return text;
  // Strip asterisks inside quotation marks: "*words*" -> "words"
  let cleaned = text.replace(/"([^"]*)"/g, (_, inner) => `"${inner.replace(/\*/g, '')}"`);
  cleaned = cleaned.replace(/\u201c([^\u201d]*)\u201d/g, (_, inner) => `\u201c${inner.replace(/\*/g, '')}\u201d`);
  // Merge fragmented asterisks: *word1* *word2* -> *word1 word2*
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/\*([^*\n]+)\*\s*\*([^*\n]+)\*/g, '*$1 $2*');
  }
  return cleaned;
}

async function requestWithKeyFailover(
  keys: string[],
  endpoint: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> {
  if (!keys.length) throw new Error('No API key is configured for the selected provider.');

  let lastError = 'No API key could complete the request.';
  for (let index = 0; index < keys.length; index += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${keys[index]}` },
        body: JSON.stringify(body),
        signal,
      });

      if (response.ok) return response;

      lastError = `API Error (${response.status}): ${await readError(response)}`;
      if (!RETRYABLE_STATUSES.has(response.status) || index === keys.length - 1) {
        throw new Error(lastError);
      }
    } catch (error) {
      if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error;
      if (error instanceof Error && error.message.startsWith('API Error')) throw error;
      lastError = error instanceof Error ? error.message : String(error);
      if (index === keys.length - 1) throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

async function streamResponse(
  response: Response,
  onToken: StreamChatOptions['onToken']
): Promise<string> {
  if (!response.body) throw new Error('ReadableStream is not supported in this browser.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let finished = false;
  let loopStopped = false;
  let nextLoopCheckAt = 128;

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;

    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') {
      finished = true;
      return;
    }

    let chunk: any;
    try {
      chunk = JSON.parse(data);
    } catch {
      throw new Error('Received an invalid streaming response from the model provider.');
    }
    if (chunk.error) throw new Error(getErrorMessage(chunk, 0, 'Streaming error'));

    const token = chunk.choices?.[0]?.delta?.content
      ?? chunk.choices?.[0]?.message?.content
      ?? '';
    if (typeof token !== 'string' || !token) return;

    fullText += token;
    onToken(token, fullText);

    if (fullText.length >= nextLoopCheckAt) {
      nextLoopCheckAt = fullText.length + 64;
      const trimmed = trimRepeatedTail(fullText);
      if (trimmed !== null) {
        fullText = trimmed;
        loopStopped = true;
        finished = true;
        onToken('', fullText);
      }
    }
  };

  try {
    while (!finished) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() && !line.trimStart().startsWith(':')) consumeLine(line);
        if (finished) break;
      }
    }

    buffer += decoder.decode();
    if (!finished && buffer.trim()) consumeLine(buffer);
    if (loopStopped) await reader.cancel().catch(() => undefined);
    return fullText.trim();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
}

export async function streamChatCompletion({
  persona,
  messages,
  settings,
  cachedSummary,
  onToken,
  onComplete,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  try {
    const useGroq = persona.model_provider === 'groq' && Boolean(settings.groqApiKey);
    const endpoint = useGroq ? GROQ_ENDPOINT : OPENROUTER_ENDPOINT;
    const keys = useGroq
      ? splitKeys([settings.groqApiKey])
      : splitKeys([
          settings.openRouterApiKey,
          settings.backupOpenRouterApiKey,
          DEFAULT_OPENROUTER_KEY,
          DEFAULT_BACKUP_OPENROUTER_KEY,
        ]);

    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    const model = useGroq
      ? (groqModels.includes(persona.model_name)
          ? persona.model_name
          : (groqModels.includes(settings.defaultModel) ? settings.defaultModel : groqModels[0]))
      : (persona.model_name || settings.defaultModel || 'deepseek/deepseek-chat');

    const prompt = assembleContextPrompt(
      persona,
      messages,
      settings.userDisplayName,
      settings.userPersonaBio,
      18,
      cachedSummary,
      MAX_PROMPT_TOKENS,
    );

    const isNsfwPersona = Boolean(persona.is_nsfw);
    const temperature = persona.temperature ?? settings.temperature ?? 0.95;
    const requestBody: Record<string, unknown> = {
      model,
      messages: prompt.messages,
      temperature: isNsfwPersona ? Math.min(1, temperature + 0.05) : temperature,
      max_tokens: Math.min(persona.max_tokens || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
      top_p: settings.topP ?? 0.95,
      frequency_penalty: settings.frequencyPenalty ?? 0.85,
      presence_penalty: settings.presencePenalty ?? 0.75,
      stream: true,
      ...(!useGroq ? { repetition_penalty: 1.15 } : {}),
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!useGroq) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'AI Companion Hub';
    }

    const response = await requestWithKeyFailover(keys, endpoint, headers, requestBody, signal);
    const answer = await streamResponse(response, onToken);
    if (!signal?.aborted) onComplete(sanitizeFormatting(answer));
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return;
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
