'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import type { StatusLead } from '@/lib/types'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import { PageHeader } from '@/components/PageHeader'
import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

interface FunilColumn {
  status: StatusLead
  color: string
  bg: string
  border: string
}

const COLUNAS: FunilColumn[] = [
  { status: 'Novo',             color: '#3B82F6', bg: 'rgba(59,130,246,0.06)',   border: 'rgba(59,130,246,0.18)'  },
  { status: 'Distribuído',      color: '#10B981', bg: 'rgba(16,185,129,0.06)',   border: 'rgba(16,185,129,0.18)'  },
  { status: 'Contato iniciado', color: '#06B6D4', bg: 'rgba(6,182,212,0.06)',    border: 'rgba(6,182,212,0.18)'   },
  { status: 'Em Atendimento',   color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',   border: 'rgba(245,158,11,0.18)'  },
  { status: 'Visita agendada',  color: '#F97316', bg: 'rgba(249,115,22,0.06)',   border: 'rgba(249,115,22,0.18)'  },
  { status: 'Proposta enviada', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)',   border: 'rgba(139,92,246,0.18)'  },
  { status: 'Convertido',       color: '#22C55E', bg: 'rgba(34,197,94,0.06)',    border: 'rgba(34,197,94,0.18)'   },
  { status: 'Perdido',          color: '#EF4444', bg: 'rgba(239,68,68,0.06)',    border: 'rgba(239,68,68,0.18)'   },
  { status: 'Nutrição',         color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.18)' },
]

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function MeuFunilPage() {
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)
  const leads        = useZelvoStore(s => s.leads)
  const corretorId   = usuarioAtual.corretorId
  const meusLeads    = leads.filter(l => l.corretorAtribuido === corretorId)

  return (
    <div>
      <PageHeader
        title="Meu Funil"
        description={`${meusLeads.length} leads em acompanhamento`}
      />

      {/* Resumo */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {COLUNAS.map(col => {
          const count = meusLeads.filter(l => l.status === col.status).length
          if (count === 0) return null
          return (
            <div
              key={col.status}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
              style={{ background: col.bg, border: `1px solid ${col.border}` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{col.status}</span>
              <span className="text-xs font-bold" style={{ color: col.color }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-3" style={{ minWidth: `${COLUNAS.length * 232}px` }}>
          {COLUNAS.map(col => {
            const colLeads = meusLeads.filter(l => l.status === col.status)
            return (
              <div key={col.status} className="flex flex-col" style={{ width: '220px', minWidth: '220px' }}>
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-t-xl mb-0.5"
                  style={{ background: col.bg, border: `1px solid ${col.border}`, borderBottom: 'none' }}
                >
                  <span className="text-xs font-bold" style={{ color: col.color }}>{col.status}</span>
                  <span
                    className="text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: col.color + '25', color: col.color }}
                  >
                    {colLeads.length}
                  </span>
                </div>
                <div
                  className="flex-1 rounded-b-xl p-2 space-y-2"
                  style={{ background: col.bg, border: `1px solid ${col.border}`, borderTop: `1px solid ${col.border}40`, minHeight: '55vh' }}
                >
                  {colLeads.map(lead => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block rounded-lg border p-3 transition-all hover:scale-[1.01] hover:shadow-lg group"
                      style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                    >
                      <p className="text-sm font-semibold text-foreground group-hover:text-white leading-tight mb-2">
                        {lead.nome}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
                        <span className="text-[10px] font-semibold text-muted-foreground">{lead.scoreLead} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{lead.origem}</p>
                      {lead.proximaAcao && (
                        <div className="mt-2 pt-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px] text-amber-400 leading-snug line-clamp-2">{lead.proximaAcao}</p>
                          {lead.dataProximaAcao && (
                            <div className="flex items-center gap-1">
                              <CalendarClock size={8} className="text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground">{formatDate(lead.dataProximaAcao)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="flex items-center justify-center h-16">
                      <p className="text-[10px] text-muted-foreground">Nenhum lead</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
