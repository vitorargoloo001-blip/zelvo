import type { Distribuicao, Lead, Corretor } from '@/lib/types'
import { LeadTemperatureBadge } from './LeadTemperatureBadge'
import { GitBranch } from 'lucide-react'

interface DistributionHistoryProps {
  distribuicoes: Distribuicao[]
  leadsById: Record<string, Lead>
  corretoresById: Record<string, Corretor>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function DistributionHistory({ distribuicoes, leadsById, corretoresById }: DistributionHistoryProps) {
  const sorted = [...distribuicoes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-3">
      {sorted.map((dist) => {
        const lead = leadsById[dist.leadId]
        const corretor = corretoresById[dist.corretorId]
        if (!lead || !corretor) return null

        return (
          <div
            key={dist.id}
            className="rounded-xl border border-border p-4 hover:border-white/10 transition-colors"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(110,9,51,0.15)' }}
              >
                <GitBranch size={14} style={{ color: '#6E0933' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{lead.nome}</span>
                  <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-foreground font-medium">{corretor.nome}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{dist.motivoDistribuicao}</p>

                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Score lead: <strong className="text-foreground">{dist.scoreLeadNoMomento}</strong>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score corretor: <strong className="text-foreground">{dist.scoreCorretorNoMomento}</strong>
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDate(dist.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {sorted.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">Nenhuma distribuição registrada.</div>
      )}
    </div>
  )
}
