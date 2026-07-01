import { NextRequest, NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { listarNotificacoesUsuario } from '@/services/notificationService'

export async function GET(req: NextRequest) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const limite = Number(req.nextUrl.searchParams.get('limit') ?? '50')
  const notificacoes = await listarNotificacoesUsuario(u.id, Math.min(limite, 100))

  return NextResponse.json({ notificacoes })
}
