revoke execute on function public.handle_new_user() from anon, authenticated;

create index if not exists ai_audit_log_user_id_idx
  on public.ai_audit_log(user_id);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "state_select_own" on public.user_state;
drop policy if exists "state_insert_own" on public.user_state;
drop policy if exists "state_update_own" on public.user_state;
drop policy if exists "audit_select_own" on public.ai_audit_log;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "state_select_own" on public.user_state
  for select using ((select auth.uid()) = user_id);
create policy "state_insert_own" on public.user_state
  for insert with check ((select auth.uid()) = user_id);
create policy "state_update_own" on public.user_state
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "audit_select_own" on public.ai_audit_log
  for select using ((select auth.uid()) = user_id);
