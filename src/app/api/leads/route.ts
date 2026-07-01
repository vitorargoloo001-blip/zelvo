import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { leadRepository } from '@/repositories/leadRepository'

export async function GET() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const leads = u.perfil === 'gerente'
    ? await leadRepository.listar()
    : await leadRepository.listarPorCorretor(u.corretorId ?? '')

  return NextResponse.json({ leads })
}
