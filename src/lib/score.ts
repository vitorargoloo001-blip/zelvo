import type { Lead, TemperaturaLead } from './types'

export function calcularLeadScore(lead: Omit<Lead, 'scoreLead' | 'temperaturaLead' | 'status' | 'corretorAtribuido' | 'id' | 'createdAt'>): number {
  let score = 0

  // Pontuações positivas
  if (lead.rendaFamiliar >= 3500) score += 25
  if (lead.valorEntrada >= 10000) score += 15
  if (lead.possuiFgts) score += 10
  if (lead.prazoCompra === 'até 30 dias') score += 20
  if (lead.empreendimentoInteresse && lead.empreendimentoInteresse.trim() !== '') score += 10
  if (lead.regiaoInteresse && lead.regiaoInteresse.trim() !== '') score += 10
  if (lead.financiamentoAprovado) score += 10

  // Penalidades
  if (lead.rendaFamiliar < 2500) score -= 30
  if (lead.prazoCompra === 'sem previsão') score -= 20
  if (!lead.regiaoInteresse || lead.regiaoInteresse.trim() === '') score -= 20

  return Math.min(100, Math.max(0, score))
}

export function definirTemperaturaLead(score: number): TemperaturaLead {
  if (score >= 80) return 'Premium'
  if (score >= 60) return 'Quente'
  if (score >= 40) return 'Morno'
  return 'Frio'
}
