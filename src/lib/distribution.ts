import type { Lead, Corretor, Distribuicao, NivelCorretor } from './types'
import { DISTRIBUICAO_REGRAS_PADRAO } from './scoreDefaults'

export function distribuirLeadAutomaticamente(
  lead: Lead,
  corretores: Corretor[],
  regras = DISTRIBUICAO_REGRAS_PADRAO,
): { corretor: Corretor | null; distribuicao: Omit<Distribuicao, 'id' | 'createdAt'> | null } {
  const niveisPreferidos = (regras.nivelPorTemperatura[lead.temperaturaLead] ?? ['C', 'D']) as NivelCorretor[]
  const capacidade = regras.capacidadeMaximaPadrao

  const ativos = corretores.filter((c) => c.ativo && c.participaDistribuicao)

  const sort = (list: Corretor[]) =>
    list.sort((a, b) => {
      if (regras.considerarMaiorScore && b.scoreCorretor !== a.scoreCorretor) return b.scoreCorretor - a.scoreCorretor
      if (regras.considerarMenorLeadsAberto && a.leadsEmAberto !== b.leadsEmAberto) return a.leadsEmAberto - b.leadsEmAberto
      if (regras.considerarMaiorConversao && b.taxaConversao !== a.taxaConversao) return b.taxaConversao - a.taxaConversao
      if (regras.considerarMenorTempoAtendimento) return a.tempoMedioAtendimento - b.tempoMedioAtendimento
      return 0
    })

  // Candidatos dentro do nível preferido e dentro da capacidade individual
  let candidatos = sort(
    ativos.filter((c) => niveisPreferidos.includes(c.nivel) && c.leadsEmAberto < (c.capacidadeMaximaLeads ?? capacidade)),
  )

  // Fallback: qualquer ativo, sem filtro de nível ou carga
  if (candidatos.length === 0 && regras.permitirFallback) {
    candidatos = sort(ativos)
  }

  const corretor = candidatos[0] ?? null
  if (!corretor) return { corretor: null, distribuicao: null }

  return {
    corretor,
    distribuicao: {
      leadId: lead.id,
      corretorId: corretor.id,
      scoreLeadNoMomento: lead.scoreLead,
      scoreCorretorNoMomento: corretor.scoreCorretor,
      motivoDistribuicao: gerarMotivo(lead, corretor),
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
