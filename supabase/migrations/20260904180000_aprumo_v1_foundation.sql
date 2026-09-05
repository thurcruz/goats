-- Aprumo V1 — Etapa 1: modelo de dia, foco, repertório, sono e comunidade.
--
-- Contexto: as tabelas existentes usam RLS owner-only (auth.uid() = user_id).
-- Esta migration introduz a PRIMEIRA superfície compartilhada do projeto
-- (comunidade), por isso as políticas de leitura pública estão isoladas e
-- explicitamente comentadas abaixo.

-- ---------------------------------------------------------------------------
-- 1. Modelo de dia: blocos (manhã/tarde/noite) e origem do registro
-- ---------------------------------------------------------------------------
alter table public.commitments
  add column if not exists day_block text not null default 'anytime'
    check (day_block in ('morning','afternoon','evening','anytime')),
  add column if not exists source text not null default 'manual'
    check (source in ('manual','ai','whatsapp'));

create index if not exists commitments_user_dayblock_idx
  on public.commitments(user_id, day_block) where active = true;

-- Quantas vezes o compromisso foi remanejado. Alimenta a métrica de "repasses"
-- que substitui a obsessão por streak.
alter table public.commitment_events
  add column if not exists reschedule_count smallint not null default 0
    check (reschedule_count >= 0);

-- ---------------------------------------------------------------------------
-- 2. Perfil: acompanhamento e respostas do onboarding
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists accompaniment_mode text not null default 'light'
    check (accompaniment_mode in ('silent','light','present','intense')),
  add column if not exists onboarding jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. Sessões de foco (hoje o timer não persiste nada)
-- ---------------------------------------------------------------------------
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  commitment_id uuid,
  name text not null default '' check (char_length(name) <= 160),
  planned_minutes smallint not null check (planned_minutes between 1 and 600),
  actual_seconds integer not null default 0 check (actual_seconds >= 0),
  interruptions smallint not null default 0 check (interruptions >= 0),
  reflection text check (reflection is null or char_length(reflection) <= 2000),
  status text not null default 'running' check (status in ('running','completed','abandoned')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key (user_id, commitment_id) references public.commitments(user_id, id) on delete set null
);
create index if not exists focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- 4. Repertório (generaliza conhecimento; books continua para progresso de leitura)
-- ---------------------------------------------------------------------------
create table if not exists public.repertoire_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('book','article','video','podcast','movie','documentary','course','quote','idea','reference','reflection','note')),
  title text not null check (char_length(title) between 1 and 240),
  author text not null default '',
  url text,
  image_url text,
  excerpt text,
  comment text,
  tags text[] not null default '{}',
  book_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, book_id) references public.books(user_id, id) on delete set null
);
create index if not exists repertoire_user_created_idx on public.repertoire_items(user_id, created_at desc);
create index if not exists repertoire_user_kind_idx on public.repertoire_items(user_id, kind);
create index if not exists repertoire_tags_idx on public.repertoire_items using gin(tags);

-- ---------------------------------------------------------------------------
-- 5. Sono (hoje só existe em localStorage)
-- ---------------------------------------------------------------------------
create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slept_on date not null default current_date,
  hours numeric(4,2) not null check (hours > 0 and hours <= 24),
  quality smallint not null check (quality between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, slept_on)
);
create index if not exists sleep_entries_user_date_idx on public.sleep_entries(user_id, slept_on desc);

-- Owner-only para tudo que é pessoal.
grant select, insert, update, delete on
  public.focus_sessions, public.repertoire_items, public.sleep_entries to authenticated;

do $$ declare t text; begin
  foreach t in array array['focus_sessions','repertoire_items','sleep_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)', t||'_owner_all', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6. COMUNIDADE — primeira superfície com leitura compartilhada.
--    Regra adotada: o que é agregado/público é legível por autenticados;
--    o que é registro pessoal (check-in) continua owner-only.
-- ---------------------------------------------------------------------------

-- Desafios oficiais. No MVP não há criação livre: escrita só via service role.
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  cover_url text,
  duration_days smallint not null check (duration_days between 1 and 365),
  starts_on date,
  ends_on date,
  official boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Ordem (user_id, challenge_id) é exigida pela FK composta de challenge_checkins.
  unique (user_id, challenge_id)
);
create index if not exists challenge_participants_challenge_idx on public.challenge_participants(challenge_id);

create table if not exists public.challenge_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null,
  day_number smallint not null check (day_number between 1 and 365),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id, day_number),
  foreign key (user_id, challenge_id) references public.challenge_participants(user_id, challenge_id) on delete cascade
);

-- Círculos (grupos por interesse).
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  tag text not null default '',
  description text not null default '',
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (circle_id, user_id)
);
create index if not exists circle_members_circle_idx on public.circle_members(circle_id);

-- Votação de funcionalidades: 1 voto por pessoa.
create table if not exists public.feature_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  season text not null default '2026-1',
  feature_id text not null check (char_length(feature_id) between 1 and 60),
  voted_at timestamptz not null default now(),
  -- 1 voto por pessoa POR TEMPORADA (não um voto para sempre).
  primary key (user_id, season)
);
create index if not exists feature_votes_feature_idx on public.feature_votes(season, feature_id);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_checkins enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.feature_votes enable row level security;

grant select on public.challenges to authenticated;
grant select, insert, delete on public.challenge_participants to authenticated;
grant select, insert, update, delete on public.challenge_checkins to authenticated;
grant select, insert, update, delete on public.circles, public.circle_members to authenticated;
grant select, insert, update, delete on public.feature_votes to authenticated;

-- Leitura pública (autenticados): catálogo de desafios e círculos públicos.
create policy "challenges_read_all" on public.challenges
  for select to authenticated using (active = true);

create policy "circles_read_public" on public.circles
  for select to authenticated using (visibility = 'public' or owner_id = (select auth.uid()));
create policy "circles_owner_write" on public.circles
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Participação é pública (permite contagem de participantes);
-- entrar/sair continua restrito ao próprio usuário.
create policy "challenge_participants_read_all" on public.challenge_participants
  for select to authenticated using (true);
create policy "challenge_participants_self_write" on public.challenge_participants
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "challenge_participants_self_delete" on public.challenge_participants
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "circle_members_read_all" on public.circle_members
  for select to authenticated using (true);
create policy "circle_members_self_write" on public.circle_members
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "circle_members_self_delete" on public.circle_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- Check-in é registro pessoal: owner-only.
create policy "challenge_checkins_owner_all" on public.challenge_checkins
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Voto é secreto: cada um lê apenas o próprio. Contagens vêm da função abaixo.
create policy "feature_votes_owner_all" on public.feature_votes
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Contagem agregada sem expor quem votou em quê.
create or replace function public.feature_vote_counts(target_season text default '2026-1')
returns table (feature_id text, votes bigint)
language sql security definer set search_path = public stable as $$
  select feature_id, count(*)::bigint from public.feature_votes
  where season = target_season group by feature_id;
$$;
revoke all on function public.feature_vote_counts(text) from public;
grant execute on function public.feature_vote_counts(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Depreciação
-- ---------------------------------------------------------------------------
-- public.user_state é o blob jsonb do protótipo. Nada novo deve escrever nele.
-- A remoção acontece só depois de migrar os dados existentes (etapa separada).
comment on table public.user_state is
  'DEPRECATED (Aprumo V1): agregado transitório do protótipo. Não escrever. Remover após migração dos dados.';
