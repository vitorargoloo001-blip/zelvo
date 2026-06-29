import type { NivelCorretor } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<NivelCorretor, { label: string; className: string }> = {
  A: {
    label: 'Nível A',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  },
  B: {
    label: 'Nível B',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  C: {
    label: 'Nível C',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  },
  D: {
    label: 'Nível D',
    className: 'bg-red-500/15 text-red-400 border border-red-500/20',
  },
}

interface BrokerLevelBadgeProps {
  nivel: NivelCorretor
}

export function BrokerLevelBadge({ nivel }: BrokerLevelBadgeProps) {
  const { label, className } = config[nivel]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold', className)}>
      {label}
    </span>
  )
}
