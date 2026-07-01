/**
 * POST /api/leads/intake
 *
 * Endpoint de entrada externa de leads. Não exige sessão autenticada — usa
 * token secreto via header x-zelvo-intake-secret para autenticar a origem.
 *
 * Variáveis de ambiente necessárias (server-side, nunca NEXT_PUBLIC):
 *   LEAD_INTAKE_SECRET          — token que a landing page deve enviar
 *   LEAD_INTAKE_ALLOWED_ORIGINS — origens HTTP permitidas (CSV)
 */

import { NextRequest, NextResponse } from 'next/server'
import { DATA_MODE } from '@/config/dataMode'
import { prisma } from '@/lib/prisma'
import { calcularLeadScore, definirTemperaturaLead } from '@/lib/score'
import { distribuirLeadAutomaticamente } from '@/lib/distribution'
import { toCorretor } from '@/repositories/corretorRepository'
import {
  notificarLeadAtribuido,
  notificarNovaTentativaEntrada,
} from '@/services/notificationService'
import {
  enviarEmailNotificacaoLeadAtribuido,
  enviarEmailLeadPremium,
} from '@/services/emailService'
import type { Lead, TipoImovel, PrazoCompra, OrigemLead } from '@/lib/types'

interface IntakePayload {
  nome?: unknown
  telefone?: unknown
  email?: unknown
  cidade?: unknown
  regiaoInteresse?: unknown
  tipoImovel?: unknown
  rendaFamiliar?: unknown
  valorEntrada?: unknown
  possuiFgts?: unknown
  prazoCompra?: unknown
  financiamentoAprovado?: unknown
  empreendimentoInteresse?: unknown
  origem?: unknown
  campanha?: unknown
  fonteEntrada?: unknown
  formularioOrigem?: unknown
  utmSource?: unknown
  utmMedium?: unknown
  utmCampaign?: unknown
  utmContent?: unknown
  utmTerm?: unknown
  dispositivo?: unknown
}

const ORIGENS_VALIDAS: OrigemLead[] = [
  'Meta Ads', 'Google Ads', 'WhatsApp', 'Landing Page', 'Indicação', 'Portal Imobiliário',
]
const TIPOS_IMOVEL_VALIDOS: TipoImovel[] = [
  'Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural',
]

function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

function mascarar(tel: string): string {
  if (tel.length <= 4) return '***'
  return '*'.repeat(tel.length - 4) + tel.slice(-4)
}

function toStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v === 'true' || v === '1'
  return false
}

