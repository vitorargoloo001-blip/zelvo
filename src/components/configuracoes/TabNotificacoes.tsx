'use client'

import { useState, useEffect } from 'react'
import { Bell, Save, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { NotificacaoConfig } from '@/lib/types'

const inputCls = 'bg-[#1F2329] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 w-20 text-right transition-colors'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="transition-colors">
      {checked ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
    </button>
  )
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function TabNotificacoes() {
  const [config,   setConfig]   = useState<Partial<NotificacaoConfig>>({})
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
  const [erro,     setErro]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/configuracoes/notificacoes').then(r => r.json()).then(d => { setConfig(d.config ?? {}); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function toggle(k: keyof NotificacaoConfig) {
    setConfig(c => ({ ...c, [k]: !(c[k] as boolean) }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const r = await fetch('/api/configuracoes/notificacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setConfig(d.config)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Bell size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Notificações</p>
          <p className="text-xs text-muted-foreground">Configure quando e como notificar corretores e gerentes</p>
        </div>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Notificações internas</p>
        <div className="px-4 pb-2">
          <Row label="Notificações internas ativas" description="Avisar corretor ao receber lead atribuído">
            <Toggle checked={!!config.notificacoesInternasAtivas} onChange={() => toggle('notificacoesInternasAtivas')} />
          </Row>
        </div>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Notificações por email</p>
        <div className="px-4 pb-2">
          <Row label="Email ao receber lead" description="Enviar email quando um lead é atribuído ao corretor">
            <Toggle checked={!!config.emailNovoLead} onChange={() => toggle('emailNovoLead')} />
          </Row>
          <Row label="Email para lead Premium" description="Alerta prioritário por email para leads Premium">
            <Toggle checked={!!config.emailLeadPremium} onChange={() => toggle('emailLeadPremium')} />
          </Row>
        </div>
        <p className="text-[10px] text-muted-foreground px-4 pb-3">Requer RESEND_API_KEY configurada na Vercel para funcionar.</p>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Alertas gerenciais</p>
        <div className="px-4 pb-2">
          <Row label="Alerta: Lead Premium parado" description="Notificar gerente se lead Premium ficar sem contato">
            <Toggle checked={!!config.alertaPremiumParado} onChange={() => toggle('alertaPremiumParado')} />
          </Row>
          <Row label="Tempo máximo Lead Premium parado" description="Em minutos, após criação do lead">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                className={inputCls}
                type="number"
                min={1}
                value={config.minutosPremiumParado ?? 10}
                onChange={e => setConfig(c => ({ ...c, minutosPremiumParado: Number(e.target.value) }))}
              />
              <span>min</span>
            </div>
          </Row>
          <Row label="Alerta: Lead sem próxima ação" description="Lead ativo sem próxima ação definida">
            <Toggle checked={!!config.alertaSemProximaAcao} onChange={() => toggle('alertaSemProximaAcao')} />
          </Row>
          <Row label="Alerta: Corretor sobrecarregado" description="Notificação quando corretor atinge o limite">
            <Toggle checked={!!config.alertaCorretorSobrecarregado} onChange={() => toggle('alertaCorretorSobrecarregado')} />
          </Row>
          <Row label="Limite de leads para alerta de sobrecarga">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                className={inputCls}
                type="number"
                min={1}
                value={config.limiteLeadsEmAberto ?? 15}
                onChange={e => setConfig(c => ({ ...c, limiteLeadsEmAberto: Number(e.target.value) }))}
              />
              <span>leads</span>
            </div>
          </Row>
        </div>
      </div>

      {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#6E0933', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        {sucesso && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 size={14} /> Salvo</span>}
      </div>
    </form>
  )
}
