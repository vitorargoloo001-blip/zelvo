/**
 * distribuicaoRepository.ts
 *
 * Camada de query Prisma para distribuições — chamada pelas API Routes
 * quando DATA_MODE=cloud. Server-only.
 */

import 'server-only'
import type { Distribuicao as DistribuicaoRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Distribuicao } from '@/lib/types'

export interface IDistribuicaoRepository {
  listar(): Promise<Distribuicao[]>
  buscarPorLeadId(leadId: string): Promise<Distribuicao | undefined>
}

export function toDistribuicao(row: DistribuicaoRow): Distribuicao {
  return {
    id: row.id,
    leadId: row.leadId,
    corretorId: row.corretorId,
    scoreLeadNoMomento: row.scoreLeadNoMomento,
    scoreCorretorNoMomento: row.scoreCorretorNoMomento,
    motivoDistribuicao: row.motivoDistribuicao,
    createdAt: row.createdAt.toISOString(),
  }
}

export const distribuicaoRepository: IDistribuicaoRepository = {
  async listar() {
    const rows = await prisma.distribuicao.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(toDistribuicao)
  },
  async buscarPorLeadId(leadId) {
    const row = await prisma.distribuicao.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    })
    return row ? toDistribuicao(row) : undefined
  },
}
