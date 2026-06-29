'use client'

import { useState } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { LeadTable } from '@/components/LeadTable'
import { AccessGuard } from '@/components/AccessGuard'
import { AcessoRestrito } from '@/components/AcessoRestrito'
import Link from 'next/link'
import type { TemperaturaLead } from '@/lib/types'

const TEMPERATURAS: TemperaturaLead[] = ['Premium', 'Quente', 'Morno', 'Frio']
const STATUS = [
  'Novo', 'Distribuído', 'Contato iniciado', 'Em Atendimento',
  'Visita agendada', 'Proposta enviada', 'Convertido', 'Perdido', 'Nutrição',
]

function LeadsContent() {
  const leads      = useZelvoStore(s => s.leads)
  const corretores = useZelvoStore(s => s.corretores)

  const corretorNomePorId = Object.fromEntries(corretores.map(c => [c.id, c.nome]))

  const [busca,       setBusca]       = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [status,      setStatus]      = useState('')

  const filtrados = leads.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase()) || l.cidade.toLowerCase().includes(busca.toLowerCase())
    const matchTemp  = !temperatura || l.temperaturaLead === temperatura
    const matchSt    = !status     || l.status === status
    return matchBusca && matchTemp && matchSt
  })

  const selectCls = 'bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${filtrados.length} de ${leads.length} leads`}
        action={
          <Link
            href="/leads/novo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: '#6E0933' }}
          >
            + Novo Lead
          </Link>
        }
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-60"
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
          <button
            onClick={() => { setBusca(''); setTemperatura(''); setStatus('') }}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <LeadTable leads={filtrados} corretorNomePorId={corretorNomePorId} />
    </div>
  )
}

export default function LeadsPage() {
  return (
    <AccessGuard
      allowedProfiles={['gerente']}
      fallback={
        <AcessoRestrito
          mensagem="Use Meus Leads para visualizar seus leads atribuídos."
          voltar={{ href: '/meus-leads', label: 'Ir para Meus Leads' }}
        />
      }
    >
      <LeadsContent />
    </AccessGuard>
  )
}
