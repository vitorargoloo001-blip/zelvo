'use client'

import { useEffect, useRef, useState } from 'react'

export default function RotatingEarth({ size = 460 }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error,   setError] = useState(false)

  useEffect(() => {
    let animId = 0
    let cancelled = false

    async function init() {
      try {
        const d3 = await import('d3')
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return
        // Alias so TypeScript recognises it as non-null inside draw() closure
        const ctx: CanvasRenderingContext2D = ctxRaw

        const DPR = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width  = size * DPR
        canvas.height = size * DPR
        canvas.style.width  = `${size}px`
        canvas.style.height = `${size}px`
        ctx.scale(DPR, DPR)

        const cx = size / 2
        const cy = size / 2
        const r  = size * 0.43

        const projection = d3.geoOrthographic()
          .scale(r)
          .translate([cx, cy])
          .clipAngle(90)

        const path      = d3.geoPath().projection(projection).context(ctx)
        const graticule = d3.geoGraticule().step([30, 30])

        let lambda = 0

        function draw() {
          if (cancelled) return

          ctx.clearRect(0, 0, size, size)
          projection.rotate([lambda, -22, 0])
          const center: [number, number] = [-lambda, 22]

          // Radial glow behind the globe
          const grd = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.3)
          grd.addColorStop(0, 'rgba(110,9,51,0.09)')
          grd.addColorStop(1, 'rgba(110,9,51,0)')
          ctx.beginPath()
          ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()

          // Graticule lines (latitude / longitude grid)
          ctx.beginPath()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path(graticule() as any)
          ctx.strokeStyle = 'rgba(110,9,51,0.1)'
          ctx.lineWidth   = 0.4
          ctx.stroke()

          // Dots at lat/lon grid
          const STEP = 7
          for (let lat = -84; lat <= 84; lat += STEP) {
            for (let lon = -180; lon < 180; lon += STEP) {
              const dist = d3.geoDistance([lon, lat], center)
              if (dist >= Math.PI / 2) continue // back-facing — skip

              const pt = projection([lon, lat])
              if (!pt) continue

              // Dots fade out at the horizon, brighten at center
              const t     = 1 - dist / (Math.PI / 2)      // 1 = center, 0 = edge
              const alpha = 0.06 + Math.pow(t, 0.7) * 0.74
              const dotR  = 0.65 + t * 1.15

              ctx.beginPath()
              ctx.arc(pt[0], pt[1], dotR, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(110,9,51,${alpha.toFixed(3)})`
              ctx.fill()
            }
          }

          // Sphere outline
          ctx.beginPath()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path({ type: 'Sphere' } as any)
          ctx.strokeStyle = 'rgba(110,9,51,0.22)'
          ctx.lineWidth   = 0.9
          ctx.stroke()

          lambda  += 0.13
          animId   = requestAnimationFrame(draw)
        }

        draw()
      } catch {
        if (!cancelled) setError(true)
      }
    }

    init()
    return () => {
      cancelled = true
      if (animId) cancelAnimationFrame(animId)
    }
  }, [size])

  if (error) {
    return (
      <div
        style={{
          width:          size,
          height:         size,
          borderRadius:   '50%',
          border:         '1px solid rgba(110,9,51,0.2)',
          background:     'rgba(110,9,51,0.04)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'rgba(110,9,51,0.45)', fontSize: 11 }}>
          Visualização indisponível
        </span>
      </div>
    )
  }

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
