'use client'

import { useState } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import Link from 'next/link'
import type { TemperaturaLead, StatusLead } from '@/lib/types'
import { ArrowRight, CalendarClock } from 'lucide-react'

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

const TEMPERATURAS: TemperaturaLead[] = ['Premium', 'Quente', 'Morno', 'Frio']
const STATUS: StatusLead[] = [
  'Novo', 'Distribuído', 'Contato iniciado', 'Em Atendimento',
  'Visita agendada', 'Proposta enviada', 'Convertido', 'Perdido', 'Nutrição',
]

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function MeusLeadsPage() {
  const usuarioAtual  = useZelvoStore(s => s.usuarioAtual)
  const leads         = useZelvoStore(s => s.leads)
  const corretorId    = usuarioAtual.corretorId

  const [busca,       setBusca]       = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [status,      setStatus]      = useState('')

  const meusLeads = leads.filter(l => l.corretorAtribuido === corretorId)
  const filtrados = meusLeads.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase()) || l.cidade.toLowerCase().includes(busca.toLowerCase())
    const matchTemp  = !temperatura || l.temperaturaLead === temperatura
    const matchSt    = !status     || l.status === status
    return matchBusca && matchTemp && matchSt
  })

  const selectCls = 'bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div>
      <PageHeader
        title="Meus Leads"
        description={`${filtrados.length} de ${meusLeads.length} leads atribuídos a você`}
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-56"
        />
        <select className={selectCls} value={temperatura} onChange={e => setTemperatura(e.target.value)}>
          <option value="">Todas as temperaturas</option>
          {TEMPERATURAS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(busca || temperatura || status) && (
          <button onClick={() => { setBusca(''); setTemperatura(''); setStatus('') }} className="text-xs text-muted-foreground hover:text-foreground px-2">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-border" style={{ background: '#1F2329' }}>
          <p className="text-muted-foreground text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: '#1F2329' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Lead', 'Temperatura', 'Score', 'Status', 'Origem', 'Próxima ação', 'Entrada', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l, i) => (
                <tr
                  key={l.id}
                  className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{l.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{l.cidade}</p>
                  </td>
                  <td className="px-4 py-3">
                    <LeadTemperatureBadge temperatura={l.temperaturaLead} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-foreground">{l.scoreLead}</span>
                    <span className="text-muted-foreground text-xs"> pts</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${STATUS_COLORS[l.status] ?? 'text-gray-400'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.origem}</td>
                  <td className="px-4 py-3 max-w-[160px]">
                    {l.proximaAcao ? (
                      <div>
                        <p className="text-xs text-amber-400 truncate">{l.proximaAcao}</p>
                        {l.dataProximaAcao && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                            <CalendarClock size={8} /> {formatDate(l.dataProximaAcao)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground">
                    {formatDate(l.createdAt.split('T')[0])}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${l.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: 'rgba(110,9,51,0.2)', color: '#c0375a' }}
                    >
                      Ver <ArrowRight size={10} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
