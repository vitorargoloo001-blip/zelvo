/**
 * GET /api/diagnostico/intake
 *
 * Retorna o status da configuração do intake e estatísticas de leads externos.
 * Exige sessão autenticada com perfil gerente. Usa variáveis server-side
 * (LEAD_INTAKE_SECRET, LEAD_INTAKE_ALLOWED_ORIGINS) que nunca chegam ao client.
 */

import { NextResponse } from 'next/server'
import { DATA_MODE } from '@/config/dataMode'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const usuario = await usuarioAutenticado()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  if (usuario.perfil !== 'gerente') return NextResponse.json({ error: 'Acesso restrito a gerentes.' }, { status: 403 })

  const secretConfigurado   = !!(process.env.LEAD_INTAKE_SECRET?.trim())
  const origensConfiguradas = !!(process.env.LEAD_INTAKE_ALLOWED_ORIGINS?.trim())

  if (DATA_MODE === 'local') {
    return NextResponse.json({
      endpointDisponivel:   true,
      secretConfigurado,
      origensConfiguradas,
      totalLeadsExternos:   0,
      ultimosLeadsExternos: [],
    })
  }

  const [totalLeadsExternos, ultimosLeadsExternos] = await Promise.all([
    prisma.lead.count({ where: { fonteEntrada: 'formulario_externo' } }),
    prisma.lead.findMany({
      where:   { fonteEntrada: 'formulario_externo' },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select:  {
        id:               true,
        nome:             true,
        campanha:         true,
        temperaturaLead:  true,
        scoreLead:        true,
        createdAt:        true,
        formularioOrigem: true,
        dispositivo:      true,
      },
    }),
  ])

  return NextResponse.json({
    endpointDisponivel: true,
    secretConfigurado,
    origensConfiguradas,
    totalLeadsExternos,
    ultimosLeadsExternos: ultimosLeadsExternos.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  })
}
