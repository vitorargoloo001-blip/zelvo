-- ─────────────────────────────────────────────────────────────────────────────
-- ZELVO MVP — Seed SQL para Supabase
-- Execute APÓS schema.sql para popular o banco com dados iniciais.
-- Estes dados espelham os mocks de src/data/ para facilitar a transição
-- do modo local para o modo supabase.
--
-- ATENÇÃO: IDs são fixos para manter compatibilidade com dados do localStorage.
-- Em produção, use UUIDs gerados automaticamente.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Corretores ────────────────────────────────────────────────────────────────
INSERT INTO corretores (id, nome, telefone, email, nivel, score_corretor, leads_recebidos, leads_em_aberto, visitas_marcadas, propostas_enviadas, vendas_fechadas, taxa_conversao, tempo_medio_atendimento, ativo)
VALUES
  ('c1', 'João Silva',    '(11) 99001-0001', 'joao@zelvo.com.br',    'A', 92, 28, 6, 8, 5, 3, 10.7, 72, true),
  ('c2', 'Maria Santos',  '(11) 99001-0002', 'maria@zelvo.com.br',   'A', 88, 24, 5, 7, 4, 2,  8.3, 68, true),
  ('c3', 'Juliana Costa', '(11) 99001-0003', 'juliana@zelvo.com.br', 'B', 74, 18, 4, 4, 3, 1,  5.6, 81, true),
  ('c4', 'Pedro Alves',   '(11) 99001-0004', 'pedro@zelvo.com.br',   'B', 68, 16, 4, 3, 2, 1,  6.3, 90, true),
  ('c5', 'Ana Lima',      '(11) 99001-0005', 'ana@zelvo.com.br',     'C', 55, 12, 3, 2, 1, 0,  0.0, 96, true);

-- ── Leads ─────────────────────────────────────────────────────────────────────
-- Nota: os IDs numéricos dos mocks precisam ser convertidos para UUID em produção.
-- Para o seed de transição, usamos IDs string que espelham os dados locais.
INSERT INTO leads (
  id, nome, telefone, cidade, regiao_interesse, tipo_imovel,
  renda_familiar, valor_entrada, possui_fgts, prazo_compra,
  financiamento_aprovado, empreendimento_interesse, origem, campanha,
  score_lead, temperatura_lead, status, corretor_atribuido,
  fonte_entrada, created_at
) VALUES
  ('lead-001', 'Rafael Torres',     '(11) 98765-4321', 'São Paulo', 'Vila Olímpia',      'Apartamento', 15000, 80000,  true,  'até 30 dias',    true,  'Parque das Árvores',   'Meta Ads',         'campanha-nov-2024', 88, 'Premium',  'Em Atendimento',   'c1', 'formulario_externo', now() - interval '10 days'),
  ('lead-002', 'Carla Mendes',      '(11) 97654-3210', 'Guarulhos',  'Centro',            'Apartamento', 8000,  30000,  false, '1 a 3 meses',    false, 'Residencial do Sol',   'Google Ads',       'google-pesquisa',   62, 'Quente',   'Contato iniciado', 'c2', 'formulario_externo', now() - interval '7 days'),
  ('lead-003', 'Eduardo Brito',     '(11) 96543-2109', 'São Paulo', 'Perdizes',          'Casa',        20000, 120000, true,  '1 a 3 meses',    true,  'Villa dos Pinheiros',  'Meta Ads',         'campanha-nov-2024', 94, 'Premium',  'Visita agendada',  'c1', 'formulario_externo', now() - interval '5 days'),
  ('lead-004', 'Fernanda Lima',     '(11) 95432-1098', 'Osasco',     'Bonfim',            'Apartamento', 6000,  20000,  false, '3 a 6 meses',    false, '',                     'WhatsApp',         '',                  38, 'Morno',    'Novo',             null, 'manual',              now() - interval '2 days'),
  ('lead-005', 'Bruno Oliveira',    '(11) 94321-0987', 'São Paulo', 'Tatuapé',           'Apartamento', 12000, 60000,  true,  'até 30 dias',    true,  'Estação Tatuapé',      'Portal Imobiliário','zap-imoveis',       79, 'Quente',   'Proposta enviada', 'c3', 'formulario_externo', now() - interval '15 days'),
  ('lead-006', 'Amanda Souza',      '(11) 93210-9876', 'Diadema',    'Vila Industrial',   'Casa',        9000,  40000,  true,  '1 a 3 meses',    false, 'Recanto da Paz',       'Meta Ads',         'campanha-out-2024', 71, 'Quente',   'Distribuído',      'c4', 'formulario_externo', now() - interval '8 days'),
  ('lead-007', 'Rodrigo Ferreira',  '(11) 92109-8765', 'São Paulo', 'Santana',           'Apartamento', 18000, 90000,  true,  'até 30 dias',    true,  'Parque Santana Plus',  'Indicação',        '',                  91, 'Premium',  'Em Atendimento',   'c2', 'manual',              now() - interval '3 days'),
  ('lead-008', 'Patricia Castro',   '(11) 91098-7654', 'Santo André','Centro',            'Comercial',   25000, 150000, false, 'acima de 6 meses',false, '',                    'Google Ads',       'google-display',    45, 'Frio',     'Nutrição',         'c5', 'formulario_externo', now() - interval '30 days'),
  ('lead-009', 'Lucas Barbosa',     '(11) 90987-6543', 'São Paulo', 'Moema',             'Apartamento', 30000, 200000, true,  'até 30 dias',    true,  'Moema Park Residence', 'Indicação',        '',                  97, 'Premium',  'Convertido',       'c1', 'manual',              now() - interval '20 days'),
  ('lead-010', 'Juliana Rocha',     '(11) 89876-5432', 'São Paulo', 'Lapa',              'Apartamento', 7000,  25000,  false, '3 a 6 meses',    false, '',                     'Meta Ads',         'campanha-nov-2024', 52, 'Morno',    'Novo',             null, 'formulario_externo', now() - interval '1 day');

