import type { ScoreRegras } from './types'

export const SCORE_REGRAS_PADRAO: ScoreRegras = {
  rendaMinima: 3500,
  rendaPontosPositivos: 25,
  entradaMinima: 10000,
  entradaPontosPositivos: 15,
  fgtsPontos: 10,
  urgenciaPontos: 20,
  empreendimentoPontos: 10,
  regiaoPontos: 10,
  financiamentoPontos: 10,
  rendaBaixaLimite: 2500,
  rendaBaixaPenalidade: -30,
  semPrevisaoPenalidade: -20,
  regiaoVaziaPenalidade: -20,
  temperaturas: {
    premium: 80,
    quente: 60,
    morno: 40,
  },
}

export const DISTRIBUICAO_REGRAS_PADRAO = {
  nivelPorTemperatura: {
    Premium: ['A'],
    Quente: ['A', 'B'],
    Morno: ['B', 'C'],
    Frio: ['C', 'D'],
  } as Record<string, string[]>,
  capacidadeMaximaPadrao: 15,
  considerarMenorLeadsAberto: true,
  considerarMaiorScore: true,
  considerarMaiorConversao: true,
  considerarMenorTempoAtendimento: true,
  permitirFallback: true,
  permitirDistribuicaoManual: true,
}

export const FUNIL_ETAPAS_PADRAO = [
  { id: 'novo',              nome: 'Novo',              cor: '#6B7280', ordem: 1, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'distribuido',       nome: 'Distribuído',       cor: '#3B82F6', ordem: 2, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'contato_iniciado',  nome: 'Contato iniciado',  cor: '#8B5CF6', ordem: 3, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'em_atendimento',    nome: 'Em Atendimento',    cor: '#F59E0B', ordem: 4, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'visita_agendada',   nome: 'Visita agendada',   cor: '#F97316', ordem: 5, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'proposta_enviada',  nome: 'Proposta enviada',  cor: '#EF4444', ordem: 6, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
  { id: 'convertido',        nome: 'Convertido',        cor: '#10B981', ordem: 7, ativa: true, etapaFinal: true,  contaComoConversao: true,  liberaLeadAberto: true  },
  { id: 'perdido',           nome: 'Perdido',           cor: '#6B7280', ordem: 8, ativa: true, etapaFinal: true,  contaComoConversao: false, liberaLeadAberto: true  },
  { id: 'nutricao',          nome: 'Nutrição',          cor: '#06B6D4', ordem: 9, ativa: true, etapaFinal: false, contaComoConversao: false, liberaLeadAberto: false },
]
