create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  purpose text not null default '',
  whatsapp_phone_e164 text unique,
  whatsapp_verified_at timestamptz,
  ai_permissions jsonb not null default '{"tasks":true,"goals":true,"books":true,"moods":false,"finance":false,"antivicio":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transitional aggregate: lets the current prototype migrate without data loss.
-- Individual domains can be normalized incrementally after the product model stabilizes.
create table if not exists public.user_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('web','whatsapp')),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.ai_audit_log enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "state_select_own" on public.user_state for select using (auth.uid() = user_id);
create policy "state_insert_own" on public.user_state for insert with check (auth.uid() = user_id);
create policy "state_update_own" on public.user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "audit_select_own" on public.ai_audit_log for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_state (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
