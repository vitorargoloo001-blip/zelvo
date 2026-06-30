'use client'

import { useZelvoStore, ESTADO_INICIAL } from '@/stores/zelvoStore'
import { AccessGuard } from '@/components/AccessGuard'
import { PageHeader } from '@/components/PageHeader'
import { useState, useEffect } from 'react'
import {
  Database, Users, GitBranch, Activity, User, Shield,
  CheckCircle2, XCircle, RotateCcw, AlertTriangle, RefreshCw,
  Globe, Server, Layers, KeyRound,
} from 'lucide-react'
import { AUTH_MODE } from '@/config/authMode'

function InfoRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function DiagCard({ title, icon: Icon, color, children }: { title: string; icon: typeof Database; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: '#1F2329', borderColor: `${color}20` }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function DiagnosticoContent() {
  const leads         = useZelvoStore(s => s.leads)
  const corretores    = useZelvoStore(s => s.corretores)
  const distribuicoes = useZelvoStore(s => s.distribuicoes)
  const atividades    = useZelvoStore(s => s.atividades)
  const usuarioAtual  = useZelvoStore(s => s.usuarioAtual)
  const sessao        = useZelvoStore(s => s.sessao)
  const authLoading   = useZelvoStore(s => s.authLoading)
  const resetarDados  = useZelvoStore(s => s.resetarDados)

  const [localStorageAtivo, setLocalStorageAtivo] = useState<boolean | null>(null)
  const [storageSize,       setStorageSize]        = useState<string>('-')
  const [ultimaAtualizacao, setUltimaAtualizacao]  = useState<string>('-')
  const [confirmando, setConfirmando] = useState(false)
  const [resetado,    setResetado]    = useState(false)

  // Variáveis de ambiente — lidas no client (apenas NEXT_PUBLIC_*)
  const authMode          = AUTH_MODE
  const dataMode          = process.env.NEXT_PUBLIC_DATA_MODE || 'local'
  const supabaseUrl       = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseConfigured = !!(supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const vercelUrl         = process.env.NEXT_PUBLIC_VERCEL_URL
  const isVercel          = !!(process.env.NEXT_PUBLIC_VERCEL_URL)
  const ambiente          = isVercel ? 'Produção (Vercel)' : 'Local (desenvolvimento)'

  useEffect(() => {
    // Testa se localStorage está disponível
    try {
      localStorage.setItem('_zelvo_test', '1')
      localStorage.removeItem('_zelvo_test')
      setLocalStorageAtivo(true)

      // Tamanho da store no localStorage
      const raw = localStorage.getItem('zelvo-mvp-storage')
      if (raw) {
        const kb = (new TextEncoder().encode(raw).length / 1024).toFixed(1)
        setStorageSize(`${kb} KB`)
      }
    } catch {
      setLocalStorageAtivo(false)
    }
    setUltimaAtualizacao(new Date().toLocaleString('pt-BR'))
  }, [leads.length, atividades.length])

  function handleReset() {
    if (!confirmando) { setConfirmando(true); return }
    resetarDados()
    setConfirmando(false)
    setResetado(true)
    setTimeout(() => setResetado(false), 3000)
  }

  const dadosIniciais =
    leads.length === ESTADO_INICIAL.leads.length &&
    corretores.length === ESTADO_INICIAL.corretores.length

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Diagnóstico do MVP"
        description="Estado interno da store, sessão e localStorage"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads',        value: leads.length,         icon: Database,   color: '#3B82F6' },
          { label: 'Corretores',   value: corretores.length,    icon: Users,      color: '#10B981' },
          { label: 'Distribuições', value: distribuicoes.length, icon: GitBranch,  color: '#8B5CF6' },
          { label: 'Atividades',   value: atividades.length,    icon: Activity,   color: '#F59E0B' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4" style={{ background: '#1F2329', borderColor: `${m.color}20` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <m.icon size={13} style={{ color: m.color }} />
            </div>
            <p className="text-3xl font-black" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Cards de ambiente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <DiagCard title="Modo de dados" icon={Layers} color="#A78BFA">
          <InfoRow label="DATA_MODE"        value={dataMode} mono />
          <InfoRow label="AUTH_MODE"        value={authMode} mono />
          <InfoRow label="Fonte de dados"   value={dataMode === 'local' ? 'Zustand + localStorage' : 'Supabase'} />
          <InfoRow label="Autenticação"     value={authMode === 'mock' ? 'UserSwitcher (demo)' : 'Supabase Auth (real)'} />
          <InfoRow label="Supabase URL"     value={supabaseConfigured ? 'Configurado ✓' : 'Não configurado'} />
          <InfoRow label="ANON KEY"         value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado ✓' : 'Não configurada'} />
          {supabaseUrl && (
            <InfoRow label="URL"
              value={supabaseUrl.replace('https://', '').replace('.supabase.co', '…')}
              mono
            />
          )}
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Para ativar auth real: defina NEXT_PUBLIC_AUTH_MODE=supabase na Vercel e crie os usuários no painel do Supabase.
            </p>
          </div>
        </DiagCard>

        <DiagCard title="Ambiente de execução" icon={Server} color="#34D399">
          <div className="flex items-center justify-between py-2.5 border-b border-border/50">
            <span className="text-xs text-muted-foreground">Plataforma</span>
            <span className={`text-xs font-semibold ${isVercel ? 'text-emerald-400' : 'text-blue-400'}`}>
              {isVercel ? '▲ Vercel' : '⬡ Local'}
            </span>
          </div>
          <InfoRow label="Ambiente"          value={ambiente} />
          <InfoRow label="NEXT_PUBLIC_VERCEL_URL" value={vercelUrl || 'não definida'} mono />
          <InfoRow label="Node runtime"      value="Edge / Node.js (Vercel)" />
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              NEXT_PUBLIC_VERCEL_URL é injetada automaticamente pela Vercel em produção.
            </p>
          </div>
        </DiagCard>

        <DiagCard title="Endpoint de intake" icon={Globe} color="#F59E0B">
          <InfoRow label="Rota"          value="POST /api/leads/intake" mono />
          <InfoRow label="Status"        value={dataMode === 'local' ? 'Preparado (mock)' : 'Aguardando implementação'} />
          <InfoRow label="Método GET"    value="Health check disponível" />
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Futuro: landing page externa → POST /api/leads/intake → Supabase → distribuição automática.
            </p>
          </div>
        </DiagCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sessão */}
        <DiagCard title="Autenticação" icon={KeyRound} color="#6E0933">
          <InfoRow label="Modo"            value={authMode === 'mock' ? 'Mock (UserSwitcher)' : 'Supabase Auth'} />
          <InfoRow label="Usuário atual"   value={usuarioAtual.nome} />
          <InfoRow label="Perfil"          value={usuarioAtual.perfil} />
          <InfoRow label="Email"           value={usuarioAtual.email} />
          <InfoRow label="corretorId"      value={usuarioAtual.corretorId ?? '—'} mono />
          <InfoRow label="ID"              value={usuarioAtual.id} mono />
          {authMode === 'supabase' && (
            <>
              <InfoRow label="Sessão ativa"    value={sessao ? 'Sim ✓' : authLoading ? 'Verificando…' : 'Não'} />
              {sessao && (
                <InfoRow label="User ID (auth)" value={sessao.userId.slice(0, 18) + '…'} mono />
              )}
            </>
          )}
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              {authMode === 'mock'
                ? 'Modo demo: troque de perfil pelo UserSwitcher. Sem login real.'
                : 'Auth real ativa. Login via /login, logout pelo botão no topo.'
              }
            </p>
          </div>
        </DiagCard>

        {/* localStorage */}
        <DiagCard title="Persistência (localStorage)" icon={Database} color="#06B6D4">
          <div className="flex items-center gap-2 py-2.5 border-b border-border/50">
            <span className="text-xs text-muted-foreground flex-1">localStorage disponível</span>
            {localStorageAtivo === null ? (
              <RefreshCw size={11} className="text-muted-foreground animate-spin" />
            ) : localStorageAtivo ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-400"><CheckCircle2 size={11} /> Ativo</span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle size={11} /> Indisponível</span>
            )}
          </div>
          <InfoRow label="Chave"              value="zelvo-mvp-storage" mono />
          <InfoRow label="Tamanho estimado"   value={storageSize} />
          <InfoRow label="Última atualização" value={ultimaAtualizacao} />
          <InfoRow label="Estado inicial?"    value={dadosIniciais ? 'Sim (não modificado)' : 'Modificado'} />
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              {/* Futuro: substituir por Supabase com Row Level Security */}
              Futuro: dados persistidos no Supabase com RLS por usuário.
            </p>
          </div>
        </DiagCard>

        {/* Integridade */}
        <DiagCard title="Integridade dos dados" icon={Shield} color="#22C55E">
          {[
            { label: 'Leads com corretor atribuído', value: leads.filter(l => l.corretorAtribuido).length + ' / ' + leads.length },
            { label: 'Leads com próxima ação',       value: leads.filter(l => l.proximaAcao).length + ' / ' + leads.length },
            { label: 'Distribuições órfãs',          value: distribuicoes.filter(d => !leads.find(l => l.id === d.leadId)).length + ' (esperado: 0)' },
            { label: 'Corretores ativos',             value: corretores.filter(c => c.ativo).length + ' / ' + corretores.length },
            { label: 'Usuários na store',             value: useZelvoStore.getState().usuarios.length },
          ].map(r => <InfoRow key={r.label} label={r.label} value={r.value} />)}
        </DiagCard>

        {/* Reset */}
        <DiagCard title="Manutenção do MVP" icon={RotateCcw} color="#EF4444">
          <p className="text-xs text-muted-foreground mb-4">
            Restaura todos os leads, corretores, distribuições e atividades ao estado inicial do MVP.
            Todos os dados criados durante a sessão serão perdidos.
          </p>
          {resetado ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 size={14} /> Dados restaurados com sucesso
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: confirmando ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${confirmando ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: confirmando ? '#EF4444' : '#9CA3AF',
                }}
              >
                {confirmando ? <AlertTriangle size={13} /> : <RotateCcw size={13} />}
                {confirmando ? 'Confirmar reset' : 'Resetar dados do MVP'}
              </button>
              {confirmando && (
                <button onClick={() => setConfirmando(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              )}
            </div>
          )}
        </DiagCard>
      </div>

      {/* Mapa de serviços futuros */}
      <div className="rounded-xl border border-border p-5" style={{ background: '#1F2329' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Pontos de integração com Supabase (V2)
        </p>
        <div className="space-y-2">
          {[
            { file: 'src/services/authService.ts',        ponto: '✓ Implementado: login, logout, recuperação de senha via Supabase Auth', done: true },
            { file: 'src/components/AuthProvider.tsx',    ponto: '✓ Implementado: listener de sessão, sync com zelvoStore, redirect para /login', done: true },
            { file: 'src/app/login/page.tsx',             ponto: '✓ Implementado: tela de login com email + senha', done: true },
            { file: 'src/services/leadService.ts',        ponto: 'Pendente: POST /api/leads/intake + RLS por corretorId', done: false },
            { file: 'src/services/corretorService.ts',    ponto: 'Pendente: métricas calculadas via Postgres functions', done: false },
            { file: 'src/services/distribuicaoService.ts', ponto: 'Pendente: distribuição via Edge Function server-side', done: false },
            { file: 'src/stores/zelvoStore.ts',           ponto: 'Pendente: localStorage → sync Supabase realtime', done: false },
            { file: 'src/lib/access.ts',                  ponto: 'Pendente: podeAcessarLead → Row Level Security no banco', done: false },
          ].map(s => (
            <div key={s.file} className="flex items-start gap-3 text-xs">
              <code className={`text-[10px] font-mono shrink-0 mt-0.5 ${s.done ? 'text-emerald-400' : 'text-amber-400'}`}>{s.file}</code>
              <span className="text-muted-foreground">{s.ponto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DiagnosticoPage() {
  return (
    <AccessGuard allowedProfiles={['gerente']}>
      <DiagnosticoContent />
    </AccessGuard>
  )
}
