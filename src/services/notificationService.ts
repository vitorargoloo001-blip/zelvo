import 'server-only'
import { prisma } from '@/lib/prisma'
import type { Lead, Corretor } from '@/lib/types'

// ── Tipos ────────────────────────────────────────────────────────────────────

export type TipoNotificacao =
  | 'lead_atribuido'
  | 'lead_premium_recebido'
  | 'lead_premium_parado'
  | 'lead_sem_proxima_acao'
  | 'corretor_sobrecarregado'
  | 'status_atualizado'
  | 'nova_tentativa_entrada'

export type PrioridadeNotificacao = 'baixa' | 'media' | 'alta' | 'critica'

export interface CriarNotificacaoPayload {
  usuarioId:  string
  leadId?:    string
  corretorId?: string
  tipo:       TipoNotificacao
  titulo:     string
  mensagem:   string
  prioridade: PrioridadeNotificacao
  metadata?:  Record<string, unknown>
}

// ── CRUD básico ───────────────────────────────────────────────────────────────

export async function criarNotificacao(payload: CriarNotificacaoPayload) {
  return prisma.notificacao.create({
    data: {
      usuarioId:  payload.usuarioId,
      leadId:     payload.leadId     ?? null,
      corretorId: payload.corretorId ?? null,
      tipo:       payload.tipo,
      titulo:     payload.titulo,
      mensagem:   payload.mensagem,
      prioridade: payload.prioridade,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata:   (payload.metadata as any) ?? undefined,
    },
  })
}

export async function listarNotificacoesUsuario(usuarioId: string, limite = 50) {
  return prisma.notificacao.findMany({
    where:   { usuarioId },
    orderBy: { createdAt: 'desc' },
    take:    limite,
  })
}

export async function contarNaoLidas(usuarioId: string): Promise<number> {
  return prisma.notificacao.count({ where: { usuarioId, lida: false } })
}

export async function marcarComoLida(id: string, usuarioId: string) {
  return prisma.notificacao.updateMany({
    where: { id, usuarioId },
    data:  { lida: true },
  })
}

export async function marcarTodasComoLidas(usuarioId: string) {
  return prisma.notificacao.updateMany({
    where: { usuarioId, lida: false },
    data:  { lida: true },
  })
}

// ── Helpers de negócio ────────────────────────────────────────────────────────

/** Busca o Usuario linkado a um Corretor (para saber o usuarioId). */
async function usuarioIdDoCorretor(corretorId: string): Promise<string | null> {
  const u = await prisma.usuario.findFirst({
    where:  { corretorId, ativo: true },
    select: { id: true },
  })
  return u?.id ?? null
}

/** Busca IDs de todos os usuários com perfil gerente. */
async function idsGerentes(): Promise<string[]> {
  const gerentes = await prisma.usuario.findMany({
    where:  { perfil: 'gerente', ativo: true },
    select: { id: true },
  })
  return gerentes.map(g => g.id)
}

// ── Notificações de domínio ────────────────────────────────────────────────

/**
 * Notifica o corretor quando um lead for atribuído a ele.
 * Se Premium, prioridade alta; caso contrário, média.
 */
export async function notificarLeadAtribuido(lead: Lead, corretor: Corretor) {
  const usuarioId = await usuarioIdDoCorretor(corretor.id)
  if (!usuarioId) return

  const isPremium = lead.temperaturaLead === 'Premium'
  const prioridade: PrioridadeNotificacao = isPremium ? 'alta' : 'media'
  const tipo: TipoNotificacao = isPremium ? 'lead_premium_recebido' : 'lead_atribuido'

  await criarNotificacao({
    usuarioId,
    leadId:    lead.id,
    corretorId: corretor.id,
    tipo,
    titulo:  isPremium ? 'Lead Premium recebido' : 'Novo lead atribuído',
    mensagem: `Você recebeu o lead ${lead.nome}, classificado como ${lead.temperaturaLead} com score ${lead.scoreLead}.`,
    prioridade,
    metadata: {
      score:        lead.scoreLead,
      temperatura:  lead.temperaturaLead,
      cidade:       lead.cidade,
      origem:       lead.origem,
      fonteEntrada: lead.fonteEntrada,
    },
  })
}

