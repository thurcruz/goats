# E-mails transacionais do GOATS (Auth)

Templates branded para os e-mails de autenticação do Supabase, com identidade GOATS
(fundo escuro, lima `#d0e027`, título serifado). Renderizam bem em Gmail, Apple Mail e
Outlook (HTML table-based, estilos inline).

## Arquivos → onde colar no dashboard

Dashboard → **Authentication → Emails → Templates**. Cole o HTML de cada arquivo no
template correspondente e ajuste o *Subject*:

| Arquivo | Template no dashboard | Subject sugerido |
| --- | --- | --- |
| `confirmation.html` | Confirm signup | `Confirme seu e-mail — GOATS` |
| `recovery.html` | Reset password | `Redefinir sua senha — GOATS` |
| `magic_link.html` | Magic Link | `Seu link de acesso — GOATS` |
| `email_change.html` | Change Email Address | `Confirme seu novo e-mail — GOATS` |

> Se você adotar o Supabase CLI depois, aponte estes arquivos em `supabase/config.toml`
> na seção `[auth.email.template.*]` (`content_path`) para versionar tudo pelo repo.

## Variáveis usadas (Go templates do Supabase)

- `{{ .ConfirmationURL }}` — link de ação (botão + fallback).
- `{{ .Token }}` — código OTP de 6 dígitos (confirmation, recovery, magic link).
- `{{ .Email }}` / `{{ .NewEmail }}` — usados na troca de e-mail.
- `{{ .Data.display_name }}` — **saudação pelo nome**. Vem do metadata gravado no
  cadastro (`options.data.display_name` em `app/cadastro/page.tsx`). O bloco
  `{{ if .Data.display_name }}…{{ end }}` degrada bem quando não há nome.

## Passo a passo do remetente personalizado (nome + domínio via Resend)

Os e-mails de nome/domínio próprios **exigem SMTP customizado** — o serviço padrão do
Supabase é limitado (poucos e-mails/hora) e usa remetente genérico.

1. **Resend**: crie conta em https://resend.com e adicione seu domínio
   (*Domains → Add Domain*).
2. **DNS**: no seu registrador, adicione os registros que o Resend mostrar
   (SPF/`MX` + DKIM `resend._domainkey` + DMARC). Aguarde verificar (fica "Verified").
3. **Credenciais SMTP** no Resend (*Settings → SMTP*):
   - Host: `smtp.resend.com` · Port: `465` (SSL) ou `587` (TLS)
   - User: `resend` · Password: uma **API Key** do Resend (*API Keys → Create*).
4. **Supabase** → *Project Settings → Authentication → SMTP Settings* → *Enable Custom SMTP*:
   - Sender email: `ola@seudominio.com` (no domínio verificado)
   - Sender name: `GOATS`
   - Host/Port/User/Password: os do passo 3.
5. **Rate limits**: *Authentication → Rate Limits* — aumente o de e-mails agora que o
   envio é próprio (o default é baixo).
6. **URLs** (se ainda não fez): *Authentication → URL Configuration* → Site URL e
   Redirect `…/auth/callback` (ver `BACKEND_SETUP.md`).

Pronto: os 4 e-mails passam a sair como `GOATS <ola@seudominio.com>`, branded e sem cair
em spam (graças ao SPF/DKIM/DMARC do seu domínio).

## Trocar o wordmark por um logo em imagem

Cada template tem, no topo, um comentário `<!-- Logo em imagem: … -->`. Hospede um PNG
(~130px de largura, fundo transparente) em uma URL HTTPS pública — por exemplo
`public/logo-email.png` no deploy (`https://SEU-DOMINIO/logo-email.png`) — e substitua o
bloco do "G + GOATS" pela tag `<img>` comentada. Use sempre URL absoluta: e-mail não
carrega assets relativos.

## Testar

- Dispare cada fluxo no app (cadastro, "esqueci a senha", magic link, troca de e-mail).
- Verifique a renderização no Gmail (web + app) e no Outlook.
- Cheque SPF/DKIM/DMARC com https://www.mail-tester.com (mira nota ≥ 9/10).
