'use client'

/**
 * AppShell.tsx
 *
 * Envolve o conteúdo de cada rota com a estrutura correta:
 * - Rotas públicas (/login, /recuperar-senha): renderiza apenas {children}
 * - Rotas autenticadas: sidebar (ZelvoMenu) + barra de usuário + AuthProvider
 *
 * A barra de usuário varia por modo:
 * - AUTH_MODE=mock     → <UserSwitcher /> (demo)
 * - AUTH_MODE=supabase → <LoggedInUserBar /> (auth real)
 *
 * Usa usePathname() client-side para detectar a rota — o root layout é
 * Server Component e não pode fazer isso diretamente.
 */

import { usePathname } from 'next/navigation'
import { ZelvoMenu }       from '@/components/ZelvoMenu'
import { UserSwitcher }    from '@/components/UserSwitcher'
import { LoggedInUserBar } from '@/components/LoggedInUserBar'
import { AuthProvider }    from '@/components/AuthProvider'
import { IS_MOCK_AUTH }    from '@/config/authMode'

// Rotas que não exibem a sidebar nem a barra de usuário
const ROTAS_PUBLICAS = ['/login', '/recuperar-senha', '/nova-senha']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublica = ROTAS_PUBLICAS.some(r => pathname.startsWith(r))

  // Telas de autenticação: sem shell
  if (isPublica) {
    return <>{children}</>
  }

  return (
    <>
      {/* Controlador de sessão — sem output visual */}
      <AuthProvider />

      {/* Sidebar fixa — expande ao hover, sobrepõe o conteúdo */}
      <ZelvoMenu />

      {/* Conteúdo principal — ml-16 garante que não fica atrás da sidebar recolhida */}
      <main className="flex-1 overflow-auto ml-16 flex flex-col">
        {IS_MOCK_AUTH ? <UserSwitcher /> : <LoggedInUserBar />}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </>
  )
}
