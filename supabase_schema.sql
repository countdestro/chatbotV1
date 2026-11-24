-- ================================================================
-- AI Companion Chatbot Schema for Supabase
-- Supports: Personas, Chats, Multi-branch Messages, Vector Memory & Logs
-- ================================================================

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PERSONAS TABLE
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  tagline text,
  avatar_url text,
  greeting text not null,
  description text,
  scenario text,
  system_prompt text not null,
  model_provider text not null default 'openrouter',
  model_name text not null default 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  temperature numeric(3,2) default 0.85,
  is_nsfw boolean default false,
  is_cbt boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- 2. CHATS TABLE
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  persona_id uuid references personas(id) on delete cascade not null,
  title text default 'New Conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. MESSAGES TABLE (supports branching / swipe responses)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  parent_id uuid references messages(id) on delete set null,
  branch_index integer default 0,
  swipe_options text[] default '{}',
  current_swipe integer default 0,
  created_at timestamptz default now()
);

-- 4. LONG-TERM MEMORY CHUNKS (For RAG / Context Recall)
create table if not exists memory_chunks (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  summary text not null,
  embedding vector(1536), -- Compatible with standard embeddings
  created_at timestamptz default now()
);

-- 5. CBT / ERP COMPULSION & URGE TRACKER (Pure-O OCD Support)
create table if not exists compulsion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  trigger_thought text not null,
  distress_level integer not null check (distress_level between 1 and 10),
  compulsion_resisted boolean default true,
  theme text, -- e.g. 'Harm', 'Relationship', 'Contamination', 'Existential'
  notes text,
  created_at timestamptz default now()
);

-- Indices for rapid querying
create index if not exists idx_chats_user_persona on chats(user_id, persona_id);
create index if not exists idx_messages_chat on messages(chat_id, created_at);
create index if not exists idx_memory_chunks_chat on memory_chunks(chat_id);
create index if not exists idx_compulsion_logs_user on compulsion_logs(user_id, created_at);

-- Row Level Security (RLS) Setup
alter table personas enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table memory_chunks enable row level security;
alter table compulsion_logs enable row level security;

-- Permissive policies for personal single-user setup (with fallback for anon/public access)
create policy "Allow all actions for personas" on personas for all using (true) with check (true);
create policy "Allow all actions for chats" on chats for all using (true) with check (true);
create policy "Allow all actions for messages" on messages for all using (true) with check (true);
create policy "Allow all actions for memory_chunks" on memory_chunks for all using (true) with check (true);
create policy "Allow all actions for compulsion_logs" on compulsion_logs for all using (true) with check (true);

-- Function for similarity search
create or replace function match_memory_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_chat_id uuid
)
returns table (
  id uuid,
  chat_id uuid,
  summary text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    memory_chunks.id,
    memory_chunks.chat_id,
    memory_chunks.summary,
    1 - (memory_chunks.embedding <=> query_embedding) as similarity
  from memory_chunks
  where memory_chunks.chat_id = p_chat_id
    and 1 - (memory_chunks.embedding <=> query_embedding) > match_threshold
  order by memory_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
