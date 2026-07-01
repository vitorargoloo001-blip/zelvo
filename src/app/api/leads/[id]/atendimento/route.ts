import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { leadRepository } from '@/repositories/leadRepository'
import { podeAcessarLead } from '@/lib/access'
import type { AtualizacaoAtendimentoPayload } from '@/stores/zelvoStore'

export async function POST(req: NextRequest, ctx: RouteContext<'/api/leads/[id]/atendimento'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const lead = await leadRepository.buscarPorId(id)
  if (!lead) return NextResponse.json({ erro: 'Lead não encontrado.' }, { status: 404 })
  if (!podeAcessarLead(u, lead)) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const payload = await req.json() as AtualizacaoAtendimentoPayload
  await leadRepository.registrarAtualizacaoAtendimento({ ...payload, leadId: id })

  return NextResponse.json({ ok: true })
}
