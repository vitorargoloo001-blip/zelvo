import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { SCORE_REGRAS_PADRAO } from '@/lib/scoreDefaults'

async function getOrCreateScoreConfig() {
  const config = await prisma.scoreConfig.findFirst({ where: { ativo: true } })
  if (config) return config
  return prisma.scoreConfig.create({
    data: { nome: 'Padrão', ativo: true, regras: SCORE_REGRAS_PADRAO as object },
  })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await getOrCreateScoreConfig()
  return NextResponse.json({ config })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const config = await getOrCreateScoreConfig()

  const regrasAtuais = config.regras as Record<string, unknown>
  const novasRegras = { ...regrasAtuais, ...body.regras }

  const atualizada = await prisma.scoreConfig.update({
    where: { id: config.id },
    data: { regras: novasRegras },
  })

  return NextResponse.json({ config: atualizada })
}
