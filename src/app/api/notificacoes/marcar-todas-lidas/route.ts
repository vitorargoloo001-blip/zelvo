import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { marcarTodasComoLidas } from '@/services/notificationService'

export async function PATCH() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  await marcarTodasComoLidas(u.id)
  return NextResponse.json({ ok: true })
}
