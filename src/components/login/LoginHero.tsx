'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown } from 'lucide-react'

const RotatingEarth = dynamic(
  () => import('@/components/ui/wireframe-dotted-globe'),
  {
    ssr:     false,
    loading: () => <GlobePlaceholder />,
  },
)

function GlobePlaceholder({ size = 420 }: { size?: number }) {
  return (
    <div
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        border:         '1px solid rgba(110,9,51,0.18)',
        background:     'radial-gradient(circle at 40% 40%, rgba(110,9,51,0.07), rgba(26,30,35,0.4))',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        maxWidth:       '100%',
      }}
    />
  )
}

export function LoginHero() {
  const [visible,   setVisible]   = useState(false)
  const [globeSize, setGlobeSize] = useState<number | null>(null)

  useEffect(() => {
    // Determine globe size once on client
    setGlobeSize(window.innerWidth < 1024 ? 240 : 420)
    // Trigger fade-in animations
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  function scrollToForm() {
    document.getElementById('login-form-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fadeBase: React.CSSProperties = {
    transition: 'opacity 0.9s ease, transform 0.9s ease',
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(22px)',
  }

  return (
    <section
      className="relative min-h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse at 68% 48%, rgba(110,9,51,0.1) 0%, #1A1E23 58%), #1A1E23',
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2.5 px-6 sm:px-10 py-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #6E0933, #9B1245)' }}
        >
          Z
        </div>
        <span className="text-xl font-black tracking-[0.12em] text-white">ZELVO</span>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-20 py-10">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center w-full max-w-7xl mx-auto">

          {/* Left: copy */}
          <div style={fadeBase}>
            {/* Badge */}
            <div className="inline-flex items-center mb-7">
              <span
                className="text-[11px] font-bold tracking-[0.14em] uppercase px-3.5 py-1.5 rounded-full"
                style={{
                  background: 'rgba(110,9,51,0.15)',
                  border:     '1px solid rgba(110,9,51,0.32)',
                  color:      '#c0375a',
                }}
              >
                CRM Inteligente para Imobiliárias
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-black text-white leading-[1.08] tracking-tight mb-7">
              Leads{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #c0375a, #6E0933)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                qualificados
              </span>
              {'.'}&nbsp;Corretores{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #c0375a, #6E0933)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                certos
              </span>
              {'.'}&nbsp;Vendas mais{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #c0375a, #6E0933)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                rápidas
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-[540px]"
              style={{ color: '#9CA3AF' }}
            >
              O Zelvo pontua cada lead, distribui automaticamente para o corretor
              ideal e acompanha toda a jornada comercial em um funil inteligente.
            </p>

            {/* Mobile globe */}
            {globeSize && (
              <div className="flex justify-center mb-9 lg:hidden">
                <RotatingEarth size={globeSize} />
              </div>
            )}

            {/* CTA */}
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-[15px] transition-all"
              style={{
                background:  'linear-gradient(135deg, #6E0933, #9B1245)',
                boxShadow:   '0 0 28px rgba(110,9,51,0.38)',
                transform:   'translateY(0)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 44px rgba(110,9,51,0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 28px rgba(110,9,51,0.38)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Entrar no sistema
              <ChevronDown size={17} />
            </button>
          </div>

          {/* Right: globe — desktop only */}
          {globeSize && (
            <div
              className="hidden lg:flex items-center justify-center"
              style={{
                transition: 'opacity 1.3s ease 0.2s',
                opacity:    visible ? 1 : 0,
              }}
            >
              <RotatingEarth size={globeSize} />
            </div>
          )}
        </div>
      </div>

      {/* ── Scroll hint ── */}
      <div className="flex justify-center pb-8">
        <button
          onClick={scrollToForm}
          className="flex flex-col items-center gap-2 group"
          style={{
            opacity:    visible ? 1 : 0,
            transition: 'opacity 1s ease 0.6s',
          }}
        >
          <span
            className="text-[10px] tracking-[0.18em] uppercase"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Role para acessar sua conta
          </span>
          <ChevronDown
            size={15}
            style={{ color: 'rgba(110,9,51,0.5)' }}
            className="group-hover:translate-y-1 transition-transform duration-300"
          />
        </button>
      </div>
    </section>
  )
}
