# AUTH_SUPABASE.md — Guia de Autenticação com Supabase

Este documento descreve como ativar e configurar o login real com Supabase Auth no Zelvo.

---

## Visão geral

O Zelvo tem dois modos de autenticação controlados pela variável de ambiente `NEXT_PUBLIC_AUTH_MODE`:

| Valor | Comportamento |
|-------|--------------|
| `mock` (padrão) | UserSwitcher no topo — troca de perfil para demo, sem login real |
| `supabase` | Login com email + senha, sessão JWT, redirecionamento para `/login` |

---

## Passo 1 — Executar a migration no Supabase

Abra o [SQL Editor](https://supabase.com/dashboard/project/hnembkuzqaazqedlozzd/sql/new) e execute o arquivo:

```
supabase/migrations/20240102000000_add_auth_user_id.sql
```

Isso adiciona:
- Coluna `ativo BOOLEAN NOT NULL DEFAULT true` na tabela `profiles`
- Coluna `auth_user_id UUID UNIQUE REFERENCES auth.users(id)` na tabela `profiles`
- Atualiza o trigger `handle_new_user` para preencher `auth_user_id`

---

## Passo 2 — Criar usuários no painel do Supabase

Acesse **Authentication → Users → Add user → Create new user** e crie:

| Email | Senha sugerida | Perfil |
|-------|----------------|--------|
| gerente@zelvo.app | Zelvo@2024! | gerente |
| joao@zelvo.app | Zelvo@2024! | corretor |
| maria@zelvo.app | Zelvo@2024! | corretor |
| juliana@zelvo.app | Zelvo@2024! | corretor |
| pedro@zelvo.app | Zelvo@2024! | corretor |
| ana@zelvo.app | Zelvo@2024! | corretor |

> **Atenção:** desmarque "Send email confirmation" ao criar usuários via painel, ou confirme manualmente em **Authentication → Users → Confirm email**.

---

## Passo 3 — Associar usuários aos profiles

O trigger `handle_new_user` cria um `profile` automaticamente ao criar o usuário. Verifique via SQL Editor:

```sql
SELECT au.email, p.nome, p.perfil, p.ativo
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at;
```

Se o perfil foi criado com `perfil = 'corretor'` mas o email é do gerente, corrija:

```sql
UPDATE profiles
SET perfil = 'gerente', nome = 'Carlos Gerente'
WHERE email = 'gerente@zelvo.app';
```

Para associar um corretor ao `corretores` correto:

```sql
UPDATE profiles
SET corretor_id = '11111111-0000-0000-0000-000000000001', nome = 'João Silva'
WHERE email = 'joao@zelvo.app';

UPDATE profiles
SET corretor_id = '11111111-0000-0000-0000-000000000002', nome = 'Maria Oliveira'
WHERE email = 'maria@zelvo.app';

-- Repita para os demais corretores
```

---

## Passo 4 — Ativar o modo de auth real

### Em desenvolvimento local (.env.local):

```env
NEXT_PUBLIC_AUTH_MODE=supabase
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://hnembkuzqaazqedlozzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
```

### Em produção (Vercel):

1. Acesse **Settings → Environment Variables** no painel da Vercel
2. Adicione: `NEXT_PUBLIC_AUTH_MODE` = `supabase`
3. Clique em **Save** e aguarde o redeploy automático

---

## Como funciona o fluxo de login

```
Usuário acessa /login
       ↓
authService.loginComEmailSenha(email, senha)
       ↓
supabase.auth.signInWithPassword()  ← JWT gerado
       ↓
buscarPerfilPorAuthId(session.user.id)  ← query na tabela profiles
       ↓
setUsuarioAtual(usuario) + setSessao(sessao)  ← zelvoStore atualizado
       ↓
router.replace(rotaInicialdoPerfil(usuario.perfil))
  - gerente  → /
  - corretor → /meu-painel
```

---

## Proteção de rotas

O `AuthProvider` (montado em `AppShell.tsx`) detecta automaticamente:

- Se `AUTH_MODE=supabase` e não há sessão → redireciona para `/login`
- Se o token expira → Supabase refresca silenciosamente, `onAuthStateChange` atualiza o store
- Logout via `LoggedInUserBar` → limpa store + `supabase.auth.signOut()` → redireciona para `/login`

Rotas públicas (sem redirect): `/login`, `/recuperar-senha`, `/nova-senha`

---

## Recuperação de senha

1. Usuário acessa `/recuperar-senha`
2. `authService.enviarEmailRecuperacao(email)` → `supabase.auth.resetPasswordForEmail()`
3. Supabase envia email com link para `/nova-senha?token=...`
4. Usuário clica no link → Supabase valida o token → usuário pode definir nova senha

> Configure o **redirect URL** em Supabase → Authentication → URL Configuration:
> - Site URL: `https://zelvo-app.vercel.app`
> - Redirect URLs: `https://zelvo-app.vercel.app/nova-senha`

---

## Manutenção: desativar um usuário

Para bloquear acesso sem excluir:

```sql
UPDATE profiles SET ativo = false WHERE email = 'usuario@zelvo.app';
```

O `authService` filtra `WHERE ativo = true` ao buscar o perfil — sessão existente é invalidada na próxima verificação.

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| "Usuário sem perfil configurado" | Profile não criado | Execute a migration + verifique o trigger |
| Login vai mas não redireciona | `profiles.id ≠ auth.users.id` | Verifique se o trigger criou o profile corretamente |
| Loop de redirect para /login | Sessão não encontrada | Verifique as variáveis de ambiente no Vercel |
| "Supabase não configurado" | Env vars ausentes | Defina NEXT_PUBLIC_SUPABASE_URL e ANON_KEY |
| Email de recuperação não chega | Redirect URL não configurada | Configure em Supabase → Auth → URL Configuration |
