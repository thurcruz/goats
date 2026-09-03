-- Agenda metadata and persistent Goat AI conversations.
alter table public.commitments
  add column if not exists scheduled_date date,
  add column if not exists start_time time,
  add column if not exists duration_minutes integer
    check (duration_minutes is null or duration_minutes between 5 and 1440);

create index if not exists commitments_user_schedule_idx
  on public.commitments(user_id, scheduled_date, start_time)
  where active = true;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nova conversa' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, id)
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  sources jsonb not null default '[]'::jsonb,
  proposed_action jsonb,
  action_status text check (action_status in ('pending','confirmed','cancelled','failed')),
  created_at timestamptz not null default now(),
  foreign key(user_id, conversation_id) references public.ai_conversations(user_id, id) on delete cascade
);

create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(user_id, conversation_id, created_at);

grant select, insert, update, delete on public.ai_conversations, public.ai_messages to authenticated;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "ai_conversations_owner_all" on public.ai_conversations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "ai_messages_owner_all" on public.ai_messages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
