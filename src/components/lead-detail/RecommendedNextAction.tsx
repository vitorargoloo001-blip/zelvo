import type { Lead } from '@/lib/types'
import { gerarProximaAcao } from '@/lib/leadAnalysis'
import { AlertCircle, Clock, Target, Snowflake } from 'lucide-react'

const URGENCIA_ICONS = {
  critica: AlertCircle,
  alta: Clock,
  media: Target,
  baixa: Snowflake,
}

const URGENCIA_LABEL = {
  critica: 'Urgência crítica',
  alta: 'Alta prioridade',
  media: 'Prioridade moderada',
  baixa: 'Baixa prioridade',
}

export function RecommendedNextAction({ lead }: { lead: Lead }) {
  const acao = gerarProximaAcao(lead)
  const Icon = URGENCIA_ICONS[acao.urgencia]

  return (
    <div
      className="rounded-xl border p-5 h-full"
      style={{ background: acao.bg, borderColor: acao.border }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${acao.color}20` }}
        >
          <Icon size={18} style={{ color: acao.color }} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: `${acao.color}cc` }}
            >
              Próxima ação recomendada
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: `${acao.color}20`, color: acao.color }}
            >
              {URGENCIA_LABEL[acao.urgencia]}
            </span>
          </div>
          <p className="text-lg font-black text-foreground leading-tight">{acao.titulo}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{acao.descricao}</p>
        </div>
      </div>

      {/* Ações numeradas */}
      <div className="space-y-2.5">
        {acao.acoes.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black"
              style={{ background: `${acao.color}22`, color: acao.color }}
            >
              {i + 1}
            </div>
            <p className="text-sm text-foreground leading-relaxed pt-0.5">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
