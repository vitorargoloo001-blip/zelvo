/**
 * atividadeRepository.ts
 *
 * Camada de query Prisma para atividades — chamada pelas API Routes
 * quando DATA_MODE=cloud. Server-only.
 */

import 'server-only'
import type { Atividade as AtividadeRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Atividade } from '@/stores/zelvoStore'

export interface IAtividadeRepository {
  listar(): Promise<Atividade[]>
  listarPorLead(leadId: string): Promise<Atividade[]>
  criar(payload: Omit<Atividade, 'id' | 'createdAt'>): Promise<Atividade>
}

export function toAtividade(row: AtividadeRow): Atividade {
  return {
    id: row.id,
    leadId: row.leadId,
    tipo: row.tipo,
    titulo: row.titulo,
    descricao: row.descricao,
    createdAt: row.createdAt.toISOString(),
  }
}

export const atividadeRepository: IAtividadeRepository = {
  async listar() {
    const rows = await prisma.atividade.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(toAtividade)
  },
  async listarPorLead(leadId) {
    const rows = await prisma.atividade.findMany({ where: { leadId }, orderBy: { createdAt: 'desc' } })
    return rows.map(toAtividade)
  },
  async criar(payload) {
    const row = await prisma.atividade.create({ data: payload })
    return toAtividade(row)
  },
}
