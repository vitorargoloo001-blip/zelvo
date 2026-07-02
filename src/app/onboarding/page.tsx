'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AccessGuard } from '@/components/AccessGuard'
import {
  Building2, UserCheck, Users, Target, GitBranch,
  Inbox, CheckCircle2, Circle, ChevronRight, ArrowRight, Loader2,
} from 'lucide-react'
import type { OnboardingStatus } from '@/lib/types'

const ETAPAS = [
  {
    id: 'empresaConfigurada' as keyof OnboardingStatus,
    titulo: 'Dados da empresa',
    descricao: 'Configure o nome, CNPJ, cidade e contatos da sua imobiliária.',
    icone: Building2,
    link: '/configuracoes?aba=empresa',
    acao: 'Configurar empresa',
  },
  {
    id: 'corretoresConfigurados' as keyof OnboardingStatus,
    titulo: 'Criar corretores',
    descricao: 'Cadastre sua equipe de corretores com nível, capacidade e se participam da distribuição.',
    icone: UserCheck,
    link: '/configuracoes?aba=corretores',
    acao: 'Gerenciar corretores',
  },
  {
    id: 'usuariosConfigurados' as keyof OnboardingStatus,
    titulo: 'Criar usuários',
    descricao: 'Crie os usuários do sistema, vincule corretores e defina os perfis de acesso.',
    icone: Users,
    link: '/configuracoes?aba=usuarios',
    acao: 'Gerenciar usuários',
  },
  {
    id: 'scoreConfigurado' as keyof OnboardingStatus,
    titulo: 'Revisar score do lead',
    descricao: 'Ajuste os pesos das regras de pontuação de leads para a realidade da sua equipe.',
    icone: Target,
    link: '/configuracoes?aba=score',
    acao: 'Configurar score',
  },
  {
    id: 'distribuicaoConfigurada' as keyof OnboardingStatus,
    titulo: 'Revisar distribuição',
    descricao: 'Defina quais níveis de corretor recebem leads Premium, Quente, Morno e Frio.',
    icone: GitBranch,
    link: '/configuracoes?aba=distribuicao',
    acao: 'Configurar distribuição',
  },
  {
    id: 'testeLeadCriado' as keyof OnboardingStatus,
    titulo: 'Testar cadastro de lead',
    descricao: 'Crie um lead de teste para verificar score, temperatura e distribuição automática.',
    icone: Inbox,
    link: '/leads/novo',
    acao: 'Criar lead de teste',
  },
] as const

function EtapaCard({
  etapa, concluida, atual, onClick,
}: {
  etapa: (typeof ETAPAS)[number]
  concluida: boolean
  atual: boolean
  onClick: () => void
}) {
  const Icon = etapa.icone

  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        background:   concluida ? 'rgba(16,185,129,0.04)' : atual ? 'rgba(110,9,51,0.08)' : '#1A1E23',
        borderColor:  concluida ? 'rgba(16,185,129,0.2)' : atual ? 'rgba(110,9,51,0.35)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: concluida ? 'rgba(16,185,129,0.15)' : atual ? 'rgba(110,9,51,0.15)' : 'rgba(255,255,255,0.05)' }}
        >
          {concluida
            ? <CheckCircle2 size={16} className="text-emerald-400" />
            : <Icon size={16} style={{ color: atual ? '#6E0933' : '#6B7280' }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{etapa.titulo}</p>
            {concluida && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
            {!concluida && <Circle size={14} className="text-border shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{etapa.descricao}</p>
          {!concluida && (
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={etapa.link}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                style={{ background: atual ? '#6E0933' : 'rgba(255,255,255,0.07)' }}
              >
                {etapa.acao} <ChevronRight size={11} />
              </Link>
              <button
                onClick={onClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Marcar como feito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const [status,  setStatus]  = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    const d = await fetch('/api/onboarding').then(r => r.json()).catch(() => null)
    setStatus(d?.status ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function marcarFeito(campo: keyof OnboardingStatus) {
    const r = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: true }),
    })
    const d = await r.json()
    setStatus(d.status)
    if (d.status?.concluido) router.push('/dashboard')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  )

  if (!status) return (
    <div className="text-center py-16 text-muted-foreground text-sm">
      Erro ao carregar onboarding. Tente recarregar a página.
    </div>
  )

  const concluidas = ETAPAS.filter(e => status[e.id as keyof OnboardingStatus]).length
  const total      = ETAPAS.length
  const progresso  = Math.round((concluidas / total) * 100)
  const primeiraAberta = ETAPAS.find(e => !status[e.id as keyof OnboardingStatus])

  if (status.concluido) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Zelvo configurado!</h2>
        <p className="text-muted-foreground text-sm">O sistema está pronto para uso pela sua equipe.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#6E0933' }}>
          Ir para o dashboard <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 pb-10">

      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, #1F2329, #16191D)', borderColor: 'rgba(110,9,51,0.25)' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Configuração inicial</p>
        <h1 className="text-2xl font-black text-white mb-1">Configurar o Zelvo</h1>
        <p className="text-sm text-muted-foreground">Siga as etapas abaixo para preparar o sistema para a sua equipe.</p>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{concluidas} de {total} etapas concluídas</span>
            <span className="font-bold text-foreground">{progresso}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/08 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso}%`, background: 'linear-gradient(90deg, #6E0933, #9B1245)' }}
            />
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-3">
        {ETAPAS.map(etapa => (
          <EtapaCard
            key={etapa.id}
            etapa={etapa}
            concluida={!!status[etapa.id as keyof OnboardingStatus]}
            atual={etapa === primeiraAberta}
            onClick={() => marcarFeito(etapa.id as keyof OnboardingStatus)}
          />
        ))}
      </div>

      {/* Finalizar */}
      {concluidas === total && (
        <button
          onClick={() => marcarFeito('concluido' as keyof OnboardingStatus)}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          style={{ background: '#6E0933' }}
        >
          Finalizar configuração <ArrowRight size={14} />
        </button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Você pode revisar as configurações a qualquer momento em{' '}
        <Link href="/configuracoes" className="text-foreground hover:underline">Configurações</Link>.
      </p>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <AccessGuard allowedProfiles={['gerente']}>
      <OnboardingContent />
    </AccessGuard>
  )
}
