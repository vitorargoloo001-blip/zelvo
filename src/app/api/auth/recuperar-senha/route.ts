import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const TOKEN_TTL_HOURS = 2

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend') as { Resend: new (key: string) => { emails: { send(opts: unknown): Promise<unknown> } } }
  return new Resend(key)
}

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json() as { email?: string; redirectTo?: string }

  if (!email) {
    return NextResponse.json({ erro: 'Email obrigatório.' }, { status: 400 })
  }

  // Sempre retorna sucesso para não expor quais emails existem
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario || !usuario.ativo) {
    return NextResponse.json({ sucesso: true })
  }

  const token     = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { token, usuarioId: usuario.id, expiresAt },
  })

  const baseUrl   = redirectTo ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const resetLink = `${baseUrl.replace(/\/$/, '')}/nova-senha?token=${token}`

  const resend = getResend()
  if (resend) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Zelvo CRM <noreply@zelvo.com.br>',
      to:   email,
      subject: 'Redefinição de senha — Zelvo CRM',
      html: `
        <p>Olá, ${usuario.nome}.</p>
        <p>Clique no link abaixo para redefinir sua senha. O link expira em ${TOKEN_TTL_HOURS} horas.</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se você não solicitou a redefinição, ignore este email.</p>
      `,
    })
  } else {
    console.warn('[recuperar-senha] RESEND_API_KEY não configurada. Link gerado apenas no log:')
    console.warn(resetLink)
  }

  return NextResponse.json({ sucesso: true })
}
