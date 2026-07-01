'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AccessGuard } from '@/components/AccessGuard'
import { PageHeader } from '@/components/PageHeader'
import {
  Bell, CheckCheck, AlertTriangle, Flame, UserPlus, Trophy,
  RefreshCw, Filter,
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

type Filtro = 'todas' | 'nao_lidas' | 'alta_prioridade' | 'leads' | 'sistema'

const PRIORIDADE_STYLES: Record<string, { badge: string; dot: string }> = {
  critica: { badge: 'text-red-400 bg-red-500/10 border-red-500/20',    dot: '#EF4444' },
  alta:    { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: '#F59E0B' },
  media:   { badge: 'text-rose-300 bg-rose-900/20 border-rose-900/30', dot: '#6E0933' },
  baixa:   { badge: 'text-gray-400 bg-gray-700/20 border-gray-700/30', dot: '#6B7280' },
}

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas',           label: 'Todas' },
  { id: 'nao_lidas',       label: 'Não lidas' },
  { id: 'alta_prioridade', label: 'Alta prioridade' },
  { id: 'leads',           label: 'Leads' },
  { id: 'sistema',         label: 'Sistema' },
]

const TIPOS_SISTEMA = ['corretor_sobrecarregado', 'lead_sem_proxima_acao', 'lead_premium_parado']
const TIPOS_LEADS   = ['lead_atribuido', 'lead_premium_recebido', 'status_atualizado', 'nova_tentativa_entrada']

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'lead_premium_recebido') return <Flame         size={15} style={{ color: '#F59E0B' }} />
  if (tipo === 'lead_premium_parado')   return <AlertTriangle size={15} style={{ color: '#EF4444' }} />
  if (tipo === 'status_atualizado')     return <Trophy        size={15} style={{ color: '#10B981' }} />
  if (tipo === 'corretor_sobrecarregado') return <AlertTriangle size={15} style={{ color: '#F59E0B' }} />
  return <UserPlus size={15} style={{ color: '#6E0933' }} />
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'agora'
  if (min < 60)  return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)    return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)     return `há ${d}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function aplicarFiltro(notificacoes: Notificacao[], filtro: Filtro): Notificacao[] {
  switch (filtro) {
    case 'nao_lidas':       return notificacoes.filter(n => !n.lida)
    case 'alta_prioridade': return notificacoes.filter(n => n.prioridade === 'alta' || n.prioridade === 'critica')
    case 'leads':           return notificacoes.filter(n => TIPOS_LEADS.includes(n.tipo))
    case 'sistema':         return notificacoes.filter(n => TIPOS_SISTEMA.includes(n.tipo))
    default:                return notificacoes
  }
}

function NotificacoesContent() {
  const [notificacoes,   setNotificacoes]   = useState<Notificacao[]>([])
  const [filtro,         setFiltro]         = useState<Filtro>('todas')
  const [loading,        setLoading]        = useState(true)
  const [marcandoTodas,  setMarcandoTodas]  = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/notificacoes?limit=100')
      if (r.ok) {
        const d = await r.json() as { notificacoes: Notificacao[] }
        setNotificacoes(d.notificacoes)
      }
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function handleMarcarLida(id: string) {
    await fetch(`/api/notificacoes/${id}/lida`, { method: 'PATCH' })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  async function handleMarcarTodas() {
    setMarcandoTodas(true)
    await fetch('/api/notificacoes/marcar-todas-lidas', { method: 'PATCH' })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    setMarcandoTodas(false)
  }

  const filtradas  = aplicarFiltro(notificacoes, filtro)
  const naoLidas   = notificacoes.filter(n => !n.lida).length

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Notificações"
        description="Todos os eventos e alertas do sistema"
      />

      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-muted-foreground" />
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filtro === f.id ? '#6E0933' : 'rgba(255,255,255,0.05)',
                color:      filtro === f.id ? '#fff'    : '#9CA3AF',
                border:     `1px solid ${filtro === f.id ? '#6E0933' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {f.label}
              {f.id === 'nao_lidas' && naoLidas > 0 && (
                <span className="ml-1 text-[10px]">({naoLidas})</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={buscar}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          {naoLidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              disabled={marcandoTodas}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              style={{
                background: 'rgba(110,9,51,0.12)',
                border:     '1px solid rgba(110,9,51,0.3)',
                color:      '#c0375a',
              }}
            >
              {marcandoTodas
                ? <RefreshCw size={11} className="animate-spin" />
                : <CheckCheck size={11} />
              }
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <RefreshCw size={14} className="animate-spin" /> Carregando notificações…
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={32} className="text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação{filtro !== 'todas' ? ' com esse filtro' : ''}</p>
          </div>
        ) : (
          <div>
            {filtradas.map((n, i) => {
              const style = PRIORIDADE_STYLES[n.prioridade] ?? PRIORIDADE_STYLES.media
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 px-5 py-4 border-b last:border-0 transition-colors ${n.lida ? '' : 'hover:bg-white/2'}`}
                  style={{
                    borderColor: 'rgba(255,255,255,0.05)',
                    background:  n.lida
                      ? i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                      : 'rgba(110,9,51,0.04)',
                  }}
                >
                  {/* Ícone */}
                  <div className="mt-0.5 shrink-0">
                    <TipoIcon tipo={n.tipo} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${n.lida ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {n.titulo}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.badge}`}>
                          {n.prioridade}
                        </span>
                        {!n.lida && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: style.dot }} />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {tempoRelativo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.mensagem}</p>

                    {/* Ações */}
                    <div className="flex items-center gap-3 mt-2">
                      {n.leadId && (
                        <Link
                          href={`/leads/${n.leadId}`}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Abrir lead
                        </Link>
                      )}
                      {!n.lida && (
                        <button
                          onClick={() => handleMarcarLida(n.id)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Marcar como lida
                        </button>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 ml-auto">
                        {new Date(n.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!loading && filtradas.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {filtradas.length} notificação{filtradas.length !== 1 ? 'ões' : ''}
        </p>
      )}
    </div>
  )
}

export default function NotificacoesPage() {
  return (
    <AccessGuard allowedProfiles={['gerente', 'corretor']}>
      <NotificacoesContent />
    </AccessGuard>
  )
}
