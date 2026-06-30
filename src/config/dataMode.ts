/**
 * dataMode.ts
 *
 * Controla qual fonte de dados o Zelvo usa em runtime.
 *
 * Para ativar Supabase:
 *   1. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local
 *   2. Altere NEXT_PUBLIC_DATA_MODE=supabase no .env.local (ou na Vercel)
 *   3. Rode as migrations em supabase/schema.sql no painel do Supabase
 *
 * Futuro: quando DATA_MODE='supabase', os repositories chamarão o Supabase
 *   em vez da zelvoStore local.
 */

export type DataMode = 'local' | 'supabase'

// Remove BOM (U+FEFF) que alguns editores inserem ao salvar variáveis de ambiente
const _rawMode = process.env.NEXT_PUBLIC_DATA_MODE?.replace(/^﻿/, '').trim()
export const DATA_MODE: DataMode = (_rawMode === 'supabase' ? 'supabase' : 'local')

export const IS_LOCAL_MODE     = DATA_MODE === 'local'
export const IS_SUPABASE_MODE  = DATA_MODE === 'supabase'
