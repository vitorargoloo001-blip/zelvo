import type { Lead } from '@/lib/types'
import { User, MapPin, DollarSign, Home } from 'lucide-react'

function Row({
  label,
  value,
}: {
  label: string
  value: string | number | boolean | undefined | null
}) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
        {String(value === true ? 'Sim' : value === false ? 'Não' : value)}
      </span>
    </div>
  )
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: typeof User
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 mt-4 mb-1 first:mt-0">
      <Icon size={11} style={{ color: '#6B7280' }} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

export function LeadInfoGrid({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Dados do lead
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {/* Coluna esquerda */}
        <div>
          <SectionLabel icon={User} label="Contato" />
          <Row label="Telefone" value={lead.telefone} />
          <Row label="Cidade" value={lead.cidade} />
          <Row label="Região de interesse" value={lead.regiaoInteresse || '—'} />
        </div>

        {/* Coluna direita */}
        <div>
          <SectionLabel icon={DollarSign} label="Perfil financeiro" />
          <Row
            label="Renda familiar"
            value={`R$ ${lead.rendaFamiliar.toLocaleString('pt-BR')}`}
          />
          <Row
            label="Valor de entrada"
            value={`R$ ${lead.valorEntrada.toLocaleString('pt-BR')}`}
          />
          <Row label="Possui FGTS" value={lead.possuiFgts} />
          <Row label="Financiamento aprovado" value={lead.financiamentoAprovado} />
          <Row label="Prazo de compra" value={lead.prazoCompra} />
        </div>
      </div>

      {/* Linha inferior */}
      <div className="mt-1">
        <SectionLabel icon={Home} label="Interesse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <Row label="Tipo de imóvel" value={lead.tipoImovel} />
          <Row
            label="Empreendimento"
            value={lead.empreendimentoInteresse || '—'}
          />
        </div>
      </div>
    </div>
  )
}
