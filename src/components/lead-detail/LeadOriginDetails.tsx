import type { Lead, FonteEntrada } from '@/lib/types'
import { MonitorSmartphone, UserPen, FileInput, Link2 } from 'lucide-react'

const FONTE_CONFIG: Record<
  FonteEntrada,
  { label: string; icon: typeof UserPen; color: string; bg: string }
> = {
  manual: {
    label: 'Manual',
    icon: UserPen,
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.12)',
  },
  formulario_externo: {
    label: 'Formulário externo',
    icon: MonitorSmartphone,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  importacao: {
    label: 'Importação',
    icon: FileInput,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[55%] break-all">
        {value}
      </span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadOriginDetails({ lead }: { lead: Lead }) {
  const fonte = FONTE_CONFIG[lead.fonteEntrada ?? 'manual']
  const FonteIcon = fonte.icon
  const hasUtm =
    lead.utmSource ||
    lead.utmMedium ||
    lead.utmCampaign ||
    lead.utmContent ||
    lead.utmTerm

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--card)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 size={13} style={{ color: '#6B7280' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Dados de origem
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md"
          style={{ color: fonte.color, background: fonte.bg }}
        >
          <FonteIcon size={10} />
          {fonte.label}
        </span>
      </div>

      <Row label="Canal de origem" value={lead.origem} />
      <Row label="Campanha" value={lead.campanha} />
      <Row label="Formulário de origem" value={lead.formularioOrigem} />
      <Row
        label="Data de envio"
        value={
          lead.dataEnvioFormulario
            ? formatDate(lead.dataEnvioFormulario)
            : undefined
        }
      />
      <Row label="Dispositivo" value={lead.dispositivo} />
      <Row label="IP de origem" value={lead.ipOrigem} />

      {hasUtm && (
        <>
          <div className="mt-4 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Parâmetros UTM
            </p>
          </div>
          <Row label="UTM Source" value={lead.utmSource} />
          <Row label="UTM Medium" value={lead.utmMedium} />
          <Row label="UTM Campaign" value={lead.utmCampaign} />
          <Row label="UTM Content" value={lead.utmContent} />
          <Row label="UTM Term" value={lead.utmTerm} />
        </>
      )}
    </div>
  )
}