-- ── Distribuições ─────────────────────────────────────────────────────────────
INSERT INTO distribuicoes (lead_id, corretor_id, score_lead_no_momento, score_corretor_no_momento, motivo_distribuicao)
SELECT 'lead-001', 'c1', 88, 92, 'Score alto + match de região'
UNION ALL SELECT 'lead-002', 'c2', 62, 88, 'Menor fila de leads'
UNION ALL SELECT 'lead-003', 'c1', 94, 92, 'Lead Premium — melhor corretor disponível'
UNION ALL SELECT 'lead-005', 'c3', 79, 74, 'Rotação automática por carga'
UNION ALL SELECT 'lead-006', 'c4', 71, 68, 'Disponibilidade imediata'
UNION ALL SELECT 'lead-007', 'c2', 91, 88, 'Indicação direta'
UNION ALL SELECT 'lead-008', 'c5', 45, 55, 'Qualificação baixa — corretor em treinamento'
UNION ALL SELECT 'lead-009', 'c1', 97, 92, 'Premium Convertido — histórico'
;

-- ── Atividades ────────────────────────────────────────────────────────────────
INSERT INTO atividades (lead_id, tipo, titulo, descricao)
VALUES
  ('lead-001', 'status',        'Lead recebido',           'Lead chegou via Meta Ads com score 88'),
  ('lead-001', 'redistribuicao','Distribuído para João',    'Distribuição automática — melhor corretor disponível'),
  ('lead-001', 'status',        'Contato iniciado',         'Primeiro contato realizado por WhatsApp'),
  ('lead-001', 'status',        'Em atendimento',           'Lead confirmou interesse no Parque das Árvores'),
  ('lead-003', 'status',        'Lead Premium identificado','Score 94 — encaminhado para corretor nível A'),
  ('lead-003', 'status',        'Visita agendada',          'Visita marcada para o próximo sábado'),
  ('lead-009', 'status',        'Lead Premium recebido',    'Score 97 — distribuição prioritária'),
  ('lead-009', 'status',        'Proposta enviada',         'Proposta de R$ 850.000 enviada'),
  ('lead-009', 'status',        'Convertido',               'Negócio fechado! Parabéns João.'),
  ('lead-005', 'status',        'Proposta enviada',         'Proposta de R$ 420.000 enviada para análise');
