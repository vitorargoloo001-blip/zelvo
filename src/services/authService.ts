/**
 * authService.ts
 *
 * Serviço de autenticação do Zelvo.
 * - AUTH_MODE=mock  → funções são no-op / não chamadas (UserSwitcher cuida de tudo)
 * - AUTH_MODE=cloud → usa Auth.js (NextAuth) real via next-auth/react
 *
 * Todas as funções são seguras de chamar em qualquer modo.
 */

import { signIn, signOut, getSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import { rotaInicialdoPerfil } from '@/lib/access'
import type { Usuario } from '@/lib/types'
import type { SessaoAuth } from '@/stores/zelvoStore'

// ── Helpers internos ──────────────────────────────────────────────────────

function sessionToUsuario(session: Session): Usuario | null {
  if (!session.user?.id) return null
  return {
    id: session.user.id,
    nome: session.user.name ?? '',
    email: session.user.email ?? '',
    perfil: session.user.perfil,
    corretorId: session.user.corretorId ?? undefined,
  }
}

function sessionToSessao(session: Session): SessaoAuth {
  return {
    userId: session.user?.id ?? '',
    email: session.user?.email ?? '',
    expiresAt: session.expires ? Math.floor(new Date(session.expires).getTime() / 1000) : 0,
  }
}

// ── Funções públicas ──────────────────────────────────────────────────────

/**
 * Realiza login com email e senha via Auth.js (Credentials Provider).
 * Retorna o usuário com perfil ou um erro tratado.
 */
export async function loginComEmailSenha(
  email: string,
  senha: string
): Promise<{ usuario: Usuario; sessao: SessaoAuth } | { erro: string }> {
  const resultado = await signIn('credentials', { email, senha, redirect: false })

  if (!resultado || resultado.error) {
    return { erro: 'Email ou senha incorretos.' }
  }

  const session = await getSession()
  if (!session) return { erro: 'Não foi possível carregar a sessão. Tente novamente.' }

  const usuario = sessionToUsuario(session)
  if (!usuario) return { erro: 'Usuário sem perfil configurado. Fale com o administrador.' }

  return { usuario, sessao: sessionToSessao(session) }
}

/**
 * Encerra a sessão do usuário atual.
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: false })
}

/**
 * Retorna a sessão ativa do Auth.js, ou null.
 */
export async function obterSessaoAtual(): Promise<SessaoAuth | null> {
  const session = await getSession()
  return session ? sessionToSessao(session) : null
}

/**
 * Retorna o Usuario atual (perfil + sessão) a partir da sessão ativa.
 */
export async function obterUsuarioAtualComPerfil(): Promise<{
  usuario: Usuario
  sessao: SessaoAuth
} | null> {
  const session = await getSession()
  if (!session) return null

  const usuario = sessionToUsuario(session)
  if (!usuario) return null

  return { usuario, sessao: sessionToSessao(session) }
}

/**
 * Retorna o path inicial para redirecionar após login, conforme perfil.
 */
export function redirecionarPorPerfil(usuario: Usuario): string {
  return rotaInicialdoPerfil(usuario.perfil)
}

/**
 * Envia email de recuperação de senha via rota própria (PasswordResetToken + Resend).
 */
export async function enviarEmailRecuperacao(
  email: string,
  redirectTo?: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const resposta = await fetch('/api/auth/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    })

    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => null)
      return { sucesso: false, erro: corpo?.erro ?? 'Erro ao enviar email. Tente novamente.' }
    }

    return { sucesso: true }
  } catch {
    return { sucesso: false, erro: 'Erro ao enviar email. Tente novamente.' }
  }
}
