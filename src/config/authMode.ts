/**
 * authMode.ts
 *
 * Controla se o Zelvo usa autenticação mockada (UserSwitcher) ou real (Auth.js + Postgres).
 *
 * NEXT_PUBLIC_AUTH_MODE=mock  → UserSwitcher para demo/desenvolvimento
 * NEXT_PUBLIC_AUTH_MODE=cloud → Auth.js (NextAuth) com login/logout real
 *
 * Alterar na Vercel: Settings → Environment Variables → NEXT_PUBLIC_AUTH_MODE=cloud
 */

export type AuthMode = 'mock' | 'cloud'

// Remove BOM (U+FEFF) que o Vercel pode inserir ao salvar variáveis de ambiente
const _rawAuth = process.env.NEXT_PUBLIC_AUTH_MODE?.replace(/^﻿/, '').trim()
export const AUTH_MODE: AuthMode = _rawAuth === 'cloud' ? 'cloud' : 'mock'

export const IS_MOCK_AUTH  = AUTH_MODE === 'mock'
export const IS_CLOUD_AUTH = AUTH_MODE === 'cloud'
