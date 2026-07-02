import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const rows = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    include: { corretor: { select: { id: true, nome: true } } },
  })

  const usuarios = rows.map(r => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    perfil: r.perfil,
    corretorId: r.corretorId ?? undefined,
    corretorNome: r.corretor?.nome ?? undefined,
    ativo: r.ativo,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return NextResponse.json({ usuarios })
}

export async function POST(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const { nome, email, senha, perfil, corretorId } = body

  if (!nome?.trim()) return NextResponse.json({ erro: 'Nome é obrigatório.' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ erro: 'Email é obrigatório.' }, { status: 400 })
  if (!senha || senha.length < 6) return NextResponse.json({ erro: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  if (!['gerente', 'corretor'].includes(perfil)) return NextResponse.json({ erro: 'Perfil inválido.' }, { status: 400 })

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ erro: 'Já existe um usuário com este email.' }, { status: 409 })

  const senhaHash = await bcrypt.hash(senha, 12)

  const novo = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senhaHash,
      perfil,
      corretorId: corretorId || null,
    },
    include: { corretor: { select: { id: true, nome: true } } },
  })

  return NextResponse.json({
    usuario: {
      id: novo.id,
      nome: novo.nome,
      email: novo.email,
      perfil: novo.perfil,
      corretorId: novo.corretorId ?? undefined,
      corretorNome: novo.corretor?.nome ?? undefined,
      ativo: novo.ativo,
      createdAt: novo.createdAt.toISOString(),
      updatedAt: novo.updatedAt.toISOString(),
    },
  }, { status: 201 })
}
