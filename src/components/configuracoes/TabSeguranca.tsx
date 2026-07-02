'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, X, Loader2, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {ok ? <CheckCircle2 size={12} /> : <X size={12} />}
        {ok ? 'Configurado' : 'Ausente'}
      </span>
    </div>
  )
}

type HealthData = {
  secrets: { intakeSecret: boolean; resendKey: boolean; databaseUrl: boolean }
  auth: boolean
  ambiente: string
  vercel: boolean
}

export function TabSeguranca() {
  const { data: session } = useSession()
  const [health,  setHealth]  = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/system/health').then(r => r.json()).then(d => { setHealth(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  const user = session?.user

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <ShieldCheck size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Segurança</p>
          <p className="text-xs text-muted-foreground">Sessão atual, permissões e status das variáveis de ambiente</p>
        </div>
      </div>

      {/* Sessão atual */}
      <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sessão atual</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Usuário logado</span>
            <span className="text-sm font-semibold text-foreground">{user?.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Perfil</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${(user as { perfil?: string })?.perfil === 'gerente' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
              {(user as { perfil?: string })?.perfil ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Modo de autenticação</span>
            <span className="text-sm text-foreground">{health?.ambiente === 'production' ? 'Auth.js + Neon/Postgres' : 'Auth.js (desenvolvimento)'}</span>
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-red-400 transition-colors border border-border hover:border-red-500/30 px-3 py-1.5 rounded-lg"
          >
            <LogOut size={12} /> Encerrar sessão
          </button>
        </div>
      </div>

      {/* Variáveis de ambiente */}
      <div className="rounded-xl border border-border p-4" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Variáveis de ambiente</p>
        <p className="text-[10px] text-amber-400 mb-3">Os valores nunca são exibidos. Apenas a presença é verificada.</p>
        <StatusRow label="LEAD_INTAKE_SECRET"      ok={health?.secrets.intakeSecret ?? false} />
        <StatusRow label="RESEND_API_KEY"           ok={health?.secrets.resendKey ?? false} />
        <StatusRow label="DATABASE_URL (Postgres)"  ok={health?.secrets.databaseUrl ?? false} />
        <StatusRow label="NEXTAUTH_SECRET"          ok={health?.auth ?? false} />
      </div>

      {/* Ambiente */}
      <div className="rounded-xl border border-border p-4 space-y-2" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Infraestrutura</p>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Ambiente</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${health?.ambiente === 'production' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {health?.ambiente ?? '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Vercel</span>
          <span className={`text-xs font-semibold ${health?.vercel ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {health?.vercel ? 'Sim' : 'Não detectado'}
          </span>
        </div>
      </div>
    </div>
  )
}
