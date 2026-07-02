import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 })

  // Invalida tokens anteriores
  await prisma.passwordResetToken.deleteMany({ where: { usuarioId: id } })

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.passwordResetToken.create({
    data: {
      token,
      usuarioId: id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://zelvo-app.vercel.app'
  const link = `${baseUrl}/nova-senha?token=${token}`

  return NextResponse.json({ ok: true, link })
}
