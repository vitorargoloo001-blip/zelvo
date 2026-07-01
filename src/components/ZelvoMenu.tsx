'use client'

import {
  LayoutDashboard,
  UsersRound,
  UserPlus,
  BriefcaseBusiness,
  Trophy,
  GitBranch,
  Settings,
  Columns3,
  TrendingUp,
  CalendarClock,
  Activity,
  Bell,
} from 'lucide-react'
import { ExpandableTabs } from '@/components/ui/expandable-tabs'
import { useZelvoStore } from '@/stores/zelvoStore'

const TABS_GERENTE = [
  { title: 'Dashboard',       icon: LayoutDashboard },
  { title: 'Leads',           icon: UsersRound },
  { title: 'Novo Lead',       icon: UserPlus },
  { title: 'Funil',           icon: Columns3 },
  { type: 'separator' as const },
  { title: 'Corretores',      icon: BriefcaseBusiness },
  { title: 'Ranking',         icon: Trophy },
  { title: 'Distribuições',   icon: GitBranch },
  { type: 'separator' as const },
  { title: 'Notificações',    icon: Bell },
  { title: 'Configurações',   icon: Settings },
  { title: 'Diagnóstico',     icon: Activity },
]

const TABS_CORRETOR = [
  { title: 'Meu Painel',        icon: LayoutDashboard },
  { title: 'Meus Leads',        icon: UsersRound },
  { title: 'Meu Funil',         icon: Columns3 },
  { title: 'Próximas Ações',    icon: CalendarClock },
  { type: 'separator' as const },
  { title: 'Minha Performance', icon: TrendingUp },
  { title: 'Notificações',      icon: Bell },
]

export function ZelvoMenu() {
  const perfil = useZelvoStore(s => s.usuarioAtual.perfil)
  const nome   = useZelvoStore(s => s.usuarioAtual.nome)
  const tabs   = perfil === 'gerente' ? TABS_GERENTE : TABS_CORRETOR

  return (
    <aside
      className={[
        'group/sidebar',
        'fixed left-0 top-0 h-screen z-40',
        'flex flex-col',
        'w-16 hover:w-60',
        'transition-[width] duration-300 ease-in-out',
        'overflow-hidden',
        'border-r border-[rgba(255,255,255,0.07)]',
      ].join(' ')}
      style={{ background: '#16191D' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-[rgba(255,255,255,0.07)] min-w-[240px]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6E0933 0%, #9B1245 100%)' }}
        >
          <span className="text-white font-black text-lg leading-none">Z</span>
        </div>
        <div
          className={[
            'overflow-hidden',
            'opacity-0 translate-x-[-6px]',
            'group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0',
            'transition-all duration-200 delay-100',
          ].join(' ')}
        >
          <p className="font-black text-[15px] tracking-widest text-white leading-none" style={{ letterSpacing: '0.15em' }}>
            ZELVO
          </p>
          <p className="text-[10px] mt-1 leading-tight" style={{ color: '#4B5563' }}>
            O lead certo no corretor certo.
          </p>
        </div>
      </div>

      {/* ── Navegação ── */}
      <div className="flex-1 px-2 py-3 overflow-y-auto min-w-[240px]">
        <p
          className={[
            'text-[10px] font-bold uppercase tracking-widest text-[#4B5563] px-3 mb-2',
            'opacity-0 group-hover/sidebar:opacity-100',
            'transition-opacity duration-200 delay-75',
          ].join(' ')}
        >
          {perfil === 'gerente' ? 'Menu' : 'Meu Espaço'}
        </p>
        <ExpandableTabs
          tabs={tabs}
          activeColor="text-[#6E0933]"
          className="border-[#2D2D2D] bg-[#16191D] text-[#E6E4E1]"
        />
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.07)] min-w-[240px]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white"
            style={{
              background: perfil === 'gerente'
                ? 'linear-gradient(135deg, #6E0933, #9B1245)'
                : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
            }}
          >
            {nome.charAt(0)}
          </div>
          <div
            className={[
              'opacity-0 group-hover/sidebar:opacity-100',
              'transition-opacity duration-200 delay-75',
              'min-w-0',
            ].join(' ')}
          >
            <p className="text-xs font-semibold text-[#E6E4E1] truncate">{nome}</p>
            <p className="text-[10px] text-[#4B5563] mt-0.5 capitalize">{perfil}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
