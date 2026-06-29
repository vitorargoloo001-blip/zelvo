'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import { BrokerLevelBadge } from '@/components/BrokerLevelBadge'
import Link from 'next/link'
import {
  Users, Flame, Inbox, CheckCircle2, CalendarClock,
  ClipboardList, TrendingUp, AlertCircle, ArrowRight,
} from 'lucide-react'

function MiniCard({
  label, value, color, icon: Icon,
}: { label: string; value: number; color: string; icon: typeof Users }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: '#1F2329', borderColor: `${color}25` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  )
}

export default function MeuPainelPage() {
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)
  const leads        = useZelvoStore(s => s.leads)
  const corretores   = useZelvoStore(s => s.corretores)

  const corretorId  = usuarioAtual.corretorId
  const corretor    = corretores.find(c => c.id === corretorId)
  const meusLeads   = leads.filter(l => l.corretorAtribuido === corretorId)

  const hoje = new Date().toISOString().split('T')[0]

  const premium       = meusLeads.filter(l => l.temperaturaLead === 'Premium').length
  const emAberto      = meusLeads.filter(l => !['Convertido', 'Perdido'].includes(l.status)).length
  const convertidos   = meusLeads.filter(l => l.status === 'Convertido').length
  const visitas       = meusLeads.filter(l => l.status === 'Visita agendada').length
  const propostas     = meusLeads.filter(l => l.status === 'Proposta enviada').length
  const semAtualizacao = meusLeads.filter(l => !l.proximaAcao && !['Convertido', 'Perdido', 'Nutrição'].includes(l.status)).length

  const acoesPendentes = meusLeads.filter(l => l.proximaAcao && l.dataProximaAcao && l.dataProximaAcao >= hoje)
  const acoesAtrasadas = meusLeads.filter(l => l.proximaAcao && l.dataProximaAcao && l.dataProximaAcao < hoje)

  if (!corretor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Nenhum perfil de corretor vinculado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, #1F2329, #16191D)', borderColor: 'rgba(110,9,51,0.25)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Meu Painel</p>
            <h1 className="text-2xl font-black text-white">{corretor.nome}</h1>
            <div className="flex items-center gap-2 mt-2">
              <BrokerLevelBadge nivel={corretor.nivel} />
              <span className="text-xs text-muted-foreground">Score: <span className="font-bold text-foreground">{corretor.scoreCorretor}</span></span>
              <span className="text-xs text-muted-foreground">Taxa de conversão: <span className="font-bold text-green-400">{corretor.taxaConversao}%</span></span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-foreground">{meusLeads.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">leads atribuídos</p>
          </div>
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniCard label="Em aberto"       value={emAberto}      color="#F59E0B" icon={Inbox} />
        <MiniCard label="Premium"         value={premium}        color="#8B5CF6" icon={Flame} />
        <MiniCard label="Visitas agend."  value={visitas}        color="#F97316" icon={CalendarClock} />
        <MiniCard label="Propostas env."  value={propostas}      color="#06B6D4" icon={ClipboardList} />
        <MiniCard label="Convertidos"     value={convertidos}    color="#22C55E" icon={CheckCircle2} />
        <MiniCard label="Sem próx. ação"  value={semAtualizacao} color="#EF4444" icon={AlertCircle} />
      </div>

      {/* ── Ações atrasadas ── */}
      {acoesAtrasadas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={13} style={{ color: '#EF4444' }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#EF4444' }}>
              Ações atrasadas ({acoesAtrasadas.length})
            </p>
          </div>
          <div className="space-y-2">
            {acoesAtrasadas.slice(0, 5).map(l => (
              <Link
                key={l.id}
                href={`/leads/${l.id}`}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <LeadTemperatureBadge temperatura={l.temperaturaLead} />
                    <span className="text-xs font-semibold text-foreground truncate">{l.nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{l.proximaAcao}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">
                    Previsto: {new Date(l.dataProximaAcao! + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ArrowRight size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Próximas ações ── */}
      {acoesPendentes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={13} style={{ color: '#F59E0B' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Próximas ações ({acoesPendentes.length})
            </p>
          </div>
          <div className="space-y-2">
            {acoesPendentes.slice(0, 6).map(l => (
              <Link
                key={l.id}
                href={`/leads/${l.id}`}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <LeadTemperatureBadge temperatura={l.temperaturaLead} />
                    <span className="text-xs font-semibold text-foreground truncate">{l.nome}</span>
                  </div>
                  <p className="text-xs text-amber-400 truncate">{l.proximaAcao}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(l.dataProximaAcao! + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ArrowRight size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              </Link>
            ))}
          </div>
          {acoesPendentes.length > 6 && (
            <Link href="/proximas-acoes" className="block mt-2 text-center text-xs text-muted-foreground hover:text-foreground">
              Ver todas ({acoesPendentes.length}) →
            </Link>
          )}
        </div>
      )}

      {/* ── Atalhos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/meus-leads',       label: 'Ver Meus Leads',       color: '#3B82F6' },
          { href: '/meu-funil',        label: 'Abrir Meu Funil',      color: '#8B5CF6' },
          { href: '/proximas-acoes',   label: 'Próximas Ações',       color: '#F59E0B' },
          { href: '/minha-performance', label: 'Minha Performance',   color: '#22C55E' },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: `${a.color}10`, borderColor: `${a.color}25`, color: a.color }}
          >
            {a.label} <ArrowRight size={11} />
          </Link>
        ))}
      </div>
    </div>
  )
}
