import type { Lead, Distribuicao } from '@/lib/types'
import type { Atividade } from '@/stores/zelvoStore'
import { gerarTimeline } from '@/lib/leadAnalysis'
import { Inbox, Zap, GitBranch, CheckCircle2, Target, MessageSquare } from 'lucide-react'

const TIPO_CONFIG = {
  entrada:      { icon: Inbox,         color: '#3B82F6' },
  calculo:      { icon: Zap,           color: '#6E0933' },
  distribuicao: { icon: GitBranch,     color: '#10B981' },
  status:       { icon: CheckCircle2,  color: '#8B5CF6' },
  acao:         { icon: Target,        color: '#F59E0B' },
  redistribuicao:{ icon: GitBranch,    color: '#10B981' },
  nota:         { icon: MessageSquare, color: '#6B7280' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  lead: Lead
  distribuicao?: Distribuicao
  corretorNome?: string
  atividades?: Atividade[]
}

export function LeadActivityTimeline({ lead, distribuicao, corretorNome, atividades = [] }: Props) {
  // Eventos auto-gerados pelo sistema
  const autoEvents = gerarTimeline(lead, distribuicao, corretorNome)

  // Converte atividades da store para o mesmo formato dos eventos
  const atividadeEvents = atividades.map(a => ({
    id: a.id,
    tipo: a.tipo as keyof typeof TIPO_CONFIG,
    titulo: a.titulo,
    descricao: a.descricao,
    timestamp: a.createdAt,
  }))

  // Mescla e ordena cronologicamente
  const allEvents = [...autoEvents, ...atividadeEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      <div className="flex items-center gap-2 mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Histórico de atividades
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] text-muted-foreground">{allEvents.length} eventos</span>
      </div>

      <div className="relative">
        <div
          className="absolute top-4 bottom-4"
          style={{
            left: '15px',
            width: '1px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.06) 90%, rgba(255,255,255,0) 100%)',
          }}
        />

        <div className="space-y-5">
          {allEvents.map((event, i) => {
            const tipoKey = (event.tipo in TIPO_CONFIG ? event.tipo : 'nota') as keyof typeof TIPO_CONFIG
            const config  = TIPO_CONFIG[tipoKey]
            const Icon    = config.icon
            const isLast  = i === allEvents.length - 1

            return (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                  style={{ background: '#1A1E23', borderColor: config.color, boxShadow: '0 0 0 3px rgba(0,0,0,0.3)' }}
                >
                  <Icon size={12} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: isLast ? config.color : '#E6E4E1' }}
                    >
                      {event.titulo}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.descricao}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
