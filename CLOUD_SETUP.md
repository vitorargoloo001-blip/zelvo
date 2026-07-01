# CLOUD_SETUP.md — Guia de Configuração Cloud (Vercel Postgres + Auth.js)

O Zelvo usa **Vercel Postgres (Neon)** como banco de dados e **Auth.js v5** (NextAuth) para autenticação.

---

## Variáveis de Ambiente Necessárias

### Banco de dados (injetadas automaticamente pela integração Vercel Postgres)
```
POSTGRES_PRISMA_URL=           # URL pooled para queries (Prisma)
POSTGRES_URL_NON_POOLING=      # URL direta para migrations
```

### Auth.js
```
NEXTAUTH_URL=https://seu-dominio.vercel.app   # URL pública da aplicação
AUTH_SECRET=<gerar com: openssl rand -base64 32>
```

### Email (opcional — necessário para recuperação de senha real)
```
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Zelvo CRM <noreply@seudominio.com.br>
```

### Modo de operação
```
NEXT_PUBLIC_AUTH_MODE=cloud   # Ativa autenticação real (default: mock)
NEXT_PUBLIC_DATA_MODE=cloud   # Ativa banco real (default: local)
```

---

## Provisionamento

### 1. Vercel Postgres
No dashboard Vercel do projeto:
1. Vá em **Storage → Create Database → Postgres (Neon)**
2. Vincule ao projeto — as variáveis `POSTGRES_*` são injetadas automaticamente

### 2. Migrations e Seed

```bash
# Aplica o schema ao banco
npx prisma migrate deploy

# Popula com dados iniciais (usuários, corretores de demo)
npx prisma db seed
```

Credenciais de demo após o seed:
- **Gerente**: `gerente@zelvo.com.br` / `zelvo@2025`
- **Corretores**: `corretor1@zelvo.com.br` ... `corretor5@zelvo.com.br` / `zelvo@2025`

### 3. AUTH_SECRET
```bash
# Gera e adiciona à Vercel:
openssl rand -base64 32
```
No dashboard: **Settings → Environment Variables → AUTH_SECRET**

### 4. Resend (recuperação de senha)
1. Crie uma conta em [resend.com](https://resend.com)
2. Adicione e verifique o domínio de envio
3. Gere uma API key e adicione como `RESEND_API_KEY`

> Sem `RESEND_API_KEY`, o sistema funciona normalmente mas os links de recuperação
> são apenas logados no console (não enviados por email).

---

## Verificação pós-deploy

- Login com credenciais seedadas (gerente e corretor)
- Criar lead → confirmar que aparece no banco
- Trocar status do lead → métricas do corretor atualizadas
- Gerente redistribuir lead → corretor anterior perde o lead
- Recuperação de senha (se Resend configurado)
- Confirmar que modo **mock** (`NEXT_PUBLIC_AUTH_MODE=mock DATA_MODE=local`) ainda funciona sem banco
