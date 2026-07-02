import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const { id } = await params
  if (id === u.id) return NextResponse.json({ erro: 'Não é possível desativar sua própria conta.' }, { status: 400 })

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 })

  await prisma.usuario.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
