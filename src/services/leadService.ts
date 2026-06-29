/**
 * leadService.ts
 *
 * Camada de serviço para operações de lead.
 * Atualmente delega para zelvoStore (localStorage).
 *
 * Futuro: substituir cada função por chamadas REST ou Supabase client:
 *   criarLead    → POST /api/leads  (ou supabase.from('leads').insert())
 *   atualizarLead → PATCH /api/leads/:id
 *   listarLeads  → GET /api/leads  (com RLS por usuário)
 */

import { useZelvoStore } from '@/stores/zelvoStore'
import type { Lead, StatusLead } from '@/lib/types'
import type { CriarLeadPayload, AtualizacaoAtendimentoPayload } from '@/stores/zelvoStore'

// ── Leitura ────────────────────────────────────────────────────────────────

/** Retorna todos os leads da store. Futuro: GET /api/leads com paginação e RLS. */
export function listarLeads(): Lead[] {
  return useZelvoStore.getState().leads
}

/** Busca um lead pelo id. Futuro: GET /api/leads/:id */
export function buscarLeadPorId(id: string): Lead | undefined {
  return useZelvoStore.getState().buscarLeadPorId(id)
}

/** Retorna leads de um corretor específico. Futuro: GET /api/leads?corretorId= */
export function listarLeadsDoCorretor(corretorId: string): Lead[] {
  return useZelvoStore.getState().leads.filter(l => l.corretorAtribuido === corretorId)
}

// ── Escrita ────────────────────────────────────────────────────────────────

/**
 * Cria um novo lead e aciona distribuição automática.
 * Futuro: POST /api/leads/intake — endpoint que recebe o payload,
 *   calcula score server-side e aciona distribuição via função Edge.
 */
export function criarLead(payload: CriarLeadPayload): Lead {
  return useZelvoStore.getState().adicionarLead(payload)
}

/**
 * Atualiza campos de um lead existente.
 * Futuro: PATCH /api/leads/:id
 */
export function atualizarLead(id: string, dados: Partial<CriarLeadPayload>): void {
  useZelvoStore.getState().atualizarLead(id, dados)
}

/**
 * Altera o status de um lead e registra na timeline.
 * Futuro: PATCH /api/leads/:id/status — valida transição de status server-side.
 */
export function alterarStatusLead(id: string, novoStatus: StatusLead): void {
  useZelvoStore.getState().alterarStatusLead(id, novoStatus)
}

/**
 * Registra atualização de atendimento (status + observação + próxima ação).
 * Futuro: POST /api/leads/:id/atendimento
 */
export function registrarAtualizacaoAtendimento(payload: AtualizacaoAtendimentoPayload): void {
  useZelvoStore.getState().adicionarAtualizacaoAtendimento(payload)
}

/**
 * Distribui automaticamente um lead para o melhor corretor disponível.
 * Futuro: POST /api/leads/:id/distribuir — lógica server-side com transação.
 */
export function distribuirLead(id: string): void {
  useZelvoStore.getState().distribuirLead(id)
}

/**
 * Redistribui manualmente um lead para um corretor específico.
 * Futuro: POST /api/leads/:id/redistribuir — requer permissão de gerente via RLS.
 */
export function redistribuirLead(id: string, corretorId: string): void {
  useZelvoStore.getState().redistribuirLead(id, corretorId)
}
