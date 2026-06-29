/**
 * route.ts — POST /api/leads/intake
 *
 * Endpoint de entrada de leads vindos de formulário externo (landing page separada).
 *
 * Fluxo futuro:
 *   Landing page externa
 *   → POST /api/leads/intake  (este endpoint)
 *   → Validação do payload
 *   → Cálculo de score server-side
 *   → Inserção no Supabase
 *   → Distribuição automática para corretor
 *   → Notificação via WhatsApp/email
 *   → Response { id, score, corretor }
 *
 * Segurança futura:
 *   - Validar HMAC ou API key do formulário externo
 *   - Rate limiting via Vercel Edge Middleware
 *   - Usar SUPABASE_SERVICE_ROLE_KEY (server-only) para inserção privilegiada
 *   - CORS restrito ao domínio da landing page
 *
 * Por enquanto: retorna 202 Accepted sem processar o payload.
 * Ative a lógica real quando DATA_MODE=supabase e o banco estiver configurado.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Futuro: validar API key do remetente
  // const apiKey = request.headers.get('x-zelvo-api-key')
  // if (apiKey !== process.env.INTAKE_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Futuro: parsear e validar o payload
  // const body = await request.json()
  // const payload = LeadExternalPayloadSchema.parse(body)

  // Futuro: calcular score (server-side, não exposto ao client)
  // const score = calcularLeadScore(payload)
  // const temperatura = definirTemperaturaLead(score)

  // Futuro: inserir no Supabase com service role
  // const { data: lead, error } = await supabaseAdmin.from('leads').insert({ ...payload, score_lead: score }).select().single()

  // Futuro: distribuir automaticamente
  // await distribuirLeadAutomaticamente(lead.id)

  // Futuro: notificar corretor
  // await notificarCorretor(lead.id)

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'local'

  if (dataMode === 'local') {
    return NextResponse.json(
      {
        status: 'pending',
        message: 'Endpoint preparado. Ative DATA_MODE=supabase para processar leads reais.',
        dataMode,
      },
      { status: 202 }
    )
  }

  // Placeholder para quando DATA_MODE=supabase for ativado
  return NextResponse.json(
    {
      status: 'not_implemented',
      message: 'Integração Supabase ainda não implementada.',
    },
    { status: 501 }
  )
}

// Futuro: endpoint GET para health check do webhook
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/leads/intake',
    status: 'ready',
    dataMode: process.env.NEXT_PUBLIC_DATA_MODE || 'local',
    supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  })
}
