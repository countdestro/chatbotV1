import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, Chat, CompulsionLog, Message, Persona } from '../types';
import { DEFAULT_PERSONAS } from './default-personas';

/** Generate a proper UUID v4 for Supabase compatibility */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Check if a string is a valid UUID */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Stable UUIDs for bundled personas whose original IDs were slugs (not valid for Supabase). */
const LEGACY_PERSONA_UUIDS: Record<string, string> = {
  'cbt-specialist-maya': 'a1b2c3d4-e5f6-4a11-8b11-000000000001',
  'nyx-companion': 'a1b2c3d4-e5f6-4a11-8b11-000000000002',
  'cyberpunk-vesper-hacker': 'a1b2c3d4-e5f6-4a11-8b11-000000000003',
  'elira-arcane-mage': 'a1b2c3d4-e5f6-4a11-8b11-000000000004',
};

export function canonicalPersonaId(id: string): string {
  if (isUUID(id)) return id;
  return LEGACY_PERSONA_UUIDS[id] || id;
}

function personaAliasIds(personaId: string): string[] {
  const ids = new Set<string>([personaId, canonicalPersonaId(personaId)]);
  for (const [legacy, uuid] of Object.entries(LEGACY_PERSONA_UUIDS)) {
    if (legacy === personaId || uuid === personaId || uuid === canonicalPersonaId(personaId)) {
      ids.add(legacy);
      ids.add(uuid);
    }
  }
  return Array.from(ids);
}

/** Convert frontend Message to Supabase row (swipes → swipe_options) */
function toSupabaseMessage(msg: Message): Record<string, unknown> {
  return {
    id: msg.id,
    chat_id: msg.chat_id,
    role: msg.role,
    content: msg.content,
    swipe_options: msg.swipes || [],
    current_swipe: msg.current_swipe ?? 0,
    created_at: msg.created_at,
  };
}

/** Convert Supabase row to frontend Message (swipe_options → swipes) */
function fromSupabaseMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    chat_id: row.chat_id as string,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content as string,
    swipes: Array.isArray(row.swipe_options) && (row.swipe_options as string[]).length > 0
      ? (row.swipe_options as string[])
      : undefined,
    current_swipe: (row.current_swipe as number) ?? undefined,
    created_at: row.created_at as string,
  };
}

export const DEFAULT_SUPABASE_URL = 'https://your-project.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-fake-anon-key-here';
export const DEFAULT_OPENROUTER_KEY = '';
export const DEFAULT_BACKUP_OPENROUTER_KEY = '';
export const DEFAULT_GROQ_KEY = '';
/** Dedicated free-tier OpenRouter key used only for summarisation calls. */
export const DEFAULT_SUMMARIZATION_KEY = '';

export const DEFAULT_USER_DISPLAY_NAME = 'User';
export const DEFAULT_USER_PERSONA_BIO =
  'A thoughtful and open-minded companion who enjoys engaging conversations, learning new things, and exploring creative ideas.';

export const DEFAULT_USER_AVATAR = '/user-avatar.png';

export function getStoredSettings(): AppSettings {
  const saved = localStorage.getItem('janitor_app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const activeProvider = parsed.activeProvider || 'openrouter';
      const defaultModel = parsed.defaultModel || 'deepseek/deepseek-chat';

      const migratedSettings: AppSettings = {
        ...parsed,
        openRouterApiKey: parsed.openRouterApiKey || '',
        backupOpenRouterApiKey: parsed.backupOpenRouterApiKey || '',
        groqApiKey: parsed.groqApiKey || '',
        summarisationOpenRouterApiKey: parsed.summarisationOpenRouterApiKey || '',
        activeProvider,
        defaultModel,
        userDisplayName: parsed.userDisplayName || DEFAULT_USER_DISPLAY_NAME,
        userPersonaBio: parsed.userPersonaBio || DEFAULT_USER_PERSONA_BIO,
        userAvatarUrl: parsed.userAvatarUrl || DEFAULT_USER_AVATAR,
      };

      try {
        localStorage.setItem('janitor_app_settings', JSON.stringify(migratedSettings));
      } catch {}

      return migratedSettings;
    } catch {
      // ignore
    }
  }
  return {
    openRouterApiKey: DEFAULT_OPENROUTER_KEY,
    backupOpenRouterApiKey: DEFAULT_BACKUP_OPENROUTER_KEY,
    groqApiKey: DEFAULT_GROQ_KEY,
    summarisationOpenRouterApiKey: DEFAULT_SUMMARIZATION_KEY,
    geminiApiKey: '',
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
    activeProvider: 'openrouter',
    defaultModel: 'deepseek/deepseek-chat',
    nsfwEnabled: true,
    userDisplayName: DEFAULT_USER_DISPLAY_NAME,
    userPersonaBio: DEFAULT_USER_PERSONA_BIO,
    userAvatarUrl: DEFAULT_USER_AVATAR,
    autoSummarizeMemory: true,
    bgOpacity: 30,
    bgBlur: 0,
    autoScroll: true,
    textStreaming: true,
    customBgUrl: '',
    frequencyPenalty: 0.35,
    presencePenalty: 0.20,
    temperature: 0.88,
    topP: 0.92,
  };
}

