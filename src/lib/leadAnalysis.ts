import type { Lead, Distribuicao } from './types'

// ── Score Analysis ─────────────────────────────────────────────────────────

export interface ScoreFactor {
  label: string
  points: number
  positive: boolean
}

export interface ScoreAnalysis {
  factors: ScoreFactor[]
  summary: string
  positiveCount: number
  negativeCount: number
}

export function analisarScore(lead: Lead): ScoreAnalysis {
  const factors: ScoreFactor[] = []

  // Fatores positivos (espelha exatamente a lógica de score.ts)
  if (lead.rendaFamiliar >= 3500)
    factors.push({ label: 'Renda compatível com o perfil', points: 25, positive: true })
  if (lead.valorEntrada >= 10000)
    factors.push({ label: 'Entrada disponível', points: 15, positive: true })
  if (lead.possuiFgts)
    factors.push({ label: 'Possui FGTS', points: 10, positive: true })
  if (lead.prazoCompra === 'até 30 dias')
    factors.push({ label: 'Intenção de compra imediata (até 30 dias)', points: 20, positive: true })
  if (lead.empreendimentoInteresse?.trim())
    factors.push({ label: `Interesse em ${lead.empreendimentoInteresse}`, points: 10, positive: true })
  if (lead.regiaoInteresse?.trim())
    factors.push({ label: `Região de interesse informada (${lead.regiaoInteresse})`, points: 10, positive: true })
  if (lead.financiamentoAprovado)
    factors.push({ label: 'Financiamento aprovado', points: 10, positive: true })

  // Fatores negativos
  if (lead.rendaFamiliar < 2500)
    factors.push({ label: 'Renda abaixo do mínimo (R$ 2.500)', points: -30, positive: false })
  if (lead.prazoCompra === 'sem previsão')
    factors.push({ label: 'Sem previsão de compra', points: -20, positive: false })
  if (!lead.regiaoInteresse?.trim())
    factors.push({ label: 'Região de interesse não informada', points: -20, positive: false })

  const positives = factors.filter(f => f.positive)
  const negatives = factors.filter(f => !f.positive)

  // Gera texto de resumo natural
  const summaryParts: string[] = []
  if (lead.rendaFamiliar >= 3500) summaryParts.push('renda compatível')
  if (lead.valorEntrada >= 10000) summaryParts.push('entrada disponível')
  if (lead.possuiFgts) summaryParts.push('FGTS confirmado')
  if (lead.prazoCompra === 'até 30 dias') summaryParts.push('intenção de compra imediata')
  if (lead.empreendimentoInteresse?.trim()) summaryParts.push(`interesse em ${lead.empreendimentoInteresse}`)
  if (lead.regiaoInteresse?.trim()) summaryParts.push(`interesse em ${lead.regiaoInteresse}`)
  if (lead.financiamentoAprovado) summaryParts.push('financiamento aprovado')

  let summary = `Este lead recebeu ${lead.scoreLead} pontos`
  if (summaryParts.length > 0) {
    const last = summaryParts.pop()!
    summary +=
      summaryParts.length > 0
        ? ` porque possui ${summaryParts.join(', ')} e ${last}`
        : ` porque possui ${last}`
  }
  if (negatives.length > 0) {
    summary += `. Atenção: ${negatives.map(n => n.label.toLowerCase()).join('; ')}`
  }
  summary += '.'

  return {
    factors,
    summary,
    positiveCount: positives.length,
    negativeCount: negatives.length,
  }
}

// ── Próxima Ação ──────────────────────────────────────────────────────────

export interface ProximaAcao {
  titulo: string
  descricao: string
  urgencia: 'critica' | 'alta' | 'media' | 'baixa'
  acoes: string[]
  color: string
  bg: string
  border: string
}