/**
 * Notifica o corretor de uma redistribuição manual.
 */
export async function notificarLeadRedistribuido(lead: Lead, corretor: Corretor) {
  const usuarioId = await usuarioIdDoCorretor(corretor.id)
  if (!usuarioId) return

  await criarNotificacao({
    usuarioId,
    leadId:     lead.id,
    corretorId: corretor.id,
    tipo:       'lead_atribuido',
    titulo:     'Lead redistribuído para você',
    mensagem:   `O lead ${lead.nome} (${lead.temperaturaLead}, score ${lead.scoreLead}) foi redistribuído para você pelo gerente.`,
    prioridade: lead.temperaturaLead === 'Premium' ? 'alta' : 'media',
  })
}

/**
 * Notifica todos os gerentes quando um status relevante mudar.
 */
export async function notificarGerenteStatusAlterado(
  lead: Lead,
  novoStatus: string
) {
  if (novoStatus !== 'Convertido' && novoStatus !== 'Perdido') return

  const gerentes = await idsGerentes()
  if (gerentes.length === 0) return

  const isConvertido = novoStatus === 'Convertido'

  await Promise.all(
    gerentes.map(usuarioId =>
      criarNotificacao({
        usuarioId,
        leadId:    lead.id,
        corretorId: lead.corretorAtribuido ?? undefined,
        tipo:      'status_atualizado',
        titulo:    isConvertido ? 'Lead convertido' : 'Lead marcado como perdido',
        mensagem:  isConvertido
          ? `O lead ${lead.nome} (score ${lead.scoreLead}) foi convertido.`
          : `O lead ${lead.nome} (score ${lead.scoreLead}) foi marcado como perdido.`,
        prioridade: isConvertido ? 'alta' : 'media',
        metadata: { novoStatus, temperatura: lead.temperaturaLead },
      })
    )
  )
}

/**
 * Notifica os gerentes sobre nova tentativa de entrada de lead duplicado.
 */
export async function notificarNovaTentativaEntrada(
  leadId: string,
  nomeLead: string,
  campanha: string
) {
  const gerentes = await idsGerentes()
  if (gerentes.length === 0) return

  await Promise.all(
    gerentes.map(usuarioId =>
      criarNotificacao({
        usuarioId,
        leadId,
        tipo:      'nova_tentativa_entrada',
        titulo:    'Nova tentativa de entrada — lead duplicado',
        mensagem:  `O lead ${nomeLead} tentou entrar novamente via formulário externo. Campanha: ${campanha || '-'}.`,
        prioridade: 'baixa',
        metadata: { campanha },
      })
    )
  )
}

/**
 * Notifica gerentes quando um lead Premium estiver parado (sem atividade).
 * Evita duplicação: não cria se já existe notificação igual nos últimos 30 min.
 */
export async function notificarGerenteLeadPremiumParado(lead: Lead) {
  const trintaMin = new Date(Date.now() - 30 * 60 * 1000)
  const gerentes  = await idsGerentes()

  await Promise.all(
    gerentes.map(async (usuarioId) => {
      const existente = await prisma.notificacao.findFirst({
        where: {
          usuarioId,
          leadId: lead.id,
          tipo:   'lead_premium_parado',
          createdAt: { gte: trintaMin },
        },
      })
      if (existente) return

      await criarNotificacao({
        usuarioId,
        leadId:    lead.id,
        tipo:      'lead_premium_parado',
        titulo:    'Lead Premium parado',
        mensagem:  `O lead Premium ${lead.nome} (score ${lead.scoreLead}) está sem atualização há mais de 10 minutos.`,
        prioridade: 'critica',
        metadata: { score: lead.scoreLead, cidade: lead.cidade },
      })
    })
  )
}
