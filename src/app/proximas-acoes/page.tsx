'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import Link from 'next/link'
import type { Lead } from '@/lib/types'
import { AlertCircle, CalendarClock, Sun, CalendarDays, Inbox, ArrowRight } from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

const STATUS_COLORS: Record<string, string> = {
  'Novo': '#3B82F6', 'Distribuído': '#10B981', 'Contato iniciado': '#06B6D4',
  'Em Atendimento': '#F59E0B', 'Visita agendada': '#F97316', 'Proposta enviada': '#8B5CF6',
  'Convertido': '#22C55E', 'Perdido': '#EF4444', 'Nutrição': '#6B7280',
}

function AcaoCard({ lead, variant }: { lead: Lead; variant: 'atrasada' | 'hoje' | 'futura' }) {
  const colors = {
    atrasada: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', date: 'text-red-400' },
    hoje:     { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', date: 'text-amber-400' },
    futura:   { bg: '#1F2329', border: 'rgba(255,255,255,0.07)', date: 'text-muted-foreground' },
  }[variant]

  const sc = STATUS_COLORS[lead.status] ?? '#6B7280'

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-white/5 transition-colors group"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
          <span className="text-xs font-semibold text-foreground group-hover:text-white truncate">{lead.nome}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: sc, background: sc + '18' }}>
            {lead.status}
          </span>
        </div>
        <p className="text-xs text-amber-400 truncate mb-1">{lead.proximaAcao}</p>
        {lead.dataProximaAcao && (
          <p className={`text-[10px] font-medium ${colors.date}`}>
            {formatDate(lead.dataProximaAcao)}
          </p>
        )}
      </div>
      <ArrowRight size={13} className="text-muted-foreground mt-0.5 shrink-0" />
    </Link>
  )
}

function Section({
  title, icon: Icon, color, leads, variant, empty,
}: {
  title: string
  icon: typeof AlertCircle
  color: string
  leads: Lead[]
  variant: 'atrasada' | 'hoje' | 'futura'
  empty: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
          {title} ({leads.length})
        </p>
      </div>
      {leads.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-1">{empty}</p>
      ) : (
        <div className="space-y-2">
          {leads.map(l => <AcaoCard key={l.id} lead={l} variant={variant} />)}
        </div>
      )}
    </div>
  )
}

export default function ProximasAcoesPage() {
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)
  const leads        = useZelvoStore(s => s.leads)
  const corretorId   = usuarioAtual.corretorId

  const hoje      = new Date().toISOString().split('T')[0]
  const meusLeads = leads.filter(l => l.corretorAtribuido === corretorId && !['Convertido', 'Perdido'].includes(l.status))

  const atrasadas   = meusLeads.filter(l => l.dataProximaAcao && l.dataProximaAcao < hoje)
  const hoje_leads  = meusLeads.filter(l => l.dataProximaAcao && l.dataProximaAcao === hoje)
  const futuras     = meusLeads.filter(l => l.dataProximaAcao && l.dataProximaAcao > hoje)
  const semAcao     = meusLeads.filter(l => !l.proximaAcao)

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Próximas Ações"
        description={`${meusLeads.filter(l => l.proximaAcao).length} ações cadastradas · ${atrasadas.length} atrasadas`}
      />

      <Section
        title="Atrasadas"
        icon={AlertCircle}
        color="#EF4444"
        leads={atrasadas}
        variant="atrasada"
        empty="Nenhuma ação atrasada."
      />

      <Section
        title="Hoje"
        icon={Sun}
        color="#F59E0B"
        leads={hoje_leads}
        variant="hoje"
        empty="Nenhuma ação para hoje."
      />

      <Section
        title="Próximos dias"
        icon={CalendarDays}
        color="#3B82F6"
        leads={futuras}
        variant="futura"
        empty="Nenhuma ação futura cadastrada."
      />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={13} className="text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sem próxima ação ({semAcao.length})
          </p>
        </div>
        {semAcao.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-1">Todos os leads têm próxima ação definida.</p>
        ) : (
          <div className="space-y-2">
            {semAcao.map(l => (
              <Link
                key={l.id}
                href={`/leads/${l.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-2">
                  <LeadTemperatureBadge temperatura={l.temperaturaLead} />
                  <p className="text-xs font-semibold text-foreground">{l.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{l.status}</p>
                </div>
                <ArrowRight size={12} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
