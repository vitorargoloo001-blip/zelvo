/**
 * leadRepository.ts
 *
 * Camada de query Prisma para leads — chamada pelas API Routes (rota = fronteira
 * HTTP + auth, repositório = query) quando DATA_MODE=cloud. Server-only: nunca
 * importar de componentes client-side (o modo local nunca chega aqui — ele
 * resolve tudo direto na zelvoStore, sem passar por rota de API).
 */

import 'server-only'
import type { Lead as LeadRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calcularLeadScore, definirTemperaturaLead } from '@/lib/score'
import { distribuirLeadAutomaticamente } from '@/lib/distribution'
import { atualizarMetricasCorretor } from '@/lib/corretorMetrics'
import { toCorretor } from './corretorRepository'
import type {
  Lead, StatusLead, TipoImovel, PrazoCompra, OrigemLead, FonteEntrada, TemperaturaLead,
} from '@/lib/types'
import type { CriarLeadPayload, AtualizacaoAtendimentoPayload } from '@/stores/zelvoStore'

// ── Interface do repositório ─────────────────────────────────────────────────

export interface ILeadRepository {
  listar(): Promise<Lead[]>
  listarPorCorretor(corretorId: string): Promise<Lead[]>
  buscarPorId(id: string): Promise<Lead | undefined>
  criar(payload: CriarLeadPayload): Promise<Lead>
  atualizar(id: string, dados: Partial<CriarLeadPayload>): Promise<Lead | undefined>
  alterarStatus(id: string, novoStatus: StatusLead): Promise<void>
  registrarAtualizacaoAtendimento(payload: AtualizacaoAtendimentoPayload): Promise<void>
  distribuir(id: string): Promise<void>
  redistribuir(id: string, corretorId: string): Promise<void>
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    cidade: row.cidade,
    regiaoInteresse: row.regiaoInteresse,
    tipoImovel: row.tipoImovel as TipoImovel,
    rendaFamiliar: row.rendaFamiliar,
    valorEntrada: row.valorEntrada,
    possuiFgts: row.possuiFgts,
    prazoCompra: row.prazoCompra as PrazoCompra,
    financiamentoAprovado: row.financiamentoAprovado,
    empreendimentoInteresse: row.empreendimentoInteresse,
    origem: row.origem as OrigemLead,
    campanha: row.campanha,
    scoreLead: row.scoreLead,
    temperaturaLead: row.temperaturaLead as TemperaturaLead,
    status: row.status as StatusLead,
    corretorAtribuido: row.corretorAtribuido,
    createdAt: row.createdAt.toISOString(),
    observacao: row.observacao ?? undefined,
    proximaAcao: row.proximaAcao ?? undefined,
    dataProximaAcao: row.dataProximaAcao ? row.dataProximaAcao.toISOString().slice(0, 10) : undefined,
    fonteEntrada: row.fonteEntrada as FonteEntrada,
    formularioOrigem: row.formularioOrigem ?? undefined,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    utmContent: row.utmContent ?? undefined,
    utmTerm: row.utmTerm ?? undefined,
    ipOrigem: row.ipOrigem ?? undefined,
    dispositivo: row.dispositivo ?? undefined,
    dataEnvioFormulario: row.dataEnvioFormulario ? row.dataEnvioFormulario.toISOString() : undefined,
  }
}

