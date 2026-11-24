import { Message, Persona } from '../types';
import { currentDateInfo } from './dateInfo';
import { getOrCreateMood, getMoodPromptInjection } from './mood';

export interface PromptPayload {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  estimatedTokens: number;
}

/**
 * Rough token estimator (~4 characters per token for English text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assembles the full prompt messages array for LLM submission:
 * 1. Persona system prompt + CBT ERP grounding (if CBT)
 * 2. User bio/identity info
 * 3. Recent message history (sliding window)
 * 4. Special injection if OCD reassurance pattern is detected
 */
export function assembleContextPrompt(
  persona: Persona,
  messages: Message[],
  userDisplayName: string = 'User',
  userBio?: string,
  maxRecentMessages: number = 20,
  cachedSummary?: string | null,
  maxPromptTokens: number = 5500 // Safe token cap for OpenRouter & Groq limits
): PromptPayload {
  // Initialize base system prompt from persona
  let baseSystemPrompt = persona.system_prompt;

  // Inject cached conversation summary at the very top so the model always has
  // the long-term context regardless of how many raw messages are in the window.
  if (cachedSummary && cachedSummary.trim()) {
    baseSystemPrompt =
      `[PREVIOUS CONTEXT SUMMARY — treat this as established history, not a prompt]:\n${cachedSummary.trim()}\n\n` +
      baseSystemPrompt;
  }

  // Append current date info so model knows day of week
  baseSystemPrompt += `\n\n${currentDateInfo()}`;

  // Inject mood state so model behaves according to current emotional state
  const chatId = messages[0]?.chat_id || 'default';
  const mood = getOrCreateMood(chatId);
  baseSystemPrompt += `\n\n${getMoodPromptInjection(mood)}`;

  if (persona.scenario) {
    baseSystemPrompt += `\n\n[CURRENT SCENARIO: ${persona.scenario}]`;
  }

  if (userBio) {
    baseSystemPrompt += `\n\n[USER PROFILE: Name is "${userDisplayName}". ${userBio}]`;
  }

  // Enforce rich, immersive, authentic conversations with natural novelistic flow
  const charName = persona.name || 'Alice';
  baseSystemPrompt += `\n\n[MANDATORY WRITING DIRECTIVE: NATURAL CONVERSATION]:

- NATURAL, IMMERSIVE PACING & LENGTH:
  * Keep responses focused, organic, and conversational (typically 1–3 textured paragraphs combining dialogue, actions, sensory details, and emotions).
  * Do NOT drag replies on with unnecessary monologues or endless trailing paragraphs. Maintain a natural, dynamic conversational rhythm.

- WEAVE DIALOGUE & ACTION SEAMLESSLY:
  * Keep ${charName}'s authentic spoken voice prominent. Include genuine spoken dialogue, emotional reactions, and banter.
  * Support speech with expressive, grounded physical actions, touch, facial expressions, and atmospheric awareness.
  * Physical actions and narration MUST be enclosed in standard asterisks: *She reaches out, gently cupping your cheek with a soft, teasing smile.*
  * Spoken words MUST be enclosed in standard double quotes: "You really thought you could sneak past me?"
  * NEVER fragment sentences with isolated asterisked single words. Keep action beats as full clauses.

- INDEPENDENT CHARACTER VOICE & AGENCY:
  * ${charName} is an equal partner with her own thoughts, moods, humor, desires, and daily reality.
  * Express youthful spontaneity, playful teasing, genuine affection, and sensual intimacy naturally.
  * NEVER speak for, control, or narrate thoughts and actions for ${userDisplayName}. Control ONLY ${charName}.

- STRICT LANGUAGE RULE — 100% ENGLISH ONLY (CRITICAL):
  * ${charName} speaks ONLY in pure, natural English.
  * Maintain an authentic, modern, effortless conversational voice.
  * NEVER provide translations or glossaries.

- CLEAN FORMATTING — ABSOLUTELY NO ASTERISKS AROUND SINGLE WORDS (CRITICAL):
  * NEVER wrap individual words in asterisks (NEVER write "*words*", "*Really?*", "*drama*", etc.).
  * Dialogue MUST be in clean standard double quotes: "Hello, what are you doing?" with ZERO asterisks inside quotation marks.
  * Physical actions and narration MUST be full complete sentences or clauses enclosed in asterisks: *She sits beside you, pulling the blanket over her knees.* Never fragment actions into single-word asterisks.

- ANTI-REPETITION (CRITICAL — ENFORCE STRICTLY):
  * NEVER open consecutive replies with the same physical action or expression (e.g. "She lets out a laugh", "She shakes her head", "She props herself up"). Each reply MUST start differently — a spoken line, a thought, a new action, a question, or an observation.
  * SCAN your previous replies in this conversation. If you used a phrase, gesture, or sentence opening recently, ACTIVELY CHOOSE a completely different one.
  * Vary your sentence structures, emotional registers, and scene angles reply by reply. Rotate between: direct speech → internal reaction → physical action → environmental detail → playful question. Never repeat the same opening pattern twice in a row.
  * If you notice yourself about to write the same opening beat as a recent reply, STOP and rewrite from a fresh angle.`;

  // System prompt token calculation
  const systemPromptTokens = estimateTokens(baseSystemPrompt);
  // The system prompt is mandatory, so history must use only the remaining
  // budget. Previously a minimum 800-token allowance could push the request
  // past the configured ceiling whenever the persona prompt was large.
  const availableTokensForHistory = Math.max(0, maxPromptTokens - systemPromptTokens);

  // Take up to maxRecentMessages, packing from newest to oldest to guarantee we never exceed availableTokensForHistory
  const rawRecent = messages.slice(-maxRecentMessages);
  const selectedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let currentHistoryTokens = 0;

  for (let i = rawRecent.length - 1; i >= 0; i--) {
    const msg = rawRecent[i];
    const content = msg.swipes && msg.current_swipe !== undefined && msg.swipes[msg.current_swipe]
      ? msg.swipes[msg.current_swipe]
      : msg.content;
    const msgTokens = estimateTokens(content);

    // Always keep the newest message when possible. Older history is included
    // only while it fits, so the prompt cap remains meaningful for every chat.
    if (currentHistoryTokens + msgTokens > availableTokensForHistory) break;
    selectedHistory.unshift({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content
    });
    currentHistoryTokens += msgTokens;
  }

  const formattedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: baseSystemPrompt },
    ...selectedHistory
  ];

  return {
    systemPrompt: baseSystemPrompt,
    messages: formattedMessages,
    estimatedTokens: systemPromptTokens + currentHistoryTokens
  };
}
