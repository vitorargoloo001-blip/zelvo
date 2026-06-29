import type { Lead } from '@/lib/types'
import { analisarScore } from '@/lib/leadAnalysis'
import { TrendingUp, TrendingDown, CheckCircle2, Info } from 'lucide-react'

export function LeadScoreExplanation({ lead }: { lead: Lead }) {
  const { factors, summary, positiveCount, negativeCount } = analisarScore(lead)
  const positives = factors.filter(f => f.positive)
  const negatives = factors.filter(f => !f.positive)

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Análise do Zelvo Score
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Resumo textual */}
      <div
        className="flex items-start gap-3 p-4 rounded-lg mb-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Info size={14} className="shrink-0 mt-0.5" style={{ color: '#6B7280' }} />
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
      </div>

      {/* Fatores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Positivos */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={11} className="text-emerald-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Pontos positivos ({positiveCount})
            </p>
          </div>
          <div className="space-y-2">
            {positives.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="text-[11px] font-black w-8 text-right shrink-0 pt-0.5"
                  style={{ color: '#10B981' }}
                >
                  +{f.points}
                </span>
                <div
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#E6E4E1' }}
                >
                  {f.label}
                </div>
              </div>
            ))}
            {positives.length === 0 && (
              <p className="text-xs text-muted-foreground pl-2">Nenhum fator positivo.</p>
            )}
          </div>
        </div>

        {/* Negativos */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown size={11} className="text-red-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
              Pontos críticos ({negativeCount})
            </p>
          </div>
          <div className="space-y-2">
            {negatives.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="text-[11px] font-black w-8 text-right shrink-0 pt-0.5"
                  style={{ color: '#EF4444' }}
                >
                  {f.points}
                </span>
                <div
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#E6E4E1' }}
                >
                  {f.label}
                </div>
              </div>
            ))}
            {negatives.length === 0 && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs"
                style={{ background: 'rgba(16,185,129,0.08)' }}
              >
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span style={{ color: '#10B981' }}>Nenhum ponto crítico identificado.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
