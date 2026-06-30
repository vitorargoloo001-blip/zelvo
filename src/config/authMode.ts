/**
 * authMode.ts
 *
 * Controla se o Zelvo usa autenticação mockada (UserSwitcher) ou real (Supabase Auth).
 *
 * NEXT_PUBLIC_AUTH_MODE=mock     → UserSwitcher para demo/desenvolvimento
 * NEXT_PUBLIC_AUTH_MODE=supabase → Supabase Auth com login/logout real
 *
 * Alterar na Vercel: Settings → Environment Variables → NEXT_PUBLIC_AUTH_MODE=supabase
 */

export type AuthMode = 'mock' | 'supabase'

// Remove BOM (U+FEFF) que o Vercel pode inserir ao salvar variáveis de ambiente
const _rawAuth = process.env.NEXT_PUBLIC_AUTH_MODE?.replace(/^﻿/, '').trim()
export const AUTH_MODE: AuthMode = _rawAuth === 'supabase' ? 'supabase' : 'mock'

export const IS_MOCK_AUTH     = AUTH_MODE === 'mock'
export const IS_SUPABASE_AUTH = AUTH_MODE === 'supabase'
