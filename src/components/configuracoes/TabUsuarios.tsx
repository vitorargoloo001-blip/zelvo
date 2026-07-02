'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Pencil, X, CheckCircle2, Loader2, KeyRound, UserX, UserCheck } from 'lucide-react'
import type { UsuarioCompleto, Corretor } from '@/lib/types'

const inputCls = 'w-full bg-[#1F2329] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#6E0933]/60 transition-colors'
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1.5'

type Form = { nome: string; email: string; senha: string; perfil: string; corretorId: string }
const formVazio: Form = { nome: '', email: '', senha: '', perfil: 'corretor', corretorId: '' }

export function TabUsuarios() {
  const [usuarios,   setUsuarios]   = useState<UsuarioCompleto[]>([])
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'criar' | { tipo: 'editar'; usuario: UsuarioCompleto } | null>(null)
  const [form,       setForm]       = useState<Form>(formVazio)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)
  const [linkAcesso, setLinkAcesso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const [u, c] = await Promise.all([
      fetch('/api/usuarios').then(r => r.json()),
      fetch('/api/corretores').then(r => r.json()),
    ])
    setUsuarios(u.usuarios ?? [])
    setCorretores(c.corretores ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirCriar() {
    setForm(formVazio)
    setErro(null)
    setLinkAcesso(null)
    setModal('criar')
  }

  function abrirEditar(u: UsuarioCompleto) {
    setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil, corretorId: u.corretorId ?? '' })
    setErro(null)
    setLinkAcesso(null)
    setModal({ tipo: 'editar', usuario: u })
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      if (modal === 'criar') {
        const r = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.erro)
        await carregar()
        setModal(null)
      } else if (modal && typeof modal === 'object') {
        const payload: Record<string, string> = { nome: form.nome, email: form.email, perfil: form.perfil, corretorId: form.corretorId }
        if (form.senha) payload.senha = form.senha
        const r = await fetch(`/api/usuarios/${modal.usuario.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.erro)
        await carregar()
        setModal(null)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function desativar(id: string) {
    if (!confirm('Desativar este usuário?')) return
    await fetch(`/api/usuarios/${id}/desativar`, { method: 'POST' })
    await carregar()
  }

  async function gerarLink(id: string) {
    const r = await fetch(`/api/usuarios/${id}/reenviar-acesso`, { method: 'POST' })
    const d = await r.json()
    if (d.link) setLinkAcesso(d.link)
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
            <Users size={16} style={{ color: '#6E0933' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Usuários do sistema</p>
            <p className="text-xs text-muted-foreground">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={abrirCriar} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#6E0933' }}>
          <Plus size={13} /> Novo usuário
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border" style={{ background: '#1A1E23' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Perfil</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Corretor vinculado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${u.perfil === 'gerente' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {u.perfil}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{u.corretorNome ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs ${u.ativo ? 'text-emerald-400' : 'text-red-400'}`}>
                    {u.ativo ? <CheckCircle2 size={11} /> : <X size={11} />}
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => abrirEditar(u)} className="p-1.5 rounded hover:bg-white/05 text-muted-foreground hover:text-foreground" title="Editar"><Pencil size={13} /></button>
                    <button onClick={() => gerarLink(u.id)} className="p-1.5 rounded hover:bg-white/05 text-muted-foreground hover:text-foreground" title="Gerar link de acesso"><KeyRound size={13} /></button>
                    {u.ativo
                      ? <button onClick={() => desativar(u.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Desativar"><UserX size={13} /></button>
                      : <button onClick={async () => { await fetch(`/api/usuarios/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: true }) }); await carregar() }} className="p-1.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400" title="Ativar"><UserCheck size={13} /></button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {linkAcesso && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/05 p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-400">Link de acesso gerado (válido por 24h)</p>
          <p className="text-xs text-muted-foreground break-all font-mono">{linkAcesso}</p>
          <button onClick={() => { navigator.clipboard.writeText(linkAcesso); setLinkAcesso(null) }} className="text-xs text-amber-400 hover:text-amber-300 underline">Copiar e fechar</button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border" style={{ background: '#1A1E23' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-foreground">{modal === 'criar' ? 'Novo usuário' : 'Editar usuário'}</p>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={salvar} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nome *</label>
                <input className={inputCls} required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>{modal === 'criar' ? 'Senha *' : 'Nova senha (deixe vazio para não alterar)'}</label>
                <input className={inputCls} type="password" required={modal === 'criar'} minLength={6} value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Perfil *</label>
                <select className={inputCls} value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                  <option value="corretor">Corretor</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Corretor vinculado</label>
                <select className={inputCls} value={form.corretorId} onChange={e => setForm(f => ({ ...f, corretorId: e.target.value }))}>
                  <option value="">— Nenhum —</option>
                  {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {erro && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{erro}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: '#6E0933', opacity: salvando ? 0.6 : 1 }}>
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
