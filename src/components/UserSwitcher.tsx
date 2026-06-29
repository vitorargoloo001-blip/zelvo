'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useZelvoStore } from '@/stores/zelvoStore'
import { rotaInicialdoPerfil } from '@/lib/access'
import { ChevronDown, Shield, User, Check } from 'lucide-react'
import type { Usuario } from '@/lib/types'

export function UserSwitcher() {
  const router            = useRouter()
  const usuarios          = useZelvoStore(s => s.usuarios)
  const usuarioAtual      = useZelvoStore(s => s.usuarioAtual)
  const selecionarUsuario = useZelvoStore(s => s.selecionarUsuario)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Futuro: substituir por verificação de sessão Supabase Auth
  function handleSelecionarUsuario(usuario: Usuario) {
    selecionarUsuario(usuario.id)
    setOpen(false)
    // Redireciona para rota inicial do novo perfil
    router.push(rotaInicialdoPerfil(usuario.perfil))
  }

  const isGerente  = usuarioAtual.perfil === 'gerente'
  const gerentes   = usuarios.filter(u => u.perfil === 'gerente')
  const corretores = usuarios.filter(u => u.perfil === 'corretor')

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-end px-4 py-1.5 border-b"
      style={{
        background: 'rgba(22,25,29,0.95)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <span className="text-[10px] text-muted-foreground mr-3 hidden sm:block">
        Demo MVP — troca de perfil:
      </span>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
          style={{
            borderColor: isGerente ? 'rgba(110,9,51,0.5)' : 'rgba(59,130,246,0.35)',
            background:  isGerente ? 'rgba(110,9,51,0.12)' : 'rgba(59,130,246,0.08)',
            color: '#E6E4E1',
          }}
        >
          {isGerente
            ? <Shield size={12} style={{ color: '#6E0933' }} />
            : <User   size={12} style={{ color: '#3B82F6' }} />
          }
          <span className="text-xs">
            <span className="text-muted-foreground">Visualizando como:</span>{' '}
            <span className="font-semibold">{usuarioAtual.nome}</span>
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
          <ChevronDown
            size={11}
            className="text-muted-foreground transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border py-1.5 shadow-2xl overflow-hidden"
            style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.09)' }}
          >
            {/* Gerentes */}
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Shield size={9} style={{ color: '#6E0933' }} /> Gerência
              </p>
            </div>
            {gerentes.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelecionarUsuario(u)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">{u.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
                {usuarioAtual.id === u.id
                  ? <Check size={12} style={{ color: '#6E0933' }} />
                  : <span className="text-[9px] text-muted-foreground">→ Dashboard</span>
                }
              </button>
            ))}

            <div className="mx-3 my-1.5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Corretores */}
            <div className="px-3 py-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <User size={9} style={{ color: '#3B82F6' }} /> Corretores
              </p>
            </div>
            {corretores.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelecionarUsuario(u)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">{u.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
                {usuarioAtual.id === u.id
                  ? <Check size={12} style={{ color: '#3B82F6' }} />
                  : <span className="text-[9px] text-muted-foreground">→ Meu Painel</span>
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
