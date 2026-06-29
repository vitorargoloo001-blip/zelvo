/**
 * corretorRepository.ts
 *
 * Abstração de acesso a dados para corretores.
 * Futuro: ativar implementação Supabase com DATA_MODE=supabase.
 */

import { IS_LOCAL_MODE } from '@/config/dataMode'
import { useZelvoStore } from '@/stores/zelvoStore'
import type { Corretor } from '@/lib/types'

export interface ICorretorRepository {
  listar(): Promise<Corretor[]>
  listarAtivos(): Promise<Corretor[]>
  buscarPorId(id: string): Promise<Corretor | undefined>
}

const localCorretorRepository: ICorretorRepository = {
  async listar() {
    return useZelvoStore.getState().corretores
  },
  async listarAtivos() {
    return useZelvoStore.getState().corretores.filter(c => c.ativo)
  },
  async buscarPorId(id) {
    return useZelvoStore.getState().buscarCorretorPorId(id)
  },
}

const supabaseCorretorRepository: ICorretorRepository = {
  async listar() {
    // Futuro: supabase!.from('corretores').select('*')
    throw new Error('Supabase não configurado.')
  },
  async listarAtivos() {
    // Futuro: supabase!.from('corretores').select('*').eq('ativo', true)
    throw new Error('Supabase não configurado.')
  },
  async buscarPorId(_id) {
    // Futuro: supabase!.from('corretores').select('*').eq('id', id).single()
    throw new Error('Supabase não configurado.')
  },
}

export const corretorRepository: ICorretorRepository = IS_LOCAL_MODE
  ? localCorretorRepository
  : supabaseCorretorRepository
