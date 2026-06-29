import type { Lead, Usuario } from '@/lib/types'

/**
 * Verifica se o usuário atual pode acessar um lead específico.
 *
 * Regras:
 * - Gerente: acesso irrestrito a qualquer lead.
 * - Corretor: apenas leads onde lead.corretorAtribuido === usuarioAtual.corretorId.
 *
 * Futuro: adicionar verificação por Row Level Security do Supabase.
 */
export function podeAcessarLead(usuarioAtual: Usuario, lead: Lead): boolean {
  if (usuarioAtual.perfil === 'gerente') return true
  return lead.corretorAtribuido === usuarioAtual.corretorId
}

/**
 * Retorna a rota inicial correta para o perfil.
 * Futuro: derivar da sessão Supabase Auth.
 */
export function rotaInicialdoPerfil(perfil: Usuario['perfil']): string {
  return perfil === 'gerente' ? '/' : '/meu-painel'
}
