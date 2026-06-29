'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { BrokerLevelBadge } from '@/components/BrokerLevelBadge'
import { PageHeader } from '@/components/PageHeader'
import {
  TrendingUp, Users, Inbox, CalendarClock,
  ClipboardList, CheckCircle2, Clock, Star, Zap,
} from 'lucide-react'

interface MetricRow {
  label: string
  value: string | number
  unit?: string
  color: string
  icon: typeof TrendingUp
  description?: string
}

function MetricCard({ label, value, unit, color, icon: Icon, description }: MetricRow) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: '#1F2329', borderColor: `${color}20` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-black" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
      </div>
      {description && <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{description}</p>}
    </div>
  )
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

export default function MinhaPerformancePage() {
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)
  const corretores   = useZelvoStore(s => s.corretores)
  const leads        = useZelvoStore(s => s.leads)
  const corretorId   = usuarioAtual.corretorId
  const corretor     = corretores.find(c => c.id === corretorId)
  const ranking      = [...corretores].filter(c => c.ativo).sort((a, b) => b.scoreCorretor - a.scoreCorretor)
  const posicaoRanking = ranking.findIndex(c => c.id === corretorId) + 1

  if (!corretor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Nenhum perfil de corretor vinculado.</p>
      </div>
    )
  }

  const meusLeads   = leads.filter(l => l.corretorAtribuido === corretorId)
  const taxaCalc    = corretor.leadsRecebidos > 0
    ? Math.round((corretor.vendasFechadas / corretor.leadsRecebidos) * 100)
    : 0

  const metrics: MetricRow[] = [
    { label: 'Leads recebidos',     value: corretor.leadsRecebidos,    color: '#3B82F6', icon: Users },
    { label: 'Leads em aberto',     value: corretor.leadsEmAberto,     color: '#F59E0B', icon: Inbox },
    { label: 'Visitas marcadas',    value: corretor.visitasMarcadas,   color: '#F97316', icon: CalendarClock },
    { label: 'Propostas enviadas',  value: corretor.propostasEnviadas, color: '#8B5CF6', icon: ClipboardList },
    { label: 'Vendas fechadas',     value: corretor.vendasFechadas,    color: '#22C55E', icon: CheckCircle2 },
    { label: 'T. médio atend.',     value: corretor.tempoMedioAtendimento, unit: 'dias', color: '#06B6D4', icon: Clock, description: 'Tempo médio do lead recebido ao fechamento' },
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Minha Performance" description="Indicadores individuais de desempenho" />

      {/* ── Hero ── */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'linear-gradient(135deg, #1F2329, #16191D)', borderColor: 'rgba(110,9,51,0.2)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{corretor.email}</p>
            <h2 className="text-xl font-black text-white mb-2">{corretor.nome}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <BrokerLevelBadge nivel={corretor.nivel} />
              <div className="flex items-center gap-1.5">
                <Star size={12} style={{ color: '#F59E0B' }} />
                <span className="text-xs text-muted-foreground">Ranking: </span>
                <span className="text-xs font-bold text-foreground">#{posicaoRanking} de {ranking.length}</span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <Zap size={14} style={{ color: '#6E0933' }} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Zelvo Score</span>
            </div>
            <p className="text-5xl font-black" style={{ color: '#6E0933' }}>{corretor.scoreCorretor}</p>
            <div className="w-32 ml-auto mt-2">
              <ScoreBar value={corretor.scoreCorretor} color="#6E0933" />
            </div>
          </div>
        </div>

        {/* Taxa de conversão destaque */}
        <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={11} /> Taxa de conversão
            </span>
            <span className="text-lg font-black text-green-400">{taxaCalc}%</span>
          </div>
          <ScoreBar value={taxaCalc} color="#22C55E" />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {corretor.vendasFechadas} vendas de {corretor.leadsRecebidos} leads recebidos
          </p>
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* ── Comparativo com a equipe ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Comparativo com a equipe</p>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="space-y-3">
          {[
            { label: 'Score do corretor', meu: corretor.scoreCorretor, max: Math.max(...corretores.map(c => c.scoreCorretor)), color: '#6E0933' },
            { label: 'Vendas fechadas',   meu: corretor.vendasFechadas,   max: Math.max(...corretores.map(c => c.vendasFechadas)),   color: '#22C55E' },
            { label: 'Visitas marcadas',  meu: corretor.visitasMarcadas,  max: Math.max(...corretores.map(c => c.visitasMarcadas)),  color: '#F97316' },
            { label: 'Taxa de conversão', meu: taxaCalc,                  max: Math.max(...corretores.map(c => c.taxaConversao)),    color: '#3B82F6' },
          ].map(row => (
            <div key={row.label} className="rounded-lg border p-3" style={{ background: '#1F2329', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-bold" style={{ color: row.color }}>
                  {row.meu}{row.label.includes('Taxa') ? '%' : ''}
                  <span className="text-muted-foreground font-normal"> / {row.max}{row.label.includes('Taxa') ? '%' : ''} max</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${row.max > 0 ? (row.meu / row.max) * 100 : 0}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
