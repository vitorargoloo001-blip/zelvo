import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { corretorRepository, toCorretor } from '@/repositories/corretorRepository'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { id } = await params
  const corretor = await corretorRepository.buscarPorId(id)
  if (!corretor) return NextResponse.json({ erro: 'Corretor não encontrado.' }, { status: 404 })

  return NextResponse.json({ corretor })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const corretor = await prisma.corretor.findUnique({ where: { id } })
  if (!corretor) return NextResponse.json({ erro: 'Corretor não encontrado.' }, { status: 404 })

  if (body.email && body.email !== corretor.email) {
    const existe = await prisma.corretor.findUnique({ where: { email: body.email.trim().toLowerCase() } })
    if (existe) return NextResponse.json({ erro: 'Email já em uso.' }, { status: 409 })
  }

  const dados: Record<string, unknown> = {}
  if (body.nome                 !== undefined) dados.nome = body.nome.trim()
  if (body.telefone             !== undefined) dados.telefone = body.telefone.trim()
  if (body.email                !== undefined) dados.email = body.email.trim().toLowerCase()
  if (body.nivel                !== undefined) dados.nivel = body.nivel
  if (body.nivelManual          !== undefined) dados.nivelManual = body.nivelManual
  if (body.capacidadeMaximaLeads !== undefined) dados.capacidadeMaximaLeads = Number(body.capacidadeMaximaLeads)
  if (body.participaDistribuicao !== undefined) dados.participaDistribuicao = body.participaDistribuicao
  if (body.observacoes          !== undefined) dados.observacoes = body.observacoes?.trim() || null
  if (body.ativo                !== undefined) dados.ativo = body.ativo

  const atualizado = await prisma.corretor.update({ where: { id }, data: dados })
  return NextResponse.json({ corretor: toCorretor(atualizado) })
}
