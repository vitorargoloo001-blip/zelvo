'use client'

import { PageHeader } from '@/components/PageHeader'
import { LeadForm } from '@/components/LeadForm'
import { AccessGuard } from '@/components/AccessGuard'
import { AcessoRestrito } from '@/components/AcessoRestrito'

export default function NovoLeadPage() {
  return (
    <AccessGuard
      allowedProfiles={['gerente']}
      fallback={
        <AcessoRestrito mensagem="O cadastro de novos leads é realizado pela equipe de gestão." />
      }
    >
      <div>
        <PageHeader title="Novo Lead" description="Cadastrar e distribuir automaticamente" />
        <div className="max-w-3xl rounded-xl border border-border p-6" style={{ background: 'var(--card)' }}>
          <LeadForm />
        </div>
      </div>
    </AccessGuard>
  )
}
