'use client'

/**
 * AuthProvider.tsx
 *
 * Componente raiz de autenticação. Renderizado no layout principal.
 *
 * AUTH_MODE=mock     → no-op: UserSwitcher já controla tudo
 * AUTH_MODE=supabase → escuta mudanças de sessão Supabase, carrega perfil da tabela
 *                      profiles, atualiza zelvoStore, redireciona para /login se
 *                      não houver sessão em rotas protegidas.
 *
 * Não renderiza nada visualmente — é um controlador de estado puro.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { IS_SUPABASE_AUTH } from '@/config/authMode'
import { supabase } from '@/lib/supabaseClient'
import { useZelvoStore } from '@/stores/zelvoStore'
import { obterUsuarioAtualComPerfil, logout } from '@/services/authService'

// Rotas que não exigem sessão
const ROTAS_PUBLICAS = ['/login', '/recuperar-senha', '/nova-senha']

export function AuthProvider() {
  const router   = useRouter()
  const pathname = usePathname()

  const setUsuarioAtual    = useZelvoStore(s => s.setUsuarioAtual)
  const limparUsuarioAtual = useZelvoStore(s => s.limparUsuarioAtual)
  const setSessao          = useZelvoStore(s => s.setSessao)
  const setAuthLoading     = useZelvoStore(s => s.setAuthLoading)

  useEffect(() => {
    // Em modo mock o UserSwitcher já cuida de tudo
    if (!IS_SUPABASE_AUTH || !supabase) return

    setAuthLoading(true)

    // Carrega sessão inicial
    obterUsuarioAtualComPerfil().then(resultado => {
      if (resultado) {
        setUsuarioAtual(resultado.usuario)
        setSessao(resultado.sessao)
      } else {
        limparUsuarioAtual()
        // Redireciona para login se a rota atual não é pública
        if (!ROTAS_PUBLICAS.some(r => pathname.startsWith(r))) {
          router.replace('/login')
        }
      }
      setAuthLoading(false)
    })

    // Escuta mudanças de sessão em tempo real (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          limparUsuarioAtual()
          if (!ROTAS_PUBLICAS.some(r => pathname.startsWith(r))) {
            router.replace('/login')
          }
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const resultado = await obterUsuarioAtualComPerfil()
          if (resultado) {
            setUsuarioAtual(resultado.usuario)
            setSessao(resultado.sessao)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

/**
 * Expõe função de logout para uso em componentes (LoggedInUserBar, etc.)
 * Limpa store + chama supabase.auth.signOut.
 */
export async function fazerLogout(
  limparStore: () => void,
  redirectTo = '/login'
): Promise<void> {
  limparStore()
  await logout()
  window.location.href = redirectTo
}
