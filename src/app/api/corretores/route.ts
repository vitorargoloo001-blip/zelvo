import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { corretorRepository, toCorretor } from '@/repositories/corretorRepository'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const corretores = await corretorRepository.listar()
  return NextResponse.json({ corretores })
}

export async function POST(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const { nome, telefone, email, nivel, capacidadeMaximaLeads, participaDistribuicao, observacoes } = body

  if (!nome?.trim())    return NextResponse.json({ erro: 'Nome é obrigatório.' }, { status: 400 })
  if (!telefone?.trim()) return NextResponse.json({ erro: 'Telefone é obrigatório.' }, { status: 400 })
  if (!email?.trim())   return NextResponse.json({ erro: 'Email é obrigatório.' }, { status: 400 })

  const existe = await prisma.corretor.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (existe) return NextResponse.json({ erro: 'Já existe um corretor com este email.' }, { status: 409 })

  const novo = await prisma.corretor.create({
    data: {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim().toLowerCase(),
      nivel: nivel ?? 'C',
      capacidadeMaximaLeads: capacidadeMaximaLeads ? Number(capacidadeMaximaLeads) : 15,
      participaDistribuicao: participaDistribuicao ?? true,
      observacoes: observacoes?.trim() || null,
    },
  })

  return NextResponse.json({ corretor: toCorretor(novo) }, { status: 201 })
}
