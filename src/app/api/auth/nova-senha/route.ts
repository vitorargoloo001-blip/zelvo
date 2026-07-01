import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token, novaSenha } = await req.json() as { token?: string; novaSenha?: string }

  if (!token || !novaSenha || novaSenha.length < 8) {
    return NextResponse.json({ erro: 'Token e nova senha (mín. 8 caracteres) obrigatórios.' }, { status: 400 })
  }

  const registro = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
    return NextResponse.json({ erro: 'Token inválido ou expirado.' }, { status: 400 })
  }

  const senhaHash = await bcrypt.hash(novaSenha, 12)

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data:  { senhaHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data:  { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ sucesso: true })
}
