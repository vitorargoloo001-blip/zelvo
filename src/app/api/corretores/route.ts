import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { corretorRepository } from '@/repositories/corretorRepository'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const corretores = await corretorRepository.listar()
  return NextResponse.json({ corretores })
}
