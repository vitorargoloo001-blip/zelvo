'use client'

import { useState, useEffect } from 'react'
import { Filter, Save, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react'
import type { EtapaFunil } from '@/lib/types'

const inputCls = 'bg-[#1F2329] border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 transition-colors'

const CORES = ['#6B7280','#3B82F6','#8B5CF6','#F59E0B','#F97316','#EF4444','#10B981','#06B6D4','#EC4899']

export function TabFunil() {
  const [etapas,   setEtapas]   = useState<EtapaFunil[]>([])
  const [configId, setConfigId] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
  const [erro,     setErro]     = useState<string | null>(null)

  async function carregar() {
    const d = await fetch('/api/configuracoes/funil').then(r => r.json())
    setEtapas(d.config?.etapas ?? [])
    setConfigId(d.config?.id ?? null)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function update(idx: number, campo: keyof EtapaFunil, valor: unknown) {
    setEtapas(e => e.map((et, i) => i === idx ? { ...et, [campo]: valor } : et))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const r = await fetch('/api/configuracoes/funil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapas }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      setEtapas(d.config.etapas)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function resetar() {
    if (!confirm('Restaurar etapas padrão?')) return
    const r = await fetch('/api/configuracoes/funil/resetar-padrao', { method: 'POST' })
    const d = await r.json()
    setEtapas(d.config?.etapas ?? [])
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  return (
    <form onSubmit={salvar} className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Filter size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Etapas do funil</p>
          <p className="text-xs text-muted-foreground">Configure as etapas do funil de vendas</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border" style={{ background: '#1A1E23' }}>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground">Ordem</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground">Nome</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground">Cor</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground">Ativa</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground">Conversão</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground">Final</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground">Libera lead</th>
            </tr>
          </thead>
          <tbody>
            {etapas.sort((a, b) => a.ordem - b.ordem).map((et, idx) => (
              <tr key={et.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                <td className="px-3 py-2">
                  <input className={`${inputCls} w-12 text-center`} type="number" value={et.ordem} onChange={e => update(idx, 'ordem', Number(e.target.value))} />
                </td>
                <td className="px-3 py-2">
                  <input className={`${inputCls} w-40`} value={et.nome} onChange={e => update(idx, 'nome', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: et.cor }} />
                    <select className={`${inputCls} text-xs py-0.5`} value={et.cor} onChange={e => update(idx, 'cor', e.target.value)}>
                      {CORES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </td>
                {(['ativa', 'contaComoConversao', 'etapaFinal', 'liberaLeadAberto'] as (keyof EtapaFunil)[]).map(campo => (
                  <td key={campo} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={et[campo] as boolean}
                      onChange={e => update(idx, campo, e.target.checked)}
                      className="w-4 h-4 accent-[#6E0933] cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
    </form>
  )
}
