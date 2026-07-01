import { NextRequest, NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { atividadeRepository } from '@/repositories/atividadeRepository'
import { prisma } from '@/lib/prisma'
import { toAtividade } from '@/repositories/atividadeRepository'
import type { Atividade } from '@/stores/zelvoStore'

export async function GET(req: NextRequest) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const leadId = req.nextUrl.searchParams.get('leadId')

  if (leadId) {
    const atividades = await atividadeRepository.listarPorLead(leadId)
    return NextResponse.json({ atividades })
  }

  if (u.perfil === 'gerente') {
    const atividades = await atividadeRepository.listar()
    return NextResponse.json({ atividades })
  }

  // Corretor: apenas atividades de seus próprios leads
  const rows = await prisma.atividade.findMany({
    where: {
      lead: { corretorAtribuido: u.corretorId ?? '' },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ atividades: rows.map(toAtividade) })
}

export async function POST(req: NextRequest) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const payload = await req.json() as Omit<Atividade, 'id' | 'createdAt'>
  const atividade = await atividadeRepository.criar(payload)

  return NextResponse.json({ atividade }, { status: 201 })
}