export async function POST(request: NextRequest) {
  if (DATA_MODE === 'local') {
    return NextResponse.json(
      { success: false, message: 'Ative DATA_MODE=cloud para processar leads reais.', dataMode: DATA_MODE },
      { status: 202 }
    )
  }

  // ── 1. Autenticação por token secreto ────────────────────────────────────
  const secret = process.env.LEAD_INTAKE_SECRET
  if (secret) {
    const tokenRecebido = request.headers.get('x-zelvo-intake-secret')
    if (tokenRecebido !== secret) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }
  }

  // ── 2. Validação de origem (CORS server-side) ────────────────────────────
  const allowedOriginsEnv = process.env.LEAD_INTAKE_ALLOWED_ORIGINS
  if (allowedOriginsEnv) {
    const origin = request.headers.get('origin')
    if (origin) {
      const permitidas = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
      if (!permitidas.includes(origin)) {
        return NextResponse.json({ success: false, error: 'Origem não permitida.' }, { status: 403 })
      }
    }
  }

  // ── 3. Parse do payload ──────────────────────────────────────────────────
  let payload: IntakePayload
  try {
    payload = (await request.json()) as IntakePayload
  } catch {
    return NextResponse.json({ success: false, error: 'Payload JSON inválido.' }, { status: 400 })
  }

  // ── 4. Validação dos campos obrigatórios ─────────────────────────────────
  const nome          = toStr(payload.nome)
  const telefone      = toStr(payload.telefone)
  const cidade        = toStr(payload.cidade)
  const prazoCompra   = toStr(payload.prazoCompra)
  const rendaFamiliar = Number(payload.rendaFamiliar)

  if (!nome || !telefone || !cidade || !prazoCompra || isNaN(rendaFamiliar) || rendaFamiliar <= 0) {
    return NextResponse.json(
      { success: false, error: 'Campos obrigatórios ausentes: nome, telefone, cidade, rendaFamiliar, prazoCompra.' },
      { status: 400 }
    )
  }

  // ── 5. Normalização do telefone ──────────────────────────────────────────
  const telefoneNormalizado = normalizarTelefone(telefone)

  const agora    = new Date()
  const agoraISO = agora.toISOString()
  const campanha = toStr(payload.campanha, '-')
  const origem   = toStr(payload.origem, '-')

  console.log(
    `[intake] ${agoraISO} | origem=${origem} | tel=${mascarar(telefoneNormalizado)} | campanha=${campanha} | cidade=${cidade}`
  )

  // ── 6. Verificação de duplicidade (mesmo telefone nos últimos 30 dias) ───
  const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const leadExistente = await prisma.lead.findFirst({
    where: { telefone: telefoneNormalizado, createdAt: { gte: trintaDiasAtras } },
    orderBy: { createdAt: 'desc' },
  })

  if (leadExistente) {
    await prisma.atividade.create({
      data: {
        leadId: leadExistente.id,
        tipo: 'nota',
        titulo: 'Nova tentativa via formulário externo',
        descricao: `Tentativa duplicada registrada em ${agoraISO}. Formulário: ${toStr(payload.formularioOrigem, '-')}. Campanha: ${campanha}.`,
      },
    })

    // Notifica gerentes sobre tentativa duplicada (fire-and-forget)
    notificarNovaTentativaEntrada(leadExistente.id, leadExistente.nome, campanha).catch(() => {})

    console.log(
      `[intake] ${agoraISO} | DUPLICADO | leadId=${leadExistente.id} | tel=${mascarar(telefoneNormalizado)}`
    )

    return NextResponse.json({
      success: true,
      leadId: leadExistente.id,
      score: leadExistente.scoreLead,
      temperatura: leadExistente.temperaturaLead,
      message: 'Lead já existente atualizado com nova tentativa de entrada.',
    }, { status: 200 })
  }

  // ── 7. Campos normalizados e validados ───────────────────────────────────
  const origemValidada: OrigemLead = ORIGENS_VALIDAS.includes(origem as OrigemLead)
    ? (origem as OrigemLead)
    : 'Landing Page'

  const tipoImovelValidado: TipoImovel = TIPOS_IMOVEL_VALIDOS.includes(toStr(payload.tipoImovel) as TipoImovel)
    ? (toStr(payload.tipoImovel) as TipoImovel)
    : 'Apartamento'

  const camposScore = {
    nome,
    telefone: telefoneNormalizado,
    cidade,
    regiaoInteresse:         toStr(payload.regiaoInteresse),
    tipoImovel:              tipoImovelValidado,
    rendaFamiliar,
    valorEntrada:            Number(payload.valorEntrada) || 0,
    possuiFgts:              toBool(payload.possuiFgts),
    prazoCompra:             prazoCompra as PrazoCompra,
    financiamentoAprovado:   toBool(payload.financiamentoAprovado),
    empreendimentoInteresse: toStr(payload.empreendimentoInteresse),
    origem:                  origemValidada,
    campanha:                toStr(payload.campanha),
    fonteEntrada:            'formulario_externo' as const,
  }

  // ── 8. Score e temperatura ───────────────────────────────────────────────
  const scoreLead       = calcularLeadScore(camposScore)
  const temperaturaLead = definirTemperaturaLead(scoreLead)

  // ── 9. IP do solicitante ─────────────────────────────────────────────────
  const ipOrigem =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null

  // ── 10. Transação: criar lead + distribuir + atividades ──────────────────
  const { leadCriado, corretorSelecionado } = await prisma.$transaction(async (tx) => {
    const corretoresAtivos = await tx.corretor.findMany({ where: { ativo: true } })

    const leadParaDistribuicao: Lead = {
      id: '', createdAt: '', ...camposScore,
      scoreLead, temperaturaLead, status: 'Novo', corretorAtribuido: null,
    }

    const { corretor: corretorSel, distribuicao: distParcial } = distribuirLeadAutomaticamente(
      leadParaDistribuicao,
      corretoresAtivos.map(toCorretor)
    )

    const leadCriado = await tx.lead.create({
      data: {
        ...camposScore,
        scoreLead,
        temperaturaLead,
        status:            corretorSel ? 'Distribuído' : 'Novo',
        corretorAtribuido: corretorSel?.id ?? null,
        formularioOrigem:  toStr(payload.formularioOrigem) || null,
        utmSource:         toStr(payload.utmSource) || null,
        utmMedium:         toStr(payload.utmMedium) || null,
        utmCampaign:       toStr(payload.utmCampaign) || null,
        utmContent:        toStr(payload.utmContent) || null,
        utmTerm:           toStr(payload.utmTerm) || null,
        ipOrigem,
        dispositivo:       toStr(payload.dispositivo) || null,
        dataEnvioFormulario: agora,
      },
    })

    if (corretorSel && distParcial) {
      await tx.distribuicao.create({
        data: {
          leadId:                 leadCriado.id,
          corretorId:             corretorSel.id,
          scoreLeadNoMomento:     distParcial.scoreLeadNoMomento,
          scoreCorretorNoMomento: distParcial.scoreCorretorNoMomento,
          motivoDistribuicao:     distParcial.motivoDistribuicao,
        },
      })
      await tx.corretor.update({
        where: { id: corretorSel.id },
        data:  { leadsEmAberto: { increment: 1 }, leadsRecebidos: { increment: 1 } },
      })
    }

    const descDist = corretorSel && distParcial
      ? distParcial.motivoDistribuicao
      : 'Nenhum corretor ativo disponível. Lead aguarda distribuição manual.'

    await tx.atividade.createMany({
      data: [
        {
          leadId:    leadCriado.id,
          tipo:      'nota',
          titulo:    'Lead recebido via formulário externo',
          descricao: `Origem: ${origemValidada}. Formulário: ${toStr(payload.formularioOrigem, '-')}. Campanha: ${campanha}.`,
        },
        {
          leadId:    leadCriado.id,
          tipo:      'nota',
          titulo:    `Score calculado: ${scoreLead}`,
          descricao: `Score de qualificação: ${scoreLead}/100.`,
        },
        {
          leadId:    leadCriado.id,
          tipo:      'nota',
          titulo:    `Temperatura definida: ${temperaturaLead}`,
          descricao: `Lead classificado como ${temperaturaLead} com score ${scoreLead}/100.`,
        },
        {
          leadId:    leadCriado.id,
          tipo:      corretorSel ? 'status' : 'nota',
          titulo:    corretorSel
            ? `Distribuição automática: ${corretorSel.nome}`
            : 'Sem corretor disponível para distribuição automática',
          descricao: descDist,
        },
      ],
    })

    return { leadCriado, corretorSelecionado: corretorSel }
  })

  // ── 11. Notificações e email (fire-and-forget, não bloqueia a resposta) ──
  if (corretorSelecionado) {
    const leadCompleto: Lead = {
      id: leadCriado.id,
      ...camposScore,
      scoreLead,
      temperaturaLead,
      status: 'Distribuído',
      corretorAtribuido: corretorSelecionado.id,
      createdAt: agora.toISOString(),
    }
    Promise.all([
      notificarLeadAtribuido(leadCompleto, corretorSelecionado),
      temperaturaLead === 'Premium'
        ? enviarEmailLeadPremium(corretorSelecionado, leadCompleto)
        : enviarEmailNotificacaoLeadAtribuido(corretorSelecionado, leadCompleto),
    ]).catch(err => console.error('[intake] Erro nas notificações:', err))
  }

  console.log(
    `[intake] ${agoraISO} | OK | leadId=${leadCriado.id} | score=${scoreLead} | temp=${temperaturaLead} | corretor=${corretorSelecionado?.nome ?? 'nenhum'}`
  )

  return NextResponse.json({
    success:           true,
    leadId:            leadCriado.id,
    score:             scoreLead,
    temperatura:       temperaturaLead,
    corretorAtribuido: corretorSelecionado?.nome ?? null,
    message:           'Lead recebido, qualificado e distribuído com sucesso.',
  }, { status: 201 })
}
