import type { Corretor } from '@/lib/types'
import { BrokerLevelBadge } from './BrokerLevelBadge'
import { Trophy } from 'lucide-react'

interface BrokerRankingProps {
  corretores: Corretor[]
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export function BrokerRanking({ corretores }: BrokerRankingProps) {
  const sorted = [...corretores]
    .filter((c) => c.ativo)
    .sort((a, b) => b.scoreCorretor - a.scoreCorretor)

  return (
    <div className="space-y-2">
      {sorted.map((corretor, index) => (
        <div
          key={corretor.id}
          className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-white/10 transition-colors"
          style={{ background: index === 0 ? 'rgba(110,9,51,0.08)' : 'var(--card)' }}
        >
          {/* Posição */}
          <div className="w-8 shrink-0 text-center">
            {index < 3 ? (
              <Trophy size={18} style={{ color: MEDAL_COLORS[index], margin: '0 auto' }} />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: index === 0 ? '#6E0933' : '#2D2D2D' }}
          >
            {corretor.nome.charAt(0)}
          </div>

          {/* Nome e nível */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground truncate">{corretor.nome}</p>
              <BrokerLevelBadge nivel={corretor.nivel} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {corretor.vendasFechadas} vendas · {corretor.taxaConversao}% conversão
            </p>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${corretor.scoreCorretor}%`,
                  background: corretor.scoreCorretor >= 85 ? '#10B981' : corretor.scoreCorretor >= 65 ? '#3B82F6' : '#F59E0B',
                }}
              />
            </div>
            <span className="text-sm font-bold text-foreground w-7 text-right">{corretor.scoreCorretor}</span>
          </div>

          {/* Leads em aberto */}
          <div className="text-right shrink-0 w-20">
            <p className="text-xs text-muted-foreground">Em aberto</p>
            <p className={`text-sm font-semibold ${corretor.leadsEmAberto >= 15 ? 'text-red-400' : 'text-foreground'}`}>
              {corretor.leadsEmAberto}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
