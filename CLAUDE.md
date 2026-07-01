# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # development server (Turbopack)
npm run build      # production build — run before finishing any task
npm run lint       # ESLint
npm run db:migrate # prisma migrate deploy (Vercel Postgres)
npm run db:seed    # prisma db seed (tsx prisma/seed.ts)
vercel --prod      # deploy to production (no GitHub auto-deploy)
```

There are no tests. Build must pass clean (`npm run build`) before any task is considered done.

## Architecture

**Zelvo** is a real estate lead management CRM. Leads arrive, get scored, get automatically distributed to brokers (corretores) based on score, and move through a 9-stage sales funnel.

### Dual-mode operation

Two independent env var toggles control the runtime:

| Var | Values | Effect |
|---|---|---|
| `NEXT_PUBLIC_AUTH_MODE` | `mock` \| `cloud` | `mock` → UserSwitcher (demo); `cloud` → Auth.js real login |
| `NEXT_PUBLIC_DATA_MODE` | `local` \| `cloud` | `local` → Zustand+localStorage; `cloud` → Postgres via API routes |

Production (Vercel) runs both as `cloud`. Local dev defaults to `mock`/`local`.
Config files: `src/config/authMode.ts` and `src/config/dataMode.ts` — both export `IS_CLOUD_*` booleans used throughout.

### Data flow (cloud mode)

```
Browser (React + Zustand)
  ↓ fetch
src/app/api/**       ← Next.js Route Handlers (auth check + HTTP boundary)
  ↓ import
src/repositories/    ← Prisma queries (server-only, Node.js runtime)
  ↓
Vercel Postgres (Neon, pooled via pgbouncer)
```

In `local` mode, the store mutates in-memory state and persists to localStorage — no API calls. The `src/repositories/` layer is never touched from the browser; only API routes import from it.

### Data flow (local mode)

```
src/data/*.ts        ← mock seed data (initial state, imported once by zelvoStore)
     ↓
src/stores/zelvoStore.ts  ← single Zustand store (all state + all mutations)
     ↓
pages ('use client') ← consume via useZelvoStore(s => s.field) selectors
```

The store uses Zustand `persist` with `skipHydration: true`. `StoreHydration` (in `layout.tsx`) calls `useZelvoStore.persist.rehydrate()` in a `useEffect` to avoid SSR hydration mismatches.

### Authentication

- `src/auth.ts` — Auth.js v5 config: Credentials Provider (email+password), `bcryptjs`, JWT session. Exports `auth`, `signIn`, `signOut`, `handlers`. Augments `next-auth` `User` with `perfil` and `corretorId`.
- `src/auth.config.ts` — Edge-safe subset (no Node.js imports), used by both `proxy.ts` and `auth.ts`.
- `src/proxy.ts` — **middleware is named `proxy.ts`, not `middleware.ts`** (Next.js 16 breaking change). Edge runtime: only checks cookie existence, no crypto. Redirects to `/login` if `AUTH_MODE=cloud` and no session cookie.
- `src/lib/apiAuth.ts` — Server-only helper; calls `auth()` (no args) to resolve the session in API routes.
- `src/services/authService.ts` — Client-side auth surface: `loginComEmailSenha`, `logout`, `obterSessaoAtual`, `obterUsuarioAtualComPerfil`, `enviarEmailRecuperacao`. Calls Auth.js `signIn`/`signOut` in cloud mode; delegates to `authMockService.ts` in mock mode.

### Database

- Prisma 7 with `@prisma/adapter-pg` (driver adapter, not the classic datasource URL).
- `src/lib/prisma.ts` — singleton `PrismaClient` with `new PrismaPg(POSTGRES_PRISMA_URL)`. `server-only` import prevents accidental client-side usage.
- `POSTGRES_PRISMA_URL` → pooled Neon URL (pgbouncer). `POSTGRES_URL_NON_POOLING` → direct URL, used only by `prisma.config.ts` for CLI migrations.
- `prisma.config.ts` — CLI config; seed via `migrations.seed: 'tsx prisma/seed.ts'`.
- `next.config.ts` has `serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg']` — required to prevent Turbopack from bundling native Node.js packages.

### Repository layer

`src/repositories/` — four files (`leadRepository`, `corretorRepository`, `distribuicaoRepository`, `atividadeRepository`). All are `server-only`. Each exports a repository object implementing an interface (e.g. `ILeadRepository`). The `toLead`/`toCorretor` mapper functions convert Prisma rows to the app's `Lead`/`Corretor` types from `src/lib/types.ts`.

Business logic lives in pure functions, not in repositories:
- `src/lib/score.ts` — `calcularLeadScore()` (0–100) and `definirTemperaturaLead()`.
- `src/lib/distribution.ts` — `distribuirLeadAutomaticamente()` matches temperatura to corretor nivel.
- `src/lib/corretorMetrics.ts` — `atualizarMetricasCorretor()` recalculates counters on status change.
- `src/lib/access.ts` — `podeAcessarLead()` single access-check (gerente = all; corretor = own leads).

### Store (Zustand)

`src/stores/zelvoStore.ts` — all 7 mutation actions are `async`. In cloud mode, each calls the corresponding API route and then updates local state from the response. In local mode, mutations are synchronous logic wrapped in a resolved Promise.

`CloudDataProvider.tsx` — runs 4 parallel fetches (`/api/leads`, `/api/corretores`, `/api/distribuicoes`, `/api/atividades`) on mount in cloud mode and hydrates the store via `hydrateFromServer()`.

### User profiles and access control

Two profiles: `gerente` (full access) and `corretor` (own leads only). Access is enforced in two places:
1. **API routes** — check via `usuarioAutenticado()` from `src/lib/apiAuth.ts`; gerente sees all, corretor query filters by `corretorAtribuido`.
2. **`src/components/AccessGuard.tsx`** — wraps UI sections: `<AccessGuard allowedProfiles={['gerente']}>`.

### API routes

All under `src/app/api/`. Route Handlers follow the pattern: `usuarioAutenticado()` → 401 if null → business logic → repository call. Dynamic segments use `await ctx.params` (async in Next.js 16).

```
GET/POST  /api/leads
GET/PATCH /api/leads/[id]
PATCH     /api/leads/[id]/status
POST      /api/leads/[id]/atendimento
POST      /api/leads/[id]/distribuir    → returns { ok, lead }
POST      /api/leads/[id]/redistribuir  → returns { ok, lead }
POST      /api/leads/intake             (no auth — external lead ingestion)
GET       /api/corretores
GET       /api/corretores/[id]
GET       /api/distribuicoes
GET       /api/atividades
POST      /api/auth/recuperar-senha
POST      /api/auth/nova-senha
GET/POST  /api/auth/[...nextauth]
```

### StatusLead (9 values)

`'Novo' | 'Distribuído' | 'Contato iniciado' | 'Em Atendimento' | 'Visita agendada' | 'Proposta enviada' | 'Convertido' | 'Perdido' | 'Nutrição'`

### Visual identity

Dark theme, hardcoded inline styles:
- Page background: `#1A1E23`
- Card background: `#1F2329`
- Sidebar: `#16191D`
- Accent (wine): `#6E0933`

### Critical: NEXTAUTH_URL must have https://

`NEXTAUTH_URL` in Vercel **must** include `https://` (e.g. `https://zelvo-app.vercel.app`). Without the protocol, `@auth/core` throws `TypeError: Invalid URL` on every `auth()` call, crashing all API routes.
