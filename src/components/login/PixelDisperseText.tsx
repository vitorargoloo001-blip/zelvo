'use client'

import { useEffect, useRef } from 'react'

interface Dot {
  ox: number; oy: number
  x:  number; y:  number
  vx: number; vy: number
  c:  string
}

interface Props {
  repelRadius?:   number
  repelStrength?: number
  returnForce?:   number
  colorTitle?:    string
  colorSub?:      string
  accentColor?:   string
  accentChance?:  number
  shape?:         'circle' | 'square'
  globeSize:      number
  mouseRef:       React.MutableRefObject<{ x: number; y: number }>
}

// Rounded, modern font stack — no pixel/bitmap fonts
const FONT = `"Inter", "Manrope", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

export function PixelDisperseText({
  repelRadius   = 90,
  repelStrength = 4,
  returnForce   = 0.18,
  colorTitle    = '#F4F1ED',
  colorSub      = '#E6E4E1',
  accentColor   = '#6E0933',
  accentChance  = 0.06,
  shape         = 'circle',
  globeSize,
  mouseRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef   = useRef<Dot[]>([])
  const rafRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx: CanvasRenderingContext2D = ctxRaw

    // ── Responsive sizing from globeSize ──────────────────────────────────
    const isDesk = globeSize >= 460
    const isTab  = globeSize >= 360 && !isDesk

    const W        = isDesk ? 1000 : isTab ? 760  : 380
    const H        = isDesk ? 320  : isTab ? 260  : 190
    const fsTitle  = isDesk ? 130  : isTab ? 88   : 56
    const fsSub    = isDesk ? 32   : isTab ? 26   : 18
    const lineGap  = isDesk ? 28   : isTab ? 22   : 14
    const GAP      = 3
    const DOT      = isDesk ? 3.5  : 2.5
    const MAX_DISP = isDesk ? 45   : 25

    // Canvas offset relative to globeSize wrapper
    const offsetX = (globeSize - W) / 2
    const offsetY = (globeSize - H) / 2

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width        = W * DPR
    canvas.height       = H * DPR
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(DPR, DPR)

    // ── Offscreen canvas: render text and sample pixels ───────────────────
    const off  = document.createElement('canvas')
    off.width  = W
    off.height = H
    const oCtx = off.getContext('2d')!

    const totalH = fsTitle + lineGap + fsSub
    const yTop   = Math.round((H - totalH) / 2)

    oCtx.fillStyle    = '#fff'
    oCtx.textAlign    = 'center'
    oCtx.textBaseline = 'top'
    oCtx.font         = `900 ${fsTitle}px ${FONT}`
    oCtx.fillText('ZELVO', W / 2, yTop)

    oCtx.font = `700 ${fsSub}px ${FONT}`
    oCtx.fillText('O lead certo no corretor certo.', W / 2, yTop + fsTitle + lineGap)

    const { data }  = oCtx.getImageData(0, 0, W, H)
    const titleEndY = yTop + fsTitle + lineGap / 2

    const dots: Dot[] = []
    for (let y = 0; y < H; y += GAP) {
      for (let x = 0; x < W; x += GAP) {
        if (data[(y * W + x) * 4 + 3] > 60) {
          const isLine1  = y < titleEndY
          const isAccent = Math.random() < accentChance
          dots.push({
            ox: x, oy: y,
            x, y,
            vx: 0, vy: 0,
            c: isAccent ? accentColor : (isLine1 ? colorTitle : colorSub),
          })
        }
      }
    }
    dotsRef.current = dots

    // Dark band gradient — computed once
    const band = ctx.createLinearGradient(0, 0, W, 0)
    band.addColorStop(0,    'rgba(0,0,0,0)')
    band.addColorStop(0.04, 'rgba(0,0,0,0.78)')
    band.addColorStop(0.96, 'rgba(0,0,0,0.78)')
    band.addColorStop(1,    'rgba(0,0,0,0)')

    let cancelled = false

    function draw() {
      if (cancelled) return

      const mx = mouseRef.current.x - offsetX
      const my = mouseRef.current.y - offsetY

      ctx.clearRect(0, 0, W, H)

      // Dark band for contrast
      ctx.fillStyle = band
      ctx.fillRect(0, 0, W, H)

      // Ghost text: subtle solid layer so the word stays readable when particles disperse
      ctx.save()
      ctx.globalAlpha  = 0.12
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle    = '#F4F1ED'
      ctx.font         = `900 ${fsTitle}px ${FONT}`
      ctx.fillText('ZELVO', W / 2, yTop)
      ctx.fillStyle    = '#E6E4E1'
      ctx.font         = `700 ${fsSub}px ${FONT}`
      ctx.fillText('O lead certo no corretor certo.', W / 2, yTop + fsTitle + lineGap)
      ctx.restore()

      // ── Physics update (all dots) ───────────────────────────────────────
      for (const d of dotsRef.current) {
        const dx = d.x - mx
        const dy = d.y - my
        const d2 = dx * dx + dy * dy

        if (d2 < repelRadius * repelRadius && d2 > 0.01) {
          const dist = Math.sqrt(d2)
          const f    = ((repelRadius - dist) / repelRadius) ** 1.8 * repelStrength
          d.vx += (dx / dist) * f
          d.vy += (dy / dist) * f
        }

        d.vx += (d.ox - d.x) * returnForce
        d.vy += (d.oy - d.y) * returnForce
        d.vx *= 0.82
        d.vy *= 0.82
        d.x  += d.vx
        d.y  += d.vy

        // Clamp displacement from origin so word stays recognisable
        const dispX = d.x - d.ox
        const dispY = d.y - d.oy
        const mag   = Math.sqrt(dispX * dispX + dispY * dispY)
        if (mag > MAX_DISP) {
          const s = MAX_DISP / mag
          d.x  = d.ox + dispX * s
          d.y  = d.oy + dispY * s
          d.vx *= 0.5
          d.vy *= 0.5
        }
      }

      // ── Draw batched by color (one beginPath per color group) ───────────
      const groups = new Map<string, Dot[]>()
      for (const d of dotsRef.current) {
        let g = groups.get(d.c)
        if (!g) { g = []; groups.set(d.c, g) }
        g.push(d)
      }

      if (shape === 'circle') {
        for (const [color, grp] of groups) {
          ctx.fillStyle = color
          ctx.beginPath()
          for (const d of grp) {
            const cx = d.x + DOT / 2
            const cy = d.y + DOT / 2
            ctx.moveTo(cx + DOT / 2, cy)
            ctx.arc(cx, cy, DOT / 2, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      } else {
        for (const [color, grp] of groups) {
          ctx.fillStyle = color
          for (const d of grp) {
            ctx.fillRect(Math.round(d.x), Math.round(d.y), DOT, DOT)
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [globeSize, repelRadius, repelStrength, returnForce, colorTitle, colorSub, accentColor, accentChance, shape, mouseRef])

  return (
    <div aria-hidden="true">
      <span className="sr-only">ZELVO — O lead certo no corretor certo.</span>
      <canvas ref={canvasRef} style={{ display: 'block', pointerEvents: 'none' }} />
    </div>
  )
}
