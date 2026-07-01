import type { NextAuthConfig } from 'next-auth'

// Configuração Edge-safe: sem imports Node.js (pg, bcryptjs, prisma).
// Usada pelo proxy.ts (Edge runtime) e estendida pelo auth.ts (Node.js runtime).
export const authConfig = {
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  providers: [],
} satisfies NextAuthConfig
