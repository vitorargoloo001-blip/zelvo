import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { DATA_MODE } from '@/config/dataMode'
import { verificarAlertasGerenciais } from '@/services/alertService'

export async function POST() {
  if (DATA_MODE === 'local') {
    return NextResponse.json({ erro: 'Disponível apenas em DATA_MODE=cloud.' }, { status: 400 })
  }

  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito a gerentes.' }, { status: 403 })

  const resultado = await verificarAlertasGerenciais()

  return NextResponse.json({ ok: true, alertasCriados: resultado })
}
