import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function LeadNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(110,9,51,0.12)', border: '1px solid rgba(110,9,51,0.2)' }}
      >
        <SearchX size={28} style={{ color: '#6E0933' }} />
      </div>

      <h1 className="text-xl font-black text-foreground mb-2">Lead não encontrado</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        O lead que você está procurando não existe ou foi removido.
      </p>

      <Link
        href="/leads"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #6E0933 0%, #8B1040 100%)',
          boxShadow: '0 4px 14px rgba(110,9,51,0.35)',
        }}
      >
        <ArrowLeft size={14} />
        Voltar para Leads
      </Link>
    </div>
  )
}
