create policy "audit_insert_own" on public.ai_audit_log
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
