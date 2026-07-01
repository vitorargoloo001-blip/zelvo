'use client'

import { useZelvoStore, ESTADO_INICIAL } from '@/stores/zelvoStore'
import { AccessGuard } from '@/components/AccessGuard'
import { PageHeader } from '@/components/PageHeader'
import { useState, useEffect } from 'react'
import {
  Database, Users, GitBranch, Activity, Shield,
  CheckCircle2, XCircle, RotateCcw, AlertTriangle, RefreshCw,
  Globe, Server, Layers, KeyRound, Zap, Bell, Mail,
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

function StatusBadge({ ok, labelSim = 'Sim', labelNao = 'Não' }: { ok: boolean; labelSim?: string; labelNao?: string }) {
  return ok
    ? <span className="flex items-center gap-1 text-xs font-semibold text-green-400"><CheckCircle2 size={11} /> {labelSim}</span>
    : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle size={11} /> {labelNao}</span>
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

interface NotifDiag {
  totalNotificacoes: number
  naoLidas:          number
  emailsEnviados:    number
  emailsErro:        number
  resendConfigurado: boolean
  fromConfigurado:   boolean
}

interface IntakeDiag {
  endpointDisponivel:   boolean
  secretConfigurado:    boolean
  origensConfiguradas:  boolean
  totalLeadsExternos:   number
  ultimosLeadsExternos: Array<{
    id:               string
    nome:             string
    campanha:         string
    temperaturaLead:  string
    scoreLead:        number
    createdAt:        string
    formularioOrigem: string | null
    dispositivo:      string | null
  }>
}

const TEMP_COLORS: Record<string, string> = {
  Premium: '#F59E0B',
  Quente:  '#EF4444',
  Morno:   '#FBBF24',
  Frio:    '#3B82F6',
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
  const [intakeDiag,    setIntakeDiag]    = useState<IntakeDiag | null>(null)
  const [intakeLoading, setIntakeLoading] = useState(false)
  const [notifDiag,     setNotifDiag]     = useState<NotifDiag | null>(null)
  const [notifLoading,  setNotifLoading]  = useState(false)
  const [testNotif,     setTestNotif]     = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [alertResult,   setAlertResult]   = useState<{ leadsParados: number; leadsSemAcao: number; corresSobrecarregados: number } | null>(null)
  const [alertLoading,  setAlertLoading]  = useState(false)

  const authMode = AUTH_MODE
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'local'
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  const isVercel  = !!(process.env.NEXT_PUBLIC_VERCEL_URL)
  const ambiente  = isVercel ? 'Produção (Vercel)' : 'Local (desenvolvimento)'

  useEffect(() => {
    try {
      localStorage.setItem('_zelvo_test', '1')
      localStorage.removeItem('_zelvo_test')
      setLocalStorageAtivo(true)
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

  // Busca dados de intake (server-side) quando em modo cloud
  useEffect(() => {
    if (authMode !== 'cloud') return
    setIntakeLoading(true)
    fetch('/api/diagnostico/intake')
      .then(r => r.ok ? r.json() : null)
      .then((data: IntakeDiag | null) => { if (data) setIntakeDiag(data) })
      .catch(() => {})
      .finally(() => setIntakeLoading(false))
  }, [authMode])

  // Busca stats de notificações quando em modo cloud
  useEffect(() => {
    if (authMode !== 'cloud') return
    setNotifLoading(true)
    fetch('/api/diagnostico/notificacoes')
      .then(r => r.ok ? r.json() : null)
      .then((data: NotifDiag | null) => { if (data) setNotifDiag(data) })
      .catch(() => {})
      .finally(() => setNotifLoading(false))
  }, [authMode])

  async function handleTestNotif() {
    setTestNotif('loading')
    try {
      const r = await fetch('/api/notificacoes/teste', { method: 'POST' })
      setTestNotif(r.ok ? 'ok' : 'err')
    } catch { setTestNotif('err') }
    setTimeout(() => setTestNotif('idle'), 4000)
  }

  async function handleVerificarAlertas() {
    setAlertLoading(true)
    try {
      const r = await fetch('/api/alertas/verificar', { method: 'POST' })
      if (r.ok) setAlertResult(await r.json())
    } catch { /* silencioso */ }
    setAlertLoading(false)
  }

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
          { label: 'Leads',         value: leads.length,         icon: Database,  color: '#3B82F6' },
          { label: 'Corretores',    value: corretores.length,    icon: Users,     color: '#10B981' },
          { label: 'Distribuições', value: distribuicoes.length, icon: GitBranch, color: '#8B5CF6' },
          { label: 'Atividades',    value: atividades.length,    icon: Activity,  color: '#F59E0B' },
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
          <InfoRow label="DATA_MODE"      value={dataMode} mono />
          <InfoRow label="AUTH_MODE"      value={authMode} mono />
          <InfoRow label="Fonte de dados" value={dataMode === 'local' ? 'Zustand + localStorage' : 'Postgres (Vercel/Neon)'} />
          <InfoRow label="Autenticação"   value={authMode === 'mock' ? 'UserSwitcher (demo)' : 'Auth.js (real)'} />
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              Credenciais do banco/Auth.js não são expostas no client. Para ativar o modo cloud: defina
              NEXT_PUBLIC_AUTH_MODE=cloud e NEXT_PUBLIC_DATA_MODE=cloud na Vercel após provisionar o Postgres.
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
          <InfoRow label="Ambiente"               value={ambiente} />
          <InfoRow label="NEXT_PUBLIC_VERCEL_URL" value={vercelUrl || 'não definida'} mono />
          <InfoRow label="Node runtime"           value="Edge / Node.js (Vercel)" />
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              NEXT_PUBLIC_VERCEL_URL é injetada automaticamente pela Vercel em produção.
            </p>
          </div>
        </DiagCard>

        <DiagCard title="Endpoint de intake" icon={Globe} color="#F59E0B">
          <InfoRow label="Rota"       value="POST /api/leads/intake" mono />
          <InfoRow label="Método GET" value="Removido (apenas POST)" />
          <div className="flex items-center justify-between py-2.5 border-b border-border/50">
            <span className="text-xs text-muted-foreground">Endpoint disponível</span>
            <StatusBadge ok={true} />
          </div>
          {intakeLoading && (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <RefreshCw size={11} className="animate-spin" /> Verificando configuração…
            </div>
          )}
          {intakeDiag && !intakeLoading && (
            <>
              <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">LEAD_INTAKE_SECRET</span>
                <StatusBadge ok={intakeDiag.secretConfigurado} labelSim="Configurado" labelNao="Não configurado" />
              </div>
              <div className="flex items-center justify-between py-2.5 last:border-0">
                <span className="text-xs text-muted-foreground">Origens permitidas</span>
                <StatusBadge ok={intakeDiag.origensConfiguradas} labelSim="Configuradas" labelNao="Não configuradas" />
              </div>
            </>
          )}
          {!intakeDiag && !intakeLoading && authMode !== 'cloud' && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Ative AUTH_MODE=cloud para ver a configuração do intake.
            </p>
          )}
        </DiagCard>
      </div>

      {/* Seção: Intake de Leads */}
      {(intakeDiag || authMode === 'cloud') && (
        <div className="rounded-xl border p-5" style={{ background: '#1F2329', borderColor: '#F59E0B20' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#F59E0B18' }}>
              <Zap size={13} style={{ color: '#F59E0B' }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>Intake de Leads</p>
            {intakeDiag && (
              <span className="ml-auto text-xs text-muted-foreground">
                Total via formulário externo:
                <span className="ml-1 font-bold text-foreground">{intakeDiag.totalLeadsExternos}</span>
              </span>
            )}
          </div>

          {intakeLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <RefreshCw size={11} className="animate-spin" /> Carregando dados de intake…
            </div>
          )}

          {intakeDiag && !intakeLoading && (
            <>
              {intakeDiag.ultimosLeadsExternos.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Nenhum lead recebido via formulário externo ainda.
                </p>
              ) : (
                <div className="space-y-0">
                  <div className="grid grid-cols-5 gap-2 pb-2 border-b border-border/50">
                    {['Nome', 'Campanha', 'Temperatura', 'Score', 'Recebido em'].map(h => (
                      <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</span>
                    ))}
                  </div>
                  {intakeDiag.ultimosLeadsExternos.map(lead => (
                    <div key={lead.id} className="grid grid-cols-5 gap-2 py-2.5 border-b border-border/30 last:border-0">
                      <span className="text-xs text-foreground truncate">{lead.nome}</span>
                      <span className="text-xs text-muted-foreground truncate">{lead.campanha || '-'}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: TEMP_COLORS[lead.temperaturaLead] ?? '#9CA3AF' }}
                      >
                        {lead.temperaturaLead}
                      </span>
                      <span className="text-xs text-foreground font-mono">{lead.scoreLead}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!intakeDiag.secretConfigurado && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-amber-400">
                    ⚠ LEAD_INTAKE_SECRET não está configurado — o endpoint aceita qualquer requisição.
                    Defina a variável na Vercel (Settings → Environment Variables).
                  </p>
                </div>
              )}
            </>
          )}

          {!intakeDiag && !intakeLoading && authMode === 'cloud' && (
            <p className="text-xs text-muted-foreground py-2">
              Não foi possível carregar os dados de intake. Verifique se você está autenticado como gerente.
            </p>
          )}

          {authMode !== 'cloud' && !intakeDiag && (
            <p className="text-xs text-muted-foreground py-2">
              Ative AUTH_MODE=cloud e DATA_MODE=cloud para ver estatísticas de intake em tempo real.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sessão */}
        <DiagCard title="Autenticação" icon={KeyRound} color="#6E0933">
          <InfoRow label="Modo"          value={authMode === 'mock' ? 'Mock (UserSwitcher)' : 'Auth.js'} />
          <InfoRow label="Usuário atual" value={usuarioAtual.nome} />
          <InfoRow label="Perfil"        value={usuarioAtual.perfil} />
          <InfoRow label="Email"         value={usuarioAtual.email} />
          <InfoRow label="corretorId"    value={usuarioAtual.corretorId ?? '—'} mono />
          <InfoRow label="ID"            value={usuarioAtual.id} mono />
          {authMode === 'cloud' && (
            <>
              <InfoRow label="Sessão ativa" value={sessao ? 'Sim ✓' : authLoading ? 'Verificando…' : 'Não'} />
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
              Em modo cloud, os dados são persistidos no Postgres via Prisma.
            </p>
          </div>
        </DiagCard>

        {/* Integridade */}
        <DiagCard title="Integridade dos dados" icon={Shield} color="#22C55E">
          {[
            { label: 'Leads com corretor atribuído', value: leads.filter(l => l.corretorAtribuido).length + ' / ' + leads.length },
            { label: 'Leads com próxima ação',       value: leads.filter(l => l.proximaAcao).length + ' / ' + leads.length },
            { label: 'Distribuições órfãs',          value: distribuicoes.filter(d => !leads.find(l => l.id === d.leadId)).length + ' (esperado: 0)' },
            { label: 'Corretores ativos',            value: corretores.filter(c => c.ativo).length + ' / ' + corretores.length },
            { label: 'Usuários na store',            value: useZelvoStore.getState().usuarios.length },
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

        {/* Notificações */}
        <DiagCard title="Notificações" icon={Bell} color="#6E0933">
          {authMode !== 'cloud' ? (
            <p className="text-xs text-muted-foreground">
              Ative AUTH_MODE=cloud para ver estatísticas de notificações.
            </p>
          ) : notifLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <RefreshCw size={11} className="animate-spin" /> Carregando…
            </div>
          ) : notifDiag ? (
            <>
              <InfoRow label="Total de notificações" value={notifDiag.totalNotificacoes} />
              <InfoRow label="Não lidas"              value={notifDiag.naoLidas} />
              <InfoRow label="E-mails enviados"       value={notifDiag.emailsEnviados} />
              <InfoRow label="E-mails com erro"       value={notifDiag.emailsErro} />
              <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Resend configurado</span>
                <StatusBadge ok={notifDiag.resendConfigurado} labelSim="Sim" labelNao="Não" />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">FROM configurado</span>
                <StatusBadge ok={notifDiag.fromConfigurado} labelSim="Sim" labelNao="Default" />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Não foi possível carregar as estatísticas.</p>
          )}

          {authMode === 'cloud' && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
              <button
                onClick={handleTestNotif}
                disabled={testNotif === 'loading'}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{
                  background: testNotif === 'ok' ? 'rgba(16,185,129,0.15)' : testNotif === 'err' ? 'rgba(239,68,68,0.15)' : 'rgba(110,9,51,0.12)',
                  border:     `1px solid ${testNotif === 'ok' ? 'rgba(16,185,129,0.3)' : testNotif === 'err' ? 'rgba(239,68,68,0.3)' : 'rgba(110,9,51,0.3)'}`,
                  color:      testNotif === 'ok' ? '#10B981' : testNotif === 'err' ? '#EF4444' : '#c0375a',
                }}
              >
                {testNotif === 'loading'
                  ? <><RefreshCw size={10} className="animate-spin" /> Criando…</>
                  : testNotif === 'ok'
                  ? <><CheckCircle2 size={10} /> Notificação criada</>
                  : testNotif === 'err'
                  ? <><XCircle size={10} /> Erro ao criar</>
                  : <><Bell size={10} /> Criar notificação de teste</>
                }
              </button>
            </div>
          )}
        </DiagCard>

        {/* Alertas Gerenciais */}
        <DiagCard title="Alertas Gerenciais" icon={Mail} color="#8B5CF6">
          <p className="text-xs text-muted-foreground mb-4">
            Verifica leads parados, sem próxima ação e corretores sobrecarregados.
            Cria notificações internas para os gerentes.
          </p>
          {alertResult && (
            <div className="mb-3 space-y-1">
              <InfoRow label="Leads parados"               value={alertResult.leadsParados} />
              <InfoRow label="Sem próxima ação"            value={alertResult.leadsSemAcao} />
              <InfoRow label="Corretores sobrecarregados"  value={alertResult.corresSobrecarregados} />
            </div>
          )}
          {authMode === 'cloud' ? (
            <button
              onClick={handleVerificarAlertas}
              disabled={alertLoading}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'rgba(139,92,246,0.12)',
                border:     '1px solid rgba(139,92,246,0.3)',
                color:      '#A78BFA',
              }}
            >
              {alertLoading
                ? <><RefreshCw size={10} className="animate-spin" /> Verificando…</>
                : <><AlertTriangle size={10} /> Verificar alertas gerenciais</>
              }
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ative AUTH_MODE=cloud para disparar alertas gerenciais.
            </p>
          )}
        </DiagCard>
      </div>

      {/* Mapa de serviços */}
      <div className="rounded-xl border border-border p-5" style={{ background: '#1F2329' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Pontos de integração com Postgres + Auth.js
        </p>
        <div className="space-y-2">
          {[
            { file: 'src/services/authService.ts',        ponto: '✓ Implementado: login, logout, recuperação de senha via Auth.js', done: true },
            { file: 'src/components/AuthProvider.tsx',    ponto: '✓ Implementado: listener de sessão, sync com zelvoStore, redirect para /login', done: true },
            { file: 'src/app/login/page.tsx',             ponto: '✓ Implementado: tela de login com email + senha', done: true },
            { file: 'src/app/api/leads/*',                ponto: '✓ Implementado: rotas com autorização verificada (gerente vs corretor)', done: true },
            { file: 'src/repositories/*',                 ponto: '✓ Implementado: queries Prisma reais (substitui stubs)', done: true },
            { file: 'src/stores/zelvoStore.ts',           ponto: '✓ Implementado: actions de mutação assíncronas via fetch em modo cloud', done: true },
            { file: 'src/app/api/leads/intake/route.ts',  ponto: '✓ Implementado: intake externo com token, duplicidade, score e distribuição automática', done: true },
            { file: 'src/services/notificationService.ts', ponto: '✓ Implementado: criação, listagem, contagem e marcação de notificações internas', done: true },
            { file: 'src/services/emailService.ts',        ponto: '✓ Implementado: envio via Resend com graceful fallback e log de e-mails', done: true },
            { file: 'src/services/alertService.ts',        ponto: '✓ Implementado: alertas gerenciais (leads parados, sem ação, corretores sobrecarregados)', done: true },
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
