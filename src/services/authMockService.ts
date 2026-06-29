/**
 * authMockService.ts
 *
 * Serviço de autenticação mockado para o MVP.
 * Simula troca de perfil via store local (sem sessão real).
 *
 * Futuro: substituir inteiramente por Supabase Auth:
 *   listarUsuarios   → supabase.from('profiles').select() (apenas para gerente)
 *   selecionarUsuario → supabase.auth.signInWithPassword() ou signInWithOAuth()
 *   obterUsuarioAtual → supabase.auth.getUser() + join com profiles
 *   logout           → supabase.auth.signOut()
 *
 * Notas de segurança para a V2:
 *   - Aplicar Row Level Security em todas as tabelas usando auth.uid()
 *   - Mapear auth.uid() → corretores.id para verificar posse de leads
 *   - Nunca expor service_role key no client
 */

import { useZelvoStore } from '@/stores/zelvoStore'
import type { Usuario } from '@/lib/types'

/**
 * Retorna todos os usuários mockados.
 * Futuro: apenas gerentes terão acesso a esta lista via RLS.
 */
export function listarUsuarios(): Usuario[] {
  return useZelvoStore.getState().usuarios
}

/**
 * Seleciona o usuário atual (simula login).
 * Futuro: substituir por supabase.auth.signInWithPassword({ email, password }).
 */
export function selecionarUsuario(id: string): void {
  useZelvoStore.getState().selecionarUsuario(id)
}

/**
 * Retorna o usuário logado no momento.
 * Futuro: supabase.auth.getUser() + buscar perfil em profiles table.
 */
export function obterUsuarioAtual(): Usuario {
  return useZelvoStore.getState().usuarioAtual
}

/**
 * Verifica se o usuário atual é gerente.
 * Futuro: checar role no JWT do Supabase Auth (app_metadata.role === 'gerente').
 */
export function isGerente(): boolean {
  return obterUsuarioAtual().perfil === 'gerente'
}

/**
 * Verifica se o usuário atual é corretor.
 * Futuro: checar role no JWT do Supabase Auth.
 */
export function isCorretor(): boolean {
  return obterUsuarioAtual().perfil === 'corretor'
}
