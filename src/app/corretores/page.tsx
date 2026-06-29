'use client'

import { useZelvoStore } from '@/stores/zelvoStore'
import { PageHeader } from '@/components/PageHeader'
import { BrokerTable } from '@/components/BrokerTable'
import { AccessGuard } from '@/components/AccessGuard'

export default function CorretoresPage() {
  const corretores = useZelvoStore(s => s.corretores)
  const ativos     = corretores.filter(c => c.ativo).length

  return (
    <AccessGuard allowedProfiles={['gerente']}>
      <div>
        <PageHeader
          title="Corretores"
          description={`${corretores.length} corretores · ${ativos} ativos`}
        />
        <BrokerTable corretores={corretores} />
      </div>
    </AccessGuard>
  )
}
