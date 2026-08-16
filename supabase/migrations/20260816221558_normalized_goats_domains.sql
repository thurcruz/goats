-- Normalized domains for analytics, Goat AI and WhatsApp tools.
create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160), description text not null default '',
  category text not null check (category in ('carreira','saude','financeiro','relacionamentos','conhecimento')),
  status text not null default 'active' check (status in ('active','completed','paused','archived')),
  deadline date, progress smallint not null default 0 check (progress between 0 and 100), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create index goals_user_status_idx on public.goals(user_id,status);

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null, title text not null check (char_length(title) between 1 and 160), position smallint not null default 0 check(position>=0),
  completed boolean not null default false, due_date date, completed_at timestamptz, created_at timestamptz not null default now(),
  foreign key(user_id,goal_id) references public.goals(user_id,id) on delete cascade
);
create index goal_milestones_user_goal_idx on public.goal_milestones(user_id,goal_id,position);

create table public.commitments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, goal_id uuid,
  title text not null check(char_length(title) between 1 and 160), kind text not null check(kind in ('task','habit')),
  category text not null default 'today' check(category in ('fixed','today','carryover')), priority smallint not null default 2 check(priority between 1 and 3),
  frequency jsonb not null default '{"type":"once"}'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id),
  foreign key(user_id,goal_id) references public.goals(user_id,id) on delete set null
);
create index commitments_user_active_idx on public.commitments(user_id,active);
create index commitments_user_goal_idx on public.commitments(user_id,goal_id) where goal_id is not null;

create table public.commitment_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, commitment_id uuid not null,
  scheduled_for date not null, status text not null default 'pending' check(status in ('pending','completed','skipped','carried')),
  completed_at timestamptz, carried_to date, note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(commitment_id,scheduled_for), foreign key(user_id,commitment_id) references public.commitments(user_id,id) on delete cascade,
  check((status='completed' and completed_at is not null) or status<>'completed'), check((status='carried' and carried_to is not null) or status<>'carried')
);
create index commitment_events_user_date_idx on public.commitment_events(user_id,scheduled_for desc);
create index commitment_events_user_status_date_idx on public.commitment_events(user_id,status,scheduled_for desc);
create index commitment_events_owner_commitment_idx on public.commitment_events(user_id,commitment_id);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  mood smallint not null check(mood between 1 and 5), note text, recorded_at timestamptz not null default now()
);
create index mood_entries_user_recorded_idx on public.mood_entries(user_id,recorded_at desc);

create table public.books (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(title) between 1 and 240), author text not null default '', cover_url text,
  total_pages integer check(total_pages>0), current_page integer not null default 0 check(current_page>=0),
  status text not null default 'want_to_read' check(status in ('want_to_read','reading','completed','abandoned')),
  rating smallint check(rating between 1 and 5), started_at date, finished_at date, summary text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id),
  check(total_pages is null or current_page<=total_pages)
);
create index books_user_status_idx on public.books(user_id,status);

create table public.knowledge_notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, book_id uuid,
  title text not null check(char_length(title) between 1 and 240), content text not null default '', learning text, application text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(user_id,book_id) references public.books(user_id,id) on delete set null
);
create index knowledge_notes_user_updated_idx on public.knowledge_notes(user_id,updated_at desc);
create index knowledge_notes_user_book_idx on public.knowledge_notes(user_id,book_id) where book_id is not null;

create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null check(char_length(description) between 1 and 240), amount numeric(14,2) not null check(amount>0),
  type text not null check(type in ('income','expense')), category text not null default 'Outros', occurred_at timestamptz not null default now(),
  recurring boolean not null default false, created_at timestamptz not null default now()
);
create index transactions_user_occurred_idx on public.transactions(user_id,occurred_at desc);
create index transactions_user_type_occurred_idx on public.transactions(user_id,type,occurred_at desc);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(title) between 1 and 160), target numeric(14,2) not null check(target>0),
  current_amount numeric(14,2) not null default 0 check(current_amount>=0), deadline date,
  status text not null default 'active' check(status in ('active','completed','paused','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index financial_goals_user_status_idx on public.financial_goals(user_id,status);

create table public.addictions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 120), start_date date not null default current_date,
  daily_cost numeric(12,2) check(daily_cost>=0), replacement_plan jsonb not null default '[]'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create index addictions_user_active_idx on public.addictions(user_id,active);

create table public.addiction_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, addiction_id uuid not null,
  event_type text not null check(event_type in ('urge','resisted','relapse')), trigger text, intervention text,
  urge_before smallint check(urge_before between 1 and 5), urge_after smallint check(urge_after between 1 and 5), note text,
  occurred_at timestamptz not null default now(), foreign key(user_id,addiction_id) references public.addictions(user_id,id) on delete cascade
);
create index addiction_events_user_addiction_time_idx on public.addiction_events(user_id,addiction_id,occurred_at desc);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 160), exercises jsonb not null default '[]'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create index workout_plans_user_active_idx on public.workout_plans(user_id,active);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, workout_plan_id uuid,
  snapshot jsonb not null default '{}'::jsonb, volume_kg numeric(14,2) not null default 0 check(volume_kg>=0),
  started_at timestamptz not null default now(), completed_at timestamptz,
  foreign key(user_id,workout_plan_id) references public.workout_plans(user_id,id) on delete set null
);
create index workout_sessions_user_started_idx on public.workout_sessions(user_id,started_at desc);
create index workout_sessions_owner_plan_idx on public.workout_sessions(user_id,workout_plan_id) where workout_plan_id is not null;

grant select,insert,update,delete on public.goals,public.goal_milestones,public.commitments,public.commitment_events,
  public.mood_entries,public.books,public.knowledge_notes,public.transactions,public.financial_goals,public.addictions,
  public.addiction_events,public.workout_plans,public.workout_sessions to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['goals','goal_milestones','commitments','commitment_events','mood_entries','books','knowledge_notes','transactions','financial_goals','addictions','addiction_events','workout_plans','workout_sessions'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',table_name||'_owner_all',table_name);
  end loop;
end $$;
