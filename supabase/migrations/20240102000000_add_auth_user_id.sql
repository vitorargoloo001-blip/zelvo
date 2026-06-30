-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: adicionar auth_user_id e ativo à tabela profiles
--
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/hnembkuzqaazqedlozzd/sql/new
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adicionar campo ativo (false = usuário desativado, não acessa o sistema)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- 2. auth_user_id é semanticamente o mesmo que profiles.id (ambos referenciam auth.users).
--    Adicionamos como coluna gerada para compatibilidade explícita com o código.
--    Se preferir uma coluna real separada (NULL para usuários sem auth):
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Preencher auth_user_id com o próprio id para registros existentes
--    (na nossa arquitetura profiles.id === auth_user_id)
UPDATE profiles SET auth_user_id = id WHERE auth_user_id IS NULL;

-- 4. Garantir que futuros inserts via trigger também preencham auth_user_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, auth_user_id, nome, email, perfil)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'perfil')::perfil_usuario, 'corretor')
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    email        = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed de usuários de teste (apenas se não existirem)
-- ATENÇÃO: senhas são configuradas via Supabase Auth, não aqui.
-- Use o Authentication → Users no painel do Supabase para criar os usuários,
-- depois associe o auth_user_id ao profile manualmente ou via trigger.
--
-- Emails de teste:
--   gerente@zelvo.app  → perfil: gerente
--   joao@zelvo.app     → perfil: corretor, corretor_id: 11111111-0000-0000-0000-000000000001
--   maria@zelvo.app    → perfil: corretor, corretor_id: 11111111-0000-0000-0000-000000000002
--   juliana@zelvo.app  → perfil: corretor, corretor_id: 11111111-0000-0000-0000-000000000003
--   pedro@zelvo.app    → perfil: corretor, corretor_id: 11111111-0000-0000-0000-000000000004
--   ana@zelvo.app      → perfil: corretor, corretor_id: 11111111-0000-0000-0000-000000000005
