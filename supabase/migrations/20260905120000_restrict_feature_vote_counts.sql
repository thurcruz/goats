-- Corrige a exposição de `feature_vote_counts` a clientes anônimos.
--
-- Contexto: o Supabase define ALTER DEFAULT PRIVILEGES concedendo EXECUTE em
-- funções do schema public para `anon` e `authenticated`. Um
-- `revoke ... from public` NÃO remove essa concessão direta ao papel `anon`,
-- então a função continuou chamável sem autenticação.
--
-- Regra para este projeto: toda função nova deve revogar explicitamente de
-- `anon` (e de `public`) antes de conceder ao papel pretendido.

revoke execute on function public.feature_vote_counts(text) from anon;
revoke execute on function public.feature_vote_counts(text) from public;
grant execute on function public.feature_vote_counts(text) to authenticated;
