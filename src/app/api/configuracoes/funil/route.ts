import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { FUNIL_ETAPAS_PADRAO } from '@/lib/scoreDefaults'

async function getOrCreateFunil() {
  const config = await prisma.funilConfig.findFirst()
  if (config) return config
  return prisma.funilConfig.create({ data: { etapas: FUNIL_ETAPAS_PADRAO as object[] } })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await getOrCreateFunil()
  return NextResponse.json({ config })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  if (!Array.isArray(body.etapas)) return NextResponse.json({ erro: 'etapas deve ser um array.' }, { status: 400 })

  const config = await getOrCreateFunil()
  const atualizada = await prisma.funilConfig.update({
    where: { id: config.id },
    data: { etapas: body.etapas },
  })

  return NextResponse.json({ config: atualizada })
}
