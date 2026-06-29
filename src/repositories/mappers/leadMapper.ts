/**
 * leadMapper.ts
 *
 * Converte entre rows do Supabase (snake_case) e o tipo Lead do TypeScript (camelCase).
 *
 * Futuro: quando DATA_MODE=supabase, os repositories usarão estes mappers
 *   para transformar os dados vindos do banco.
 */

import type { Lead, StatusLead, TemperaturaLead, TipoImovel, PrazoCompra, OrigemLead, FonteEntrada } from '@/lib/types'

/** Shape da row da tabela `leads` no Supabase */
export interface LeadRow {
  id: string
  nome: string
  telefone: string
  cidade: string
  regiao_interesse: string
  tipo_imovel: string
  renda_familiar: number
  valor_entrada: number
  possui_fgts: boolean
  prazo_compra: string
  financiamento_aprovado: boolean
  empreendimento_interesse: string
  origem: string
  campanha: string
  score_lead: number
  temperatura_lead: string
  status: string
  corretor_atribuido: string | null
  fonte_entrada: string
  observacao: string | null
  proxima_acao: string | null
  data_proxima_acao: string | null
  formulario_origem: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  ip_origem: string | null
  dispositivo: string | null
  data_envio_formulario: string | null
  created_at: string
}

/** Converte uma row do Supabase para o tipo Lead do TypeScript */
export function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    cidade: row.cidade,
    regiaoInteresse: row.regiao_interesse,
    tipoImovel: row.tipo_imovel as TipoImovel,
    rendaFamiliar: row.renda_familiar,
    valorEntrada: row.valor_entrada,
    possuiFgts: row.possui_fgts,
    prazoCompra: row.prazo_compra as PrazoCompra,
    financiamentoAprovado: row.financiamento_aprovado,
    empreendimentoInteresse: row.empreendimento_interesse,
    origem: row.origem as OrigemLead,
    campanha: row.campanha,
    scoreLead: row.score_lead,
    temperaturaLead: row.temperatura_lead as TemperaturaLead,
    status: row.status as StatusLead,
    corretorAtribuido: row.corretor_atribuido,
    fonteEntrada: row.fonte_entrada as FonteEntrada,
    observacao: row.observacao ?? undefined,
    proximaAcao: row.proxima_acao ?? undefined,
    dataProximaAcao: row.data_proxima_acao ?? undefined,
    formularioOrigem: row.formulario_origem ?? undefined,
    utmSource: row.utm_source ?? undefined,
    utmMedium: row.utm_medium ?? undefined,
    utmCampaign: row.utm_campaign ?? undefined,
    utmContent: row.utm_content ?? undefined,
    utmTerm: row.utm_term ?? undefined,
    ipOrigem: row.ip_origem ?? undefined,
    dispositivo: row.dispositivo ?? undefined,
    dataEnvioFormulario: row.data_envio_formulario ?? undefined,
    createdAt: row.created_at,
  }
}

/** Converte um Lead para o formato de inserção do Supabase */
export function leadToRow(lead: Omit<Lead, 'id' | 'createdAt'>): Omit<LeadRow, 'id' | 'created_at'> {
  return {
    nome: lead.nome,
    telefone: lead.telefone,
    cidade: lead.cidade,
    regiao_interesse: lead.regiaoInteresse,
    tipo_imovel: lead.tipoImovel,
    renda_familiar: lead.rendaFamiliar,
    valor_entrada: lead.valorEntrada,
    possui_fgts: lead.possuiFgts,
    prazo_compra: lead.prazoCompra,
    financiamento_aprovado: lead.financiamentoAprovado,
    empreendimento_interesse: lead.empreendimentoInteresse,
    origem: lead.origem,
    campanha: lead.campanha,
    score_lead: lead.scoreLead,
    temperatura_lead: lead.temperaturaLead,
    status: lead.status,
    corretor_atribuido: lead.corretorAtribuido,
    fonte_entrada: lead.fonteEntrada,
    observacao: lead.observacao ?? null,
    proxima_acao: lead.proximaAcao ?? null,
    data_proxima_acao: lead.dataProximaAcao ?? null,
    formulario_origem: lead.formularioOrigem ?? null,
    utm_source: lead.utmSource ?? null,
    utm_medium: lead.utmMedium ?? null,
    utm_campaign: lead.utmCampaign ?? null,
    utm_content: lead.utmContent ?? null,
    utm_term: lead.utmTerm ?? null,
    ip_origem: lead.ipOrigem ?? null,
    dispositivo: lead.dispositivo ?? null,
    data_envio_formulario: lead.dataEnvioFormulario ?? null,
  }
}
