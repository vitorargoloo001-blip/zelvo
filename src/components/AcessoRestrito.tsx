'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'

interface AcessoRestritoProps {
  mensagem?: string
  voltar?: { href: string; label: string }
}

export function AcessoRestrito({
  mensagem = 'Esta área é acessível apenas para gerentes.',
  voltar = { href: '/meu-painel', label: 'Voltar ao Meu Painel' },
}: AcessoRestritoProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)' }}
      >
        <ShieldX size={24} style={{ color: '#EF4444' }} />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-foreground mb-1">Acesso restrito</p>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{mensagem}</p>
        <Link
          href={voltar.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6E0933, #8B1040)' }}
        >
          {voltar.label}
        </Link>
      </div>
    </div>
  )
}
