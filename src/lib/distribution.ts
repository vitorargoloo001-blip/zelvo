import type { Lead, Corretor, Distribuicao, NivelCorretor } from './types'

const NIVEIS_POR_TEMPERATURA: Record<string, NivelCorretor[]> = {
  Premium: ['A'],
  Quente: ['A', 'B'],
  Morno: ['B', 'C'],
  Frio: ['C', 'D'],
}

const MAX_LEADS_EM_ABERTO = 15

export function distribuirLeadAutomaticamente(
  lead: Lead,
  corretores: Corretor[]
): { corretor: Corretor | null; distribuicao: Omit<Distribuicao, 'id' | 'createdAt'> | null } {
  const niveisPreferidos = NIVEIS_POR_TEMPERATURA[lead.temperaturaLead] ?? ['C', 'D']

  const ativos = corretores.filter((c) => c.ativo)

  // Tenta primeiro com o grupo de nível preferido e limite de 15 leads
  let candidatos = ativos
    .filter((c) => niveisPreferidos.includes(c.nivel) && c.leadsEmAberto < MAX_LEADS_EM_ABERTO)
    .sort((a, b) => {
      if (b.scoreCorretor !== a.scoreCorretor) return b.scoreCorretor - a.scoreCorretor
      if (a.leadsEmAberto !== b.leadsEmAberto) return a.leadsEmAberto - b.leadsEmAberto
      if (b.taxaConversao !== a.taxaConversao) return b.taxaConversao - a.taxaConversao
      return a.tempoMedioAtendimento - b.tempoMedioAtendimento
    })

  // Fallback: qualquer ativo, independente do nível ou carga
  if (candidatos.length === 0) {
    candidatos = ativos.sort((a, b) => b.scoreCorretor - a.scoreCorretor)
  }

  const corretor = candidatos[0] ?? null
  if (!corretor) return { corretor: null, distribuicao: null }

  const motivo = gerarMotivo(lead, corretor)

  return {
    corretor,
    distribuicao: {
      leadId: lead.id,
      corretorId: corretor.id,
      scoreLeadNoMomento: lead.scoreLead,
      scoreCorretorNoMomento: corretor.scoreCorretor,
      motivoDistribuicao: motivo,
    },
  }
}

function gerarMotivo(lead: Lead, corretor: Corretor): string {
  return (
    `Lead ${lead.temperaturaLead} enviado para ${corretor.nome} porque ele é Nível ${corretor.nivel}, ` +
    `possui score ${corretor.scoreCorretor}, taxa de conversão de ${corretor.taxaConversao}% ` +
    `e apenas ${corretor.leadsEmAberto} leads em aberto.`
  )
}
