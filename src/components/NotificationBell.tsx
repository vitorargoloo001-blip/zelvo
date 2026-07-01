'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell, CheckCheck, AlertTriangle, Flame, UserPlus, Trophy,
  RefreshCw, X,
} from 'lucide-react'

interface Notificacao {
  id:         string
  tipo:       string
  titulo:     string
  mensagem:   string
  prioridade: string
  lida:       boolean
  leadId:     string | null
  createdAt:  string
}

const PRIORIDADE_STYLES: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  critica: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  label: 'text-red-400',    dot: '#EF4444' },
  alta:    { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'text-amber-400',  dot: '#F59E0B' },
  media:   { bg: 'rgba(110,9,51,0.08)',  border: 'rgba(110,9,51,0.2)',   label: 'text-rose-300',   dot: '#6E0933' },
  baixa:   { bg: 'rgba(75,85,99,0.1)',   border: 'rgba(75,85,99,0.2)',   label: 'text-gray-400',   dot: '#6B7280' },
}

function TipoIcon({ tipo }: { tipo: string }) {
  const cls = 'shrink-0'
  if (tipo === 'lead_premium_recebido') return <Flame      size={13} className={cls} style={{ color: '#F59E0B' }} />
  if (tipo === 'lead_premium_parado')   return <AlertTriangle size={13} className={cls} style={{ color: '#EF4444' }} />
  if (tipo === 'status_atualizado')     return <Trophy      size={13} className={cls} style={{ color: '#10B981' }} />
  if (tipo === 'corretor_sobrecarregado') return <AlertTriangle size={13} className={cls} style={{ color: '#F59E0B' }} />
  return <UserPlus size={13} className={cls} style={{ color: '#6E0933' }} />
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'agora'
  if (min < 60)  return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)    return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function NotificationBell() {
  const [naoLidas,      setNaoLidas]      = useState(0)
  const [aberto,        setAberto]        = useState(false)
  const [notificacoes,  setNotificacoes]  = useState<Notificacao[]>([])
  const [loadingList,   setLoadingList]   = useState(false)
  const [marcandoTodas, setMarcandoTodas] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const buscarCount = useCallback(async () => {
    try {
      const r = await fetch('/api/notificacoes/count')
      if (r.ok) {
        const d = await r.json() as { naoLidas: number }
        setNaoLidas(d.naoLidas)
      }
    } catch { /* silencioso */ }
  }, [])

  const buscarLista = useCallback(async () => {
    setLoadingList(true)
    try {
      const r = await fetch('/api/notificacoes?limit=10')
      if (r.ok) {
        const d = await r.json() as { notificacoes: Notificacao[] }
        setNotificacoes(d.notificacoes)
      }
    } catch { /* silencioso */ }
    finally { setLoadingList(false) }
  }, [])

  // Count no mount + polling 30s
  useEffect(() => {
    buscarCount()
    const timer = setInterval(buscarCount, 30_000)
    return () => clearInterval(timer)
  }, [buscarCount])

  // Abre dropdown → busca lista
  useEffect(() => {
    if (aberto) buscarLista()
  }, [aberto, buscarLista])

  // Fecha ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleMarcarLida(id: string) {
    await fetch(`/api/notificacoes/${id}/lida`, { method: 'PATCH' })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setNaoLidas(prev => Math.max(0, prev - 1))
  }

  async function handleMarcarTodas() {
    setMarcandoTodas(true)
    await fetch('/api/notificacoes/marcar-todas-lidas', { method: 'PATCH' })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    setNaoLidas(0)
    setMarcandoTodas(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setAberto(v => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/8"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        title="Notificações"
      >
        <Bell size={14} style={{ color: naoLidas > 0 ? '#6E0933' : '#6B7280' }} />
        {naoLidas > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white px-0.5"
            style={{ background: '#6E0933', border: '1.5px solid #1A1E23' }}
          >
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div
          className="absolute right-0 top-10 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden"
          style={{ background: '#1A1E23', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={13} style={{ color: '#6E0933' }} />
              <span className="text-xs font-bold text-foreground">Notificações</span>
              {naoLidas > 0 && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#6E0933' }}
                >
                  {naoLidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button
                  onClick={handleMarcarTodas}
                  disabled={marcandoTodas}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {marcandoTodas
                    ? <RefreshCw size={10} className="animate-spin" />
                    : <CheckCheck size={10} />
                  }
                  Marcar lidas
                </button>
              )}
              <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
                <RefreshCw size={12} className="animate-spin" /> Carregando…
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notificacoes.map(n => {
                const style = PRIORIDADE_STYLES[n.prioridade] ?? PRIORIDADE_STYLES.media
                return (
                  <div
                    key={n.id}
                    className="flex gap-3 px-4 py-3 border-b cursor-pointer transition-colors hover:bg-white/3"
                    style={{
                      borderColor: 'rgba(255,255,255,0.05)',
                      background:  n.lida ? 'transparent' : style.bg,
                    }}
                    onClick={() => { if (!n.lida) handleMarcarLida(n.id) }}
                  >
                    <div className="mt-0.5">
                      <TipoIcon tipo={n.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[11px] font-semibold leading-snug ${n.lida ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {n.titulo}
                        </p>
                        <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">
                          {tempoRelativo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                        {n.mensagem}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${style.label}`}
                        >
                          {n.prioridade}
                        </span>
                        {!n.lida && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: style.dot }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <Link
              href="/notificacoes"
              onClick={() => setAberto(false)}
              className="block text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todas as notificações →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
