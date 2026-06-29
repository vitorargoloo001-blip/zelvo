'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { StatCard } from '@/components/StatCard'
import { LeadTemperatureBadge } from '@/components/LeadTemperatureBadge'
import { BrokerLevelBadge } from '@/components/BrokerLevelBadge'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
  Users, GitBranch, TrendingUp, Flame, Clock,
  ArrowRight, AlertTriangle, Zap, UserX, Inbox,
  MonitorSmartphone, UserPen, FileInput,
  CalendarClock, MessageCircleWarning, Filter,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// Dados de atividade semanal (fixos no MVP — futuramente gerados a partir dos leads)
const areaData = [
  { dia: 'Seg', leads: 4, distribuidos: 3 },
  { dia: 'Ter', leads: 6, distribuidos: 5 },
  { dia: 'Qua', leads: 3, distribuidos: 3 },
  { dia: 'Qui', leads: 8, distribuidos: 6 },
  { dia: 'Sex', leads: 5, distribuidos: 4 },
  { dia: 'Sáb', leads: 2, distribuidos: 2 },
  { dia: 'Dom', leads: 7, distribuidos: 6 },
]

const STATUS_COLOR: Record<string, string> = {
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">{children}</p>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

function AlertItem({
  icon: Icon, color, title, description,
}: { icon: typeof AlertTriangle; color: string; title: string; description: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border"
      style={{ background: `${color}0d`, borderColor: `${color}25` }}
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: '#E6E4E1' }}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router       = useRouter()
  const usuarioAtual = useZelvoStore(s => s.usuarioAtual)

  useEffect(() => {
    if (usuarioAtual.perfil === 'corretor') router.replace('/meu-painel')
  }, [usuarioAtual.perfil, router])

  // ── Dados reativos da store ──────────────────────────────────────────────
  const leads       = useZelvoStore(s => s.leads)
  const corretores  = useZelvoStore(s => s.corretores)
  const distribuicoes = useZelvoStore(s => s.distribuicoes)

  if (usuarioAtual.perfil === 'corretor') return null

  const corretorById = Object.fromEntries(corretores.map(c => [c.id, c]))

  // ── Métricas ─────────────────────────────────────────────────────────────
  const totalLeads    = leads.length
  const premium       = leads.filter(l => l.temperaturaLead === 'Premium').length
  const quentes       = leads.filter(l => l.temperaturaLead === 'Quente').length
  const mornos        = leads.filter(l => l.temperaturaLead === 'Morno').length
  const frios         = leads.filter(l => l.temperaturaLead === 'Frio').length
  const convertidos   = leads.filter(l => l.status === 'Convertido').length
  const semAtendimento = leads.filter(l => l.status === 'Novo' && !l.corretorAtribuido).length

  const totalManual    = leads.filter(l => (l.fonteEntrada ?? 'manual') === 'manual').length
  const totalFormulario = leads.filter(l => l.fonteEntrada === 'formulario_externo').length
  const totalImportacao = leads.filter(l => l.fonteEntrada === 'importacao').length

  // ── Gargalos do funil ────────────────────────────────────────────────────
  const distribuidosSemContato = leads.filter(l => l.status === 'Distribuído')
  const premiumParados = leads.filter(
    l => l.temperaturaLead === 'Premium' && ['Novo', 'Distribuído'].includes(l.status)
  )
  const quentesParados = leads.filter(
    l => l.temperaturaLead === 'Quente' && ['Novo', 'Distribuído'].includes(l.status)
  )
  const semProximaAcao = leads.filter(
    l => !l.proximaAcao && !['Convertido', 'Perdido', 'Nutrição'].includes(l.status)
  )
  const corretoresSobrecarregados = corretores.filter(c => c.leadsEmAberto >= 15 && c.ativo)
  const totalGargalos =
    distribuidosSemContato.length + premiumParados.length +
    quentesParados.length + semProximaAcao.length + corretoresSobrecarregados.length

  // ── Alertas ───────────────────────────────────────────────────────────────
  const premiumSemAtendimento = leads.filter(
    l => l.temperaturaLead === 'Premium' && l.status === 'Novo' && !l.corretorAtribuido
  )
  const quentesSemAtendimento = leads.filter(
    l => l.temperaturaLead === 'Quente' && l.status === 'Novo' && !l.corretorAtribuido
  )
  const leadsSemCorretor = leads.filter(
    l => !l.corretorAtribuido && l.status === 'Novo' &&
    l.temperaturaLead !== 'Premium' && l.temperaturaLead !== 'Quente'
  )
  const totalAlertas =
    premiumSemAtendimento.length + quentesSemAtendimento.length +
    leadsSemCorretor.length

  // ── Listas ────────────────────────────────────────────────────────────────
  const leadsRecentes = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const topCorretores = [...corretores]
    .filter(c => c.ativo)
    .sort((a, b) => b.scoreCorretor - a.scoreCorretor)
    .slice(0, 5)

  const pieData = [
    { name: 'Premium', value: premium, color: '#8B5CF6' },
    { name: 'Quente',  value: quentes, color: '#EF4444' },
    { name: 'Morno',   value: mornos,  color: '#F59E0B' },
    { name: 'Frio',    value: frios,   color: '#3B82F6' },
  ]

  return (
    <div className="space-y-8 pb-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Painel gerencial</p>
          <h1 className="text-2xl font-black text-foreground leading-tight">Dashboard Zelvo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da qualificação, ranking e distribuição de leads em tempo real.
          </p>
        </div>
        <Link
          href="/leads/novo"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg, #6E0933 0%, #8B1040 100%)', boxShadow: '0 4px 14px rgba(110,9,51,0.4)' }}
        >
          <Zap size={14} />
          Novo Lead
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div>
        <SectionTitle>Métricas do período</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard title="Total de Leads" value={totalLeads} subtitle="Todos os períodos" icon={Users} />
          <StatCard title="Leads Premium" value={premium} subtitle="Exige atendimento imediato" icon={Flame} accent />
          <StatCard title="Distribuições" value={distribuicoes.length} subtitle="Distribuído automaticamente" icon={GitBranch} />
          <StatCard title="Convertidos" value={convertidos} subtitle="Melhor corretor disponível" icon={TrendingUp} />
          <StatCard title="Sem atendimento" value={semAtendimento} subtitle="Lead sem próxima ação" icon={UserX} alert={semAtendimento > 0} />
        </div>
      </div>

      {/* ── Gargalos do funil ── */}
      {totalGargalos > 0 && (
        <div>
          <SectionTitle>Gargalos do funil</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">

            {distribuidosSemContato.length > 0 && (
              <Link href="/funil" className="block">
                <div className="rounded-xl border p-4 hover:border-cyan-500/30 transition-colors cursor-pointer" style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircleWarning size={14} style={{ color: '#06B6D4' }} />
                    <span className="text-xs text-muted-foreground">Sem contato</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: '#06B6D4' }}>{distribuidosSemContato.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Distribuídos sem primeiro contato</p>
                </div>
              </Link>
            )}

            {premiumParados.length > 0 && (
              <Link href="/funil" className="block">
                <div className="rounded-xl border p-4 hover:border-purple-500/30 transition-colors cursor-pointer" style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={14} style={{ color: '#8B5CF6' }} />
                    <span className="text-xs text-muted-foreground">Premium parados</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{premiumParados.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Premium sem evolução no funil</p>
                </div>
              </Link>
            )}

            {quentesParados.length > 0 && (
              <Link href="/funil" className="block">
                <div className="rounded-xl border p-4 hover:border-red-500/30 transition-colors cursor-pointer" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span className="text-xs text-muted-foreground">Quentes parados</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: '#EF4444' }}>{quentesParados.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Quentes no início do funil</p>
                </div>
              </Link>
            )}

            {semProximaAcao.length > 0 && (
              <Link href="/funil" className="block">
                <div className="rounded-xl border p-4 hover:border-amber-500/30 transition-colors cursor-pointer" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock size={14} style={{ color: '#F59E0B' }} />
                    <span className="text-xs text-muted-foreground">Sem próxima ação</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{semProximaAcao.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Leads sem ação definida</p>
                </div>
              </Link>
            )}

            {corretoresSobrecarregados.length > 0 && (
              <Link href="/corretores" className="block">
                <div className="rounded-xl border p-4 hover:border-orange-500/30 transition-colors cursor-pointer" style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={14} style={{ color: '#F97316' }} />
                    <span className="text-xs text-muted-foreground">Corretores</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: '#F97316' }}>{corretoresSobrecarregados.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Com capacidade no limite</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Alertas ── */}
      {totalAlertas > 0 && (
        <div>
          <SectionTitle>Atenção do gerente</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {premiumSemAtendimento.length > 0 && (
              <AlertItem
                icon={Flame} color="#8B5CF6"
                title={`${premiumSemAtendimento.length} lead${premiumSemAtendimento.length > 1 ? 's' : ''} Premium sem atendimento`}
                description={`${premiumSemAtendimento.map(l => l.nome.split(' ')[0]).join(', ')} — prioridade máxima`}
              />
            )}
            {quentesSemAtendimento.length > 0 && (
              <AlertItem
                icon={AlertTriangle} color="#EF4444"
                title={`${quentesSemAtendimento.length} lead${quentesSemAtendimento.length > 1 ? 's' : ''} Quente${quentesSemAtendimento.length > 1 ? 's' : ''} parado${quentesSemAtendimento.length > 1 ? 's' : ''}`}
                description={`${quentesSemAtendimento.map(l => l.nome.split(' ')[0]).join(', ')} — risco de esfriar`}
              />
            )}
            {corretoresSobrecarregados.map(c => (
              <AlertItem
                key={c.id} icon={Users} color="#F59E0B"
                title={`${c.nome.split(' ')[0]} sobrecarregado`}
                description={`${c.leadsEmAberto} leads em aberto — limite atingido`}
              />
            ))}
            {leadsSemCorretor.length > 0 && (
              <AlertItem
                icon={Inbox} color="#6B7280"
                title={`${leadsSemCorretor.length} lead${leadsSemCorretor.length > 1 ? 's' : ''} sem próxima ação`}
                description="Mornos e Frios aguardando distribuição manual"
              />
            )}
          </div>
        </div>
      )}

      {/* ── Gráficos ── */}
      <div>
        <SectionTitle>Atividade semanal</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Area chart */}
          <div className="lg:col-span-2 rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Leads × Distribuições</p>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#6E0933' }} />
                  <span className="text-muted-foreground">Leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                  <span className="text-muted-foreground">Distribuídos</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6E0933" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6E0933" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1A1E23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#E6E4E1', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.04)', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="leads"       name="Leads"       stroke="#6E0933" strokeWidth={2.5} fill="url(#gLeads)" dot={false} />
                <Area type="monotone" dataKey="distribuidos" name="Distribuídos" stroke="#10B981" strokeWidth={2.5} fill="url(#gDist)"  dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie + Origem */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
              <p className="text-sm font-semibold text-foreground mb-1">Por temperatura</p>
              <p className="text-xs text-muted-foreground mb-4">Distribuição atual da base</p>
              <div className="flex justify-center">
                <PieChart width={150} height={150}>
                  <Pie data={pieData} cx={70} cy={70} innerRadius={44} outerRadius={68} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1A1E23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#E6E4E1', fontSize: 12 }} />
                </PieChart>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 rounded-full" style={{ width: `${Math.max(8, (item.value / totalLeads) * 60)}px`, background: item.color, opacity: 0.4 }} />
                      <span className="text-xs font-semibold text-foreground w-4 text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
              <p className="text-sm font-semibold text-foreground mb-1">Origem dos leads</p>
              <p className="text-xs text-muted-foreground mb-4">Por fonte de entrada</p>
              <div className="space-y-3">
                {[
                  { label: 'Manual', value: totalManual, icon: UserPen, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
                  { label: 'Formulário externo', value: totalFormulario, icon: MonitorSmartphone, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                  { label: 'Importação', value: totalImportacao, icon: FileInput, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                      <item.icon size={13} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-bold text-foreground">{item.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/08 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${totalLeads > 0 ? (item.value / totalLeads) * 100 : 0}%`, background: item.color, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listas ── */}
      <div>
        <SectionTitle>Operação em tempo real</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Leads recentes */}
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Leads recentes</p>
                <p className="text-xs text-muted-foreground mt-0.5">Mais recentes primeiro</p>
              </div>
              <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {leadsRecentes.map(lead => {
                const corretor = lead.corretorAtribuido ? corretorById[lead.corretorAtribuido] : null
                return (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #6E0933 0%, #9B1245 100%)' }}>
                      {lead.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-white">{lead.nome}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: STATUS_COLOR[lead.status], background: `${STATUS_COLOR[lead.status]}18` }}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{lead.cidade} · {lead.origem}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                          Score {lead.scoreLead}
                        </span>
                        <LeadTemperatureBadge temperatura={lead.temperaturaLead} />
                        {corretor && <span className="text-[10px] text-muted-foreground truncate">→ {corretor.nome.split(' ')[0]}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Top corretores */}
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Top corretores</p>
                <p className="text-xs text-muted-foreground mt-0.5">Por score de performance</p>
              </div>
              <Link href="/ranking" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Ver ranking <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {topCorretores.map((c, i) => (
                <div key={c.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors">
                  <span className="text-xs font-black mt-2 shrink-0 w-5 text-right" style={{ color: i === 0 ? '#6E0933' : '#4B5563' }}>
                    #{i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: i === 0 ? 'linear-gradient(135deg, #6E0933 0%, #9B1245 100%)' : '#252A30' }}>
                    {c.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{c.nome}</p>
                      <BrokerLevelBadge nivel={c.nivel} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="font-bold text-foreground">{c.scoreCorretor}</span> score
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={9} />
                        <span className="font-semibold text-foreground">{c.tempoMedioAtendimento}min</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        <span className="font-semibold text-emerald-400">{c.taxaConversao}%</span> conv.
                      </span>
                      <span className={`text-[10px] font-semibold ${c.leadsEmAberto >= 15 ? 'text-red-400' : c.leadsEmAberto >= 10 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        {c.leadsEmAberto} em aberto
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
