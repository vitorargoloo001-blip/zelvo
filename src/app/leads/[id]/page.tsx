'use client'

import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MessageCircle, RefreshCw, ChevronDown, Zap, ShieldX,
} from 'lucide-react'

import { useZelvoStore } from '@/stores/zelvoStore'
import { podeAcessarLead } from '@/lib/access'
import { AttendanceControl } from '@/components/lead-detail/AttendanceControl'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import { LeadScoreExplanation } from '@/components/lead-detail/LeadScoreExplanation'
import { DistributionReasonCard } from '@/components/lead-detail/DistributionReasonCard'
import { RecommendedNextAction } from '@/components/lead-detail/RecommendedNextAction'
import { LeadInfoGrid } from '@/components/lead-detail/LeadInfoGrid'
import { LeadOriginDetails } from '@/components/lead-detail/LeadOriginDetails'
import { LeadActivityTimeline } from '@/components/lead-detail/LeadActivityTimeline'

const STATUS_COLORS: Record<string, string> = {
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

function scoreColor(s: number) {
  return s >= 80 ? '#8B5CF6' : s >= 60 ? '#EF4444' : s >= 40 ? '#F59E0B' : '#3B82F6'
}
function scoreLabel(s: number) {
  if (s >= 80) return 'Prioridade máxima — atender imediatamente.'
  if (s >= 60) return 'Alta chance de conversão — contatar hoje.'
  if (s >= 40) return 'Potencial moderado — acompanhar de perto.'
  return 'Perfil frio — enviar para nutrição.'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LeadDetailPage() {
  const params = useParams()
  const rawId  = params?.id
  const id     = Array.isArray(rawId) ? rawId[0] : rawId ?? ''

  // Dados reativos vindos da store
  const lead         = useZelvoStore(s => s.leads.find(l => l.id === id))
  const corretores   = useZelvoStore(s => s.corretores)
  const distribuicoes = useZelvoStore(s => s.distribuicoes)
  const atividades   = useZelvoStore(s => s.atividades.filter(a => a.leadId === id))
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)

  if (!lead) notFound()

  // Controle de acesso por perfil — usa podeAcessarLead() centralizado
  const isGerente = usuarioAtual.perfil === 'gerente'
  const isCorretor = usuarioAtual.perfil === 'corretor'

  if (!podeAcessarLead(usuarioAtual, lead)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <ShieldX size={24} style={{ color: '#EF4444' }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground mb-1">Você não tem acesso a este lead.</p>
          <p className="text-sm text-muted-foreground mb-4">Este lead está atribuído a outro corretor.</p>
          <Link href="/meus-leads" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6E0933, #8B1040)' }}>
            Ver Meus Leads
          </Link>
        </div>
      </div>
    )
  }

  const corretor = lead.corretorAtribuido
    ? corretores.find(c => c.id === lead.corretorAtribuido) ?? null
    : null
  // Distribuição mais recente deste lead
  const dist = distribuicoes.filter(d => d.leadId === id).at(-1)

  const whatsapp    = `https://wa.me/55${lead.telefone.replace(/\D/g, '')}`
  const sc          = scoreColor(lead.scoreLead)
  const statusColor = STATUS_COLORS[lead.status] ?? '#6B7280'

  return (
    <div className="space-y-6 pb-10">

      {/* ── Breadcrumb ── */}
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={13} />
        Voltar para Leads
      </Link>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md border"
              style={{ color: statusColor, borderColor: statusColor + '40', background: statusColor + '15' }}
            >
              {lead.status}
            </span>
            {corretor && <span className="text-xs text-muted-foreground">→ {corretor.nome}</span>}
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {lead.origem}
            </span>
            {lead.campanha && (
              <span
                className="text-[10px] text-muted-foreground px-2 py-0.5 rounded truncate max-w-[200px]"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                title={lead.campanha}
              >
                {lead.campanha}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-foreground">{lead.nome}</h1>
          <p className="text-xs text-muted-foreground mt-1">Criado em {formatDate(lead.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isGerente && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title="Use o Controle de atendimento abaixo"
            >
              <RefreshCw size={11} /> Redistribuir
            </button>
          )}
          <Link
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
          >
            <MessageCircle size={13} /> WhatsApp
          </Link>
        </div>
      </div>

      {/* ── Hero: Score + Próxima Ação ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-xl border p-5 flex flex-col justify-between"
          style={{ background: `linear-gradient(135deg, ${sc}12 0%, rgba(31,35,41,1) 75%)`, borderColor: sc + '30' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} style={{ color: sc }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: sc + 'cc' }}>Zelvo Score</p>
            </div>
            <div className="text-7xl font-black leading-none" style={{ color: sc }}>{lead.scoreLead}</div>
            <p className="text-sm text-muted-foreground mt-1">de 100 pontos</p>
          </div>
          <div className="mt-6">
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${lead.scoreLead}%`, background: sc }} />
            </div>
            <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{scoreLabel(lead.scoreLead)}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <RecommendedNextAction lead={lead} />
        </div>
      </div>

      {/* ── Análise ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadScoreExplanation lead={lead} />
        {corretor && dist ? (
          <DistributionReasonCard corretor={corretor} distribuicao={dist} />
        ) : (
          <div
            className="rounded-xl border border-border p-5 flex flex-col items-center justify-center text-center gap-2"
            style={{ background: 'var(--card)' }}
          >
            <p className="text-sm font-semibold text-foreground">Lead sem distribuição registrada</p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              {lead.status === 'Novo'
                ? 'Nenhum corretor disponível no momento da entrada do lead.'
                : 'A distribuição não foi registrada para este lead.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Controle de atendimento ── */}
      <AttendanceControl lead={lead} />

      {/* ── Dados + Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <LeadInfoGrid lead={lead} />
          <LeadOriginDetails lead={lead} />
        </div>
        <LeadActivityTimeline
          lead={lead}
          distribuicao={dist}
          corretorNome={corretor?.nome}
          atividades={atividades}
        />
      </div>
    </div>
  )
}
