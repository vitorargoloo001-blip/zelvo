'use client'

import { useEffect, useRef, useState } from 'react'

export default function RotatingEarth({ size = 460 }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let animId = 0
    let cancelled = false

    async function init() {
      try {
        const [d3, { feature }] = await Promise.all([
          import('d3'),
          import('topojson-client'),
        ])

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const worldRaw = require('world-atlas/land-110m.json')

        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return
        const ctx: CanvasRenderingContext2D = ctxRaw

        const DPR = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width  = size * DPR
        canvas.height = size * DPR
        canvas.style.width  = `${size}px`
        canvas.style.height = `${size}px`
        ctx.scale(DPR, DPR)

        const cx = size / 2
        const cy = size / 2
        const r  = size * 0.46

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const land = feature(worldRaw as any, worldRaw.objects.land as any)

        const projection = d3.geoOrthographic()
          .scale(r)
          .translate([cx, cy])
          .clipAngle(90)

        const path      = d3.geoPath().projection(projection).context(ctx)
        const graticule = d3.geoGraticule().step([30, 30])

        // Pre-compute which grid points fall on land (runs once)
        const STEP = 1.5
        const landPoints: [number, number][] = []
        for (let lat = -90; lat <= 90; lat += STEP) {
          for (let lon = -180; lon < 180; lon += STEP) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (d3.geoContains(land as any, [lon, lat])) {
              landPoints.push([lon, lat])
            }
          }
        }

        if (cancelled) return

        let lambda = 0

        function draw() {
          if (cancelled) return

          ctx.clearRect(0, 0, size, size)
          projection.rotate([lambda, -20, 0])
          const center: [number, number] = [-lambda, 20]

          // Black ocean fill
          ctx.beginPath()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path({ type: 'Sphere' } as any)
          ctx.fillStyle = '#000'
          ctx.fill()

          // Graticule grid lines
          ctx.beginPath()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path(graticule() as any)
          ctx.strokeStyle = 'rgba(255,255,255,0.09)'
          ctx.lineWidth = 0.5
          ctx.stroke()

          // Land dots — white, fade at edges
          for (const [lon, lat] of landPoints) {
            const dist = d3.geoDistance([lon, lat], center)
            if (dist >= Math.PI / 2) continue

            const pt = projection([lon, lat])
            if (!pt) continue

            const t     = 1 - dist / (Math.PI / 2) // 1 = center, 0 = horizon
            const alpha = 0.35 + t * 0.65
            const dotR  = 1.0 + t * 0.85

            ctx.beginPath()
            ctx.arc(pt[0], pt[1], dotR, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
            ctx.fill()
          }

          // Sphere outline ring
          ctx.beginPath()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          path({ type: 'Sphere' } as any)
          ctx.strokeStyle = 'rgba(255,255,255,0.75)'
          ctx.lineWidth   = 1.2
          ctx.stroke()

          lambda += 0.12
          animId  = requestAnimationFrame(draw)
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
          border:         '1px solid rgba(255,255,255,0.2)',
          background:     '#000',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          Visualização indisponível
        </span>
      </div>
    )
  }

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
