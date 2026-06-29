import type { Corretor } from '@/lib/types'
import { BrokerLevelBadge } from './BrokerLevelBadge'
import { Clock, TrendingUp } from 'lucide-react'

interface BrokerTableProps {
  corretores: Corretor[]
}

export function BrokerTable({ corretores }: BrokerTableProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corretor</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Em Aberto</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversão</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tempo Médio</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {corretores.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <BrokerLevelBadge nivel={c.nivel} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.scoreCorretor}%`,
                        background: c.scoreCorretor >= 85 ? '#10B981' : c.scoreCorretor >= 65 ? '#3B82F6' : c.scoreCorretor >= 40 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <span className="font-semibold text-xs text-foreground">{c.scoreCorretor}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-sm font-medium ${c.leadsEmAberto >= 15 ? 'text-red-400' : c.leadsEmAberto >= 10 ? 'text-amber-400' : 'text-foreground'}`}>
                  {c.leadsEmAberto}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp size={13} />
                  <span className="text-sm font-medium">{c.taxaConversao}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock size={13} />
                  <span className="text-sm">{c.tempoMedioAtendimento}min</span>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-foreground">{c.vendasFechadas}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.ativo ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.ativo ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
