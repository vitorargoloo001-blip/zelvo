import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { marcarComoLida } from '@/services/notificationService'

export async function PATCH(_req: NextRequest, ctx: RouteContext<'/api/notificacoes/[id]/lida'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  await marcarComoLida(id, u.id)

  return NextResponse.json({ ok: true })
}
