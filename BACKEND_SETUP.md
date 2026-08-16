# Backend do GOATS — Supabase

## O que já está integrado

- PostgreSQL com isolamento por usuário (Row Level Security).
- Login por link mágico no e-mail.
- Sessão segura em cookies.
- API `GET/PUT /api/store` autenticada.
- Migração automática do estado local para a conta na primeira sincronização.
- Preferência offline: o app continua utilizável se o backend estiver indisponível.
- Campos de vínculo com WhatsApp e permissões granulares da Goat AI.
- Log estrutural para auditoria futura das ações da IA.

## Ativação

1. Crie um projeto em https://supabase.com/dashboard.
2. No SQL Editor, execute `supabase/migrations/001_goats_foundation.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha a URL e a chave pública do projeto.
5. Em Authentication > URL Configuration, adicione:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
6. Reinicie `npm run dev` e acesse `/login`.

## Comportamento de migração

Ao entrar pela primeira vez:

- se a conta já possuir estado remoto, ele prevalece;
- se a conta estiver vazia, o estado atual do `localStorage` é enviado;
- cada alteração seguinte é salva localmente e sincronizada com o PostgreSQL.

O `user_state` em JSONB é uma camada de transição para preservar o protótipo. Antes de análises avançadas da Goat AI e relatórios em escala, os domínios devem ser normalizados em tabelas de eventos (`commitments`, `habit_events`, `goal_events`, `mood_entries` etc.).

## Segurança

- A chave `SUPABASE_SERVICE_ROLE_KEY` nunca deve chegar ao browser.
- Rotas de API são tratadas como endpoints públicos e sempre verificam o usuário.
- RLS impede que uma sessão leia ou altere dados de outra conta.
- O log de auditoria não aceita inserções diretas do cliente; futuras ações da Goat AI devem ser registradas pelo backend confiável.
