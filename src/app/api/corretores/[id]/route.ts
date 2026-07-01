import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { corretorRepository } from '@/repositories/corretorRepository'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/corretores/[id]'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const corretor = await corretorRepository.buscarPorId(id)
  if (!corretor) return NextResponse.json({ erro: 'Corretor não encontrado.' }, { status: 404 })

  return NextResponse.json({ corretor })
}
