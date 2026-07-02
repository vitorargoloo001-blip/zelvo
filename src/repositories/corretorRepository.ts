/**
 * corretorRepository.ts
 *
 * Camada de query Prisma para corretores — chamada pelas API Routes
 * (rota = fronteira HTTP + auth, repositório = query) quando DATA_MODE=cloud.
 * Server-only: nunca importar de componentes client-side.
 */

import 'server-only'
import type { Corretor as CorretorRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Corretor } from '@/lib/types'

export interface ICorretorRepository {
  listar(): Promise<Corretor[]>
  listarAtivos(): Promise<Corretor[]>
  buscarPorId(id: string): Promise<Corretor | undefined>
}

export function toCorretor(row: CorretorRow): Corretor {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    nivel: row.nivel,
    scoreCorretor: row.scoreCorretor,
    leadsRecebidos: row.leadsRecebidos,
    leadsEmAberto: row.leadsEmAberto,
    visitasMarcadas: row.visitasMarcadas,
    propostasEnviadas: row.propostasEnviadas,
    vendasFechadas: row.vendasFechadas,
    taxaConversao: row.taxaConversao,
    tempoMedioAtendimento: row.tempoMedioAtendimento,
    ativo: row.ativo,
    capacidadeMaximaLeads: row.capacidadeMaximaLeads,
    participaDistribuicao: row.participaDistribuicao,
    nivelManual: row.nivelManual,
    observacoes: row.observacoes ?? undefined,
  }
}

export const corretorRepository: ICorretorRepository = {
  async listar() {
    const rows = await prisma.corretor.findMany({ orderBy: { nome: 'asc' } })
    return rows.map(toCorretor)
  },
  async listarAtivos() {
    const rows = await prisma.corretor.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } })
    return rows.map(toCorretor)
  },
  async buscarPorId(id) {
    const row = await prisma.corretor.findUnique({ where: { id } })
    return row ? toCorretor(row) : undefined
  },
}
