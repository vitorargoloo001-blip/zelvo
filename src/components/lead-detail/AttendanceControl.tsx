'use client'

import { useState } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'
import type { Lead, StatusLead } from '@/lib/types'
import { ClipboardEdit, CheckCircle2, ChevronRight } from 'lucide-react'

const ALL_STATUSES: StatusLead[] = [
  'Novo', 'Distribuído', 'Contato iniciado', 'Em Atendimento',
  'Visita agendada', 'Proposta enviada', 'Convertido', 'Perdido', 'Nutrição',
]

const STATUS_COLORS: Record<StatusLead, string> = {
  'Novo':             '#3B82F6',
  'Distribuído':      '#10B981',
  'Contato iniciado': '#06B6D4',
  'Em Atendimento':   '#F59E0B',
  'Visita agendada':  '#F97316',
  'Proposta enviada': '#8B5CF6',
  'Convertido':       '#22C55E',
  'Perdido':          '#EF4444',
  'Nutrição':         '#6B7280',
}

function StatusBadge({ status }: { status: StatusLead }) {
  const c = STATUS_COLORS[status] ?? '#6B7280'
  return (
    <span
      className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-md border"
      style={{ color: c, borderColor: c + '45', background: c + '18' }}
    >
      {status}
    </span>
  )
}

export function AttendanceControl({ lead }: { lead: Lead }) {
  const adicionarAtualizacaoAtendimento = useZelvoStore(s => s.adicionarAtualizacaoAtendimento)

  const [statusNovo,      setStatusNovo]      = useState<StatusLead>(lead.status as StatusLead)
  const [observacao,      setObservacao]      = useState(lead.observacao ?? '')
  const [proximaAcao,     setProximaAcao]     = useState(lead.proximaAcao ?? '')
  const [dataProximaAcao, setDataProximaAcao] = useState(lead.dataProximaAcao ?? '')
  const [saved,           setSaved]           = useState(false)

  const statusMudou  = statusNovo !== (lead.status as StatusLead)
  const temAlteracao = statusMudou || observacao !== (lead.observacao ?? '') ||
    proximaAcao !== (lead.proximaAcao ?? '') || dataProximaAcao !== (lead.dataProximaAcao ?? '')

  async function handleSave() {
    if (!temAlteracao) return
    await adicionarAtualizacaoAtendimento({
      leadId:          lead.id,
      statusAnterior:  lead.status as StatusLead,
      statusNovo,
      observacao:      observacao || undefined,
      proximaAcao:     proximaAcao || undefined,
      dataProximaAcao: dataProximaAcao || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputCls    = 'w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
  const selectCls   = 'w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardEdit size={13} style={{ color: '#6B7280' }} />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Controle de atendimento
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {saved && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle2 size={11} /> Salvo
          </span>
        )}
      </div>

      {/* ── Status ── */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Status do lead
        </label>
        {/* Preview de mudança */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge status={lead.status as StatusLead} />
          {statusMudou && (
            <>
              <ChevronRight size={12} className="text-muted-foreground" />
              <StatusBadge status={statusNovo} />
            </>
          )}
        </div>
        <select className={selectCls} value={statusNovo} onChange={e => setStatusNovo(e.target.value as StatusLead)}>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Observação ── */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Observação
        </label>
        <textarea
          className={inputCls + ' resize-none'}
          rows={2}
          placeholder="Notas sobre o atendimento, objeções, interesse do lead…"
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />
      </div>

      {/* ── Próxima ação ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Próxima ação
          </label>
          <input
            className={inputCls}
            placeholder="Ex: Ligar às 14h para confirmar visita"
            value={proximaAcao}
            onChange={e => setProximaAcao(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Data prevista
          </label>
          <input
            type="date"
            className={inputCls}
            value={dataProximaAcao}
            onChange={e => setDataProximaAcao(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* ── Botão ── */}
      <button
        onClick={handleSave}
        disabled={!temAlteracao}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : 'linear-gradient(135deg, #6E0933, #8B1040)',
          boxShadow: temAlteracao ? '0 4px 14px rgba(110,9,51,0.3)' : 'none',
        }}
      >
        {saved ? (
          <><CheckCircle2 size={14} /> Atualização salva</>
        ) : (
          'Salvar atualização'
        )}
      </button>
    </div>
  )
}
