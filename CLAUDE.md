# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # development server (Turbopack)
npm run build    # production build — run this to verify TypeScript before finishing any task
npm run lint     # ESLint
```

There are no tests. Build must pass clean (`npm run build`) before any task is considered done.

## Architecture

**Zelvo** is a real estate lead management system. Leads arrive, get scored, get automatically distributed to brokers (corretores) based on score and availability, and move through a 9-stage sales funnel.

### Data flow

```
src/data/*.ts          ← mock seed data (initial state only)
     ↓
src/stores/zelvoStore.ts  ← single Zustand store (all state + all mutations)
     ↓
src/repositories/      ← abstraction layer (local store or Supabase, switchable)
     ↓
pages ('use client')   ← consume store via useZelvoStore(s => s.field) selectors
```

`src/data/` files are **only** imported by `zelvoStore.ts` as `ESTADO_INICIAL`. No page or component imports from `src/data/` directly — all data access goes through the store.

### State and persistence

The store uses Zustand `persist` middleware with `skipHydration: true`. The `StoreHydration` component (rendered in `layout.tsx`) calls `useZelvoStore.persist.rehydrate()` in a `useEffect` to hydrate from localStorage on the client. This avoids SSR hydration mismatches.

Every page is `'use client'`. The store is the only data source at runtime.

### User profiles and access control

Two profiles: `gerente` (full access) and `corretor` (own leads only).

- **`src/lib/access.ts`** — `podeAcessarLead(usuarioAtual, lead)` is the single access-check function. Gerente always passes; corretor passes only if `lead.corretorAtribuido === usuarioAtual.corretorId`.
- **`src/components/AccessGuard.tsx`** — wraps pages/sections that are profile-restricted. Reads perfil from the store internally. Usage: `<AccessGuard allowedProfiles={['gerente']}>`.
- **`src/components/UserSwitcher.tsx`** — mock profile switcher (no real auth). Calls `selecionarUsuario(id)` then redirects to `rotaInicialdoPerfil(perfil)` (`/` for gerente, `/meu-painel` for corretor).
- Users are mocked in `src/data/usuarios.ts`: 1 gerente + 5 corretores (c1–c5).

### Scoring and distribution

- **`src/lib/score.ts`** — `calcularLeadScore()` returns 0–100 based on income, down payment, FGTS, purchase timeline, etc. `definirTemperaturaLead()` maps score → `Premium/Quente/Morno/Frio`.
- **`src/lib/distribution.ts`** — `distribuirLeadAutomaticamente()` matches lead temperatura to corretor nivel (Premium→A, Quente→A/B, Morno→B/C, Frio→C/D), then sorts eligible corretores by scoreCorretor → leadsEmAberto → taxaConversao → tempoMedioAtendimento. Falls back to any active corretor if no eligible match.

### StatusLead (9 values)

`'Novo' | 'Distribuído' | 'Contato iniciado' | 'Em Atendimento' | 'Visita agendada' | 'Proposta enviada' | 'Convertido' | 'Perdido' | 'Nutrição'`

Changing status via `alterarStatusLead` or `adicionarAtualizacaoAtendimento` automatically updates the assigned corretor's metrics (vendasFechadas, visitasMarcadas, propostasEnviadas, leadsEmAberto).

### Data mode (local vs Supabase)

`src/config/dataMode.ts` exports `DATA_MODE` derived from `NEXT_PUBLIC_DATA_MODE` env var (defaults to `'local'`).

`src/repositories/` holds dual implementations — local (zelvoStore) and supabase stubs — selected by `IS_LOCAL_MODE`. The supabase implementations throw until the DB is configured. `src/lib/supabaseClient.ts` returns `null` when env vars are absent.

`supabase/schema.sql` — full schema with RLS. `supabase/seed.sql` — initial data mirroring the mocks.

### Menu

`src/components/ZelvoMenu.tsx` reads `usuarioAtual.perfil` and renders different tab sets:
- Gerente: Dashboard, Leads, Novo Lead, Funil, Corretores, Ranking, Distribuições, Configurações, Diagnóstico
- Corretor: Meu Painel, Meus Leads, Meu Funil, Próximas Ações, Minha Performance

The sidebar uses a Tailwind `group/sidebar` hover-expand pattern (no JS state).

### Visual identity

Dark theme — hardcoded inline styles:
- Page background: `#1A1E23`
- Card background: `#1F2329`
- Sidebar: `#16191D`
- Accent (wine): `#6E0933`
