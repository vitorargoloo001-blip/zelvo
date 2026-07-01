import 'server-only'
import { auth } from '@/auth'
import type { Usuario } from '@/lib/types'

/**
 * Resolve o Usuario autenticado a partir da sessão Auth.js, para uso nas
 * API Routes em DATA_MODE=cloud. Retorna null se não houver sessão.
 */
export async function usuarioAutenticado(): Promise<Usuario | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    id: session.user.id,
    nome: session.user.name ?? '',
    email: session.user.email ?? '',
    perfil: session.user.perfil,
    corretorId: session.user.corretorId ?? undefined,
  }
}
