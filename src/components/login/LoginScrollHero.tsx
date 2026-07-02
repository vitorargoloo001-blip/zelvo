'use client'

import { useRef, useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { loginComEmailSenha, redirecionarPorPerfil } from '@/services/authService'
import { useZelvoStore }       from '@/stores/zelvoStore'
import { OrbitText } from '@/components/login/OrbitText'
import RotatingEarth from '@/components/ui/wireframe-dotted-globe'

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginScrollHero() {
  const router          = useRouter()
  const setUsuarioAtual = useZelvoStore(s => s.setUsuarioAtual)
  const setSessao       = useZelvoStore(s => s.setSessao)

  // form
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando,   setCarregando]   = useState(false)
  const [erro,         setErro]         = useState<string | null>(null)

  // globe size — default 460 renders immediately, corrected after mount
  const [globeSize, setGlobeSize] = useState(460)
  useEffect(() => {
    setGlobeSize(Math.min(Math.round(window.innerWidth * 0.62), 520))
  }, [])

  // card interactive state (pointer-events switch)
  const [cardInteractive, setCardInteractive] = useState(false)

  // ── scroll setup ──────────────────────────────────────────────────────────
  //
  // body has "h-full flex" which breaks document scroll.
  // Solution: own scroll container (scrollRef) with overflow-y: auto,
  // and track progress through containerRef inside it.
  //
  const scrollRef       = useRef<HTMLDivElement>(null)
  const containerRef    = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target:    containerRef,
    container: scrollRef,
    offset:    ['start start', 'end end'],
  })

  // spring smoothing
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 25 })

  // globe
  const globeScale   = useTransform(smooth, [0, 0.7],        [1,    2.6])
  const globeOpacity = useTransform(smooth, [0, 0.55, 0.75], [1, 0.18, 0])
  const globeY       = useTransform(smooth, [0, 0.7],        [0,   -100])

  // dark overlay
  const overlayOpacity = useTransform(smooth, [0.1, 0.55], [0, 0.72])

  // login card
  const cardOpacity = useTransform(smooth, [0.42, 0.72], [0, 1])
  const cardY       = useTransform(smooth, [0.42, 0.72], [60, 0])
  const cardScale   = useTransform(smooth, [0.42, 0.72], [0.94, 1])

  // keep pointer-events in sync with card opacity
  useEffect(() => {
    return cardOpacity.on('change', v => setCardInteractive(v > 0.4))
  }, [cardOpacity])

  // ── auth ──────────────────────────────────────────────────────────────────

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

  const inputBase: React.CSSProperties = {
    background: '#272C33',
    border:     '1px solid rgba(255,255,255,0.08)',
  }

  return (
    // Scroll container — 100vw × 100vh, scrollable internally.
    // This bypasses the broken document scroll caused by body's h-full flex.
    <div
      ref={scrollRef}
      style={{
        width:     '100vw',
        height:    '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background:'#000',
      }}
    >
      {/* Tall div — creates 220vh of scroll space */}
      <div ref={containerRef} style={{ minHeight: '220vh', position: 'relative' }}>

        {/* Sticky viewport — stays fixed while parent scrolls */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          {/* Vinho glow */}
          <div style={{
            position:     'absolute',
            inset:        0,
            background:   'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(110,9,51,0.13) 0%, transparent 70%)',
            pointerEvents:'none',
          }} />

          {/* Dark overlay (grows with scroll) */}
          <motion.div style={{
            position:     'absolute',
            inset:        0,
            background:   '#000',
            opacity:      overlayOpacity,
            pointerEvents:'none',
            zIndex:       2,
          }} />

          {/* Globe + orbit text */}
          <motion.div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            scale:          globeScale,
            opacity:        globeOpacity,
            y:              globeY,
            zIndex:         1,
          }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <RotatingEarth size={globeSize} />
              <OrbitText globeSize={globeSize} duration={18} />
            </div>
          </motion.div>

          {/* Login card (appears on scroll) */}
          <motion.div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 16px',
            zIndex:         10,
            opacity:        cardOpacity,
            y:              cardY,
            scale:          cardScale,
            pointerEvents:  cardInteractive ? 'auto' : 'none',
          }}>
            <div style={{ width:'100%', maxWidth:400 }}>

              {/* Card header */}
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:'linear-gradient(135deg, #6E0933, #9B1245)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:900, fontSize:17, color:'#fff',
                  }}>Z</div>
                  <span style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.02em', color:'#fff' }}>ZELVO</span>
                </div>
                <h2 style={{ fontSize:15, fontWeight:700, color:'#E6E4E1', marginBottom:6 }}>
                  Entrar na sua conta
                </h2>
                <p style={{ fontSize:12, color:'#6B7280', lineHeight:1.5 }}>
                  Acesse o painel para gerenciar leads, corretores e distribuições.
                </p>
              </div>

              {/* Card body */}
              <div style={{
                background:     'rgba(26,30,35,0.88)',
                backdropFilter: 'blur(16px)',
                border:         '1px solid #2D2D2D',
                borderRadius:   18,
                padding:        24,
                boxShadow:      '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
              }}>
                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                  {/* Email */}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:500, color:'#9CA3AF', marginBottom:6 }}>
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
                      style={{
                        ...inputBase,
                        width:'100%', padding:'10px 12px', borderRadius:8,
                        fontSize:13, color:'#E6E4E1', outline:'none',
                        boxSizing:'border-box', opacity:carregando ? 0.5 : 1,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>

                  {/* Senha */}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:500, color:'#9CA3AF', marginBottom:6 }}>
                      Senha
                    </label>
                    <div style={{ position:'relative' }}>
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        disabled={carregando}
                        style={{
                          ...inputBase,
                          width:'100%', padding:'10px 40px 10px 12px', borderRadius:8,
                          fontSize:13, color:'#E6E4E1', outline:'none',
                          boxSizing:'border-box', opacity:carregando ? 0.5 : 1,
                        }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(110,9,51,0.6)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setMostrarSenha(v => !v)}
                        style={{
                          position:'absolute', right:12, top:'50%',
                          transform:'translateY(-50%)',
                          background:'none', border:'none', padding:0,
                          cursor:'pointer', color:'#6B7280', display:'flex',
                        }}
                      >
                        {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Erro */}
                  {erro && (
                    <div style={{
                      display:'flex', alignItems:'flex-start', gap:8,
                      padding:'10px 12px', borderRadius:8,
                      background:'rgba(239,68,68,0.08)',
                      border:'1px solid rgba(239,68,68,0.2)', fontSize:13,
                    }}>
                      <AlertCircle size={14} style={{ color:'#EF4444', flexShrink:0, marginTop:1 }} />
                      <span style={{ color:'#FCA5A5' }}>{erro}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={carregando || !email || !senha}
                    style={{
                      width:'100%', padding:'11px 0', borderRadius:8,
                      background:carregando ? '#4a0622' : '#6E0933',
                      border:'none', color:'#fff', fontSize:13, fontWeight:600,
                      cursor: carregando || !email || !senha ? 'not-allowed' : 'pointer',
                      opacity: carregando || !email || !senha ? 0.5 : 1,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      gap:8, transition:'background 0.2s',
                    }}
                    onMouseEnter={e => { if (!carregando) e.currentTarget.style.background = '#8a0b3e' }}
                    onMouseLeave={e => { if (!carregando) e.currentTarget.style.background = '#6E0933' }}
                  >
                    {carregando && <Loader2 size={14} className="animate-spin" />}
                    {carregando ? 'Entrando…' : 'Entrar'}
                  </button>
                </form>

                <div style={{ marginTop:14, textAlign:'center' }}>
                  <Link
                    href="/recuperar-senha"
                    style={{ fontSize:12, color:'#6B7280', textDecoration:'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

        </div>{/* end sticky */}
      </div>{/* end containerRef */}
    </div>   /* end scrollRef */
  )
}
