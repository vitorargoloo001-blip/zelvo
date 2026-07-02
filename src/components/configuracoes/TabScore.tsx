'use client'

import { useState, useEffect } from 'react'
import { Target, Save, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react'
import type { ScoreRegras } from '@/lib/types'

const inputCls = 'bg-[#1F2329] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 w-28 text-right transition-colors'

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

export function TabScore() {
  const [regras,   setRegras]   = useState<ScoreRegras | null>(null)
  const [configId, setConfigId] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
  const [erro,     setErro]     = useState<string | null>(null)

  async function carregar() {
    const d = await fetch('/api/configuracoes/score').then(r => r.json())
    setRegras(d.config?.regras ?? null)
    setConfigId(d.config?.id ?? null)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function set<K extends keyof ScoreRegras>(k: K, v: ScoreRegras[K]) {
    setRegras(r => r ? { ...r, [k]: v } : r)
  }

  function setTemp(k: keyof ScoreRegras['temperaturas'], v: number) {
    setRegras(r => r ? { ...r, temperaturas: { ...r.temperaturas, [k]: v } } : r)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      const r = await fetch('/api/configuracoes/score', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regras }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setRegras(d.config.regras)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function resetar() {
    if (!confirm('Restaurar regras padrão? As alterações atuais serão perdidas.')) return
    const r = await fetch('/api/configuracoes/score/resetar-padrao', { method: 'POST' })
    const d = await r.json()
    setRegras(d.config?.regras ?? null)
    setConfigId(d.config?.id ?? null)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  if (loading || !regras) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Target size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Score do Lead</p>
          <p className="text-xs text-muted-foreground">Configure os pesos e limiares para cálculo automático do score</p>
        </div>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Pontuações positivas</p>
        <div className="px-4 pb-2">
          <Row label="Renda mínima para bônus" description="Renda familiar acima deste valor">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              R$&nbsp;<input className={inputCls} type="number" value={regras.rendaMinima} onChange={e => set('rendaMinima', Number(e.target.value))} />
              &nbsp;→ <span className="text-emerald-400">+{regras.rendaPontosPositivos} pts</span>
            </div>
          </Row>
          <Row label="Entrada mínima para bônus" description="Valor de entrada acima deste valor">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              R$&nbsp;<input className={inputCls} type="number" value={regras.entradaMinima} onChange={e => set('entradaMinima', Number(e.target.value))} />
              &nbsp;→ <span className="text-emerald-400">+{regras.entradaPontosPositivos} pts</span>
            </div>
          </Row>
          <Row label="Bônus FGTS" description="Possui FGTS disponível">
            <span className="text-sm font-semibold text-emerald-400">+<input className={inputCls} type="number" value={regras.fgtsPontos} onChange={e => set('fgtsPontos', Number(e.target.value))} /> pts</span>
          </Row>
          <Row label="Bônus urgência (até 30 dias)" description="Intenção de compra imediata">
            <span className="text-sm font-semibold text-emerald-400">+<input className={inputCls} type="number" value={regras.urgenciaPontos} onChange={e => set('urgenciaPontos', Number(e.target.value))} /> pts</span>
          </Row>
          <Row label="Bônus empreendimento" description="Tem interesse em empreendimento específico">
            <span className="text-sm font-semibold text-emerald-400">+<input className={inputCls} type="number" value={regras.empreendimentoPontos} onChange={e => set('empreendimentoPontos', Number(e.target.value))} /> pts</span>
          </Row>
          <Row label="Bônus região de interesse" description="Região especificada">
            <span className="text-sm font-semibold text-emerald-400">+<input className={inputCls} type="number" value={regras.regiaoPontos} onChange={e => set('regiaoPontos', Number(e.target.value))} /> pts</span>
          </Row>
          <Row label="Bônus financiamento aprovado">
            <span className="text-sm font-semibold text-emerald-400">+<input className={inputCls} type="number" value={regras.financiamentoPontos} onChange={e => set('financiamentoPontos', Number(e.target.value))} /> pts</span>
          </Row>
        </div>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Penalidades</p>
        <div className="px-4 pb-2">
          <Row label="Renda baixa" description={`Renda abaixo de R$ ${regras.rendaBaixaLimite.toLocaleString('pt-BR')}`}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              R$&nbsp;<input className={inputCls} type="number" value={regras.rendaBaixaLimite} onChange={e => set('rendaBaixaLimite', Number(e.target.value))} />
              &nbsp;→ <span className="text-red-400">{regras.rendaBaixaPenalidade} pts</span>
            </div>
          </Row>
          <Row label="Sem previsão de compra">
            <span className="text-sm font-semibold text-red-400"><input className={inputCls} type="number" value={regras.semPrevisaoPenalidade} onChange={e => set('semPrevisaoPenalidade', Number(e.target.value))} /> pts</span>
          </Row>
          <Row label="Região não especificada">
            <span className="text-sm font-semibold text-red-400"><input className={inputCls} type="number" value={regras.regiaoVaziaPenalidade} onChange={e => set('regiaoVaziaPenalidade', Number(e.target.value))} /> pts</span>
          </Row>
        </div>
      </div>

      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Faixas de temperatura</p>
        <div className="px-4 pb-2">
          <Row label="Premium" description="Corretor Nível A">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-purple-400 font-semibold">≥</span>
              <input className={inputCls} type="number" value={regras.temperaturas.premium} onChange={e => setTemp('premium', Number(e.target.value))} />
              <span className="text-muted-foreground">pts</span>
            </div>
          </Row>
          <Row label="Quente" description="Corretor Nível A ou B">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-red-400 font-semibold">≥</span>
              <input className={inputCls} type="number" value={regras.temperaturas.quente} onChange={e => setTemp('quente', Number(e.target.value))} />
              <span className="text-muted-foreground">pts</span>
            </div>
          </Row>
          <Row label="Morno" description="Corretor Nível B ou C">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-amber-400 font-semibold">≥</span>
              <input className={inputCls} type="number" value={regras.temperaturas.morno} onChange={e => setTemp('morno', Number(e.target.value))} />
              <span className="text-muted-foreground">pts</span>
            </div>
          </Row>
          <Row label="Frio" description="Corretor Nível C ou D">
            <span className="text-xs text-muted-foreground">&lt; {regras.temperaturas.morno} pts</span>
          </Row>
        </div>
      </div>

      {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#6E0933', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" onClick={resetar} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
          <RotateCcw size={14} /> Restaurar padrão
        </button>
        {sucesso && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 size={14} /> Salvo</span>}
      </div>
      <p className="text-xs text-muted-foreground">Config ID: {configId ?? '—'}</p>
    </form>
  )
}
