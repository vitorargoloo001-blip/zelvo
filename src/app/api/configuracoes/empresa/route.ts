import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

async function getOrCreateEmpresa() {
  const empresa = await prisma.empresa.findFirst()
  if (empresa) return empresa
  return prisma.empresa.create({ data: { nome: 'Minha Imobiliária' } })
}

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const empresa = await getOrCreateEmpresa()
  return NextResponse.json({ empresa })
}

export async function PATCH(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const { nome, cnpj, telefone, email, site, cidade, estado, segmento, logoUrl } = body

  const empresa = await getOrCreateEmpresa()
  const atualizada = await prisma.empresa.update({
    where: { id: empresa.id },
    data: {
      ...(nome      !== undefined && { nome }),
      ...(cnpj      !== undefined && { cnpj }),
      ...(telefone  !== undefined && { telefone }),
      ...(email     !== undefined && { email }),
      ...(site      !== undefined && { site }),
      ...(cidade    !== undefined && { cidade }),
      ...(estado    !== undefined && { estado }),
      ...(segmento  !== undefined && { segmento }),
      ...(logoUrl   !== undefined && { logoUrl }),
    },
  })

  return NextResponse.json({ empresa: atualizada })
}
