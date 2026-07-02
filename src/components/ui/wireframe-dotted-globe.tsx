'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { feature } from 'topojson-client'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const worldRaw = require('world-atlas/land-110m.json')

let _landCache: [number, number][] | null = null

function getLandPoints(): [number, number][] {
  if (_landCache) return _landCache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const land = feature(worldRaw as any, worldRaw.objects.land as any)
  const pts: [number, number][] = []
  for (let lat = -90; lat <= 90; lat += 2.0) {
    for (let lon = -180; lon < 180; lon += 2.0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (d3.geoContains(land as any, [lon, lat])) pts.push([lon, lat])
    }
  }
  return (_landCache = pts)
}

// Pre-compute as soon as the module loads on the client so the cache is
// warm before the first useEffect fires — globe draws on the first frame.
if (typeof window !== 'undefined') getLandPoints()

export default function RotatingEarth({ size = 460 }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let animId = 0
    let cancelled = false
    let cleanup: (() => void) | null = null

    try {
      const pts     = getLandPoints()
      const canvasN = canvasRef.current
      if (!canvasN) return
      // Non-nullable alias so TypeScript trusts it inside closures
      const canvas: HTMLCanvasElement = canvasN
      const ctxRaw = canvas.getContext('2d')
      if (!ctxRaw) return
      const ctx: CanvasRenderingContext2D = ctxRaw

      const DPR = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = size * DPR
      canvas.height = size * DPR
      canvas.style.width  = `${size}px`
      canvas.style.height = `${size}px`
      ctx.scale(DPR, DPR)

      const projection = d3.geoOrthographic()
        .scale(size * 0.46).translate([size / 2, size / 2]).clipAngle(90)
      const path      = d3.geoPath().projection(projection).context(ctx)
      const graticule = d3.geoGraticule().step([30, 30])

      // Rotation state
      let lambda     = 0
      let phi        = -20
      let isDragging = false
      let lastX      = 0
      let lastY      = 0
      const SENS     = 0.35 // degrees per pixel

      // ── Mouse ──────────────────────────────────────────────────────────────
      function onMouseDown(e: MouseEvent) {
        isDragging = true
        lastX = e.clientX
        lastY = e.clientY
        canvas.style.cursor = 'grabbing'
      }

      function onMouseMove(e: MouseEvent) {
        if (!isDragging) return
        lambda += (e.clientX - lastX) * SENS
        phi    -= (e.clientY - lastY) * SENS
        phi     = Math.max(-90, Math.min(90, phi))
        lastX   = e.clientX
        lastY   = e.clientY
      }

      function onMouseUp() {
        isDragging = false
        canvas.style.cursor = 'grab'
      }

      // ── Touch ──────────────────────────────────────────────────────────────
      function onTouchStart(e: TouchEvent) {
        if (e.touches.length !== 1) return
        isDragging = true
        lastX = e.touches[0].clientX
        lastY = e.touches[0].clientY
      }

      function onTouchMove(e: TouchEvent) {
        if (!isDragging || e.touches.length !== 1) return
        e.preventDefault()
        lambda += (e.touches[0].clientX - lastX) * SENS
        phi    -= (e.touches[0].clientY - lastY) * SENS
        phi     = Math.max(-90, Math.min(90, phi))
        lastX   = e.touches[0].clientX
        lastY   = e.touches[0].clientY
      }

      function onTouchEnd() { isDragging = false }

      canvas.style.cursor = 'grab'
      canvas.addEventListener('mousedown',  onMouseDown)
      canvas.addEventListener('touchstart', onTouchStart, { passive: true })
      canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
      canvas.addEventListener('touchend',   onTouchEnd)
      window.addEventListener('mousemove',  onMouseMove)
      window.addEventListener('mouseup',    onMouseUp)

      cleanup = () => {
        canvas.removeEventListener('mousedown',  onMouseDown)
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove',  onTouchMove)
        canvas.removeEventListener('touchend',   onTouchEnd)
        window.removeEventListener('mousemove',  onMouseMove)
        window.removeEventListener('mouseup',    onMouseUp)
      }

      // ── Draw loop ──────────────────────────────────────────────────────────
      function draw() {
        if (cancelled) return

        // Auto-rotate only when not dragging
        if (!isDragging) lambda += 0.12

        projection.rotate([lambda, phi, 0])
        const center: [number, number] = [-lambda, -phi]

        ctx.clearRect(0, 0, size, size)

        // Ocean
        ctx.beginPath()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path({ type: 'Sphere' } as any)
        ctx.fillStyle = '#000'
        ctx.fill()

        // Graticule
        ctx.beginPath()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path(graticule() as any)
        ctx.strokeStyle = 'rgba(255,255,255,0.09)'
        ctx.lineWidth   = 0.5
        ctx.stroke()

        // Land dots
        for (const [lon, lat] of pts) {
          const dist = d3.geoDistance([lon, lat], center)
          if (dist >= Math.PI / 2) continue
          const pt = projection([lon, lat])
          if (!pt) continue
          const t     = 1 - dist / (Math.PI / 2)
          const alpha = 0.35 + t * 0.65
          const dotR  = 1.0 + t * 0.85
          ctx.beginPath()
          ctx.arc(pt[0], pt[1], dotR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
          ctx.fill()
        }

        // Outline
        ctx.beginPath()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path({ type: 'Sphere' } as any)
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'
        ctx.lineWidth   = 1.2
        ctx.stroke()

        animId = requestAnimationFrame(draw)
      }

      draw()
    } catch {
      if (!cancelled) setError(true)
    }

    return () => {
      cancelled = true
      if (animId) cancelAnimationFrame(animId)
      cleanup?.()
    }
  }, [size])

  if (error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.2)', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          Visualização indisponível
        </span>
      </div>
    )
  }

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
