'use client'

/**
 * CloudDataProvider.tsx
 *
 * Hidrata a zelvoStore com dados do servidor quando DATA_MODE=cloud.
 * Dispara 4 fetches paralelos no mount (leads, corretores, distribuicoes,
 * atividades) e aplica via store.hydrateFromServer().
 *
 * DATA_MODE=local → no-op (store usa os dados mock em ESTADO_INICIAL).
 * Não renderiza nada visualmente.
 */

import { useEffect } from 'react'
import { IS_CLOUD_MODE } from '@/config/dataMode'
import { useZelvoStore } from '@/stores/zelvoStore'
import type { Lead, Corretor, Distribuicao } from '@/lib/types'
import type { Atividade } from '@/stores/zelvoStore'

export function CloudDataProvider() {
  const hydrateFromServer = useZelvoStore(s => s.hydrateFromServer)

  useEffect(() => {
    if (!IS_CLOUD_MODE) return

    Promise.all([
      fetch('/api/leads').then(r => r.json()) as Promise<{ leads: Lead[] }>,
      fetch('/api/corretores').then(r => r.json()) as Promise<{ corretores: Corretor[] }>,
      fetch('/api/distribuicoes').then(r => r.json()) as Promise<{ distribuicoes: Distribuicao[] }>,
      fetch('/api/atividades').then(r => r.json()) as Promise<{ atividades: Atividade[] }>,
    ])
      .then(([leadsRes, corretoresRes, distribuicoesRes, atividadesRes]) => {
        hydrateFromServer({
          leads:         leadsRes.leads         ?? [],
          corretores:    corretoresRes.corretores    ?? [],
          distribuicoes: distribuicoesRes.distribuicoes ?? [],
          atividades:    atividadesRes.atividades    ?? [],
        })
      })
      .catch(err => {
        console.error('[CloudDataProvider] Erro ao carregar dados do servidor:', err)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
