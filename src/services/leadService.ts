/**
 * leadService.ts
 *
 * Camada de serviço para operações de lead — delega para zelvoStore, que
 * em DATA_MODE=cloud faz fetch() para as rotas de API correspondentes.
 */

import { useZelvoStore } from '@/stores/zelvoStore'
import type { Lead, StatusLead } from '@/lib/types'
import type { CriarLeadPayload, AtualizacaoAtendimentoPayload } from '@/stores/zelvoStore'

// ── Leitura ────────────────────────────────────────────────────────────────

export function listarLeads(): Lead[] {
  return useZelvoStore.getState().leads
}

export function buscarLeadPorId(id: string): Lead | undefined {
  return useZelvoStore.getState().buscarLeadPorId(id)
}

export function listarLeadsDoCorretor(corretorId: string): Lead[] {
  return useZelvoStore.getState().leads.filter(l => l.corretorAtribuido === corretorId)
}

// ── Escrita ────────────────────────────────────────────────────────────────

export function criarLead(payload: CriarLeadPayload): Promise<Lead> {
  return useZelvoStore.getState().adicionarLead(payload)
}

export function atualizarLead(id: string, dados: Partial<CriarLeadPayload>): Promise<void> {
  return useZelvoStore.getState().atualizarLead(id, dados)
}

export function alterarStatusLead(id: string, novoStatus: StatusLead): Promise<void> {
  return useZelvoStore.getState().alterarStatusLead(id, novoStatus)
}

export function registrarAtualizacaoAtendimento(payload: AtualizacaoAtendimentoPayload): Promise<void> {
  return useZelvoStore.getState().adicionarAtualizacaoAtendimento(payload)
}

export function distribuirLead(id: string): Promise<void> {
  return useZelvoStore.getState().distribuirLead(id)
}

export function redistribuirLead(id: string, corretorId: string): Promise<void> {
  return useZelvoStore.getState().redistribuirLead(id, corretorId)
}
