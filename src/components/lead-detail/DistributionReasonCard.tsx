import type { Corretor, Distribuicao } from '@/lib/types'
import { BrokerLevelBadge } from '@/components/BrokerLevelBadge'
import { Clock, TrendingUp, Inbox, GitBranch } from 'lucide-react'

interface Props {
  corretor: Corretor
  distribuicao: Distribuicao
}

export function DistributionReasonCard({ corretor, distribuicao }: Props) {
  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={13} style={{ color: '#6B7280' }} />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Motivo da distribuição
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Corretor card */}
      <div
        className="flex items-center gap-3 p-3 rounded-lg mb-4"
        style={{ background: 'rgba(110,9,51,0.08)', border: '1px solid rgba(110,9,51,0.2)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #6E0933 0%, #9B1245 100%)' }}
        >
          {corretor.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground text-sm">{corretor.nome}</p>
            <BrokerLevelBadge nivel={corretor.nivel} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Score <span className="font-bold text-foreground">{corretor.scoreCorretor}</span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {corretor.taxaConversao}% conv.
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock size={9} />{corretor.tempoMedioAtendimento}min resp.
            </span>
            <span
              className={`text-xs font-semibold ${
                corretor.leadsEmAberto >= 15 ? 'text-red-400' : 'text-muted-foreground'
              }`}
            >
              {corretor.leadsEmAberto} em aberto
            </span>
          </div>
        </div>
      </div>

      {/* Texto do motivo */}
      <p className="text-sm text-foreground leading-relaxed">
        {distribuicao.motivoDistribuicao}
      </p>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Vendas', value: corretor.vendasFechadas, icon: TrendingUp },
          { label: 'Propostas', value: corretor.propostasEnviadas, icon: Inbox },
          { label: 'Visitas', value: corretor.visitasMarcadas, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="text-center p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Icon size={12} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-base font-black text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
