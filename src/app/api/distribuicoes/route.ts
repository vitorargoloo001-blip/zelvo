import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { distribuicaoRepository } from '@/repositories/distribuicaoRepository'
import { prisma } from '@/lib/prisma'
import { toDistribuicao } from '@/repositories/distribuicaoRepository'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  if (u.perfil === 'gerente') {
    const distribuicoes = await distribuicaoRepository.listar()
    return NextResponse.json({ distribuicoes })
  }

  // Corretor: apenas distribuições de seus próprios leads
  const rows = await prisma.distribuicao.findMany({
    where: { corretorId: u.corretorId ?? '' },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ distribuicoes: rows.map(toDistribuicao) })
}
