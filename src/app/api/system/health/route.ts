import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VERSION = '2.0.0'

export async function GET() {
  let database = false
  let totals = { leads: 0, corretores: 0, usuarios: 0, distribuicoes: 0, atividades: 0 }

  try {
    const [leads, corretores, usuarios, distribuicoes, atividades] = await Promise.all([
      prisma.lead.count(),
      prisma.corretor.count(),
      prisma.usuario.count(),
      prisma.distribuicao.count(),
      prisma.atividade.count(),
    ])
    totals = { leads, corretores, usuarios, distribuicoes, atividades }
    database = true
  } catch {
    database = false
  }

  return NextResponse.json({
    ok: database,
    database,
    auth: !!process.env.NEXTAUTH_SECRET,
    ambiente: process.env.NODE_ENV ?? 'development',
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
    version: VERSION,
    totals,
    secrets: {
      intakeSecret: !!process.env.LEAD_INTAKE_SECRET,
      resendKey: !!process.env.RESEND_API_KEY,
      databaseUrl: !!(process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL),
    },
  })
}