export function gerarProximaAcao(lead: Lead): ProximaAcao {
  switch (lead.temperaturaLead) {
    case 'Premium':
      return {
        titulo: 'Contato em até 10 minutos',
        descricao:
          'Lead com alta probabilidade de conversão. Cada minuto sem contato reduz as chances de fechar negócio.',
        urgencia: 'critica',
        acoes: [
          'Ligar agora para o lead',
          'Enviar mensagem no WhatsApp com apresentação do corretor',
          'Agendar visita ao empreendimento ou simulação de financiamento',
        ],
        color: '#8B5CF6',
        bg: 'rgba(139,92,246,0.06)',
        border: 'rgba(139,92,246,0.25)',
      }
    case 'Quente':
      return {
        titulo: 'Contato ainda hoje',
        descricao:
          'Perfil qualificado com boa probabilidade de avanço. Confirmar interesse e agendar próximo passo.',
        urgencia: 'alta',
        acoes: [
          'Confirmar renda e região de interesse do lead',
          'Verificar prazo de compra e disponibilidade de entrada',
          'Propor agendamento de visita ou reunião',
        ],
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.06)',
        border: 'rgba(239,68,68,0.25)',
      }
    case 'Morno':
      return {
        titulo: 'Qualificação complementar',
        descricao:
          'Lead com potencial moderado. Precisa de mais informações antes de avançar para proposta.',
        urgencia: 'media',
        acoes: [
          'Entender objeções e dúvidas do lead',
          'Confirmar orçamento e capacidade de financiamento',
          'Criar follow-up para os próximos 7 dias',
        ],
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.06)',
        border: 'rgba(245,158,11,0.25)',
      }
    case 'Frio':
      return {
        titulo: 'Enviar para nutrição',
        descricao:
          'Perfil com baixa probabilidade de conversão imediata. Não alocar tempo comercial agora.',
        urgencia: 'baixa',
        acoes: [
          'Incluir em sequência de e-mail ou WhatsApp automatizado',
          'Reavaliar perfil em 30 dias',
          'Não alocar corretor de alto nível neste momento',
        ],
        color: '#3B82F6',
        bg: 'rgba(59,130,246,0.06)',
        border: 'rgba(59,130,246,0.2)',
      }
  }
}

// ── Timeline ──────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string
  titulo: string
  descricao: string
  timestamp: string
  tipo: 'entrada' | 'calculo' | 'distribuicao' | 'status' | 'acao'
}

export function gerarTimeline(
  lead: Lead,
  distribuicao?: Distribuicao,
  corretorNome?: string
): TimelineEvent[] {
  const base = new Date(lead.createdAt).getTime()
  const events: TimelineEvent[] = []

  events.push({
    id: 'entrada',
    titulo: 'Lead recebido',
    descricao: `Lead "${lead.nome}" recebido via ${lead.origem}${lead.campanha ? ` — ${lead.campanha}` : ''}.`,
    timestamp: lead.createdAt,
    tipo: 'entrada',
  })

  events.push({
    id: 'score',
    titulo: 'Zelvo Score calculado',
    descricao: `Score atribuído automaticamente: ${lead.scoreLead} pontos.`,
    timestamp: new Date(base + 3000).toISOString(),
    tipo: 'calculo',
  })

  events.push({
    id: 'temperatura',
    titulo: `Temperatura definida: ${lead.temperaturaLead}`,
    descricao: `Lead classificado como ${lead.temperaturaLead} com base no score de ${lead.scoreLead}.`,
    timestamp: new Date(base + 6000).toISOString(),
    tipo: 'calculo',
  })

  if (distribuicao && corretorNome) {
    events.push({
      id: 'distribuicao',
      titulo: 'Distribuição automática realizada',
      descricao: `Lead enviado para ${corretorNome}.`,
      timestamp: distribuicao.createdAt,
      tipo: 'distribuicao',
    })
  }

  if (lead.status !== 'Novo') {
    const descMap: Record<string, string> = {
      'Distribuído':       'Lead aguardando primeiro contato do corretor.',
      'Contato iniciado':  'Corretor fez o primeiro contato com o lead.',
      'Em Atendimento':    'Corretor está em processo ativo de atendimento.',
      'Visita agendada':   'Visita ao empreendimento agendada com o lead.',
      'Proposta enviada':  'Proposta comercial enviada para análise do lead.',
      'Convertido':        'Lead convertido — venda ou proposta fechada.',
      'Perdido':           'Lead encerrado sem conversão.',
      'Nutrição':          'Lead incluído em fluxo de nutrição para reativação futura.',
    }
    events.push({
      id: 'status',
      titulo: `Status: ${lead.status}`,
      descricao: descMap[lead.status] ?? `Lead no status "${lead.status}".`,
      timestamp: new Date(base + 120000).toISOString(),
      tipo: 'status',
    })
  }

  const proxima = gerarProximaAcao(lead)
  events.push({
    id: 'proxima-acao',
    titulo: 'Próxima ação recomendada',
    descricao: proxima.titulo,
    timestamp: new Date().toISOString(),
    tipo: 'acao',
  })

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}
