'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mapeamento de título da aba → rota
const TAB_HREF: Record<string, string> = {
  // Gerente
  Dashboard: '/',
  Leads: '/leads',
  'Novo Lead': '/leads/novo',
  Funil: '/funil',
  Corretores: '/corretores',
  Ranking: '/ranking',
  Distribuições: '/distribuicoes',
  Configurações: '/configuracoes',
  Diagnóstico:   '/diagnostico',
  Notificações:  '/notificacoes',
  // Corretor
  'Meu Painel': '/meu-painel',
  'Meus Leads': '/meus-leads',
  'Meu Funil': '/meu-funil',
  'Próximas Ações': '/proximas-acoes',
  'Minha Performance': '/minha-performance',
}

export type TabItem =
  | { title: string; icon: LucideIcon }
  | { type: 'separator' }

export interface ExpandableTabsProps {
  tabs: TabItem[]
  /** Classe Tailwind de cor para o ícone/texto do item ativo (não usada diretamente; a ativa usa fundo vinho) */
  activeColor?: string
  /** Classes adicionais na nav */
  className?: string
}

export function ExpandableTabs({ tabs, className }: ExpandableTabsProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col gap-0.5 w-full', className)}>
      {tabs.map((tab, i) => {
        if ('type' in tab && tab.type === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              className="my-2 mx-3 h-px shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          )
        }

        const t = tab as { title: string; icon: LucideIcon }
        const href = TAB_HREF[t.title] ?? '/'
        const isActive =
          href === '/'
            ? pathname === '/'
            : pathname.startsWith(href)

        return (
          <Link
            key={t.title}
            href={href}
            title={t.title}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group/item',
              isActive
                ? 'text-white'
                : 'text-[#6B7280] hover:text-[#E6E4E1] hover:bg-white/5'
            )}
            style={
              isActive
                ? {
                    background:
                      'linear-gradient(135deg, #6E0933 0%, #8B1040 100%)',
                    boxShadow: '0 2px 8px rgba(110,9,51,0.35)',
                  }
                : {}
            }
          >
            {/* Ícone — sempre visível */}
            <t.icon
              size={16}
              strokeWidth={isActive ? 2.5 : 1.75}
              className="shrink-0"
            />

            {/* Label — aparece quando a sidebar expande */}
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                'opacity-0 translate-x-[-4px]',
                // respondendo ao group/sidebar definido no ZelvoMenu
                'group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0',
                'transition-all duration-200 delay-75'
              )}
            >
              {t.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
