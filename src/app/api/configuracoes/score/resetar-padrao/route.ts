import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { SCORE_REGRAS_PADRAO } from '@/lib/scoreDefaults'

export async function POST() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await prisma.scoreConfig.findFirst({ where: { ativo: true } })

  if (config) {
    const atualizada = await prisma.scoreConfig.update({
      where: { id: config.id },
      data: { regras: SCORE_REGRAS_PADRAO as object },
    })
    return NextResponse.json({ config: atualizada })
  }

  const nova = await prisma.scoreConfig.create({
    data: { nome: 'Padrão', ativo: true, regras: SCORE_REGRAS_PADRAO as object },
  })
  return NextResponse.json({ config: nova })
}
