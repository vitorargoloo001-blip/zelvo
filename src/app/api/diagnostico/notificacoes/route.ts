import { NextResponse } from 'next/server'
import { DATA_MODE } from '@/config/dataMode'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const resendConfigurado  = !!(process.env.RESEND_API_KEY?.trim())
  const fromConfigurado    = !!(process.env.RESEND_FROM_EMAIL?.trim())

  if (DATA_MODE === 'local') {
    return NextResponse.json({
      totalNotificacoes: 0,
      naoLidas:          0,
      emailsEnviados:    0,
      emailsErro:        0,
      resendConfigurado,
      fromConfigurado,
    })
  }

  const [totalNotificacoes, naoLidas, emailsEnviados, emailsErro] = await Promise.all([
    prisma.notificacao.count(),
    prisma.notificacao.count({ where: { lida: false } }),
    prisma.emailLog.count({ where: { status: 'enviado' } }),
    prisma.emailLog.count({ where: { status: 'erro' } }),
  ])

  return NextResponse.json({
    totalNotificacoes,
    naoLidas,
    emailsEnviados,
    emailsErro,
    resendConfigurado,
    fromConfigurado,
  })
}
