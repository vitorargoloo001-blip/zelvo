# Zelvo

CRM de gestão de leads para imobiliárias. Distribuição inteligente por score, funil configurável, painel de gerente e corretor, intake externo via API.

## Stack

| Camada       | Tecnologia                                      |
|--------------|-------------------------------------------------|
| Framework    | Next.js 16 — App Router                         |
| Linguagem    | TypeScript (estrito)                            |
| Estilos      | Tailwind CSS                                    |
| Estado       | Zustand (`skipHydration: true`)                 |
| Banco        | PostgreSQL via Neon + Prisma 7 (`@prisma/adapter-pg`) |
| Auth         | Auth.js (next-auth beta) — session + JWT        |
| Email        | Resend                                          |
| Hospedagem   | Vercel                                          |

---

## Rodar localmente

```bash
npm install

# Copiar e preencher variáveis de ambiente
cp .env.example .env.local

npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Sem `NEXT_PUBLIC_DATA_MODE=db`, o sistema usa Zustand com dados mockados (modo `local`).

---

## Variáveis de ambiente

### Obrigatórias em produção

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_PRISMA_URL` | URL pooled do Neon (pgbouncer) — usada em runtime |
| `POSTGRES_URL_NON_POOLING` | URL direta do Neon — usada pelo Prisma CLI (`db push`) |
| `NEXTAUTH_SECRET` | Segredo de sessão Auth.js (gere com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública do app (ex: `https://zelvo.vercel.app`) |
| `NEXT_PUBLIC_DATA_MODE` | `db` para produção, `local` para mock |

### Opcionais / recursos extras

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave da Resend para envio de emails |
| `RESEND_FROM_EMAIL` | Endereço remetente (ex: `noreply@suaimobiliaria.com`) |
| `LEAD_INTAKE_SECRET` | Token Bearer para autenticar POST `/api/leads/intake` |
| `LEAD_INTAKE_ALLOWED_ORIGINS` | CORS allowlist para o endpoint de intake |

> **Segurança:** `LEAD_INTAKE_SECRET`, `LEAD_INTAKE_ALLOWED_ORIGINS`, `RESEND_API_KEY` e `RESEND_FROM_EMAIL` NUNCA devem ter prefixo `NEXT_PUBLIC_` — são server-side only.

---

## Banco de dados (Neon + Prisma)

### Schema

O schema completo está em `prisma/schema.prisma`.

### Aplicar mudanças

```bash
# Gerar client Prisma (após alterar schema)
npx prisma generate

# Aplicar ao banco (usa URL direta, não pooled)
npx prisma db push
```

> O projeto usa `db push` em vez de `migrate dev` porque a `POSTGRES_PRISMA_URL` é pooled (pgbouncer) e não suporta advisory locks. O arquivo `prisma.config.ts` aponta `POSTGRES_URL_NON_POOLING` para o CLI.

### Modelos principais

- `Usuario`, `Corretor` — usuários e corretores com perfil e nível
- `Lead`, `Distribuicao`, `Atividade` — pipeline de leads
- `Empresa`, `ScoreConfig`, `DistribuicaoConfig`, `FunilConfig`, `NotificacaoConfig` — configurações singleton
- `OnboardingStatus` — progresso do onboarding inicial
- `Notificacao`, `EmailLog`, `PasswordResetToken` — suporte

---

## Build e deploy

```bash
npm run build
```

O build deve completar sem erros TypeScript e sem warnings de lint. Todos os 59 routes são gerados.

### Deploy na Vercel

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente listadas acima
3. O comando de build padrão (`npm run build`) e o output directory (`.next`) são detectados automaticamente
4. Configure `NEXTAUTH_URL` com a URL do deploy

---

## Perfis de usuário

| Perfil    | Acesso |
|-----------|--------|
| `gerente` | Total: leads, corretores, distribuições, configurações, diagnóstico |
| `corretor`| Restrito: apenas seus leads e métricas pessoais |

Login via `/login` com email + senha (Auth.js + bcrypt).

---

## Estrutura do projeto

```
prisma/
  schema.prisma       # Modelos e schema do banco
  config.ts           # Aponta POSTGRES_URL_NON_POOLING para o CLI

src/
  app/                # Páginas Next.js (App Router)
    api/              # Route Handlers (server-side)
      configuracoes/  # empresa, score, distribuicao, funil, notificacoes
      corretores/     # CRUD + ativar/inativar
      usuarios/       # CRUD + desativar + reenviar-acesso
      leads/          # CRUD + intake externo
      system/health   # Health check + totais
      onboarding/     # Status de onboarding
    configuracoes/    # Página de configurações (10 tabs)
    onboarding/       # Wizard de primeiro uso
    dashboard/        # Painel principal
    leads/            # Lista e detalhe de leads
    corretores/       # Ranking e painel do corretor

  components/
    configuracoes/    # TabEmpresa, TabUsuarios, TabCorretores, ...
    ui/               # Componentes reutilizáveis

  lib/
    types.ts          # Tipos TypeScript do domínio
    scoreDefaults.ts  # Defaults de score, distribuição e funil
    distribution.ts   # Algoritmo de distribuição de leads
    apiAuth.ts        # usuarioAutenticado() — auth server-side
    prisma.ts         # Singleton do PrismaClient

  repositories/       # Abstração de dados (db ou local/mock)
  services/           # notificationService, emailService
  stores/             # zelvoStore.ts (Zustand)
  data/               # Mock data para modo local
```

---

## Diagnóstico e saúde

- `/diagnostico` — painel de diagnóstico do intake e integrações (gerente)
- `/api/system/health` — health check público com totais do banco, presença de secrets e ambiente
- `/onboarding` — wizard de configuração inicial para novos gerentes

Veja o guia operacional completo em [OPERACAO_ZELVO.md](./OPERACAO_ZELVO.md).
