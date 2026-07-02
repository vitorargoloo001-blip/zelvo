'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Loader2, CheckCircle2 } from 'lucide-react'
import type { Empresa } from '@/lib/types'

const inputCls = 'w-full bg-[#1F2329] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 transition-colors'
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1.5'

export function TabEmpresa() {
  const [empresa, setEmpresa] = useState<Partial<Empresa>>({})
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso]   = useState(false)
  const [erro, setErro]         = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/configuracoes/empresa')
      .then(r => r.json())
      .then(d => { setEmpresa(d.empresa ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      const r = await fetch('/api/configuracoes/empresa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro ?? 'Erro ao salvar.')
      setEmpresa(d.empresa)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  function campo(k: keyof Empresa) {
    return {
      value: (empresa[k] as string) ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmpresa(prev => ({ ...prev, [k]: e.target.value })),
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8">
      <Loader2 size={16} className="animate-spin" /> Carregando…
    </div>
  )

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Building2 size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Dados da Empresa</p>
          <p className="text-xs text-muted-foreground">Informações exibidas no sistema e em documentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelCls}>Nome da empresa *</label>
          <input className={inputCls} required {...campo('nome')} />
        </div>
        <div>
          <label className={labelCls}>CNPJ</label>
          <input className={inputCls} placeholder="00.000.000/0001-00" {...campo('cnpj')} />
        </div>
        <div>
          <label className={labelCls}>Telefone</label>
          <input className={inputCls} placeholder="(11) 99999-9999" {...campo('telefone')} />
        </div>
        <div>
          <label className={labelCls}>Email principal</label>
          <input className={inputCls} type="email" placeholder="contato@empresa.com" {...campo('email')} />
        </div>
        <div>
          <label className={labelCls}>Site</label>
          <input className={inputCls} placeholder="https://empresa.com" {...campo('site')} />
        </div>
        <div>
          <label className={labelCls}>Cidade</label>
          <input className={inputCls} placeholder="São Paulo" {...campo('cidade')} />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <input className={inputCls} placeholder="SP" {...campo('estado')} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Segmento</label>
          <input className={inputCls} placeholder="Imobiliária, Incorporadora…" {...campo('segmento')} />
        </div>
      </div>

      {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#6E0933', opacity: salvando ? 0.6 : 1 }}
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
        {sucesso && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 size={14} /> Salvo com sucesso
          </span>
        )}
      </div>
    </form>
  )
}
