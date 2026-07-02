'use client'

import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Play, Save, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { DistribuicaoRegras } from '@/lib/types'

type CorretorInfo = { id: string; nome: string; nivel: string; leadsEmAberto: number; capacidadeMaximaLeads: number }
type ApiData = {
  config: { id: string; regras: DistribuicaoRegras }
  disponiveis: CorretorInfo[]
  sobrecarregados: CorretorInfo[]
  foraDistribuicao: CorretorInfo[]
}

type SimResult = { corretorEscolhido: { nome: string; nivel: string; leadsEmAberto: number } | null; motivo: string; totalCandidatos: number }

const inputCls = 'bg-[#1F2329] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 w-24 text-right transition-colors'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}>
      {checked ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
    </button>
  )
}

export function TabDistribuicao() {
  const [data,     setData]     = useState<ApiData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
  const [erro,     setErro]     = useState<string | null>(null)
  const [simTemp,  setSimTemp]  = useState('Quente')
  const [simRes,   setSimRes]   = useState<SimResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  const carregar = useCallback(async () => {
    const d = await fetch('/api/configuracoes/distribuicao').then(r => r.json())
    setData(d)
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function setRegra<K extends keyof DistribuicaoRegras>(k: K, v: DistribuicaoRegras[K]) {
    setData(d => d ? { ...d, config: { ...d.config, regras: { ...d.config.regras, [k]: v } } } : d)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSalvando(true)
    setErro(null)
    try {
      const r = await fetch('/api/configuracoes/distribuicao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regras: data.config.regras }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      await carregar()
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function simular() {
    setSimLoading(true)
    setSimRes(null)
    try {
      const r = await fetch('/api/configuracoes/distribuicao/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperatura: simTemp }),
      })
      const d = await r.json()
      setSimRes(d)
    } finally {
      setSimLoading(false)
    }
  }

  if (loading || !data) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  const regras = data.config.regras

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <GitBranch size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Distribuição automática</p>
          <p className="text-xs text-muted-foreground">Regras de roteamento de leads para corretores</p>
        </div>
      </div>

      {/* Status atual */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Disponíveis', count: data.disponiveis.length, cor: '#10B981' },
          { label: 'Sobrecarregados', count: data.sobrecarregados.length, cor: '#F59E0B' },
          { label: 'Fora da distribuição', count: data.foraDistribuicao.length, cor: '#6B7280' },
        ].map(({ label, count, cor }) => (
          <div key={label} className="rounded-xl border border-border p-3 text-center" style={{ background: '#1F2329' }}>
            <p className="text-2xl font-black" style={{ color: cor }}>{count}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Regras de nível por temperatura */}
      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Roteamento por temperatura</p>
        <div className="px-4 pb-4 space-y-2">
          {['Premium', 'Quente', 'Morno', 'Frio'].map(temp => (
            <div key={temp} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm font-medium text-foreground">{temp}</span>
              <div className="flex gap-1">
                {['A', 'B', 'C', 'D'].map(n => {
                  const ativos = (regras.nivelPorTemperatura?.[temp] ?? []) as string[]
                  const marcado = ativos.includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        const lista = [...ativos]
                        marcado ? lista.splice(lista.indexOf(n), 1) : lista.push(n)
                        setRegra('nivelPorTemperatura', { ...regras.nivelPorTemperatura, [temp]: lista })
                      }}
                      className="w-7 h-7 rounded text-xs font-black transition-all border"
                      style={{
                        background: marcado ? 'rgba(110,9,51,0.2)' : 'rgba(255,255,255,0.04)',
                        borderColor: marcado ? '#6E0933' : 'rgba(255,255,255,0.1)',
                        color: marcado ? '#E6E4E1' : '#6B7280',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critérios */}
      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Critérios de seleção</p>
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Capacidade máxima padrão (leads)</span>
            <input className={inputCls} type="number" min={1} value={regras.capacidadeMaximaPadrao} onChange={e => setRegra('capacidadeMaximaPadrao', Number(e.target.value))} />
          </div>
          {[
            { k: 'considerarMaiorScore' as keyof DistribuicaoRegras, label: 'Priorizar maior score do corretor' },
            { k: 'considerarMenorLeadsAberto' as keyof DistribuicaoRegras, label: 'Priorizar corretor com menor carga' },
            { k: 'considerarMaiorConversao' as keyof DistribuicaoRegras, label: 'Priorizar maior taxa de conversão' },
            { k: 'considerarMenorTempoAtendimento' as keyof DistribuicaoRegras, label: 'Priorizar menor tempo de atendimento' },
            { k: 'permitirFallback' as keyof DistribuicaoRegras, label: 'Fallback se todos sobrecarregados' },
            { k: 'permitirDistribuicaoManual' as keyof DistribuicaoRegras, label: 'Permitir distribuição manual' },
          ].map(({ k, label }) => (
            <div key={String(k)} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <Toggle checked={regras[k] as boolean} onChange={() => setRegra(k, !(regras[k] as boolean))} />
            </div>
          ))}
        </div>
      </div>

      {/* Simulação */}
      <div className="rounded-xl border border-amber-500/20 p-4 space-y-3" style={{ background: 'rgba(245,158,11,0.04)' }}>
        <p className="text-xs font-semibold text-amber-400">Simular distribuição</p>
        <div className="flex items-center gap-3">
          <select className="bg-[#1F2329] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground flex-1" value={simTemp} onChange={e => setSimTemp(e.target.value)}>
            {['Premium', 'Quente', 'Morno', 'Frio'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button type="button" onClick={simular} disabled={simLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap" style={{ background: '#6E0933', opacity: simLoading ? 0.6 : 1 }}>
            {simLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Testar
          </button>
        </div>
        {simRes && (
          <div className="rounded-lg bg-white/[0.03] border border-border p-3">
            <p className="text-xs font-semibold text-foreground mb-1">
              {simRes.corretorEscolhido
                ? `→ ${simRes.corretorEscolhido.nome} (Nível ${simRes.corretorEscolhido.nivel} · ${simRes.corretorEscolhido.leadsEmAberto} leads abertos)`
                : '→ Nenhum corretor disponível'}
            </p>
            <p className="text-[11px] text-muted-foreground">{simRes.motivo}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{simRes.totalCandidatos} corretor(es) na distribuição</p>
          </div>
        )}
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
