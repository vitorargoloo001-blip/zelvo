'use client'

import Link from 'next/link'
import type { Lead, FonteEntrada } from '@/lib/types'
import { LeadTemperatureBadge } from './LeadTemperatureBadge'
import { MonitorSmartphone, FileInput, UserPen, ArrowRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'Novo':             'text-blue-400',
  'Distribuído':      'text-emerald-400',
  'Contato iniciado': 'text-cyan-400',
  'Em Atendimento':   'text-amber-400',
  'Visita agendada':  'text-orange-400',
  'Proposta enviada': 'text-violet-400',
  'Convertido':       'text-green-400',
  'Perdido':          'text-red-400',
  'Nutrição':         'text-gray-400',
}

const FONTE_CONFIG: Record<FonteEntrada, { label: string; icon: typeof UserPen; color: string; bg: string }> = {
  manual: {
    label: 'Manual',
    icon: UserPen,
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.12)',
  },
  formulario_externo: {
    label: 'Form. externo',
    icon: MonitorSmartphone,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  importacao: {
    label: 'Importação',
    icon: FileInput,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
}

interface LeadTableProps {
  leads: Lead[]
  corretorNomePorId?: Record<string, string>
}

export function LeadTable({ leads, corretorNomePorId = {} }: LeadTableProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cidade</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temperatura</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corretor</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entrada</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const fonte = FONTE_CONFIG[lead.fonteEntrada ?? 'manual']
            const FonteIcon = fonte.icon
            return (
              <tr
                key={lead.id}
                className="border-b border-border last:border-0 hover:bg-white/[0.025] transition-colors group"
              >
                {/* Nome clicável */}
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="font-semibold text-foreground group-hover:text-white transition-colors">
                      {lead.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">{lead.telefone}</p>
                  </Link>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{lead.cidade}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${lead.scoreLead}%`,
                          background:
                            lead.scoreLead >= 80
                              ? '#8B5CF6'
                              : lead.scoreLead >= 60
                              ? '#EF4444'
                              : lead.scoreLead >= 40
                              ? '#F59E0B'
                              : '#3B82F6',
                        }}
                      />
                    </div>
                    <span className="font-semibold text-foreground text-xs w-6">{lead.scoreLead}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
                </td>

                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'text-muted-foreground'}`}>
                    {lead.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {lead.corretorAtribuido ? corretorNomePorId[lead.corretorAtribuido] ?? '—' : '—'}
                </td>

                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ color: fonte.color, background: fonte.bg }}
                  >
                    <FonteIcon size={10} />
                    {fonte.label}
                  </span>
                </td>

                {/* Botão Ver detalhes */}
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Ver detalhes
                    <ArrowRight size={11} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {leads.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Nenhum lead encontrado.
        </div>
      )}
    </div>
  )
}