export function saveStoredSettings(settings: AppSettings) {
  localStorage.setItem('janitor_app_settings', JSON.stringify(settings));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const settings = getStoredSettings();
  const url = settings.supabaseUrl || DEFAULT_SUPABASE_URL;
  const key = settings.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key);
    }
    return supabaseInstance;
  } catch (e) {
    console.warn('Failed to init Supabase client:', e);
    return null;
  }
}

// ================= Local / Supabase Sync Repositories =================

function toSupabasePersona(persona: Persona): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: canonicalPersonaId(persona.id),
    name: persona.name,
    tagline: persona.tagline || '',
    avatar_url: persona.avatar_url,
    greeting: persona.greeting,
    description: persona.description || '',
    scenario: persona.scenario || '',
    system_prompt: persona.system_prompt,
    model_provider: persona.model_provider,
    model_name: persona.model_name,
    temperature: persona.temperature,
    is_nsfw: !!persona.is_nsfw,
    is_cbt: !!persona.is_cbt,
    tags: persona.tags || [],
  };
  if (persona.background_url) row.background_url = persona.background_url;
  if (persona.created_at) row.created_at = persona.created_at;
  return row;
}

function mergePersonas(remote: Persona[], local: Persona[]): Persona[] {
  const byId = new Map<string, Persona>();
  for (const p of [...local, ...remote]) {
    const id = canonicalPersonaId(p.id);
    byId.set(id, { ...p, id });
  }
  return Array.from(byId.values());
}

function readLocalPersonas(): Persona[] {
  const localSaved = localStorage.getItem('janitor_personas');
  if (!localSaved) return [];
  try {
    return JSON.parse(localSaved) as Persona[];
  } catch {
    return [];
  }
}

export async function fetchPersonas(): Promise<Persona[]> {
  let remote: Persona[] = [];
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('personas').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch personas fallback to local:', error.message);
    } else if (data && data.length > 0) {
      remote = data as Persona[];
    }
  }

  const finalPersonas = remote.length > 0 ? remote : DEFAULT_PERSONAS;
  localStorage.setItem('janitor_personas', JSON.stringify(finalPersonas));
  return finalPersonas;
}

export async function savePersonaToStorage(persona: Persona): Promise<Persona> {
  const toSave: Persona = { ...persona, id: canonicalPersonaId(persona.id) };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('personas').upsert(toSupabasePersona(toSave)).select().single();
    if (error) {
      console.warn('Supabase save persona:', error.message);
    } else if (data) {
      toSave.id = (data as Persona).id;
    }
  }

  const personas = mergePersonas([], [...readLocalPersonas(), toSave]);
  localStorage.setItem('janitor_personas', JSON.stringify(personas));
  return toSave;
}

async function ensurePersonaRemote(persona: Persona): Promise<Persona> {
  const toSave: Persona = { ...persona, id: canonicalPersonaId(persona.id) };
  const supabase = getSupabaseClient();
  if (!supabase || !isUUID(toSave.id)) return toSave;
  const { error } = await supabase.from('personas').upsert(toSupabasePersona(toSave));
  if (error) console.warn('Supabase ensure persona:', error.message);
  return toSave;
}

