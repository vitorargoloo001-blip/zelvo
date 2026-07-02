'use client'

import { useState, useEffect, useCallback } from 'react'
import { Server, RefreshCw, CheckCircle2, X, Loader2 } from 'lucide-react'

type Health = {
  ok: boolean
  database: boolean
  auth: boolean
  ambiente: string
  vercel: boolean
  timestamp: string
  version: string
  totals: { leads: number; corretores: number; usuarios: number; distribuicoes: number; atividades: number }
  secrets: { intakeSecret: boolean; resendKey: boolean; databaseUrl: boolean }
}

function Stat({ label, value, cor }: { label: string; value: number; cor?: string }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center" style={{ background: '#1F2329' }}>
      <p className="text-2xl font-black" style={{ color: cor ?? '#E6E4E1' }}>{value.toLocaleString('pt-BR')}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

export function TabSistema() {
  const [health,  setHealth]  = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [testando, setTestando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const d = await fetch('/api/system/health').then(r => r.json()).catch(() => null)
    setHealth(d)
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function testar() {
    setTestando(true)
    await carregar()
    setTestando(false)
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando diagnóstico…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Server size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sistema</p>
          <p className="text-xs text-muted-foreground">Diagnóstico operacional e status dos serviços</p>
        </div>
      </div>

      {/* Status geral */}
      <div className="rounded-xl border p-4 flex items-center justify-between" style={{ background: health?.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderColor: health?.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-3">
          {health?.ok
            ? <CheckCircle2 size={20} className="text-emerald-400" />
            : <X size={20} className="text-red-400" />}
          <div>
            <p className="text-sm font-semibold text-foreground">{health?.ok ? 'Sistema operacional' : 'Problema detectado'}</p>
            <p className="text-xs text-muted-foreground">{health?.timestamp ? `Última verificação: ${new Date(health.timestamp).toLocaleTimeString('pt-BR')}` : '—'}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">v{health?.version ?? '—'}</span>
      </div>

      {/* Totais */}
      {health?.totals && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Leads"        value={health.totals.leads}        cor="#6E0933" />
          <Stat label="Corretores"   value={health.totals.corretores}   cor="#3B82F6" />
          <Stat label="Usuários"     value={health.totals.usuarios}     cor="#8B5CF6" />
          <Stat label="Distribuições" value={health.totals.distribuicoes} />
          <Stat label="Atividades"   value={health.totals.atividades} />
        </div>
      )}

      {/* Serviços */}
      <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Serviços</p>
        {[
          { label: 'Banco de dados (Neon/Postgres)', ok: health?.database },
          { label: 'Auth.js (NEXTAUTH_SECRET)',      ok: health?.auth },
          { label: 'Vercel',                         ok: health?.vercel },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-foreground">{label}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {ok ? <CheckCircle2 size={11} /> : <X size={11} />}
              {ok ? 'OK' : 'Falha'}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Ambiente</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${health?.ambiente === 'production' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {health?.ambiente ?? '—'}
          </span>
        </div>
      </div>

      <button
        onClick={testar}
        disabled={testando}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw size={14} className={testando ? 'animate-spin' : ''} />
        {testando ? 'Verificando…' : 'Testar saúde do sistema'}
      </button>
    </div>
  )
}
