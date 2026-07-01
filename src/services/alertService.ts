import 'server-only'
import { prisma } from '@/lib/prisma'
import {
  notificarGerenteLeadPremiumParado,
  criarNotificacao,
} from '@/services/notificationService'
import type { Lead, TemperaturaLead } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLeadPartial(row: {
  id: string; nome: string; scoreLead: number; temperaturaLead: string
  status: string; corretorAtribuido: string | null; cidade: string
  origem: string; fonteEntrada: string; prazoCompra: string
  createdAt: Date
}): Lead {
  return {
    id:              row.id,
    nome:            row.nome,
    telefone:        '',
    cidade:          row.cidade,
    regiaoInteresse: '',
    tipoImovel:      'Apartamento',
    rendaFamiliar:   0,
    valorEntrada:    0,
    possuiFgts:      false,
    prazoCompra:     row.prazoCompra as Lead['prazoCompra'],
    financiamentoAprovado: false,
    empreendimentoInteresse: '',
    origem:          row.origem as Lead['origem'],
    campanha:        '',
    scoreLead:       row.scoreLead,
    temperaturaLead: row.temperaturaLead as TemperaturaLead,
    status:          row.status as Lead['status'],
    corretorAtribuido: row.corretorAtribuido,
    fonteEntrada:    row.fonteEntrada as Lead['fonteEntrada'],
    createdAt:       row.createdAt.toISOString(),
  }
}

async function idsGerentes(): Promise<string[]> {
  const gerentes = await prisma.usuario.findMany({
    where:  { perfil: 'gerente', ativo: true },
    select: { id: true },
  })
  return gerentes.map(g => g.id)
}

async function deduplicarNotificacao(
  usuarioId: string,
  tipo: string,
  leadId?: string,
  corretorId?: string,
  janelaMinutos = 30
): Promise<boolean> {
  const desde = new Date(Date.now() - janelaMinutos * 60 * 1000)
  const existente = await prisma.notificacao.findFirst({
    where: {
      usuarioId,
      tipo,
      ...(leadId    ? { leadId }    : {}),
      ...(corretorId ? { corretorId } : {}),
      createdAt: { gte: desde },
    },
  })
  return !!existente
}

// ── Verificações individuais ───────────────────────────────────────────────────

/** Leads Premium/Quentes sem atividade recente. */
async function verificarLeadsParados(): Promise<number> {
  const dezMin   = new Date(Date.now() - 10 * 60 * 1000)
  const vinteQuatroH = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const leadsParados = await prisma.lead.findMany({
    where: {
      status: { in: ['Novo', 'Distribuído', 'Contato iniciado'] },
      OR: [
        { temperaturaLead: 'Premium', createdAt: { lt: dezMin } },
        { temperaturaLead: 'Quente',  createdAt: { lt: vinteQuatroH } },
      ],
    },
    select: {
      id: true, nome: true, scoreLead: true, temperaturaLead: true,
      status: true, corretorAtribuido: true, cidade: true,
      origem: true, fonteEntrada: true, prazoCompra: true, createdAt: true,
    },
    take: 20,
    orderBy: { scoreLead: 'desc' },
  })

  let criadas = 0
  for (const row of leadsParados) {
    const lead = toLeadPartial(row)
    if (lead.temperaturaLead === 'Premium') {
      await notificarGerenteLeadPremiumParado(lead)
      criadas++
    } else {
      // Quente parado — notificação mais simples para gerentes
      const gerentes = await idsGerentes()
      for (const usuarioId of gerentes) {
        const jaExiste = await deduplicarNotificacao(usuarioId, 'lead_premium_parado', lead.id)
        if (!jaExiste) {
          await criarNotificacao({
            usuarioId,
            leadId:    lead.id,
            tipo:      'lead_premium_parado',
            titulo:    'Lead Quente parado',
            mensagem:  `Lead Quente ${lead.nome} (score ${lead.scoreLead}) está sem atualização há mais de 24 horas.`,
            prioridade: 'alta',
            metadata: { temperatura: lead.temperaturaLead },
          })
          criadas++
        }
      }
    }
  }
  return criadas
}

/** Leads sem próxima ação definida. */
async function verificarLeadsSemProximaAcao(): Promise<number> {
  const quarentaOitoh = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const leads = await prisma.lead.findMany({
    where: {
      proximaAcao: null,
      status:      { in: ['Contato iniciado', 'Em Atendimento'] },
      createdAt:   { lt: quarentaOitoh },
    },
    select: {
      id: true, nome: true, scoreLead: true, temperaturaLead: true,
      status: true, corretorAtribuido: true, cidade: true,
      origem: true, fonteEntrada: true, prazoCompra: true, createdAt: true,
    },
    take: 10,
  })

  const gerentes = await idsGerentes()
  let criadas = 0

  for (const row of leads) {
    for (const usuarioId of gerentes) {
      const jaExiste = await deduplicarNotificacao(usuarioId, 'lead_sem_proxima_acao', row.id)
      if (!jaExiste) {
        await criarNotificacao({
          usuarioId,
          leadId:    row.id,
          tipo:      'lead_sem_proxima_acao',
          titulo:    'Lead sem próxima ação',
          mensagem:  `O lead ${row.nome} está em "${row.status}" há mais de 48h sem próxima ação definida.`,
          prioridade: 'media',
        })
        criadas++
      }
    }
  }
  return criadas
}

/** Corretores com mais de 15 leads em aberto. */
async function verificarCorretoresSobrecarregados(): Promise<number> {
  const corretores = await prisma.corretor.findMany({
    where:  { ativo: true, leadsEmAberto: { gt: 15 } },
    select: { id: true, nome: true, leadsEmAberto: true },
  })

  const gerentes = await idsGerentes()
  let criadas = 0

  for (const c of corretores) {
    for (const usuarioId of gerentes) {
      const jaExiste = await deduplicarNotificacao(usuarioId, 'corretor_sobrecarregado', undefined, c.id, 60)
      if (!jaExiste) {
        await criarNotificacao({
          usuarioId,
          corretorId: c.id,
          tipo:       'corretor_sobrecarregado',
          titulo:     'Corretor sobrecarregado',
          mensagem:   `${c.nome} tem ${c.leadsEmAberto} leads em aberto (limite: 15).`,
          prioridade: 'alta',
          metadata:   { leadsEmAberto: c.leadsEmAberto },
        })
        criadas++
      }
    }
  }
  return criadas
}

// ── Função principal ───────────────────────────────────────────────────────────

export interface ResultadoAlertas {
  leadsParados:             number
  leadsSemProximaAcao:      number
  corretoresSobrecarregados: number
  total:                    number
}

export async function verificarAlertasGerenciais(): Promise<ResultadoAlertas> {
  const [leadsParados, leadsSemProximaAcao, corretoresSobrecarregados] = await Promise.all([
    verificarLeadsParados(),
    verificarLeadsSemProximaAcao(),
    verificarCorretoresSobrecarregados(),
  ])

  return {
    leadsParados,
    leadsSemProximaAcao,
    corretoresSobrecarregados,
    total: leadsParados + leadsSemProximaAcao + corretoresSobrecarregados,
  }
}
