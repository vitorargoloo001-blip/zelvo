'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Trophy,
  GitBranch,
  Settings,
  ListFilter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: ListFilter },
  { href: '/leads/novo', label: 'Novo Lead', icon: UserPlus },
  { href: '/corretores', label: 'Corretores', icon: Users },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/distribuicoes', label: 'Distribuições', icon: GitBranch },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-64 shrink-0 flex flex-col h-screen border-r border-border"
      style={{ background: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6E0933 0%, #9B1245 100%)' }}
          >
            <span className="text-white font-black text-lg tracking-tight">Z</span>
          </div>
          {/* Text */}
          <div>
            <p
              className="font-black text-base tracking-widest leading-none"
              style={{ color: '#FFFFFF', letterSpacing: '0.15em' }}
            >
              ZELVO
            </p>
            <p className="text-[10px] mt-1 leading-tight" style={{ color: '#6B7280' }}>
              O lead certo no corretor certo.
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-2">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
              style={
                active
                  ? {
                      background:
                        'linear-gradient(135deg, #6E0933 0%, #8B1040 100%)',
                      boxShadow: '0 2px 8px rgba(110,9,51,0.35)',
                    }
                  : {}
              }
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.5 : 1.75}
                style={{ opacity: active ? 1 : 0.7 }}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">MVP v1.0</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Dados simulados
            </p>
          </div>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(110,9,51,0.2)' }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#6E0933' }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
