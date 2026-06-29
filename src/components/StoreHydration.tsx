'use client'

import { useEffect } from 'react'
import { useZelvoStore } from '@/stores/zelvoStore'

// Dispara a hidratação do Zustand a partir do localStorage assim que o
// componente monta no cliente. Deve estar no layout raiz.
export function StoreHydration() {
  useEffect(() => {
    useZelvoStore.persist.rehydrate()
  }, [])
  return null
}