function readLocalChats(personaId: string): Chat[] {
  const localSaved = localStorage.getItem(`janitor_chats_${personaId}`);
  if (!localSaved) return [];
  try {
    return JSON.parse(localSaved) as Chat[];
  } catch {
    return [];
  }
}

export function collectLocalChats(personaId: string): Chat[] {
  const byId = new Map<string, Chat>();
  for (const alias of personaAliasIds(personaId)) {
    for (const chat of readLocalChats(alias)) {
      byId.set(chat.id, {
        ...chat,
        persona_id: canonicalPersonaId(personaId),
      });
    }
  }
  return Array.from(byId.values());
}

function writeLocalChats(personaId: string, chats: Chat[]) {
  const canonicalId = canonicalPersonaId(personaId);
  localStorage.setItem(`janitor_chats_${canonicalId}`, JSON.stringify(chats));
  for (const alias of personaAliasIds(personaId)) {
    if (alias !== canonicalId) localStorage.setItem(`janitor_chats_${alias}`, JSON.stringify(chats));
  }
}

export function readLocalMessages(chatId: string): Message[] {
  const localSaved = localStorage.getItem(`janitor_messages_${chatId}`);
  if (!localSaved) return [];
  try {
    return JSON.parse(localSaved) as Message[];
  } catch {
    return [];
  }
}

function writeLocalMessages(chatId: string, messages: Message[]) {
  localStorage.setItem(`janitor_messages_${chatId}`, JSON.stringify(messages));
}

function findLocalChat(chatId: string): Chat | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('janitor_chats_')) continue;
    try {
      const chats = JSON.parse(localStorage.getItem(key) || '[]') as Chat[];
      const found = chats.find(c => c.id === chatId);
      if (found) return found;
    } catch {
      // ignore
    }
  }
  return null;
}

function toSupabaseChat(chat: Chat): Record<string, unknown> {
  return {
    id: chat.id,
    persona_id: canonicalPersonaId(chat.persona_id),
    title: chat.title,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
  };
}

function canSyncChat(chat: Chat): boolean {
  return isUUID(chat.id) && isUUID(canonicalPersonaId(chat.persona_id));
}

function canSyncMessage(msg: Message): boolean {
  return isUUID(msg.id) && isUUID(msg.chat_id);
}

async function persistChatToSupabase(chat: Chat): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !canSyncChat(chat)) return false;
  const { error } = await supabase.from('chats').upsert(toSupabaseChat(chat));
  if (error) {
    console.warn('Supabase persist chat:', error.message);
    return false;
  }
  return true;
}

async function persistMessageToSupabase(msg: Message): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !canSyncMessage(msg)) return false;

  const localChat = findLocalChat(msg.chat_id);
  if (localChat) {
    await persistChatToSupabase(localChat);
  }

  const { error } = await supabase.from('messages').upsert(toSupabaseMessage(msg));
  if (error) {
    if (localChat) {
      await persistChatToSupabase(localChat);
      const retry = await supabase.from('messages').upsert(toSupabaseMessage(msg));
      if (!retry.error) return true;
    }
    console.warn('Supabase persist message:', error.message);
    return false;
  }
  return true;
}

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}

function mergeChats(primary: Chat[], secondary: Chat[]): Chat[] {
  const byId = new Map<string, Chat>();
  for (const chat of secondary) byId.set(chat.id, chat);
  for (const chat of primary) byId.set(chat.id, chat);
  return sortChats(Array.from(byId.values()));
}

function sameMessageContent(a: Message, b: Message): boolean {
  return a.role === b.role && a.content === b.content && a.created_at === b.created_at;
}

async function fetchRemoteChats(personaId: string): Promise<{ chats: Chat[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  const id = canonicalPersonaId(personaId);
  if (!supabase || !isUUID(id)) return { chats: [], ok: false };
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('persona_id', id)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('Supabase fetch chats:', error.message);
    return { chats: [], ok: false };
  }
  return { chats: (data || []) as Chat[], ok: true };
}

