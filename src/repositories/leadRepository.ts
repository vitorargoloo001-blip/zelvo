/**
 * leadRepository.ts
 *
 * Abstração de acesso a dados para leads.
 * - Modo local: lê e escreve via zelvoStore (Zustand + localStorage)
 * - Modo supabase: lê e escreve via Supabase client com RLS
 *
 * Futuro: ativar implementação Supabase trocando DATA_MODE para 'supabase'
 *   e garantindo que schema.sql foi executado no projeto Supabase.
 */

import { IS_LOCAL_MODE } from '@/config/dataMode'
import { useZelvoStore } from '@/stores/zelvoStore'
import type { Lead, StatusLead } from '@/lib/types'
import type { CriarLeadPayload, AtualizacaoAtendimentoPayload } from '@/stores/zelvoStore'

// ── Interface do repositório ─────────────────────────────────────────────────

export interface ILeadRepository {
  listar(): Promise<Lead[]>
  listarPorCorretor(corretorId: string): Promise<Lead[]>
  buscarPorId(id: string): Promise<Lead | undefined>
  criar(payload: CriarLeadPayload): Promise<Lead>
  alterarStatus(id: string, novoStatus: StatusLead): Promise<void>
  registrarAtualizacaoAtendimento(payload: AtualizacaoAtendimentoPayload): Promise<void>
  distribuir(id: string): Promise<void>
  redistribuir(id: string, corretorId: string): Promise<void>
}

// ── Implementação local (zelvoStore) ─────────────────────────────────────────

const localLeadRepository: ILeadRepository = {
  async listar() {
    return useZelvoStore.getState().leads
  },
  async listarPorCorretor(corretorId) {
    return useZelvoStore.getState().leads.filter(l => l.corretorAtribuido === corretorId)
  },
  async buscarPorId(id) {
    return useZelvoStore.getState().buscarLeadPorId(id)
  },
  async criar(payload) {
    return useZelvoStore.getState().adicionarLead(payload)
  },
  async alterarStatus(id, novoStatus) {
    useZelvoStore.getState().alterarStatusLead(id, novoStatus)
  },
  async registrarAtualizacaoAtendimento(payload) {
    useZelvoStore.getState().adicionarAtualizacaoAtendimento(payload)
  },
  async distribuir(id) {
    useZelvoStore.getState().distribuirLead(id)
  },
  async redistribuir(id, corretorId) {
    useZelvoStore.getState().redistribuirLead(id, corretorId)
  },
}

// ── Implementação Supabase (futura) ──────────────────────────────────────────

const supabaseLeadRepository: ILeadRepository = {
  async listar() {
    // Futuro: const { data, error } = await supabase!.from('leads').select('*')
    // Futuro: if (error) throw error
    // Futuro: return data.map(rowToLead)
    throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_DATA_MODE=local ou configure o Supabase.')
  },
  async listarPorCorretor(_corretorId) {
    // Futuro: supabase!.from('leads').select('*').eq('corretor_atribuido', corretorId)
    throw new Error('Supabase não configurado.')
  },
  async buscarPorId(_id) {
    // Futuro: supabase!.from('leads').select('*').eq('id', id).single()
    throw new Error('Supabase não configurado.')
  },
  async criar(_payload) {
    // Futuro: POST /api/leads/intake — calcular score server-side e inserir
    throw new Error('Supabase não configurado.')
  },
  async alterarStatus(_id, _novoStatus) {
    // Futuro: supabase!.from('leads').update({ status: novoStatus }).eq('id', id)
    throw new Error('Supabase não configurado.')
  },
  async registrarAtualizacaoAtendimento(_payload) {
    // Futuro: transação: update leads + insert atividades
    throw new Error('Supabase não configurado.')
  },
  async distribuir(_id) {
    // Futuro: chamar Edge Function que executa distribuição server-side
    throw new Error('Supabase não configurado.')
  },
  async redistribuir(_id, _corretorId) {
    // Futuro: supabase!.from('leads').update({ corretor_atribuido: corretorId }).eq('id', id)
    throw new Error('Supabase não configurado.')
  },
}

// ── Exporta repositório ativo baseado no DATA_MODE ────────────────────────────

export const leadRepository: ILeadRepository = IS_LOCAL_MODE
  ? localLeadRepository
  : supabaseLeadRepository
