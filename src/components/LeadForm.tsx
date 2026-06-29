'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useZelvoStore } from '@/stores/zelvoStore'
import { calcularLeadScore, definirTemperaturaLead } from '@/lib/score'
import type { TipoImovel, PrazoCompra, OrigemLead, FonteEntrada } from '@/lib/types'
import { LeadTemperatureBadge } from './LeadTemperatureBadge'
import { CheckCircle2 } from 'lucide-react'

const TIPOS_IMOVEL: TipoImovel[] = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural']
const PRAZOS: PrazoCompra[] = ['até 30 dias', '1 a 3 meses', '3 a 6 meses', 'acima de 6 meses', 'sem previsão']
const ORIGENS: OrigemLead[] = ['Meta Ads', 'Google Ads', 'WhatsApp', 'Landing Page', 'Indicação', 'Portal Imobiliário']
const FONTES: { value: FonteEntrada; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'formulario_externo', label: 'Formulário externo' },
  { value: 'importacao', label: 'Importação' },
]

export function LeadForm() {
  const router       = useRouter()
  const adicionarLead = useZelvoStore(s => s.adicionarLead)

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    regiaoInteresse: '',
    tipoImovel: 'Apartamento' as TipoImovel,
    rendaFamiliar: '',
    valorEntrada: '',
    possuiFgts: false,
    prazoCompra: '1 a 3 meses' as PrazoCompra,
    financiamentoAprovado: false,
    empreendimentoInteresse: '',
    origem: 'Meta Ads' as OrigemLead,
    campanha: '',
    fonteEntrada: 'manual' as FonteEntrada,
  })

  const [preview, setPreview] = useState<{ score: number; temperatura: string } | null>(null)
  const [sucesso, setSucesso] = useState<{ nome: string; score: number; temperatura: string; corretor: string | null } | null>(null)

  function calcularPreview() {
    const renda  = parseFloat(form.rendaFamiliar) || 0
    const entrada = parseFloat(form.valorEntrada) || 0
    const score = calcularLeadScore({ ...form, rendaFamiliar: renda, valorEntrada: entrada })
    setPreview({ score, temperatura: definirTemperaturaLead(score) })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const renda  = parseFloat(form.rendaFamiliar) || 0
    const entrada = parseFloat(form.valorEntrada) || 0

    // Cria o lead na store: calcula score, distribui, persiste tudo
    const lead = adicionarLead({
      ...form,
      rendaFamiliar: renda,
      valorEntrada:  entrada,
    })

    // Busca o corretor atribuído para exibir no feedback
    const corretores = useZelvoStore.getState().corretores
    const corretor   = lead.corretorAtribuido
      ? corretores.find(c => c.id === lead.corretorAtribuido)?.nome ?? null
      : null

    setSucesso({
      nome:       lead.nome,
      score:      lead.scoreLead,
      temperatura: lead.temperaturaLead,
      corretor,
    })

    // Redireciona para a tela de detalhe do lead criado
    setTimeout(() => router.push(`/leads/${lead.id}`), 1200)
  }

  const inputCls   = 'w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
  const selectCls  = 'w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

  function field(label: string, content: React.ReactNode) {
    return (
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
        {content}
      </div>
    )
  }

  // ── Feedback de sucesso ───────────────────────────────────────────────────
  if (sucesso) {
    const tempColor: Record<string, string> = {
      Premium: '#8B5CF6', Quente: '#EF4444', Morno: '#F59E0B', Frio: '#3B82F6',
    }
    const cor = tempColor[sucesso.temperatura] ?? '#6E0933'
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${cor}18`, border: `1px solid ${cor}30` }}>
          <CheckCircle2 size={28} style={{ color: cor }} />
        </div>
        <div>
          <p className="text-lg font-black text-foreground mb-1">Lead cadastrado!</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{sucesso.nome}</span> recebeu score{' '}
            <span className="font-bold" style={{ color: cor }}>{sucesso.score}</span> — temperatura{' '}
            <span className="font-bold" style={{ color: cor }}>{sucesso.temperatura}</span>.
          </p>
          {sucesso.corretor ? (
            <p className="text-sm text-emerald-400 mt-1">Distribuído automaticamente para {sucesso.corretor}.</p>
          ) : (
            <p className="text-sm text-amber-400 mt-1">Nenhum corretor disponível no momento.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Redirecionando para o detalhe do lead…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Preview de score */}
      {preview && (
        <div className="rounded-xl border border-border p-4 flex items-center gap-4" style={{ background: 'rgba(110,9,51,0.08)' }}>
          <div className="text-center">
            <p className="text-3xl font-black text-foreground">{preview.score}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Temperatura estimada</p>
            <LeadTemperatureBadge temperatura={preview.temperatura as never} />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            A distribuição será feita automaticamente ao salvar.
          </div>
        </div>
      )}

      {/* Dados pessoais */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Dados do Lead</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('Nome completo', <input required className={inputCls} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do cliente" />)}
          {field('Telefone', <input className={inputCls} value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />)}
          {field('Cidade', <input className={inputCls} value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="São Paulo" />)}
        </div>
      </div>

      {/* Perfil de compra */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Perfil de Compra</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Região de interesse', <input className={inputCls} value={form.regiaoInteresse} onChange={e => setForm(f => ({ ...f, regiaoInteresse: e.target.value }))} placeholder="Ex: Zona Sul" />)}
          {field('Tipo de imóvel', <select className={selectCls} value={form.tipoImovel} onChange={e => setForm(f => ({ ...f, tipoImovel: e.target.value as TipoImovel }))}>{TIPOS_IMOVEL.map(t => <option key={t}>{t}</option>)}</select>)}
          {field('Renda familiar (R$)', <input type="number" className={inputCls} value={form.rendaFamiliar} onChange={e => setForm(f => ({ ...f, rendaFamiliar: e.target.value }))} placeholder="5000" />)}
          {field('Valor de entrada (R$)', <input type="number" className={inputCls} value={form.valorEntrada} onChange={e => setForm(f => ({ ...f, valorEntrada: e.target.value }))} placeholder="20000" />)}
          {field('Prazo de compra', <select className={selectCls} value={form.prazoCompra} onChange={e => setForm(f => ({ ...f, prazoCompra: e.target.value as PrazoCompra }))}>{PRAZOS.map(p => <option key={p}>{p}</option>)}</select>)}
          {field('Empreendimento de interesse', <input className={inputCls} value={form.empreendimentoInteresse} onChange={e => setForm(f => ({ ...f, empreendimentoInteresse: e.target.value }))} placeholder="Nome do empreendimento" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#6E0933]" checked={form.possuiFgts} onChange={e => setForm(f => ({ ...f, possuiFgts: e.target.checked }))} />
            <span className="text-sm text-foreground">Possui FGTS</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#6E0933]" checked={form.financiamentoAprovado} onChange={e => setForm(f => ({ ...f, financiamentoAprovado: e.target.checked }))} />
            <span className="text-sm text-foreground">Financiamento aprovado</span>
          </label>
        </div>
      </div>

      {/* Origem */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Origem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('Fonte de entrada',
            <select className={selectCls} value={form.fonteEntrada} onChange={e => setForm(f => ({ ...f, fonteEntrada: e.target.value as FonteEntrada }))}>
              {FONTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          )}
          {field('Canal de origem',
            <select className={selectCls} value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value as OrigemLead }))}>
              {ORIGENS.map(o => <option key={o}>{o}</option>)}
            </select>
          )}
          {field('Campanha', <input className={inputCls} value={form.campanha} onChange={e => setForm(f => ({ ...f, campanha: e.target.value }))} placeholder="Nome da campanha" />)}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={calcularPreview}
          className="px-4 py-2 rounded-md text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors"
        >
          Calcular score
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-md text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6E0933 0%, #8B1040 100%)' }}
        >
          Cadastrar e distribuir
        </button>
      </div>
    </form>
  )
}