async function remoteMessageCount(chatId: string): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUUID(chatId)) return 0;
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId);
  if (error) return 0;
  return count ?? 0;
}

async function pickCanonicalChat(chats: Chat[]): Promise<Chat> {
  if (chats.length === 1) return chats[0];
  let best = chats[0];
  let bestScore = -1;
  for (const chat of chats) {
    const localCount = readLocalMessages(chat.id).length;
    const remoteCount = await remoteMessageCount(chat.id);
    const score = Math.max(localCount, remoteCount);
    if (score > bestScore) {
      best = chat;
      bestScore = score;
    } else if (score === bestScore && (chat.updated_at || '') > (best.updated_at || '')) {
      best = chat;
    }
  }
  return best;
}

export async function fetchRemoteMessagesPaginated(chatId: string): Promise<Message[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUUID(chatId)) return [];

  const all: Message[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.warn('Supabase fetch messages paginated:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    for (const row of data) {
      all.push(fromSupabaseMessage(row as Record<string, unknown>));
    }
    if (data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
    }
  }

  return all;
}

async function loadAllMessagesForChat(chatId: string): Promise<Message[]> {
  const byId = new Map<string, Message>();
  for (const msg of readLocalMessages(chatId)) byId.set(msg.id, msg);
  const remote = await fetchRemoteMessagesPaginated(chatId);
  for (const msg of remote) {
    byId.set(msg.id, msg);
  }
  return Array.from(byId.values()).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
}

async function migrateMessagesIntoChat(sourceChatId: string, targetChat: Chat): Promise<void> {
  if (sourceChatId === targetChat.id) {
    return;
  }

  const mergeKey = `janitor_merged_${sourceChatId}_into_${targetChat.id}`;
  if (localStorage.getItem(mergeKey)) return;

  const sourceMessages = await loadAllMessagesForChat(sourceChatId);
  if (sourceMessages.length === 0) {
    localStorage.setItem(mergeKey, '1');
    return;
  }

  const existing = await loadAllMessagesForChat(targetChat.id);
  for (const msg of sourceMessages) {
    if (existing.some(m => m.id === msg.id || sameMessageContent(m, msg))) continue;
    const synced: Message = {
      ...msg,
      id: isUUID(msg.id) ? msg.id : generateUUID(),
      chat_id: targetChat.id,
    };
    await persistMessageToSupabase(synced);
    existing.push(synced);
  }
  writeLocalMessages(targetChat.id, existing.sort((a, b) => a.created_at.localeCompare(b.created_at)));
  localStorage.setItem(mergeKey, '1');
}

export async function fetchChatsForPersona(personaId: string): Promise<Chat[]> {
  const { chats: remote } = await fetchRemoteChats(personaId);
  const local = collectLocalChats(personaId);
  const merged = mergeChats(remote, local);
  if (merged.length > 0) writeLocalChats(personaId, merged);
  return merged;
}

