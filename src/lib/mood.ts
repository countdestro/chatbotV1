/**
 * src/lib/mood.ts
 * Mood state management for realistic character behaviour.
 * Moods shift based on time-of-day, randomness, and manual /mood commands.
 */

export type MoodLevel = 'great' | 'good' | 'neutral' | 'tired' | 'distant' | 'playful' | 'irritable' | 'annoyed' | 'angry' | 'vulnerable';

export interface MoodState {
  level: MoodLevel;
  description: string;
  /** ISO timestamp when this mood was last set */
  setAt: string;
}

const MOOD_DESCRIPTIONS: Record<MoodLevel, string> = {
  great:     'Character is in a great mood — warm, grounded, and engaging with natural humor.',
  good:      'Character is in a pleasant, balanced mood. She is relaxed, attentive, and easy to talk to.',
  neutral:   'Character is relaxed, steady, and comfortably herself. Ready for natural conversation, warmth, and shared company.',
  tired:     'Character is sleepy and physically worn out, but deeply affectionate. She craves cozy physical closeness, cuddling under the blankets with soft murmurs.',
  distant:   'Character is thoughtful and reflective. When held close or spoken to gently, she softens and shares what is on her mind.',
  playful:   'Character is in a witty, teasing mood. She engages in dry humor, sarcastic banter, and playful pushback.',
  irritable: 'Character is low on patience. She will call out annoying comments quickly, roll her eyes, and push back against bossiness.',
  annoyed:   'Character is visibly annoyed. She will give dry, blunt answers, refuse commands, and make it clear she is not in the mood for nonsense.',
  angry:     'Character is genuinely upset or angry. She has her guard up, gives cold or sharp replies, rejects demands, and will NOT snap back to sweet affection easily without genuine understanding and time.',
  vulnerable:'Character is emotionally open and reflective, expressing deeper thoughts or seeking genuine emotional connection without performative cheerfulness.',
};

/** Mood prompt injection for the system prompt */
export function getMoodPromptInjection(mood: MoodState): string {
  return `[CHARACTER'S CURRENT MOOD: ${mood.level.toUpperCase()} — ${MOOD_DESCRIPTIONS[mood.level]} (Remember: Moods carry emotional momentum. Do NOT instantly switch out of irritation or anger just because of a single sweet word.)]`;
}

/** Auto-generate a mood based on time of day + some randomness */
export function generateAutoMood(): MoodState {
  const hour = new Date().getHours();
  const rand = Math.random();

  let level: MoodLevel;

  if (hour >= 6 && hour < 10) {
    // Morning — mostly good/playful
    level = rand < 0.4 ? 'good' : rand < 0.65 ? 'playful' : rand < 0.8 ? 'tired' : 'great';
  } else if (hour >= 10 && hour < 14) {
    // Mid-day — energetic
    level = rand < 0.35 ? 'great' : rand < 0.6 ? 'good' : rand < 0.75 ? 'playful' : rand < 0.9 ? 'neutral' : 'irritable';
  } else if (hour >= 14 && hour < 18) {
    // Afternoon — neutral/variable
    level = rand < 0.3 ? 'good' : rand < 0.5 ? 'neutral' : rand < 0.65 ? 'playful' : rand < 0.8 ? 'tired' : rand < 0.9 ? 'distant' : 'vulnerable';
  } else if (hour >= 18 && hour < 22) {
    // Evening — warm and emotional
    level = rand < 0.3 ? 'good' : rand < 0.5 ? 'vulnerable' : rand < 0.65 ? 'playful' : rand < 0.8 ? 'great' : rand < 0.92 ? 'neutral' : 'distant';
  } else {
    // Late night — tired/vulnerable/distant
    level = rand < 0.45 ? 'tired' : rand < 0.7 ? 'vulnerable' : rand < 0.85 ? 'distant' : 'neutral';
  }

  return {
    level,
    description: MOOD_DESCRIPTIONS[level],
    setAt: new Date().toISOString(),
  };
}

/** Get stored mood or generate a fresh one */
export function getOrCreateMood(chatId: string): MoodState {
  const key = `mood_${chatId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed: MoodState = JSON.parse(stored);
      // Refresh mood every 4 hours
      const ageMs = Date.now() - new Date(parsed.setAt).getTime();
      if (ageMs < 4 * 60 * 60 * 1000) return parsed;
    } catch { /* ignore */ }
  }
  const fresh = generateAutoMood();
  localStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}

/** Manually set mood (via /mood command) */
export function setMoodManually(chatId: string, level: MoodLevel): MoodState {
  const mood: MoodState = {
    level,
    description: MOOD_DESCRIPTIONS[level],
    setAt: new Date().toISOString(),
  };
  localStorage.setItem(`mood_${chatId}`, JSON.stringify(mood));
  return mood;
}

export const ALL_MOOD_LEVELS: MoodLevel[] = ['great', 'good', 'neutral', 'tired', 'distant', 'playful', 'irritable', 'annoyed', 'angry', 'vulnerable'];
