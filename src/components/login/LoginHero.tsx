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

function GlobePlaceholder() {
  return (
    <div
      style={{
        width:          500,
        height:         500,
        borderRadius:   '50%',
        border:         '1px solid rgba(110,9,51,0.18)',
        background:     'radial-gradient(circle at 40% 40%, rgba(110,9,51,0.07), rgba(26,30,35,0.4))',
        maxWidth:       '90vw',
        maxHeight:      '90vw',
      }}
    />
  )
}

export function LoginHero() {
  const [visible,   setVisible]   = useState(false)
  const [globeSize, setGlobeSize] = useState<number | null>(null)

  useEffect(() => {
    const size = Math.min(window.innerWidth * 0.72, 560)
    setGlobeSize(Math.round(size))
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  function scrollToForm() {
    document.getElementById('login-form-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#1A1E23' }}
    >
      {/* Globe */}
      {globeSize && (
        <div
          style={{
            opacity:    visible ? 1 : 0,
            transition: 'opacity 1.2s ease',
          }}
        >
          <RotatingEarth size={globeSize} />
        </div>
      )}

      {/* Scroll hint */}
      <div className="absolute bottom-8 flex justify-center w-full">
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
            Entrar no sistema
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
