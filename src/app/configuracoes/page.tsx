'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/AccessGuard'
import { PageHeader } from '@/components/PageHeader'
import {
  Building2, Users, UserCheck, Target, GitBranch,
  Filter, Webhook, Bell, ShieldCheck, Server,
} from 'lucide-react'
import { TabEmpresa }       from '@/components/configuracoes/TabEmpresa'
import { TabUsuarios }      from '@/components/configuracoes/TabUsuarios'
import { TabCorretores }    from '@/components/configuracoes/TabCorretores'
import { TabScore }         from '@/components/configuracoes/TabScore'
import { TabDistribuicao }  from '@/components/configuracoes/TabDistribuicao'
import { TabFunil }         from '@/components/configuracoes/TabFunil'
import { TabIntake }        from '@/components/configuracoes/TabIntake'
import { TabNotificacoes }  from '@/components/configuracoes/TabNotificacoes'
import { TabSeguranca }     from '@/components/configuracoes/TabSeguranca'
import { TabSistema }       from '@/components/configuracoes/TabSistema'

const ABAS = [
  { id: 'empresa',       label: 'Empresa',        icon: Building2,  component: TabEmpresa },
  { id: 'usuarios',      label: 'Usuários',        icon: Users,      component: TabUsuarios },
  { id: 'corretores',    label: 'Corretores',      icon: UserCheck,  component: TabCorretores },
  { id: 'score',         label: 'Score do Lead',   icon: Target,     component: TabScore },
  { id: 'distribuicao',  label: 'Distribuição',    icon: GitBranch,  component: TabDistribuicao },
  { id: 'funil',         label: 'Funil',           icon: Filter,     component: TabFunil },
  { id: 'intake',        label: 'Intake Externo',  icon: Webhook,    component: TabIntake },
  { id: 'notificacoes',  label: 'Notificações',    icon: Bell,       component: TabNotificacoes },
  { id: 'seguranca',     label: 'Segurança',       icon: ShieldCheck, component: TabSeguranca },
  { id: 'sistema',       label: 'Sistema',         icon: Server,     component: TabSistema },
] as const

type AbaId = (typeof ABAS)[number]['id']

function ConfiguracoesContent() {
  const [aba, setAba] = useState<AbaId>('empresa')

  const Ativa = ABAS.find(a => a.id === aba)?.component ?? TabEmpresa

  return (
    <div>
      <PageHeader title="Configurações" description="Centro operacional do Zelvo" />

      <div className="flex gap-6 mt-2">
        {/* Sidebar de abas */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {ABAS.map(({ id, label, icon: Icon }) => {
            const ativo = aba === id
            return (
              <button
                key={id}
                onClick={() => setAba(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                style={{
                  background: ativo ? 'rgba(110,9,51,0.15)' : 'transparent',
                  color:      ativo ? '#E6E4E1' : '#6B7280',
                  fontWeight: ativo ? 600 : 400,
                  borderLeft: ativo ? '2px solid #6E0933' : '2px solid transparent',
                }}
              >
                <Icon size={14} style={{ color: ativo ? '#6E0933' : undefined }} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Conteúdo da aba */}
        <div className="flex-1 min-w-0">
          <Ativa />
        </div>
      </div>
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
