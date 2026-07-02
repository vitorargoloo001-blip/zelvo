import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

async function getOrCreate() {
  const status = await prisma.onboardingStatus.findFirst()
  if (status) return status
  return prisma.onboardingStatus.create({ data: {} })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const status = await getOrCreate()
  return NextResponse.json({ status })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const status = await getOrCreate()

  const dados: Record<string, unknown> = {}
  const campos = [
    'empresaConfigurada', 'corretoresConfigurados', 'usuariosConfigurados',
    'scoreConfigurado', 'distribuicaoConfigurada', 'testeLeadCriado', 'concluido',
  ]
  for (const campo of campos) {
    if (body[campo] !== undefined) dados[campo] = body[campo]
  }

  // Auto-marcar como concluído se todas as etapas anteriores estão feitas
  const atualizado = await prisma.onboardingStatus.update({
    where: { id: status.id },
    data: dados,
  })

  const todasEtapas = [
    atualizado.empresaConfigurada,
    atualizado.corretoresConfigurados,
    atualizado.usuariosConfigurados,
    atualizado.scoreConfigurado,
    atualizado.distribuicaoConfigurada,
    atualizado.testeLeadCriado,
  ]

  if (todasEtapas.every(Boolean) && !atualizado.concluido) {
    const final = await prisma.onboardingStatus.update({
      where: { id: status.id },
      data: { concluido: true },
    })
    return NextResponse.json({ status: final })
  }

  return NextResponse.json({ status: atualizado })
}
