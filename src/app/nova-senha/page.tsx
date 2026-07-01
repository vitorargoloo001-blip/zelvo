'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

function NovaSenhaForm() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const token         = searchParams.get('token') ?? ''

  const [novaSenha,    setNovaSenha]    = useState('')
  const [confirmar,    setConfirmar]    = useState('')
  const [mostrar,      setMostrar]      = useState(false)
  const [carregando,   setCarregando]   = useState(false)
  const [erro,         setErro]         = useState<string | null>(null)
  const [concluido,    setConcluido]    = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (novaSenha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    try {
      const res = await fetch('/api/auth/nova-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.erro ?? 'Erro ao redefinir senha.')
        return
      }
      setConcluido(true)
      setTimeout(() => router.replace('/login'), 2500)
    } finally {
      setCarregando(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm" style={{ color: '#EF4444' }}>Link inválido. Solicite um novo link de recuperação.</p>
        <Link href="/recuperar-senha" className="mt-4 block text-xs underline" style={{ color: '#6B7280' }}>Recuperar senha</Link>
      </div>
    )
  }

  if (concluido) {
    return (
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)' }}>
          <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
        </div>
        <h2 className="text-base font-semibold text-white mb-2">Senha redefinida!</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Redirecionando para o login…</p>
      </div>
    )
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all disabled:opacity-50'
  const inputStyle = { background: '#272C33', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <>
      <h1 className="text-lg font-semibold text-white mb-1">Nova senha</h1>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Digite e confirme sua nova senha.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Nova senha</label>
          <div className="relative">
            <input
              type={mostrar ? 'text' : 'password'}
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              disabled={carregando}
              className={inputCls + ' pr-10'}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button type="button" tabIndex={-1} onClick={() => setMostrar(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5" style={{ color: '#6B7280' }}>
              {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Confirmar senha</label>
          <input
            type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            required
            placeholder="••••••••"
            disabled={carregando}
            className={inputCls}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
            <span style={{ color: '#FCA5A5' }}>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={carregando || !novaSenha || !confirmar}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: carregando ? '#4a0622' : '#6E0933' }}
          onMouseEnter={e => { if (!carregando) (e.currentTarget.style.background = '#8a0b3e') }}
          onMouseLeave={e => { if (!carregando) (e.currentTarget.style.background = '#6E0933') }}
        >
          {carregando && <Loader2 size={14} className="animate-spin" />}
          {carregando ? 'Salvando…' : 'Redefinir senha'}
        </button>
      </form>
    </>
  )
}

export default function NovaSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1A1E23' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white" style={{ background: '#6E0933' }}>Z</div>
            <span className="text-2xl font-black tracking-tight text-white">ZELVO</span>
          </div>
          <p className="text-sm" style={{ color: '#6B7280' }}>Sistema de Gestão de Leads</p>
        </div>
        <div className="rounded-2xl border p-6" style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)' }}>
          <Suspense fallback={<div className="text-sm text-center" style={{ color: '#6B7280' }}>Carregando…</div>}>
            <NovaSenhaForm />
          </Suspense>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>Zelvo CRM · Imobiliária</p>
      </div>
    </div>
  )
}
