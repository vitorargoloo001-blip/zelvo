/**
 * distribuicaoRepository.ts
 *
 * Abstração de acesso a dados para distribuições.
 * Futuro: ativar implementação Supabase com DATA_MODE=supabase.
 */

import { IS_LOCAL_MODE } from '@/config/dataMode'
import { useZelvoStore } from '@/stores/zelvoStore'
import type { Distribuicao } from '@/lib/types'

export interface IDistribuicaoRepository {
  listar(): Promise<Distribuicao[]>
  buscarPorLeadId(leadId: string): Promise<Distribuicao | undefined>
}

const localDistribuicaoRepository: IDistribuicaoRepository = {
  async listar() {
    return useZelvoStore.getState().distribuicoes
  },
  async buscarPorLeadId(leadId) {
    return useZelvoStore.getState().buscarDistribuicaoPorLeadId(leadId)
  },
}

const supabaseDistribuicaoRepository: IDistribuicaoRepository = {
  async listar() {
    // Futuro: supabase!.from('distribuicoes').select('*').order('created_at', { ascending: false })
    throw new Error('Supabase não configurado.')
  },
  async buscarPorLeadId(_leadId) {
    // Futuro: supabase!.from('distribuicoes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).single()
    throw new Error('Supabase não configurado.')
  },
}

export const distribuicaoRepository: IDistribuicaoRepository = IS_LOCAL_MODE
  ? localDistribuicaoRepository
  : supabaseDistribuicaoRepository
