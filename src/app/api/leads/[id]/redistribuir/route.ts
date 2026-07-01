import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { leadRepository } from '@/repositories/leadRepository'
import { corretorRepository } from '@/repositories/corretorRepository'
import { notificarLeadRedistribuido } from '@/services/notificationService'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/leads/[id]/redistribuir'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { id } = await ctx.params
  const { corretorId } = await req.json() as { corretorId: string }

  await leadRepository.redistribuir(id, corretorId)

  const [lead, corretor] = await Promise.all([
    leadRepository.buscarPorId(id),
    corretorRepository.buscarPorId(corretorId),
  ])

  // Notifica novo corretor (fire-and-forget)
  if (lead && corretor) {
    notificarLeadRedistribuido(lead, corretor).catch(() => {})
  }

  return NextResponse.json({ ok: true, lead: lead ?? null })
}
