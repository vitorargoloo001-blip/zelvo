import type { Corretor, StatusLead } from './types'

// Compartilhado entre zelvoStore (modo local) e os repositórios Prisma (modo cloud)
// para que a regra de atualização de métricas nunca divirja entre os dois modos.
export function atualizarMetricasCorretor(
  c: Corretor,
  novoStatus: StatusLead,
  statusAnterior: StatusLead
): Corretor {
  const updated = { ...c }
  const fechando = novoStatus === 'Convertido' || novoStatus === 'Perdido'
  const reabrindo = ['Convertido', 'Perdido'].includes(statusAnterior) && !['Convertido', 'Perdido'].includes(novoStatus)

  if (fechando) updated.leadsEmAberto = Math.max(0, updated.leadsEmAberto - 1)
  if (reabrindo) updated.leadsEmAberto = updated.leadsEmAberto + 1
  if (novoStatus === 'Convertido')       updated.vendasFechadas    = updated.vendasFechadas + 1
  if (novoStatus === 'Visita agendada')  updated.visitasMarcadas   = updated.visitasMarcadas + 1
  if (novoStatus === 'Proposta enviada') updated.propostasEnviadas = updated.propostasEnviadas + 1
  return updated
}
