/**
 * authService.ts
 *
 * Serviço de autenticação do Zelvo.
 * - AUTH_MODE=mock  → funções são no-op / retornam dados do UserSwitcher
 * - AUTH_MODE=supabase → usa Supabase Auth real
 *
 * Todas as funções são seguras de chamar em qualquer modo.
 */

import { supabase } from '@/lib/supabaseClient'
import { rotaInicialdoPerfil } from '@/lib/access'
import type { Usuario, PerfilUsuario } from '@/lib/types'
import type { SessaoAuth } from '@/stores/zelvoStore'

// ── Shape do profile vindo do Supabase ────────────────────────────────────

interface ProfileRow {
  id:          string
  nome:        string
  email:       string
  perfil:      string
  corretor_id: string | null
  ativo:       boolean
}

// ── Helpers internos ──────────────────────────────────────────────────────

function profileToUsuario(p: ProfileRow): Usuario {
  return {
    id:         p.id,
    nome:       p.nome,
    email:      p.email,
    perfil:     p.perfil as PerfilUsuario,
    corretorId: p.corretor_id ?? undefined,
  }
}

// ── Funções públicas ──────────────────────────────────────────────────────

/**
 * Realiza login com email e senha via Supabase Auth.
 * Retorna o usuário com perfil ou um erro tratado.
 */
export async function loginComEmailSenha(
  email: string,
  senha: string
): Promise<{ usuario: Usuario; sessao: SessaoAuth } | { erro: string }> {
  if (!supabase) return { erro: 'Supabase não configurado. Configure as variáveis de ambiente.' }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error || !data.session) {
    if (error?.message?.includes('Invalid login credentials'))
      return { erro: 'Email ou senha incorretos.' }
    if (error?.message?.includes('Email not confirmed'))
      return { erro: 'Confirme seu email antes de entrar.' }
    return { erro: error?.message ?? 'Erro ao fazer login. Tente novamente.' }
  }

  const perfil = await buscarPerfilPorAuthId(data.session.user.id)
  if (!perfil) return { erro: 'Usuário sem perfil configurado. Fale com o administrador.' }

  const sessao: SessaoAuth = {
    userId:    data.session.user.id,
    email:     data.session.user.email ?? email,
    expiresAt: data.session.expires_at ?? 0,
  }

  return { usuario: profileToUsuario(perfil), sessao }
}

/**
 * Encerra a sessão do usuário atual no Supabase.
 */
export async function logout(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Retorna a sessão ativa do Supabase, ou null.
 */
export async function obterSessaoAtual(): Promise<SessaoAuth | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return {
    userId:    session.user.id,
    email:     session.user.email ?? '',
    expiresAt: session.expires_at ?? 0,
  }
}

/**
 * Retorna o Usuario atual (perfil + sessão) a partir da sessão ativa.
 * Consulta a tabela profiles para obter perfil e corretor_id.
 */
export async function obterUsuarioAtualComPerfil(): Promise<{
  usuario: Usuario
  sessao: SessaoAuth
} | null> {
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const perfil = await buscarPerfilPorAuthId(session.user.id)
  if (!perfil) return null

  return {
    usuario: profileToUsuario(perfil),
    sessao: {
      userId:    session.user.id,
      email:     session.user.email ?? '',
      expiresAt: session.expires_at ?? 0,
    },
  }
}

/**
 * Retorna o path inicial para redirecionar após login, conforme perfil.
 */
export function redirecionarPorPerfil(usuario: Usuario): string {
  return rotaInicialdoPerfil(usuario.perfil)
}

/**
 * Envia email de recuperação de senha via Supabase Auth.
 */
export async function enviarEmailRecuperacao(
  email: string,
  redirectTo?: string
): Promise<{ sucesso: boolean; erro?: string }> {
  if (!supabase) return { sucesso: false, erro: 'Supabase não configurado.' }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? `${window.location.origin}/nova-senha`,
  })

  if (error) return { sucesso: false, erro: error.message }
  return { sucesso: true }
}

// ── Funções internas ──────────────────────────────────────────────────────

async function buscarPerfilPorAuthId(authUserId: string): Promise<ProfileRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, perfil, corretor_id, ativo')
    .eq('id', authUserId)
    .eq('ativo', true)
    .single()

  if (error || !data) return null
  return data as ProfileRow
}
