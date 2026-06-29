// leadIntakeService.ts
// Responsável por receber e processar leads de qualquer fonte de entrada.
//
// Futuramente esta lógica será chamada por: POST /api/leads/intake
// O endpoint receberá o payload do formulário externo de qualificação,
// padronizará os campos, calculará o score e distribuirá automaticamente.

import { calcularLeadScore, definirTemperaturaLead } from '@/lib/score'
import { distribuirLeadAutomaticamente } from '@/lib/distribution'
import { corretores } from '@/data/corretores'
import type { Lead, LeadExternalPayload, Distribuicao } from '@/lib/types'

export interface LeadIntakeResult {
  lead: Lead
  distribuicao: Distribuicao | null
  corretorNome: string | null
}

// Processa um lead vindo do formulário externo de qualificação.
// Calcula score, define temperatura e distribui automaticamente.
export function receberLeadExterno(payload: LeadExternalPayload): LeadIntakeResult {
  const agora = new Date().toISOString()

  // Monta objeto parcial com todos os campos que calcularLeadScore precisa
  const leadBase = {
    nome: payload.nome,
    telefone: payload.telefone,
    cidade: payload.cidade,
    regiaoInteresse: payload.regiaoInteresse ?? '',
    tipoImovel: payload.tipoImovel,
    rendaFamiliar: payload.rendaFamiliar,
    valorEntrada: payload.valorEntrada,
    possuiFgts: payload.possuiFgts,
    prazoCompra: payload.prazoCompra,
    financiamentoAprovado: payload.financiamentoAprovado,
    empreendimentoInteresse: payload.empreendimentoInteresse ?? '',
    origem: payload.origem,
    campanha: payload.utmCampaign ?? '',
    fonteEntrada: 'formulario_externo' as const,
    formularioOrigem: payload.formularioOrigem,
    utmSource: payload.utmSource,
    utmMedium: payload.utmMedium,
    utmCampaign: payload.utmCampaign,
    utmContent: payload.utmContent,
    utmTerm: payload.utmTerm,
    ipOrigem: payload.ipOrigem,
    dispositivo: payload.dispositivo,
    dataEnvioFormulario: payload.dataEnvioFormulario ?? agora,
  }

  const scoreLead = calcularLeadScore(leadBase)

  const temperaturaLead = definirTemperaturaLead(scoreLead)

  const lead: Lead = {
    id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...leadBase,
    scoreLead,
    temperaturaLead,
    status: 'Novo',
    corretorAtribuido: null,
    createdAt: agora,
  }

  const { corretor, distribuicao: distParcial } = distribuirLeadAutomaticamente(lead, corretores)

  let distribuicao: Distribuicao | null = null
  let corretorNome: string | null = null

  if (corretor && distParcial) {
    lead.corretorAtribuido = corretor.id
    lead.status = 'Distribuído'
    corretorNome = corretor.nome

    distribuicao = {
      id: `dist_${Date.now()}`,
      createdAt: agora,
      ...distParcial,
    }
  }

  return { lead, distribuicao, corretorNome }
}
