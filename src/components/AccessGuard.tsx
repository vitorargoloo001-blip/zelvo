'use client'

import type { PerfilUsuario } from '@/lib/types'
import { useZelvoStore } from '@/stores/zelvoStore'
import { AcessoRestrito } from '@/components/AcessoRestrito'

interface AccessGuardProps {
  allowedProfiles: PerfilUsuario[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Renderiza children apenas se o perfil do usuário atual estiver em allowedProfiles.
 * Caso contrário, exibe o fallback (padrão: <AcessoRestrito />).
 *
 * Futuro: substituir verificação de perfil por validação de sessão via Supabase Auth.
 */
export function AccessGuard({ allowedProfiles, children, fallback }: AccessGuardProps) {
  const perfil = useZelvoStore(s => s.usuarioAtual.perfil)

  if (!allowedProfiles.includes(perfil)) {
    return <>{fallback ?? <AcessoRestrito />}</>
  }

  return <>{children}</>
}
