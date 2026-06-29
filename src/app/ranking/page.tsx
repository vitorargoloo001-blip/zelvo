'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { BrokerRanking } from '@/components/BrokerRanking'
import { BrokerLevelBadge } from '@/components/BrokerLevelBadge'
import { AccessGuard } from '@/components/AccessGuard'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts'

const NIVEL_COLORS: Record<string, string> = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' }

export default function RankingPage() {
  const corretores = useZelvoStore(s => s.corretores)
  const sorted     = [...corretores].sort((a, b) => b.scoreCorretor - a.scoreCorretor)
  const top3   = sorted.slice(0, 3)

  const barData = corretores.map(c => ({ name: c.nome.split(' ')[0], score: c.scoreCorretor, nivel: c.nivel }))

  return (
    <AccessGuard allowedProfiles={['gerente']}>
    <div>
      <PageHeader title="Ranking dos Corretores" description="Performance e meritocracia operacional" />

      {/* Pódio */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {top3.map((c, i) => (
          <div
            key={c.id}
            className="rounded-xl border p-5 text-center"
            style={{ background: i === 0 ? 'rgba(110,9,51,0.12)' : 'var(--card)', borderColor: i === 0 ? 'rgba(110,9,51,0.3)' : 'rgba(255,255,255,0.07)' }}
          >
            <div className="text-2xl mb-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2" style={{ background: i === 0 ? '#6E0933' : '#2D2D2D' }}>
              {c.nome.charAt(0)}
            </div>
            <p className="font-semibold text-foreground text-sm">{c.nome}</p>
            <div className="flex justify-center mt-1.5"><BrokerLevelBadge nivel={c.nivel} /></div>
            <p className="text-3xl font-black mt-3" style={{ color: i === 0 ? '#6E0933' : '#E6E4E1' }}>{c.scoreCorretor}</p>
            <p className="text-xs text-muted-foreground">score</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-muted-foreground">Vendas</p>
                <p className="font-bold text-foreground">{c.vendasFechadas}</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-muted-foreground">Conversão</p>
                <p className="font-bold text-foreground">{c.taxaConversao}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
          <p className="text-sm font-semibold text-foreground mb-4">Score por corretor</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1F2329', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#E6E4E1', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={NIVEL_COLORS[entry.nivel]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {Object.entries(NIVEL_COLORS).map(([nivel, color]) => (
              <div key={nivel} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                Nível {nivel}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
          <p className="text-sm font-semibold text-foreground mb-4">Radar — Top 3</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={[
              { metric: 'Conversão', ...Object.fromEntries(top3.map(c => [c.nome.split(' ')[0], c.taxaConversao])) },
              { metric: 'Velocidade', ...Object.fromEntries(top3.map(c => [c.nome.split(' ')[0], Math.max(0, 100 - c.tempoMedioAtendimento)])) },
              { metric: 'Vendas', ...Object.fromEntries(top3.map(c => [c.nome.split(' ')[0], Math.min(100, (c.vendasFechadas / 30) * 100)])) },
              { metric: 'Aberto', ...Object.fromEntries(top3.map(c => [c.nome.split(' ')[0], Math.min(100, ((c.leadsRecebidos - c.leadsEmAberto) / Math.max(c.leadsRecebidos, 1)) * 100)])) },
            ]}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6B7280' }} />
              {top3.map((c, i) => (
                <Radar key={c.id} name={c.nome.split(' ')[0]} dataKey={c.nome.split(' ')[0]} stroke={['#6E0933', '#10B981', '#3B82F6'][i]} fill={['#6E0933', '#10B981', '#3B82F6'][i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Tooltip contentStyle={{ background: '#1F2329', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#E6E4E1', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
        <p className="text-sm font-semibold text-foreground mb-4">Ranking completo</p>
        <BrokerRanking corretores={corretores} />
      </div>
    </div>
    </AccessGuard>
  )
}
