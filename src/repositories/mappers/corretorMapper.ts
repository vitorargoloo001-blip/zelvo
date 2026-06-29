/**
 * corretorMapper.ts
 *
 * Converte entre rows do Supabase (snake_case) e o tipo Corretor (camelCase).
 *
 * Futuro: usado pelos repositories quando DATA_MODE=supabase.
 */

import type { Corretor, NivelCorretor } from '@/lib/types'

/** Shape da row da tabela `corretores` no Supabase */
export interface CorretorRow {
  id: string
  nome: string
  telefone: string
  email: string
  nivel: string
  score_corretor: number
  leads_recebidos: number
  leads_em_aberto: number
  visitas_marcadas: number
  propostas_enviadas: number
  vendas_fechadas: number
  taxa_conversao: number
  tempo_medio_atendimento: number
  ativo: boolean
  created_at: string
}

export function rowToCorretor(row: CorretorRow): Corretor {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    nivel: row.nivel as NivelCorretor,
    scoreCorretor: row.score_corretor,
    leadsRecebidos: row.leads_recebidos,
    leadsEmAberto: row.leads_em_aberto,
    visitasMarcadas: row.visitas_marcadas,
    propostasEnviadas: row.propostas_enviadas,
    vendasFechadas: row.vendas_fechadas,
    taxaConversao: row.taxa_conversao,
    tempoMedioAtendimento: row.tempo_medio_atendimento,
    ativo: row.ativo,
  }
}

export function corretorToRow(corretor: Omit<Corretor, 'id'>): Omit<CorretorRow, 'id' | 'created_at'> {
  return {
    nome: corretor.nome,
    telefone: corretor.telefone,
    email: corretor.email,
    nivel: corretor.nivel,
    score_corretor: corretor.scoreCorretor,
    leads_recebidos: corretor.leadsRecebidos,
    leads_em_aberto: corretor.leadsEmAberto,
    visitas_marcadas: corretor.visitasMarcadas,
    propostas_enviadas: corretor.propostasEnviadas,
    vendas_fechadas: corretor.vendasFechadas,
    taxa_conversao: corretor.taxaConversao,
    tempo_medio_atendimento: corretor.tempoMedioAtendimento,
    ativo: corretor.ativo,
  }
}
