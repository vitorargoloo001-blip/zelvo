-- ─────────────────────────────────────────────────────────────────────────────
-- ZELVO MVP — Schema SQL para Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase antes de ativar
-- DATA_MODE=supabase.
--
-- Instruções:
--   1. Acesse https://supabase.com → seu projeto → SQL Editor
--   2. Cole e execute este conteúdo
--   3. Em seguida, execute supabase/seed.sql para popular os dados iniciais
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensões ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tipos ENUM ────────────────────────────────────────────────────────────────
CREATE TYPE nivel_corretor    AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE temperatura_lead  AS ENUM ('Premium', 'Quente', 'Morno', 'Frio');
CREATE TYPE status_lead       AS ENUM (
  'Novo', 'Distribuído', 'Contato iniciado', 'Em Atendimento',
  'Visita agendada', 'Proposta enviada', 'Convertido', 'Perdido', 'Nutrição'
);
CREATE TYPE tipo_imovel       AS ENUM ('Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural');
CREATE TYPE prazo_compra      AS ENUM ('até 30 dias', '1 a 3 meses', '3 a 6 meses', 'acima de 6 meses', 'sem previsão');
CREATE TYPE origem_lead       AS ENUM ('Meta Ads', 'Google Ads', 'WhatsApp', 'Landing Page', 'Indicação', 'Portal Imobiliário');
CREATE TYPE fonte_entrada     AS ENUM ('manual', 'formulario_externo', 'importacao');
CREATE TYPE tipo_atividade    AS ENUM ('status', 'redistribuicao', 'nota');
CREATE TYPE perfil_usuario    AS ENUM ('gerente', 'corretor');

-- ── Tabela: corretores ────────────────────────────────────────────────────────
CREATE TABLE corretores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    TEXT NOT NULL,
  telefone                TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  nivel                   nivel_corretor NOT NULL DEFAULT 'C',
  score_corretor          INT NOT NULL DEFAULT 0,
  leads_recebidos         INT NOT NULL DEFAULT 0,
  leads_em_aberto         INT NOT NULL DEFAULT 0,
  visitas_marcadas        INT NOT NULL DEFAULT 0,
  propostas_enviadas      INT NOT NULL DEFAULT 0,
  vendas_fechadas         INT NOT NULL DEFAULT 0,
  taxa_conversao          NUMERIC(5,2) NOT NULL DEFAULT 0,
  tempo_medio_atendimento INT NOT NULL DEFAULT 0,
  ativo                   BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: leads ─────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                      TEXT NOT NULL,
  telefone                  TEXT NOT NULL,
  cidade                    TEXT NOT NULL,
  regiao_interesse          TEXT NOT NULL,
  tipo_imovel               tipo_imovel NOT NULL,
  renda_familiar            NUMERIC(12,2) NOT NULL,
  valor_entrada             NUMERIC(12,2) NOT NULL,
  possui_fgts               BOOLEAN NOT NULL DEFAULT false,
  prazo_compra              prazo_compra NOT NULL,
  financiamento_aprovado    BOOLEAN NOT NULL DEFAULT false,
  empreendimento_interesse  TEXT NOT NULL DEFAULT '',
  origem                    origem_lead NOT NULL,
  campanha                  TEXT NOT NULL DEFAULT '',
  score_lead                INT NOT NULL DEFAULT 0,
  temperatura_lead          temperatura_lead NOT NULL DEFAULT 'Frio',
  status                    status_lead NOT NULL DEFAULT 'Novo',
  corretor_atribuido        UUID REFERENCES corretores(id) ON DELETE SET NULL,
  fonte_entrada             fonte_entrada NOT NULL DEFAULT 'manual',
  observacao                TEXT,
  proxima_acao              TEXT,
  data_proxima_acao         DATE,
  -- Rastreabilidade de formulário externo
  formulario_origem         TEXT,
  utm_source                TEXT,
  utm_medium                TEXT,
  utm_campaign              TEXT,
  utm_content               TEXT,
  utm_term                  TEXT,
  ip_origem                 TEXT,
  dispositivo               TEXT,
  data_envio_formulario     TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: distribuicoes ─────────────────────────────────────────────────────
CREATE TABLE distribuicoes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                   UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  corretor_id               UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  score_lead_no_momento     INT NOT NULL DEFAULT 0,
  score_corretor_no_momento INT NOT NULL DEFAULT 0,
  motivo_distribuicao       TEXT NOT NULL DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: atividades ────────────────────────────────────────────────────────
CREATE TABLE atividades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo        tipo_atividade NOT NULL DEFAULT 'nota',
  titulo      TEXT NOT NULL,
  descricao   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: profiles (vinculada ao Supabase Auth) ─────────────────────────────
-- Futuro: criada automaticamente via trigger ao criar usuário no Auth
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  perfil       perfil_usuario NOT NULL DEFAULT 'corretor',
  corretor_id  UUID REFERENCES corretores(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_leads_corretor         ON leads(corretor_atribuido);
CREATE INDEX idx_leads_status           ON leads(status);
CREATE INDEX idx_leads_temperatura      ON leads(temperatura_lead);
CREATE INDEX idx_leads_created_at       ON leads(created_at DESC);
CREATE INDEX idx_distribuicoes_lead     ON distribuicoes(lead_id);
CREATE INDEX idx_distribuicoes_corretor ON distribuicoes(corretor_id);
CREATE INDEX idx_atividades_lead        ON atividades(lead_id);
CREATE INDEX idx_atividades_created_at  ON atividades(created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;

-- Políticas: gerente vê tudo
CREATE POLICY "gerente_all_leads" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND perfil = 'gerente')
  );

CREATE POLICY "gerente_all_corretores" ON corretores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND perfil = 'gerente')
  );

CREATE POLICY "gerente_all_distribuicoes" ON distribuicoes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND perfil = 'gerente')
  );

CREATE POLICY "gerente_all_atividades" ON atividades
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND perfil = 'gerente')
  );

-- Políticas: corretor vê apenas seus próprios leads
CREATE POLICY "corretor_own_leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.perfil = 'corretor'
        AND leads.corretor_atribuido = profiles.corretor_id
    )
  );

CREATE POLICY "corretor_update_own_leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.perfil = 'corretor'
        AND leads.corretor_atribuido = profiles.corretor_id
    )
  );

CREATE POLICY "corretor_own_atividades" ON atividades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN leads l ON l.id = atividades.lead_id
      WHERE p.id = auth.uid()
        AND p.perfil = 'corretor'
        AND l.corretor_atribuido = p.corretor_id
    )
  );

-- Corretor vê apenas a si mesmo em corretores
CREATE POLICY "corretor_own_profile" ON corretores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.corretor_id = corretores.id
    )
  );

-- profiles: cada usuário vê apenas o próprio perfil
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- ── Trigger: criar profile automaticamente ao registrar usuário ───────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'perfil')::perfil_usuario, 'corretor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