export async function getOrCreateActiveChat(persona: Persona): Promise<Chat> {
  // If we already have a local chat for this persona, use it immediately
  const local = collectLocalChats(persona.id);
  if (local.length > 0) {
    const topLocal = sortChats(local)[0];
    // Sync remote in background without blocking
    ensurePersonaRemote(persona).catch(() => { });
    return topLocal;
  }

  const syncedPersona = await ensurePersonaRemote(persona);
  const personaId = syncedPersona.id;
  const { chats: remote, ok: remoteOk } = await fetchRemoteChats(personaId);
  const candidates = mergeChats(remote, local);

  if (!remoteOk && candidates.length > 0) {
    writeLocalChats(personaId, candidates);
    return sortChats(candidates)[0];
  }

  if (candidates.length > 0) {
    const active = candidates[0];
    const cloudActive: Chat = {
      ...active,
      id: isUUID(active.id) ? active.id : generateUUID(),
      persona_id: personaId,
    };
    persistChatToSupabase(cloudActive).catch(() => { });
    writeLocalChats(personaId, mergeChats([cloudActive], candidates));
    return cloudActive;
  }

  const newChat: Chat = {
    id: generateUUID(),
    persona_id: personaId,
    title: `Conversation with ${syncedPersona.name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await persistChatToSupabase(newChat);
  writeLocalChats(personaId, [newChat]);

  if (syncedPersona.greeting) {
    const greetingMsg: Message = {
      id: generateUUID(),
      chat_id: newChat.id,
      role: 'assistant',
      content: syncedPersona.greeting,
      swipes: [syncedPersona.greeting],
      current_swipe: 0,
      created_at: new Date().toISOString(),
    };
    await saveMessageToStorage(greetingMsg);
  }

  return newChat;
}

export async function clearAllChatMessages(chatId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isUUID(chatId)) {
    const { error } = await supabase.from('messages').delete().eq('chat_id', chatId);
    if (error) console.warn('Supabase clear all messages:', error.message);
  }
  writeLocalMessages(chatId, []);
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const supabase = getSupabaseClient();
  if (supabase && isUUID(chatId)) {
    const remote = await fetchRemoteMessagesPaginated(chatId);

    if (remote.length > 0) {
      // Remote Supabase DB is authoritative for established history.
      // Update local cache so it always mirrors clean remote state.
      writeLocalMessages(chatId, remote);
      return remote;
    }

    // If remote has 0 messages and local has messages, sync them to Supabase
    const local = readLocalMessages(chatId);
    if (local.length > 0) {
      for (const msg of local) {
        await persistMessageToSupabase(msg);
      }
      return local;
    }
    return [];
  }
  return readLocalMessages(chatId);
}

export async function saveMessageToStorage(msg: Message): Promise<Message> {
  const toSave: Message = {
    ...msg,
    id: isUUID(msg.id) ? msg.id : generateUUID(),
    chat_id: isUUID(msg.chat_id) ? msg.chat_id : msg.chat_id,
  };

  // 1. Write to local storage immediately so messages are never lost even if remote is slow/fails
  const messages = readLocalMessages(toSave.chat_id);
  const existingIdx = messages.findIndex(m => m.id === toSave.id);
  if (existingIdx >= 0) {
    messages[existingIdx] = toSave;
  } else {
    messages.push(toSave);
  }
  writeLocalMessages(toSave.chat_id, messages);

  // 2. Persist to Supabase
  await persistMessageToSupabase(toSave);

  const supabase = getSupabaseClient();
  if (supabase && isUUID(toSave.chat_id)) {
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', toSave.chat_id);
  }

  return toSave;
}

export async function deleteMessageFromStorage(chatId: string, messageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isUUID(messageId)) {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) console.warn('Supabase delete message:', error.message);
  }

  const filtered = readLocalMessages(chatId).filter(m => m.id !== messageId);
  writeLocalMessages(chatId, filtered);
}

export async function saveCompulsionLogEntry(log: CompulsionLog): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('compulsion_logs').insert(log);
    } catch (e) {
      console.warn('Supabase compulsion log fallback:', e);
    }
  }

  const existingLogs = getCompulsionLogs();
  existingLogs.unshift(log);
  localStorage.setItem('janitor_compulsion_logs', JSON.stringify(existingLogs));
}

export function getCompulsionLogs(): CompulsionLog[] {
  const saved = localStorage.getItem('janitor_compulsion_logs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
}
function patchLocalChat(chatId: string, patch: Partial<Chat>) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('janitor_chats_')) continue;
    try {
      const chats = JSON.parse(localStorage.getItem(key) || '[]') as Chat[];
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx >= 0) {
        chats[idx] = { ...chats[idx], ...patch };
        localStorage.setItem(key, JSON.stringify(chats));
        return;
      }
    } catch {
      // ignore
    }
  }
}

export async function updateChatMode(chatId: string, mode: 'cbt' | 'erp'): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isUUID(chatId)) {
    const { error } = await supabase.from('chats').update({ mode }).eq('id', chatId);
    if (error) console.warn('Supabase update chat mode:', error.message);
  }
  patchLocalChat(chatId, { mode });
}

export async function updateChatScenario(chatId: string, scenario?: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isUUID(chatId)) {
    const { error } = await supabase.from('chats').update({ scenario }).eq('id', chatId);
    if (error) console.warn('Supabase update chat scenario:', error.message);
  }
  patchLocalChat(chatId, { scenario });
}
