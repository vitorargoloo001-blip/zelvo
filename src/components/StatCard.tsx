import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accent?: boolean
  alert?: boolean
}

export function StatCard({ title, value, subtitle, icon: Icon, accent, alert }: StatCardProps) {
  const iconBg = alert
    ? 'rgba(239,68,68,0.12)'
    : accent
    ? 'rgba(110,9,51,0.15)'
    : 'rgba(255,255,255,0.05)'

  const iconColor = alert ? '#EF4444' : accent ? '#6E0933' : '#4B5563'
  const valueColor = alert ? '#EF4444' : accent ? '#E6E4E1' : '#E6E4E1'

  return (
    <div
      className={cn(
        'group rounded-xl border p-5 transition-all duration-200 hover:border-white/15 cursor-default',
        alert ? 'border-red-500/20' : 'border-border'
      )}
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(110,9,51,0.18) 0%, rgba(110,9,51,0.06) 100%)'
          : alert
          ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(31,35,41,1) 80%)'
          : 'var(--card)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
            {title}
          </p>
          <p
            className="text-3xl font-black mt-2 leading-none"
            style={{ color: valueColor }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2 leading-tight">{subtitle}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3 transition-transform duration-200 group-hover:scale-110"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColor }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Bottom accent line */}
      {(accent || alert) && (
        <div
          className="mt-4 h-px w-full rounded-full"
          style={{
            background: accent
              ? 'linear-gradient(90deg, #6E0933 0%, transparent 100%)'
              : 'linear-gradient(90deg, #EF4444 0%, transparent 100%)',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
}
