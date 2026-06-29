import type { TemperaturaLead } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<TemperaturaLead, { label: string; className: string }> = {
  Premium: {
    label: 'Premium',
    className: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  },
  Quente: {
    label: 'Quente',
    className: 'bg-red-500/15 text-red-400 border border-red-500/20',
  },
  Morno: {
    label: 'Morno',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  },
  Frio: {
    label: 'Frio',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
}

interface LeadTemperatureBadgeProps {
  temperatura: TemperaturaLead
}

export function LeadTemperatureBadge({ temperatura }: LeadTemperatureBadgeProps) {
  const { label, className } = config[temperatura]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold', className)}>
      {label}
    </span>
  )
}
