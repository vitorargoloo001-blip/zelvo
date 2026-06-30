'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { loginComEmailSenha, redirecionarPorPerfil } from '@/services/authService'
import { useZelvoStore } from '@/stores/zelvoStore'

export default function LoginPage() {
  const router = useRouter()
  const setUsuarioAtual = useZelvoStore(s => s.setUsuarioAtual)
  const setSessao       = useZelvoStore(s => s.setSessao)

  const [email,       setEmail]       = useState('')
  const [senha,       setSenha]       = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando,  setCarregando]  = useState(false)
  const [erro,        setErro]        = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const resultado = await loginComEmailSenha(email.trim(), senha)

    if ('erro' in resultado) {
      setErro(resultado.erro)
      setCarregando(false)
      return
    }

    setUsuarioAtual(resultado.usuario)
    setSessao(resultado.sessao)

    router.replace(redirecionarPorPerfil(resultado.usuario))
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#1A1E23' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white"
              style={{ background: '#6E0933' }}
            >
              Z
            </div>
            <span className="text-2xl font-black tracking-tight text-white">ZELVO</span>
          </div>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Sistema de Gestão de Leads
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background:   '#1F2329',
            borderColor:  'rgba(255,255,255,0.07)',
          }}
        >
          <h1 className="text-lg font-semibold text-white mb-6">
            Entrar na sua conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                disabled={carregando}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all disabled:opacity-50"
                style={{
                  background:  '#272C33',
                  border:      '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={carregando}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all disabled:opacity-50"
                  style={{
                    background: '#272C33',
                    border:     '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                  style={{ color: '#6B7280' }}
                >
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                <span style={{ color: '#FCA5A5' }}>{erro}</span>
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: carregando ? '#4a0622' : '#6E0933' }}
              onMouseEnter={e => { if (!carregando) (e.currentTarget.style.background = '#8a0b3e') }}
              onMouseLeave={e => { if (!carregando) (e.currentTarget.style.background = '#6E0933') }}
            >
              {carregando && <Loader2 size={14} className="animate-spin" />}
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Link recuperar senha */}
          <div className="mt-4 text-center">
            <Link
              href="/recuperar-senha"
              className="text-xs transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
          Zelvo CRM · Imobiliária
        </p>
      </div>
    </div>
  )
}
