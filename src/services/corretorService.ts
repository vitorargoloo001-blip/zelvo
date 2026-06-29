/**
 * corretorService.ts
 *
 * Camada de serviço para operações de corretor.
 * Atualmente delega para zelvoStore (localStorage).
 *
 * Futuro: substituir por Supabase client:
 *   listarCorretores → supabase.from('corretores').select() com RLS
 *   atualizarMetricas → atualização em trigger server-side, não client
 */

import { useZelvoStore } from '@/stores/zelvoStore'
import type { Corretor } from '@/lib/types'

/** Retorna todos os corretores. Futuro: GET /api/corretores com RLS (corretor vê apenas a si mesmo). */
export function listarCorretores(): Corretor[] {
  return useZelvoStore.getState().corretores
}

/** Retorna apenas corretores ativos. Futuro: GET /api/corretores?ativo=true */
export function listarCorretoresAtivos(): Corretor[] {
  return useZelvoStore.getState().corretores.filter(c => c.ativo)
}

/** Busca corretor por id. Futuro: GET /api/corretores/:id */
export function buscarCorretorPorId(id: string): Corretor | undefined {
  return useZelvoStore.getState().buscarCorretorPorId(id)
}

/**
 * Atualiza métricas do corretor.
 * Futuro: métricas serão calculadas server-side via Postgres functions/triggers.
 * Não haverá chamada client-side para isso — apenas leitura de views agregadas.
 */
export function atualizarMetricasCorretor(id: string, delta: Partial<Pick<Corretor, 'leadsEmAberto' | 'leadsRecebidos' | 'vendasFechadas' | 'visitasMarcadas' | 'propostasEnviadas'>>): void {
  // Atual: delegado internamente pela store ao alterarStatusLead / redistribuirLead
  // Futuro: remover esta função — Supabase triggers cuidarão das métricas automaticamente
  void id; void delta
}
