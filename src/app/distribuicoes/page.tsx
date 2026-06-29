'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { DistributionHistory } from '@/components/DistributionHistory'
import { AccessGuard } from '@/components/AccessGuard'

export default function DistribuicoesPage() {
  const distribuicoes  = useZelvoStore(s => s.distribuicoes)
  const leads          = useZelvoStore(s => s.leads)
  const corretores     = useZelvoStore(s => s.corretores)

  const leadsById      = Object.fromEntries(leads.map(l => [l.id, l]))
  const corretoresById = Object.fromEntries(corretores.map(c => [c.id, c]))

  return (
    <AccessGuard allowedProfiles={['gerente']}>
      <div>
        <PageHeader
          title="Distribuições"
          description={`${distribuicoes.length} distribuições registradas`}
        />
        <DistributionHistory
          distribuicoes={distribuicoes}
          leadsById={leadsById}
          corretoresById={corretoresById}
        />
      </div>
    </AccessGuard>
  )
}
