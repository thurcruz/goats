# Backend do APRUMO — Supabase

## O que já está integrado

- PostgreSQL com isolamento por usuário (Row Level Security).
- Login por link mágico no e-mail.
- Sessão segura em cookies.
- APIs autenticadas por domínio normalizado: `/api/core` (metas e compromissos), `/api/domains` (finanças, hábitos, humor, conhecimento) e `/api/profile` (identidade e permissões da IA).
- Preferência offline: o app continua utilizável se o backend estiver indisponível.
- Campos de vínculo com WhatsApp e permissões granulares da Apri.
- Log estrutural para auditoria futura das ações da IA.

## Ativação

1. Crie um projeto em https://supabase.com/dashboard.
2. No SQL Editor, execute `supabase/migrations/001_goats_foundation.sql` (nome de arquivo histórico — migrations aplicadas não são renomeadas).
3. Copie `.env.example` para `.env.local`.
4. Preencha a URL e a chave pública do projeto.
5. Em Authentication > URL Configuration, adicione:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
6. Reinicie `npm run dev` e acesse `/login`.

## Comportamento de sincronização

- Ao carregar, o app hidrata a partir das tabelas normalizadas (`/api/core`, `/api/domains`) e do perfil (`/api/profile`); o `localStorage` serve como camada offline.
- Cada alteração é salva localmente e sincronizada por domínio com o PostgreSQL.

Observação: a tabela `user_state` (JSONB) foi a camada de transição original do protótipo e **não é mais usada** pela aplicação — a persistência agora é totalmente normalizada. A tabela permanece no banco por compatibilidade; se houver dados relevantes apenas nela, migre-os para as tabelas normalizadas antes de removê-la.

## Segurança

- A chave `SUPABASE_SERVICE_ROLE_KEY` nunca deve chegar ao browser.
- Rotas de API são tratadas como endpoints públicos e sempre verificam o usuário.
- RLS impede que uma sessão leia ou altere dados de outra conta.
- O log de auditoria não aceita inserções diretas do cliente; futuras ações da Apri devem ser registradas pelo backend confiável.
