'use client'

/**
 * LoggedInUserBar.tsx
 *
 * Barra superior mostrada quando AUTH_MODE=supabase.
 * Exibe nome do usuário, badge de perfil e botão de logout.
 * Substitui visualmente o UserSwitcher no modo de autenticação real.
 */

import { useState } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'
import { fazerLogout } from '@/components/AuthProvider'
import { Shield, User, LogOut, Loader2 } from 'lucide-react'

export function LoggedInUserBar() {
  const usuarioAtual      = useZelvoStore(s => s.usuarioAtual)
  const limparUsuarioAtual = useZelvoStore(s => s.limparUsuarioAtual)
  const authLoading        = useZelvoStore(s => s.authLoading)

  const [saindo, setSaindo] = useState(false)

  const isGerente = usuarioAtual.perfil === 'gerente'

  async function handleLogout() {
    setSaindo(true)
    await fazerLogout(limparUsuarioAtual)
  }

  if (authLoading) {
    return (
      <div
        className="sticky top-0 z-30 flex items-center justify-end px-4 py-1.5 border-b"
        style={{
          background: 'rgba(22,25,29,0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <Loader2 size={13} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Verificando sessão…</span>
      </div>
    )
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-end px-4 py-1.5 border-b gap-3"
      style={{
        background: 'rgba(22,25,29,0.95)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Usuário logado */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
        style={{
          borderColor: isGerente ? 'rgba(110,9,51,0.4)' : 'rgba(59,130,246,0.3)',
          background:  isGerente ? 'rgba(110,9,51,0.10)' : 'rgba(59,130,246,0.07)',
        }}
      >
        {isGerente
          ? <Shield size={12} style={{ color: '#6E0933' }} />
          : <User   size={12} style={{ color: '#3B82F6' }} />
        }
        <span className="text-xs text-muted-foreground">
          Conectado como{' '}
          <span className="font-semibold text-foreground">{usuarioAtual.nome}</span>
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: isGerente ? 'rgba(110,9,51,0.25)' : 'rgba(59,130,246,0.2)',
            color:      isGerente ? '#c0375a'              : '#60A5FA',
          }}
        >
          {isGerente ? 'Gerente' : 'Corretor'}
        </span>
      </div>

      {/* Botão sair */}
      <button
        onClick={handleLogout}
        disabled={saindo}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all hover:bg-white/5 disabled:opacity-50"
        style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}
      >
        {saindo
          ? <Loader2 size={12} className="animate-spin" />
          : <LogOut  size={12} />
        }
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
    </div>
  )
}
