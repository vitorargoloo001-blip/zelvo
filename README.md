# Zelvo MVP

Sistema de gestão de leads para imobiliárias. Controle de funil, distribuição de leads por score, painel de corretores e gerentes.

## Stack

- **Next.js** (App Router) — framework principal
- **TypeScript** — tipagem estrita
- **Tailwind CSS** — estilização
- **Zustand** — gerenciamento de estado + localStorage
- **Supabase** — banco de dados (integração futura)
- **Vercel** — hospedagem oficial

---

## Rodar localmente

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env.local

# Servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

O modo padrão é `local` — funciona sem banco de dados usando Zustand + localStorage.

---

## Modo de dados

| `NEXT_PUBLIC_DATA_MODE` | Fonte de dados         | Quando usar                   |
|-------------------------|------------------------|-------------------------------|
| `local` (padrão)        | Zustand + localStorage | Desenvolvimento, demonstração |
| `supabase`              | Supabase (banco real)  | Produção                      |

Configure no `.env.local`:

```bash
NEXT_PUBLIC_DATA_MODE=local
```

---

## Deploy na Vercel

O Zelvo foi projetado para rodar nativamente na Vercel.

**Banco recomendado:** Supabase

### Variáveis de ambiente necessárias

| Variável                        | Descrição                 |
|---------------------------------|---------------------------|
| `NEXT_PUBLIC_DATA_MODE`         | `local` ou `supabase`    |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta no client-side.
> Use-a apenas em Route Handlers ou Server Actions (variável de servidor, sem prefixo `NEXT_PUBLIC_`).

### Comando de build

```bash
npm run build
```

### Para ativar Supabase em produção

1. Execute `supabase/schema.sql` no SQL Editor do Supabase
2. Configure as variáveis de ambiente na Vercel
3. Altere `NEXT_PUBLIC_DATA_MODE=supabase`
4. Faça um novo deploy

Veja o guia completo em [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).

---

## Perfis de usuário

O MVP usa um sistema de perfis mockados (sem login real):

- **Gerente** — acesso completo: leads, funil, corretores, ranking, distribuições, diagnóstico
- **Corretor** — acesso restrito: apenas seus próprios leads e métricas pessoais

Use o seletor de usuário no topo da tela para alternar entre perfis.

---

## Estrutura do projeto

```
src/
  app/              # Páginas Next.js (App Router)
  components/       # Componentes reutilizáveis
  config/           # dataMode.ts — controla fonte de dados
  data/             # Dados mockados iniciais
  lib/              # Tipos, access.ts, supabaseClient.ts
  repositories/     # Abstração de dados (local ou supabase)
  services/         # Camada de serviços
  stores/           # zelvoStore.ts (Zustand + localStorage)
supabase/
  schema.sql        # Schema completo com RLS
  seed.sql          # Dados iniciais
```

---

## Diagnóstico

Acesse `/diagnostico` (perfil gerente) para ver:
- Modo de dados ativo e status da configuração Supabase
- Ambiente de execução (local vs Vercel)
- Contadores de leads, corretores, distribuições e atividades
- Status do localStorage
- Mapa de pontos de integração com Supabase
