import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { toCorretor } from '@/repositories/corretorRepository'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const { id } = await params
  const corretor = await prisma.corretor.findUnique({ where: { id } })
  if (!corretor) return NextResponse.json({ erro: 'Corretor não encontrado.' }, { status: 404 })

  const atualizado = await prisma.corretor.update({ where: { id }, data: { ativo: true } })
  return NextResponse.json({ corretor: toCorretor(atualizado) })
}
