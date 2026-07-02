import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { DISTRIBUICAO_REGRAS_PADRAO } from '@/lib/scoreDefaults'

async function getOrCreateConfig() {
  const config = await prisma.distribuicaoConfig.findFirst({ where: { ativo: true } })
  if (config) return config
  return prisma.distribuicaoConfig.create({
    data: { ativo: true, regras: DISTRIBUICAO_REGRAS_PADRAO as object },
  })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await getOrCreateConfig()

  // Estatísticas dos corretores para o painel de distribuição
  const corretores = await prisma.corretor.findMany({
    select: {
      id: true, nome: true, nivel: true, ativo: true,
      leadsEmAberto: true, capacidadeMaximaLeads: true, participaDistribuicao: true,
    },
    orderBy: { nome: 'asc' },
  })

  const disponiveis    = corretores.filter(c => c.ativo && c.participaDistribuicao && c.leadsEmAberto < c.capacidadeMaximaLeads)
  const sobrecarregados = corretores.filter(c => c.ativo && c.participaDistribuicao && c.leadsEmAberto >= c.capacidadeMaximaLeads)
  const foraDistribuicao = corretores.filter(c => !c.participaDistribuicao || !c.ativo)

  return NextResponse.json({ config, disponiveis, sobrecarregados, foraDistribuicao })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const config = await getOrCreateConfig()

  const regrasAtuais = config.regras as Record<string, unknown>
  const novasRegras = { ...regrasAtuais, ...body.regras }

  const atualizada = await prisma.distribuicaoConfig.update({
    where: { id: config.id },
    data: { regras: novasRegras },
  })

  return NextResponse.json({ config: atualizada })
}
