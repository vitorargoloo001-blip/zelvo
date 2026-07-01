'use client'

/**
 * AuthProvider.tsx
 *
 * Componente raiz de autenticação. Renderizado no layout principal.
 *
 * AUTH_MODE=mock  → no-op: UserSwitcher já controla tudo
 * AUTH_MODE=cloud → carrega a sessão Auth.js atual, popula zelvoStore,
 *                   redireciona para /login se não houver sessão em rotas
 *                   protegidas (o proxy.ts já faz o mesmo a cada navegação;
 *                   isto cobre o caso de a sessão expirar com a SPA já
 *                   carregada).
 *
 * Não renderiza nada visualmente — é um controlador de estado puro.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { IS_CLOUD_AUTH } from '@/config/authMode'
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
    if (!IS_CLOUD_AUTH) return

    setAuthLoading(true)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

/**
 * Expõe função de logout para uso em componentes (LoggedInUserBar, etc.)
 * Limpa store + encerra a sessão Auth.js.
 */
export async function fazerLogout(
  limparStore: () => void,
  redirectTo = '/login'
): Promise<void> {
  limparStore()
  await logout()
  window.location.href = redirectTo
}
