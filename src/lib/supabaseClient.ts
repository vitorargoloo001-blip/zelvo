/**
 * supabaseClient.ts
 *
 * Cliente Supabase para uso no browser (anon key).
 * Apenas instanciado quando as variáveis de ambiente estão presentes.
 *
 * IMPORTANTE:
 *   - Nunca use SUPABASE_SERVICE_ROLE_KEY aqui — apenas em Route Handlers server-side.
 *   - Este arquivo só deve ser importado em componentes client-side ou
 *     em funções que rodam no browser.
 *
 * Futuro: quando DATA_MODE=supabase, os repositories importarão este cliente
 *   para fazer queries diretas com Row Level Security aplicada pelo anon key.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Instância do cliente Supabase. Será `null` quando as variáveis não estiverem
 * configuradas (modo local / desenvolvimento sem Supabase).
 *
 * Futuro: remover o null check quando Supabase for obrigatório em produção.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

/**
 * Verifica se o cliente Supabase está disponível.
 * Use antes de qualquer operação que dependa do Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
