import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { leadRepository } from '@/repositories/leadRepository'
import { podeAcessarLead } from '@/lib/access'
import { notificarGerenteStatusAlterado } from '@/services/notificationService'
import type { StatusLead } from '@/lib/types'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/leads/[id]/status'>) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const lead = await leadRepository.buscarPorId(id)
  if (!lead) return NextResponse.json({ erro: 'Lead não encontrado.' }, { status: 404 })
  if (!podeAcessarLead(u, lead)) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { novoStatus } = await req.json() as { novoStatus: StatusLead }
  await leadRepository.alterarStatus(id, novoStatus)

  // Notifica gerentes quando Convertido ou Perdido (fire-and-forget)
  const leadAtualizado = { ...lead, status: novoStatus }
  notificarGerenteStatusAlterado(leadAtualizado, novoStatus).catch(() => {})

  return NextResponse.json({ ok: true })
}
