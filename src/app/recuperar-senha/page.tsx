'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { enviarEmailRecuperacao } from '@/services/authService'

export default function RecuperarSenhaPage() {
  const [email,      setEmail]      = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)
  const [enviado,    setEnviado]    = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const resultado = await enviarEmailRecuperacao(email.trim())

    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Erro ao enviar email. Tente novamente.')
      setCarregando(false)
      return
    }

    setEnviado(true)
    setCarregando(false)
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
            background:  '#1F2329',
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          {enviado ? (
            /* Estado: email enviado */
            <div className="text-center py-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.12)' }}
              >
                <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">
                Email enviado!
              </h2>
              <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
                Verifique sua caixa de entrada em{' '}
                <span className="font-medium text-white">{email}</span>{' '}
                e siga as instruções para redefinir sua senha.
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                style={{ color: '#6E0933' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#9a1040')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6E0933')}
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
            </div>
          ) : (
            /* Estado: formulário */
            <>
              <h1 className="text-lg font-semibold text-white mb-1">
                Recuperar senha
              </h1>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Informe seu email e enviaremos um link para redefinir a senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      background: '#272C33',
                      border:     '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                {erro && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                    <span style={{ color: '#FCA5A5' }}>{erro}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando || !email}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: carregando ? '#4a0622' : '#6E0933' }}
                  onMouseEnter={e => { if (!carregando) (e.currentTarget.style.background = '#8a0b3e') }}
                  onMouseLeave={e => { if (!carregando) (e.currentTarget.style.background = '#6E0933') }}
                >
                  {carregando && <Loader2 size={14} className="animate-spin" />}
                  {carregando ? 'Enviando…' : 'Enviar link de recuperação'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-xs transition-colors"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >
                  <ArrowLeft size={12} />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
          Zelvo CRM · Imobiliária
        </p>
      </div>
    </div>
  )
}
