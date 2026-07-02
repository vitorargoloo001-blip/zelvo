import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

async function getOrCreate() {
  const config = await prisma.notificacaoConfig.findFirst()
  if (config) return config
  return prisma.notificacaoConfig.create({ data: {} })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const config = await getOrCreate()
  return NextResponse.json({ config })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const config = await getOrCreate()

  const atualizada = await prisma.notificacaoConfig.update({
    where: { id: config.id },
    data: {
      ...(body.notificacoesInternasAtivas   !== undefined && { notificacoesInternasAtivas: body.notificacoesInternasAtivas }),
      ...(body.emailNovoLead                !== undefined && { emailNovoLead: body.emailNovoLead }),
      ...(body.emailLeadPremium             !== undefined && { emailLeadPremium: body.emailLeadPremium }),
      ...(body.alertaPremiumParado          !== undefined && { alertaPremiumParado: body.alertaPremiumParado }),
      ...(body.minutosPremiumParado         !== undefined && { minutosPremiumParado: Number(body.minutosPremiumParado) }),
      ...(body.alertaSemProximaAcao         !== undefined && { alertaSemProximaAcao: body.alertaSemProximaAcao }),
      ...(body.alertaCorretorSobrecarregado !== undefined && { alertaCorretorSobrecarregado: body.alertaCorretorSobrecarregado }),
      ...(body.limiteLeadsEmAberto          !== undefined && { limiteLeadsEmAberto: Number(body.limiteLeadsEmAberto) }),
    },
  })

  return NextResponse.json({ config: atualizada })
}
