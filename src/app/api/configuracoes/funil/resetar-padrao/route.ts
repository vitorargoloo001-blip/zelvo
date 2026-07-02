import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { FUNIL_ETAPAS_PADRAO } from '@/lib/scoreDefaults'

export async function POST() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await prisma.funilConfig.findFirst()

  if (config) {
    const atualizada = await prisma.funilConfig.update({
      where: { id: config.id },
      data: { etapas: FUNIL_ETAPAS_PADRAO as object[] },
    })
    return NextResponse.json({ config: atualizada })
  }

  const nova = await prisma.funilConfig.create({ data: { etapas: FUNIL_ETAPAS_PADRAO as object[] } })
  return NextResponse.json({ config: nova })
}
