import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { nome, email, senha, perfil, corretorId, ativo } = body

  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 })

  if (email && email !== usuario.email) {
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return NextResponse.json({ erro: 'Email já em uso.' }, { status: 409 })
  }

  const dados: Record<string, unknown> = {}
  if (nome !== undefined)       dados.nome = nome.trim()
  if (email !== undefined)      dados.email = email.trim().toLowerCase()
  if (perfil !== undefined)     dados.perfil = perfil
  if (corretorId !== undefined) dados.corretorId = corretorId || null
  if (ativo !== undefined)      dados.ativo = ativo
  if (senha && senha.length >= 6) {
    dados.senhaHash = await bcrypt.hash(senha, 12)
  }

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: dados,
    include: { corretor: { select: { id: true, nome: true } } },
  })

  return NextResponse.json({
    usuario: {
      id: atualizado.id,
      nome: atualizado.nome,
      email: atualizado.email,
      perfil: atualizado.perfil,
      corretorId: atualizado.corretorId ?? undefined,
      corretorNome: atualizado.corretor?.nome ?? undefined,
      ativo: atualizado.ativo,
      createdAt: atualizado.createdAt.toISOString(),
      updatedAt: atualizado.updatedAt.toISOString(),
    },
  })
}
