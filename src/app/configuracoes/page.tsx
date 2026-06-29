'use client'

import { useState } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { AccessGuard } from '@/components/AccessGuard'
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-5 mb-4" style={{ background: 'var(--card)' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, description, control }: { label: string; description?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="ml-4 shrink-0">{control}</div>
    </div>
  )
}

const inputCls = 'bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-40 text-right'

function ConfiguracoesContent() {
  const resetarDados = useZelvoStore(s => s.resetarDados)
  const totalLeads   = useZelvoStore(s => s.leads.length)

  const [confirmando, setConfirmando] = useState(false)
  const [resetado,    setResetado]    = useState(false)

  function handleReset() {
    if (!confirmando) {
      setConfirmando(true)
      return
    }
    resetarDados()
    setConfirmando(false)
    setResetado(true)
    setTimeout(() => setResetado(false), 3000)
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Regras de score e distribuição do sistema" />

      <Section title="Regras de Score do Lead">
        <Row label="Renda mínima para +25 pts" description="Lead com renda acima desse valor ganha pontuação" control={<input readOnly className={inputCls} defaultValue="R$ 3.500" />} />
        <Row label="Entrada mínima para +15 pts" description="Valor mínimo de entrada considerado positivo" control={<input readOnly className={inputCls} defaultValue="R$ 10.000" />} />
        <Row label="Bônus FGTS" description="Pontos extras se o lead possui FGTS" control={<input readOnly className={inputCls} defaultValue="+10 pts" />} />
        <Row label="Bônus urgência 30 dias" description="Pontos extras para intenção de compra imediata" control={<input readOnly className={inputCls} defaultValue="+20 pts" />} />
        <Row label="Penalidade renda baixa" description="Renda familiar abaixo de R$ 2.500" control={<input readOnly className={inputCls} defaultValue="-30 pts" />} />
        <Row label="Penalidade sem previsão" description="Prazo de compra 'sem previsão'" control={<input readOnly className={inputCls} defaultValue="-20 pts" />} />
      </Section>

      <Section title="Faixas de Temperatura">
        <Row label="Premium" description="Prioridade máxima — Corretor Nível A" control={<span className="text-xs font-semibold text-purple-400 bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 rounded-md">80 – 100</span>} />
        <Row label="Quente"  description="Alta prioridade — Corretor Nível A ou B" control={<span className="text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/20 px-2 py-0.5 rounded-md">60 – 79</span>} />
        <Row label="Morno"   description="Prioridade moderada — Corretor Nível B ou C" control={<span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-md">40 – 59</span>} />
        <Row label="Frio"    description="Nutrição — Corretor Nível C ou D" control={<span className="text-xs font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 rounded-md">0 – 39</span>} />
      </Section>

      <Section title="Regras de Distribuição">
        <Row label="Limite de leads em aberto" description="Corretor com mais leads do que esse valor não recebe novos, exceto se não houver outro disponível" control={<input readOnly className={inputCls} defaultValue="15 leads" />} />
        <Row label="Critério de desempate 1" description="Maior scoreCorretor"          control={<span className="text-xs text-muted-foreground">Automático</span>} />
        <Row label="Critério de desempate 2" description="Menor leadsEmAberto"          control={<span className="text-xs text-muted-foreground">Automático</span>} />
        <Row label="Critério de desempate 3" description="Maior taxaConversao"          control={<span className="text-xs text-muted-foreground">Automático</span>} />
        <Row label="Critério de desempate 4" description="Menor tempoMedioAtendimento"  control={<span className="text-xs text-muted-foreground">Automático</span>} />
      </Section>

      <Section title="Níveis dos Corretores">
        <Row label="Nível A" control={<span className="text-xs font-semibold text-emerald-400">85 – 100</span>} />
        <Row label="Nível B" control={<span className="text-xs font-semibold text-blue-400">65 – 84</span>} />
        <Row label="Nível C" control={<span className="text-xs font-semibold text-amber-400">40 – 64</span>} />
        <Row label="Nível D" control={<span className="text-xs font-semibold text-red-400">0 – 39</span>} />
      </Section>

      {/* ── Reset do MVP ── */}
      <div className="rounded-xl border p-5" style={{ background: confirmando ? 'rgba(239,68,68,0.06)' : 'var(--card)', borderColor: confirmando ? 'rgba(239,68,68,0.25)' : undefined }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Dados do MVP</p>
            <p className="text-sm font-semibold text-foreground">Resetar dados do MVP</p>
            <p className="text-xs text-muted-foreground mt-1">
              Restaura os {totalLeads > 15 ? `${totalLeads} leads e demais dados` : '15 leads, 8 corretores e 9 distribuições'} iniciais.
              {' '}Todos os dados criados durante a sessão serão perdidos.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {resetado ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 size={15} />
                Dados restaurados
              </div>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: confirmando ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${confirmando ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: confirmando ? '#EF4444' : '#9CA3AF',
                  }}
                >
                  {confirmando ? <AlertTriangle size={13} /> : <RotateCcw size={13} />}
                  {confirmando ? 'Confirmar reset' : 'Resetar dados'}
                </button>
                {confirmando && (
                  <button
                    onClick={() => setConfirmando(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        As configurações acima fazem parte do MVP V1 com valores fixos. Na Versão 2, estas regras serão editáveis sem necessidade de código.
      </p>
    </div>
  )
}

export default function ConfiguracoesPage() {
  return (
    <AccessGuard allowedProfiles={['gerente']}>
      <ConfiguracoesContent />
    </AccessGuard>
  )
}
