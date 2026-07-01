import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { leadRepository } from '@/repositories/leadRepository'

export async function POST(_req: NextRequest, ctx: RouteContext<'/api/leads/[id]/distribuir'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { id } = await ctx.params
  await leadRepository.distribuir(id)
  const lead = await leadRepository.buscarPorId(id)

  return NextResponse.json({ ok: true, lead: lead ?? null })
}