export const leadRepository: ILeadRepository = {
  async listar() {
    const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(toLead)
  },

  async listarPorCorretor(corretorId) {
    const rows = await prisma.lead.findMany({
      where: { corretorAtribuido: corretorId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toLead)
  },

  async buscarPorId(id) {
    const row = await prisma.lead.findUnique({ where: { id } })
    return row ? toLead(row) : undefined
  },

  async atualizar(id, dados) {
    return prisma.$transaction(async (tx) => {
      const row = await tx.lead.findUnique({ where: { id } })
      if (!row) return undefined

      const recalcular =
        dados.rendaFamiliar !== undefined || dados.valorEntrada !== undefined ||
        dados.possuiFgts !== undefined || dados.prazoCompra !== undefined ||
        dados.empreendimentoInteresse !== undefined || dados.regiaoInteresse !== undefined ||
        dados.financiamentoAprovado !== undefined

      let scoreLead = row.scoreLead
      let temperaturaLead = row.temperaturaLead as TemperaturaLead
      if (recalcular) {
        const merged = { ...toLead(row), ...dados }
        scoreLead = calcularLeadScore(merged)
        temperaturaLead = definirTemperaturaLead(scoreLead)
      }

      const updated = await tx.lead.update({
        where: { id },
        data: { ...dados, scoreLead, temperaturaLead },
      })
      return toLead(updated)
    })
  },

  async criar(payload) {
    const camposScore = {
      nome: payload.nome, telefone: payload.telefone, cidade: payload.cidade,
      regiaoInteresse: payload.regiaoInteresse, tipoImovel: payload.tipoImovel,
      rendaFamiliar: payload.rendaFamiliar, valorEntrada: payload.valorEntrada,
      possuiFgts: payload.possuiFgts, prazoCompra: payload.prazoCompra,
      financiamentoAprovado: payload.financiamentoAprovado,
      empreendimentoInteresse: payload.empreendimentoInteresse,
      origem: payload.origem, campanha: payload.campanha,
      fonteEntrada: payload.fonteEntrada,
    }

    const scoreLead = calcularLeadScore(camposScore)
    const temperaturaLead = definirTemperaturaLead(scoreLead)

    return prisma.$transaction(async (tx) => {
      const corretoresAtivos = await tx.corretor.findMany({ where: { ativo: true } })

      const leadParaDistribuicao: Lead = {
        id: '', createdAt: '', ...camposScore,
        scoreLead, temperaturaLead, status: 'Novo', corretorAtribuido: null,
      }
      const { corretor, distribuicao: distParcial } = distribuirLeadAutomaticamente(
        leadParaDistribuicao,
        corretoresAtivos.map(toCorretor)
      )

      const leadCriado = await tx.lead.create({
        data: {
          ...camposScore,
          scoreLead,
          temperaturaLead,
          status: corretor ? 'Distribuído' : 'Novo',
          corretorAtribuido: corretor?.id ?? null,
        },
      })

      if (corretor && distParcial) {
        await tx.distribuicao.create({
          data: {
            leadId: leadCriado.id,
            corretorId: corretor.id,
            scoreLeadNoMomento: distParcial.scoreLeadNoMomento,
            scoreCorretorNoMomento: distParcial.scoreCorretorNoMomento,
            motivoDistribuicao: distParcial.motivoDistribuicao,
          },
        })
        await tx.corretor.update({
          where: { id: corretor.id },
          data: { leadsEmAberto: { increment: 1 }, leadsRecebidos: { increment: 1 } },
        })
      }

      return toLead(leadCriado)
    })
  },

  async alterarStatus(id, novoStatus) {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } })
      if (!lead) return

      await tx.lead.update({ where: { id }, data: { status: novoStatus } })

      if (lead.corretorAtribuido) {
        const corretor = await tx.corretor.findUnique({ where: { id: lead.corretorAtribuido } })
        if (corretor) {
          const atualizado = atualizarMetricasCorretor(toCorretor(corretor), novoStatus, lead.status as StatusLead)
          await tx.corretor.update({
            where: { id: corretor.id },
            data: {
              leadsEmAberto: atualizado.leadsEmAberto,
              vendasFechadas: atualizado.vendasFechadas,
              visitasMarcadas: atualizado.visitasMarcadas,
              propostasEnviadas: atualizado.propostasEnviadas,
            },
          })
        }
      }

      await tx.atividade.create({
        data: {
          leadId: id,
          tipo: 'status',
          titulo: `Status: ${novoStatus}`,
          descricao: `Lead movido de "${lead.status}" para "${novoStatus}".`,
        },
      })
    })
  },

  async registrarAtualizacaoAtendimento(payload) {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: payload.leadId } })
      if (!lead) return

      const statusMudou = payload.statusNovo !== payload.statusAnterior

      const partes: string[] = []
      if (statusMudou) partes.push(`Status alterado: "${payload.statusAnterior}" → "${payload.statusNovo}".`)
      if (payload.observacao) partes.push(`Obs: ${payload.observacao}`)
      if (payload.proximaAcao) {
        const data = payload.dataProximaAcao
          ? ` (${new Date(payload.dataProximaAcao + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`
          : ''
        partes.push(`Próxima ação: ${payload.proximaAcao}${data}`)
      }

      await tx.lead.update({
        where: { id: payload.leadId },
        data: {
          status: payload.statusNovo,
          observacao: payload.observacao,
          proximaAcao: payload.proximaAcao,
          dataProximaAcao: payload.dataProximaAcao ? new Date(payload.dataProximaAcao) : undefined,
        },
      })

      if (statusMudou && lead.corretorAtribuido) {
        const corretor = await tx.corretor.findUnique({ where: { id: lead.corretorAtribuido } })
        if (corretor) {
          const atualizado = atualizarMetricasCorretor(
            toCorretor(corretor),
            payload.statusNovo,
            payload.statusAnterior
          )
          await tx.corretor.update({
            where: { id: corretor.id },
            data: {
              leadsEmAberto: atualizado.leadsEmAberto,
              vendasFechadas: atualizado.vendasFechadas,
              visitasMarcadas: atualizado.visitasMarcadas,
              propostasEnviadas: atualizado.propostasEnviadas,
            },
          })
        }
      }

      await tx.atividade.create({
        data: {
          leadId: payload.leadId,
          tipo: statusMudou ? 'status' : 'nota',
          titulo: statusMudou ? `Status: ${payload.statusNovo}` : 'Atendimento atualizado',
          descricao: partes.join(' ') || 'Sem observações.',
        },
      })
    })
  },

  async distribuir(id) {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } })
      if (!lead) return

      const corretoresAtivos = await tx.corretor.findMany({ where: { ativo: true } })
      const { corretor, distribuicao: distParcial } = distribuirLeadAutomaticamente(
        toLead(lead),
        corretoresAtivos.map(toCorretor)
      )
      if (!corretor || !distParcial) return

      await tx.lead.update({ where: { id }, data: { corretorAtribuido: corretor.id, status: 'Distribuído' } })
      await tx.distribuicao.create({
        data: {
          leadId: id,
          corretorId: corretor.id,
          scoreLeadNoMomento: distParcial.scoreLeadNoMomento,
          scoreCorretorNoMomento: distParcial.scoreCorretorNoMomento,
          motivoDistribuicao: distParcial.motivoDistribuicao,
        },
      })
      await tx.corretor.update({
        where: { id: corretor.id },
        data: { leadsEmAberto: { increment: 1 }, leadsRecebidos: { increment: 1 } },
      })
    })
  },

  async redistribuir(id, corretorId) {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } })
      const novoCorretor = await tx.corretor.findUnique({ where: { id: corretorId } })
      if (!lead || !novoCorretor) return

      const motivo =
        `Redistribuição manual — Lead ${lead.temperaturaLead} reatribuído para ${novoCorretor.nome} ` +
        `(Nível ${novoCorretor.nivel}, score ${novoCorretor.scoreCorretor}).`

      await tx.lead.update({ where: { id }, data: { corretorAtribuido: corretorId, status: 'Distribuído' } })
      await tx.distribuicao.create({
        data: {
          leadId: id,
          corretorId,
          scoreLeadNoMomento: lead.scoreLead,
          scoreCorretorNoMomento: novoCorretor.scoreCorretor,
          motivoDistribuicao: motivo,
        },
      })
      await tx.corretor.update({
        where: { id: corretorId },
        data: { leadsEmAberto: { increment: 1 }, leadsRecebidos: { increment: 1 } },
      })

      if (lead.corretorAtribuido && lead.corretorAtribuido !== corretorId) {
        const corretorAnterior = await tx.corretor.findUnique({ where: { id: lead.corretorAtribuido } })
        if (corretorAnterior) {
          await tx.corretor.update({
            where: { id: corretorAnterior.id },
            data: { leadsEmAberto: Math.max(0, corretorAnterior.leadsEmAberto - 1) },
          })
        }
      }

      await tx.atividade.create({
        data: {
          leadId: id,
          tipo: 'redistribuicao',
          titulo: `Redistribuído para ${novoCorretor.nome}`,
          descricao: motivo,
        },
      })
    })
  },
}
