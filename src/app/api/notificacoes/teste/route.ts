import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { criarNotificacao } from '@/services/notificationService'

export async function POST() {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const notificacao = await criarNotificacao({
    usuarioId:  u.id,
    tipo:       'lead_atribuido',
    titulo:     'Notificação de teste',
    mensagem:   `Essa é uma notificação de teste criada às ${new Date().toLocaleString('pt-BR')} para verificar o sistema.`,
    prioridade: 'media',
    metadata:   { teste: true, usuario: u.nome },
  })

  return NextResponse.json({ ok: true, notificacao })
}
