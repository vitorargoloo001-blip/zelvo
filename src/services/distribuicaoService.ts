/**
 * distribuicaoService.ts
 *
 * Camada de serviço para operações de distribuição.
 * Atualmente delega para zelvoStore (localStorage).
 *
 * Futuro: substituir por Supabase client:
 *   listarDistribuicoes → supabase.from('distribuicoes').select() com RLS
 *   registrarDistribuicao → inserção com validação server-side via Edge Function
 */

import { useZelvoStore } from '@/stores/zelvoStore'
import type { Distribuicao } from '@/lib/types'

/** Retorna todas as distribuições. Futuro: GET /api/distribuicoes (gerente vê todas, RLS). */
export function listarDistribuicoes(): Distribuicao[] {
  return useZelvoStore.getState().distribuicoes
}

/**
 * Busca a distribuição mais recente de um lead.
 * Futuro: GET /api/distribuicoes?leadId=:id&latest=true
 */
export function buscarDistribuicaoPorLeadId(leadId: string): Distribuicao | undefined {
  return useZelvoStore.getState().buscarDistribuicaoPorLeadId(leadId)
}

/**
 * Registra uma nova distribuição (usada internamente pelo leadService).
 * Futuro: lógica movida inteiramente para server-side (Edge Function ou Supabase trigger).
 * O cliente não chamará este service diretamente — apenas leitura via RLS.
 */
export function registrarDistribuicao(distribuicao: Omit<Distribuicao, 'id' | 'createdAt'>): void {
  // Atual: distribuição é registrada automaticamente dentro de adicionarLead/redistribuirLead
  // Futuro: POST /api/distribuicoes (requer papel de gerente ou service_role key)
  void distribuicao
}
