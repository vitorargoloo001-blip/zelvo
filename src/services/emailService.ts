import 'server-only'
import { prisma } from '@/lib/prisma'
import type { Lead, Corretor } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend') as {
    Resend: new (key: string) => {
      emails: { send(opts: unknown): Promise<{ error?: unknown }> }
    }
  }
  return new Resend(key)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Zelvo CRM <noreply@zelvo.com.br>'
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://zelvo-app.vercel.app'

async function registrarEmailLog(opts: {
  usuarioId?: string
  leadId?:    string
  destinatario: string
  assunto:   string
  status:    'enviado' | 'erro' | 'pendente'
  erro?:     string
  metadata?: Record<string, unknown>
}) {
  await prisma.emailLog.create({
    data: {
      usuarioId:    opts.usuarioId ?? null,
      leadId:       opts.leadId    ?? null,
      destinatario: opts.destinatario,
      assunto:      opts.assunto,
      status:       opts.status,
      erro:         opts.erro ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata:     (opts.metadata as any) ?? undefined,
    },
  })
}

// ── Funções públicas ───────────────────────────────────────────────────────────

/**
 * Envia email de notificação quando um lead é atribuído a um corretor.
 * Se RESEND_API_KEY não estiver configurado, apenas registra no EmailLog.
 */
export async function enviarEmailNotificacaoLeadAtribuido(
  corretor: Corretor,
  lead: Lead,
  usuarioId?: string
) {
  const assunto = 'Novo lead atribuído no Zelvo'
  const linkLead = `${APP_URL}/leads/${lead.id}`

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #E6E4E1; background: #1A1E23; padding: 32px; border-radius: 12px;">
      <h2 style="color: #ffffff; margin-top: 0;">Novo lead atribuído</h2>
      <p>Olá, <strong>${corretor.nome}</strong>.</p>
      <p>Você recebeu um novo lead no Zelvo:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Nome</td><td style="padding: 6px 0; font-weight: bold;">${lead.nome}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Temperatura</td><td style="padding: 6px 0; font-weight: bold;">${lead.temperaturaLead}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Score</td><td style="padding: 6px 0; font-weight: bold;">${lead.scoreLead}/100</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Cidade</td><td style="padding: 6px 0;">${lead.cidade}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Origem</td><td style="padding: 6px 0;">${lead.origem}</td></tr>
      </table>
      <a href="${linkLead}" style="display: inline-block; background: #6E0933; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
        Abrir lead no Zelvo
      </a>
      <p style="color: #4B5563; font-size: 12px; margin-top: 24px;">Zelvo CRM — O lead certo no corretor certo.</p>
    </div>
  `

  const resend = getResend()
  if (!resend) {
    console.warn(`[emailService] RESEND_API_KEY não configurado. Email para ${corretor.email} não enviado.`)
    await registrarEmailLog({
      usuarioId,
      leadId: lead.id,
      destinatario: corretor.email,
      assunto,
      status: 'pendente',
      erro: 'RESEND_API_KEY não configurado',
    })
    return
  }

  try {
    const resultado = await resend.emails.send({ from: FROM, to: corretor.email, subject: assunto, html })
    if (resultado.error) throw new Error(String(resultado.error))
    await registrarEmailLog({ usuarioId, leadId: lead.id, destinatario: corretor.email, assunto, status: 'enviado' })
    console.log(`[emailService] Email enviado para ${corretor.email} — lead ${lead.id}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[emailService] Erro ao enviar email para ${corretor.email}:`, msg)
    await registrarEmailLog({ usuarioId, leadId: lead.id, destinatario: corretor.email, assunto, status: 'erro', erro: msg })
  }
}

/**
 * Envia email de alerta de Lead Premium para o corretor.
 */
export async function enviarEmailLeadPremium(
  corretor: Corretor,
  lead: Lead,
  usuarioId?: string
) {
  const assunto = 'Lead Premium recebido no Zelvo — contato imediato recomendado'
  const linkLead = `${APP_URL}/leads/${lead.id}`

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #E6E4E1; background: #1A1E23; padding: 32px; border-radius: 12px;">
      <div style="background: #6E0933; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #fff; font-weight: bold; font-size: 14px;">⚡ Lead Premium — Prioridade Máxima</p>
      </div>
      <h2 style="color: #ffffff; margin-top: 0;">Lead Premium recebido</h2>
      <p>Olá, <strong>${corretor.nome}</strong>.</p>
      <p>Você recebeu um Lead <strong>Premium</strong> que requer atenção imediata:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Nome</td><td style="padding: 6px 0; font-weight: bold;">${lead.nome}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Score</td><td style="padding: 6px 0; font-weight: bold; color: #F59E0B;">${lead.scoreLead}/100</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Cidade</td><td style="padding: 6px 0;">${lead.cidade}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Prazo</td><td style="padding: 6px 0;">${lead.prazoCompra}</td></tr>
        <tr><td style="padding: 6px 0; color: #9CA3AF;">Origem</td><td style="padding: 6px 0;">${lead.origem}</td></tr>
      </table>
      <p style="color: #F59E0B; font-size: 13px;">Recomendação: contate este lead em até 10 minutos para maximizar a chance de conversão.</p>
      <a href="${linkLead}" style="display: inline-block; background: #6E0933; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
        Abrir lead agora
      </a>
      <p style="color: #4B5563; font-size: 12px; margin-top: 24px;">Zelvo CRM — O lead certo no corretor certo.</p>
    </div>
  `

  const resend = getResend()
  if (!resend) {
    await registrarEmailLog({
      usuarioId,
      leadId: lead.id,
      destinatario: corretor.email,
      assunto,
      status: 'pendente',
      erro: 'RESEND_API_KEY não configurado',
    })
    return
  }

  try {
    const resultado = await resend.emails.send({ from: FROM, to: corretor.email, subject: assunto, html })
    if (resultado.error) throw new Error(String(resultado.error))
    await registrarEmailLog({ usuarioId, leadId: lead.id, destinatario: corretor.email, assunto, status: 'enviado' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await registrarEmailLog({ usuarioId, leadId: lead.id, destinatario: corretor.email, assunto, status: 'erro', erro: msg })
  }
}
