'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserCheck, Plus, Pencil, X, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Corretor } from '@/lib/types'

const inputCls = 'w-full bg-[#1F2329] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 transition-colors'
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1.5'

type Form = {
  nome: string; telefone: string; email: string; nivel: string
  capacidadeMaximaLeads: number; participaDistribuicao: boolean; observacoes: string
}
const formVazio: Form = { nome: '', telefone: '', email: '', nivel: 'C', capacidadeMaximaLeads: 15, participaDistribuicao: true, observacoes: '' }

const nivelCor: Record<string, string> = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' }

export function TabCorretores() {
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'criar' | { tipo: 'editar'; corretor: Corretor } | null>(null)
  const [form,       setForm]       = useState<Form>(formVazio)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const r = await fetch('/api/corretores').then(d => d.json())
    setCorretores(r.corretores ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirCriar() {
    setForm(formVazio)
    setErro(null)
    setModal('criar')
  }

  function abrirEditar(c: Corretor) {
    setForm({
      nome: c.nome, telefone: c.telefone, email: c.email, nivel: c.nivel,
      capacidadeMaximaLeads: c.capacidadeMaximaLeads, participaDistribuicao: c.participaDistribuicao,
      observacoes: c.observacoes ?? '',
    })
    setErro(null)
    setModal({ tipo: 'editar', corretor: c })
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const url = modal === 'criar' ? '/api/corretores' : `/api/corretores/${(modal as { corretor: Corretor }).corretor.id}`
      const method = modal === 'criar' ? 'POST' : 'PATCH'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro)
      await carregar()
      setModal(null)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function alterarStatus(c: Corretor, ativar: boolean) {
    await fetch(`/api/corretores/${c.id}/${ativar ? 'ativar' : 'inativar'}`, { method: 'POST' })
    await carregar()
  }

  async function alterarDistribuicao(c: Corretor) {
    await fetch(`/api/corretores/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participaDistribuicao: !c.participaDistribuicao }),
    })
    await carregar()
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  const ativos   = corretores.filter(c => c.ativo)
  const inativos = corretores.filter(c => !c.ativo)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
            <UserCheck size={16} style={{ color: '#6E0933' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Corretores</p>
            <p className="text-xs text-muted-foreground">{ativos.length} ativo{ativos.length !== 1 ? 's' : ''} · {inativos.length} inativo{inativos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={abrirCriar} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#6E0933' }}>
          <Plus size={13} /> Novo corretor
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border" style={{ background: '#1A1E23' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Nível</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Leads aberto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Distrib.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {corretores.map(c => (
              <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-black" style={{ background: `${nivelCor[c.nivel]}20`, color: nivelCor[c.nivel] }}>
                    {c.nivel}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs font-semibold ${c.leadsEmAberto >= c.capacidadeMaximaLeads ? 'text-red-400' : 'text-foreground'}`}>
                    {c.leadsEmAberto}/{c.capacidadeMaximaLeads}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <button onClick={() => alterarDistribuicao(c)} className="text-muted-foreground hover:text-foreground transition-colors" title={c.participaDistribuicao ? 'Remover da distribuição' : 'Incluir na distribuição'}>
                    {c.participaDistribuicao ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs ${c.ativo ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {c.ativo ? <CheckCircle2 size={11} /> : <X size={11} />}
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => abrirEditar(c)} className="p-1.5 rounded hover:bg-white/05 text-muted-foreground hover:text-foreground" title="Editar"><Pencil size={13} /></button>
                    <button
                      onClick={() => alterarStatus(c, !c.ativo)}
                      className={`p-1.5 rounded text-muted-foreground transition-colors ${c.ativo ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                      title={c.ativo ? 'Inativar' : 'Ativar'}
                    >
                      {c.ativo ? <UserCheck size={13} /> : <UserCheck size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border" style={{ background: '#1A1E23' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-foreground">{modal === 'criar' ? 'Novo corretor' : 'Editar corretor'}</p>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={salvar} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className={labelCls}>Nome *</label>
                <input className={inputCls} required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Telefone *</label>
                  <input className={inputCls} required value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Nível</label>
                  <select className={inputCls} value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}>
                    <option value="A">A — Sênior</option>
                    <option value="B">B — Pleno</option>
                    <option value="C">C — Júnior</option>
                    <option value="D">D — Trainee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Capacidade máxima de leads em aberto</label>
                <input className={inputCls} type="number" min={1} max={100} value={form.capacidadeMaximaLeads} onChange={e => setForm(f => ({ ...f, capacidadeMaximaLeads: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button type="button" onClick={() => setForm(f => ({ ...f, participaDistribuicao: !f.participaDistribuicao }))} className="transition-colors">
                    {form.participaDistribuicao ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                  </button>
                  <span className="text-sm text-foreground">Participa da distribuição automática</span>
                </label>
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <input className={inputCls} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Especialidade, região, etc." />
              </div>
              {erro && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{erro}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#6E0933', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
