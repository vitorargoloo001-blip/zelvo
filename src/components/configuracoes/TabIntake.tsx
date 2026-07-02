'use client'

import { useState, useEffect } from 'react'
import { Webhook, Copy, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'

type IntakeData = {
  endpointUrl: string
  secretConfigurado: boolean
  origensConfiguradas: boolean
  origensPermitidas: string[]
  totalLeads: number
  totalExternos: number
  ultimoExterno: { data: string; nome: string; origem: string } | null
  exemploPayload: Record<string, unknown>
  avisoSeguranca: string
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        {ok ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
        {ok ? 'Configurado' : 'Não configurado'}
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  )
}

export function TabIntake() {
  const [data,    setData]    = useState<IntakeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    fetch('/api/diagnostico/intake').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function copiarExemplo() {
    if (!data) return
    const code = `// ATENÇÃO: este fetch deve ficar em uma serverless function ou back-end próprio.
// NUNCA exponha o secreto no front-end público.

const res = await fetch('${data.endpointUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-intake-secret': process.env.LEAD_INTAKE_SECRET,   // variável do servidor
    'Origin': 'https://seu-site.com.br',
  },
  body: JSON.stringify(${JSON.stringify(data.exemploPayload, null, 2)}),
});
const json = await res.json();
console.log(json.lead);`
    navigator.clipboard.writeText(code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
  if (!data)   return <p className="text-muted-foreground text-sm py-8">Erro ao carregar dados do intake.</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(110,9,51,0.15)' }}>
          <Webhook size={16} style={{ color: '#6E0933' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Intake externo</p>
          <p className="text-xs text-muted-foreground">Integração com landing pages e formulários externos</p>
        </div>
      </div>

      {/* Endpoint */}
      <div className="rounded-xl border border-border p-4 space-y-2" style={{ background: 'var(--card)' }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endpoint</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-emerald-400 bg-black/30 border border-border rounded px-3 py-2 font-mono break-all">{data.endpointUrl}</code>
          <a href={data.endpointUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0"><ExternalLink size={14} /></a>
        </div>
        <p className="text-xs text-muted-foreground">Método: <strong className="text-foreground">POST</strong></p>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: 'var(--card)' }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status da configuração</p>
        <StatusBadge ok={data.secretConfigurado}  label="LEAD_INTAKE_SECRET" />
        <StatusBadge ok={data.origensConfiguradas} label="LEAD_INTAKE_ALLOWED_ORIGINS" />
        {data.origensPermitidas.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            <p className="font-medium text-foreground mb-1">Origens permitidas:</p>
            {data.origensPermitidas.map(o => <p key={o} className="font-mono">{o}</p>)}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border p-3 text-center" style={{ background: '#1F2329' }}>
          <p className="text-2xl font-black text-foreground">{data.totalLeads}</p>
          <p className="text-[10px] text-muted-foreground">Total de leads</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center" style={{ background: '#1F2329' }}>
          <p className="text-2xl font-black text-foreground">{data.totalExternos}</p>
          <p className="text-[10px] text-muted-foreground">Leads externos</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center" style={{ background: '#1F2329' }}>
          <p className="text-xs font-semibold text-foreground">{data.ultimoExterno ? new Date(data.ultimoExterno.data).toLocaleDateString('pt-BR') : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Última entrada</p>
          {data.ultimoExterno && <p className="text-[10px] text-muted-foreground truncate">{data.ultimoExterno.nome}</p>}
        </div>
      </div>

      {/* Aviso de segurança */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/05 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80">{data.avisoSeguranca}</p>
        </div>
      </div>

      {/* Exemplo de integração */}
      <div className="rounded-xl border border-border" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exemplo de integração</p>
          <button onClick={copiarExemplo} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {copiado ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <pre className="px-4 py-3 text-[11px] text-muted-foreground overflow-x-auto leading-relaxed">
{`POST ${data.endpointUrl}
Content-Type: application/json
x-intake-secret: <LEAD_INTAKE_SECRET>

${JSON.stringify(data.exemploPayload, null, 2)}`}
        </pre>
      </div>
    </div>
  )
}
