import { ModelOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  // Top-Tier Flagship Conversational & Intelligence Models (OpenRouter)
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (Top Realism & Conversational Depth)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 65536,
    description: 'Phenomenal natural dialogue, sharp wit, emotional realism, and high conversational intelligence.'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Gold Standard Prose & Emotional Depth)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 200000,
    description: 'The undisputed highest quality prose, deep psychological realism, and unmatched emotional nuance.'
  },
  {
    id: 'sao10k/l3-euryale-70b',
    name: 'Sao10k L3 Euryale 70B (Creative Storytelling & Romance)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 32768,
    description: 'Specially fine-tuned for rich narrative depth, emotional expression, and character dynamics.'
  },
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
    name: 'Dolphin Mistral 24B Venice (Fast & Creative)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 32768,
    description: 'High-speed creative conversational model with natural dialogue and adaptive personality.'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (High Speed & 128k Context)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 131072,
    description: 'Flagship open model with 128k context, strong reasoning and high-speed generation.'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (Deep Chain-of-Thought & Psychology)',
    provider: 'openrouter',
    isFree: false,
    isNsfwCapable: true,
    contextWindow: 65536,
    description: 'State-of-the-art reasoning model for profound psychological insight, CBT grounding, and complex dynamics.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra 550B (Free)',
    provider: 'openrouter',
    isFree: true,
    isNsfwCapable: false,
    contextWindow: 1000000,
    description: 'NVIDIA flagship open model with 1M context, free tier.'
  },
  {
    id: 'mistralai/mistral-nemo:free',
    name: 'Mistral Nemo 12B (Free)',
    provider: 'openrouter',
    isFree: true,
    isNsfwCapable: true,
    contextWindow: 32768,
    description: 'Fast, nuanced dialogue and storytelling with minimal refusal.'
  },

  // Groq Models (14,400 Free Daily Chats)
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B (14,400 chats/day free)',
    provider: 'groq',
    isFree: true,
    isNsfwCapable: false,
    contextWindow: 128000,
    description: 'Blazing fast (500 tokens/sec) on Groq LPUs. Ideal for CBT Companion and instant responses.'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Groq Llama 3.1 8B Instant (Ultra Fast)',
    provider: 'groq',
    isFree: true,
    isNsfwCapable: false,
    contextWindow: 128000,
    description: 'Instantaneous response times, light resource footprint.'
  }
];

export const DEFAULT_MODEL_ID = 'deepseek/deepseek-chat';
export const DEFAULT_CBT_MODEL_ID = 'nvidia/nemotron-3-ultra-550b-a55b:free';

