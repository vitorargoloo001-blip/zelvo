'use client'

interface Props {
  text?:     string
  duration?: number
  radius?:   number
  opacity?:  number
  globeSize: number
}

export function OrbitText({
  text     = 'ZELVO — o lead certo no corretor certo.',
  duration = 18,
  radius,
  opacity  = 0.70,
  globeSize,
}: Props) {
  const cx = globeSize / 2
  const cy = globeSize / 2
  const r  = radius ?? Math.round(globeSize * 0.49)
  const fs = Math.max(10, Math.round(globeSize * 0.029))

  // Repeat enough times to fill the orbit circumference (≈ 2πr)
  const fullText = (text + '   ✦   ').repeat(5)

  // Full circle starting at 12 o'clock, going clockwise
  const pathD = `M ${cx},${cy - r} a ${r},${r} 0 1,1 0,${r * 2} a ${r},${r} 0 1,1 0,-${r * 2}`

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${globeSize} ${globeSize}`}
      style={{
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        overflow:      'visible',
      }}
    >
      <defs>
        <path id="zelvo-orbit-path" d={pathD} fill="none" />
        <filter id="zelvo-orbit-glow" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        @keyframes zelvo-orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .zelvo-orbit-ring {
          transform-box: view-box;
          transform-origin: 50% 50%;
          animation: zelvo-orbit-spin ${duration}s linear infinite;
        }
      `}</style>

      <g className="zelvo-orbit-ring" opacity={opacity}>
        <text
          style={{
            fontFamily:    '"Inter", "Manrope", system-ui, -apple-system, sans-serif',
            fontSize:      fs,
            fill:          '#E6E4E1',
            letterSpacing: '0.08em',
            fontWeight:    300,
          }}
          filter="url(#zelvo-orbit-glow)"
        >
          <textPath href="#zelvo-orbit-path">
            {fullText}
          </textPath>
        </text>
      </g>
    </svg>
  )
}
