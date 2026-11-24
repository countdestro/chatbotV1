export type ModelProvider = 'openrouter' | 'groq' | 'gemini';

export interface Persona {
  id: string;
  name: string;
  creator_handle?: string;
  tagline: string;
  avatar_url: string;
  background_url?: string;  // Full-screen chat background image (Janitor AI style)
  greeting: string;
  description: string;
  scenario: string;
  system_prompt: string;
  model_provider: ModelProvider;
  model_name: string;
  temperature: number;
  max_tokens?: number;
  token_count?: number;
  is_nsfw: boolean;
  is_cbt: boolean;
  tags: string[];
  created_at?: string;
  chat_count?: number;
  bookmark_count?: number;
}

export interface Chat {
  id: string;
  persona_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  /** Per‑chat CBT/ERP mode */
  mode?: "cbt" | "erp";
  /** Optional free‑form scenario (set via /scenario command) */
  scenario?: string;
  /** Timeline support – index of the current event */
  eventIndex?: number;
  /** Optional list of event descriptions */
  eventLog?: string[];
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  swipes?: string[]; // Multiple alternative responses for assistant
  current_swipe?: number;
  created_at: string;
}

export interface MemoryChunk {
  id: string;
  chat_id: string;
  summary: string;
  created_at: string;
}

export interface CompulsionLog {
  id: string;
  trigger_thought: string;
  distress_level: number; // 1 to 10
  compulsion_resisted: boolean;
  theme: 'Harm' | 'Relationship (ROCD)' | 'Contamination' | 'Existential' | 'Scrupulosity' | 'Somatic' | 'Other';
  notes?: string;
  created_at: string;
}

export interface AppSettings {
  openRouterApiKey: string;
  backupOpenRouterApiKey?: string;
  groqApiKey: string;
  geminiApiKey: string;
  /** Dedicated OpenRouter key used exclusively for chat summarisation (free-tier). */
  summarisationOpenRouterApiKey?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  activeProvider: ModelProvider;
  defaultModel: string;
  nsfwEnabled: boolean;
  userDisplayName: string;
  userPersonaBio: string;
  autoSummarizeMemory: boolean;
  bgOpacity?: number;
  bgBlur?: number;
  autoScroll?: boolean;
  textStreaming?: boolean;
  customBgUrl?: string;
  userAvatarUrl?: string;
  frequencyPenalty?: number;
  presencePenalty?: number;
  temperature?: number;
  topP?: number;
  groqMigrated?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  isFree: boolean;
  isNsfwCapable: boolean;
  contextWindow: number;
  description: string;
}
