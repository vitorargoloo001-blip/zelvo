import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { contarNaoLidas } from '@/services/notificationService'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ naoLidas: 0 }, { status: 200 })

  const naoLidas = await contarNaoLidas(u.id)
  return NextResponse.json({ naoLidas })
}
