# Deploy na Vercel — Zelvo MVP

Guia completo para hospedar o Zelvo no Vercel com Next.js e Supabase.

---

## Stack

| Camada     | Tecnologia         |
|------------|--------------------|
| Front-end  | Next.js (App Router) |
| Linguagem  | TypeScript         |
| Estilo     | Tailwind CSS       |
| Estado     | Zustand            |
| Banco      | Supabase (futuro)  |
| Hospedagem | Vercel             |

---

## 1. Subir o projeto no GitHub

```bash
git init
git add .
git commit -m "feat: zelvo mvp inicial"
git remote add origin https://github.com/SEU_USUARIO/zelvo.git
git push -u origin main
```

---

## 2. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e faça login
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `zelvo`
4. Framework: **Next.js** (detectado automaticamente)
5. Build command: `npm run build` (padrão — não altere)
6. Output directory: `.next` (padrão — não altere)
7. Clique em **"Deploy"**

---

## 3. Configurar variáveis de ambiente na Vercel

Acesse: **Vercel → seu projeto → Settings → Environment Variables**

### Modo local (demonstração sem banco)

| Variável                      | Valor   | Ambiente         |
|-------------------------------|---------|------------------|
| `NEXT_PUBLIC_DATA_MODE`       | `local` | Production, Preview, Development |

### Modo Supabase (banco real)

| Variável                      | Valor                                | Ambiente         |
|-------------------------------|--------------------------------------|------------------|
| `NEXT_PUBLIC_DATA_MODE`       | `supabase`                           | Production       |
| `NEXT_PUBLIC_SUPABASE_URL`    | `https://xxxx.supabase.co`          | Production       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...`         | Production       |

> **NUNCA** adicione `SUPABASE_SERVICE_ROLE_KEY` como variável `NEXT_PUBLIC_*`.
> Se precisar da service role, use apenas como variável de servidor (sem o prefixo `NEXT_PUBLIC_`).

---

## 4. Rodar o build localmente antes do deploy

```bash
# Instalar dependências
npm install

# Verificar tipos TypeScript
npx tsc --noEmit

# Build de produção
npm run build

# Servidor local de produção
npm start
```

---

## 5. Alternar o modo de dados

### Para modo local (padrão — Zustand + localStorage)

No `.env.local`:
```
NEXT_PUBLIC_DATA_MODE=local
```

Ou na Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_DATA_MODE = local
```

### Para modo Supabase (banco real)

1. Execute `supabase/schema.sql` no SQL Editor do Supabase
2. Opcionalmente execute `supabase/seed.sql` para dados iniciais
3. Configure as variáveis na Vercel:
```
NEXT_PUBLIC_DATA_MODE        = supabase
NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```
4. Faça um novo deploy (ou acione via "Redeploy" na Vercel)

---

## 6. Verificar o deploy

- Acesse o URL da Vercel (ex: `https://zelvo.vercel.app`)
- Acesse `/diagnostico` (perfil gerente) para ver:
  - Modo de dados ativo
  - Ambiente de execução (Local vs Vercel)
  - Status da configuração Supabase
  - Contadores de dados
- Teste `GET https://zelvo.vercel.app/api/leads/intake` para verificar o endpoint

---

## 7. Próximos passos após ativar Supabase

1. Migrar dados do `src/data/` para o banco executando `supabase/seed.sql`
2. Ativar Supabase Auth no painel do Supabase
3. Substituir `UserSwitcher` mockado por login real
4. Implementar `POST /api/leads/intake` com lógica real
5. Configurar domínio personalizado na Vercel

---

## Arquivos de referência

| Arquivo                              | Descrição |
|--------------------------------------|-----------|
| `.env.example`                       | Modelo de variáveis de ambiente |
| `src/config/dataMode.ts`             | Controla qual fonte de dados está ativa |
| `src/lib/supabaseClient.ts`          | Cliente Supabase (null quando não configurado) |
| `src/repositories/leadRepository.ts` | Abstração local/supabase para leads |
| `supabase/schema.sql`                | Schema completo para criar tabelas e RLS |
| `supabase/seed.sql`                  | Dados iniciais espelhando os mocks |
| `src/app/api/leads/intake/route.ts`  | Endpoint futuro de entrada de leads |
