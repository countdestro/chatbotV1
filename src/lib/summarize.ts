/**
 * summarize.ts
 * -----------
 * Handles automatic chat summarisation:
 *  - Builds a compact transcript from the message list.
 *  - Calls OpenRouter (dedicated summarisation key, cheap 8B model) to produce
 *    a 150-200-word summary paragraph.
 *  - Persists the summary in Supabase (chat_summaries table) + localStorage cache.
 *  - Provides loadChatSummary() for ChatScreen to read back on mount.
 *
 * Summarisation is fire-and-forget: errors are swallowed so they never break
 * the main chat flow.
 */

import { Message } from '../types';
import { getSupabaseClient } from './supabase';

// ── Constants ──────────────────────────────────────────────────────────────

/** Dedicated OpenRouter key exclusively for summarisation (configured in settings). */
export const SUMMARIZATION_OR_KEY = '';

/** Model used for summarisation – confirmed working on the free-tier summarisation key. */
const SUMMARIZATION_MODEL = 'minimax/minimax-m3.1-flash:free';

/** Maximum words allowed in the summary before we trim it. */
const MAX_SUMMARY_WORDS = 250;

/** Number of new bot replies between automatic incremental summarisation runs. */
export const SUMMARY_INTERVAL = 10;

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// ── Local cache helpers ────────────────────────────────────────────────────

function localKey(chatId: string) {
  return `janitor_summary_${chatId}`;
}

function readLocalSummary(chatId: string): string | null {
  try {
    return localStorage.getItem(localKey(chatId));
  } catch {
    return null;
  }
}

function writeLocalSummary(chatId: string, summary: string) {
  try {
    localStorage.setItem(localKey(chatId), summary);
  } catch {
    // ignore quota errors
  }
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildSummarisationPrompt(
  messages: Message[],
  existingSummary?: string | null
): string {
  // Build a plain-text transcript (skip system messages – they're instructions, not events)
  const transcript = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      // Use the currently selected swipe if available
      const content =
        m.swipes && m.current_swipe !== undefined && m.swipes[m.current_swipe]
          ? m.swipes[m.current_swipe]
          : m.content;
      return `${role}: ${content}`;
    })
    .join('\n');

  if (existingSummary) {
    // Incremental update: extend existing summary with new content
    return `You are a memory-log assistant updating an ongoing conversation summary.

EXISTING SUMMARY:
${existingSummary}

NEW CONVERSATION EXCERPT (extend the summary with these new events):
${transcript}

Write an updated summary in ONE paragraph of 150-200 words.
Include: user preferences, hobbies, personal details, key story events, relationship milestones, emotional moments, decisions, promises, and future plans.
Keep the full context from the existing summary; do NOT drop any important facts.
Write in plain prose. No bullet points. No markdown.`;
  }

  // Full summarisation from scratch
  return `You are a memory-log assistant.
Summarise the conversation below in ONE paragraph of 150-200 words.
Include: user preferences, hobbies, personal details disclosed, key story events, relationship milestones, emotional moments, explicit decisions, promises, and future plans.
Do NOT invent anything not explicitly present in the conversation.
Write in plain prose. No bullet points. No markdown.

[CONVERSATION]
${transcript}
[END]`;
}

// ── Word-count guard ───────────────────────────────────────────────────────

function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '…';
}

// ── Core summarisation call ────────────────────────────────────────────────

async function callSummarizationAPI(prompt: string): Promise<string> {
  const body = {
    model: SUMMARIZATION_MODEL,
    messages: [
      {
        role: 'user' as const,
        content: prompt,
      },
    ],
    max_tokens: 1600,
    temperature: 0.3,
    stream: false,
  };

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUMMARIZATION_OR_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Companion Hub – Summariser',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Summarisation API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const raw: string =
    json?.choices?.[0]?.message?.content ||
    json?.choices?.[0]?.text ||
    '';

  if (!raw.trim()) throw new Error('Summarisation returned empty response.');

  return trimToWordLimit(raw.trim(), MAX_SUMMARY_WORDS);
}

// ── Supabase persistence ───────────────────────────────────────────────────

async function persistSummaryToSupabase(
  chatId: string,
  summary: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  // Check if a row already exists for this chat_id
  const { data: existing } = await supabase
    .from('chat_summaries')
    .select('id')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('chat_summaries')
      .update({
        summary,
        updated_at: new Date().toISOString(),
        model_used: SUMMARIZATION_MODEL,
      })
      .eq('id', existing.id);

    if (error) {
      console.warn('[Summarise] Supabase update failed:', error.message);
    }
  } else {
    const { error } = await supabase.from('chat_summaries').insert({
      chat_id: chatId,
      summary,
      updated_at: new Date().toISOString(),
      model_used: SUMMARIZATION_MODEL,
    });

    if (error) {
      console.warn('[Summarise] Supabase insert failed:', error.message);
    }
  }
}

// ── Public: summarise + cache ──────────────────────────────────────────────

/**
 * Summarises the given message array for the specified chat, then stores
 * the result in both Supabase and localStorage.
 *
 * @param chatId   - UUID of the current chat.
 * @param messages - Full message list as held by ChatScreen.
 * @param incremental - If true, reads the existing cached summary and extends
 *                      it with only the latest turns (saves tokens).
 */
export async function summarizeAndCache(
  chatId: string,
  messages: Message[],
  incremental = false
): Promise<void> {
  // Need at least a couple of meaningful exchanges to summarise
  const meaningful = messages.filter(m => m.role !== 'system');
  if (meaningful.length < 4) return;

  try {
    const existingSummary = incremental ? readLocalSummary(chatId) : null;

    // For incremental updates: only send the most recent 20 messages to the API
    const messagesToSummarize = incremental
      ? messages.slice(-20)
      : messages;

    const prompt = buildSummarisationPrompt(messagesToSummarize, existingSummary);
    const summary = await callSummarizationAPI(prompt);

    // Persist locally (instant on next load)
    writeLocalSummary(chatId, summary);

    // Persist remotely (survives cleared cache / new device)
    await persistSummaryToSupabase(chatId, summary);

    console.log(`[Summarise] ✅ Summary saved for chat ${chatId.slice(0, 8)}…`);
  } catch (err) {
    // Silent failure – never let summarisation break the chat
    console.warn('[Summarise] Failed (non-fatal):', err);
  }
}

// ── Public: load cached summary ────────────────────────────────────────────

/**
 * Loads the cached summary for a chat.
 * Priority: localStorage (fast) → Supabase (reliable fallback).
 *
 * @returns The summary string, or null if none exists yet.
 */
export async function loadChatSummary(chatId: string): Promise<string | null> {
  // 1️⃣ Fast path: local cache
  const local = readLocalSummary(chatId);
  if (local) return local;

  // 2️⃣ Fallback: Supabase
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chat_summaries')
      .select('summary')
      .eq('chat_id', chatId)
      .maybeSingle();

    if (error) {
      console.warn('[Summarise] Supabase fetch error:', error.message);
      return null;
    }

    if (data?.summary) {
      // Repopulate local cache for next time
      writeLocalSummary(chatId, data.summary);
      return data.summary;
    }
  } catch (err) {
    console.warn('[Summarise] Failed to load summary:', err);
  }

  return null;
}
