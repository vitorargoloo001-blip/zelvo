import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'
import type { PerfilUsuario } from '@/lib/types'

declare module 'next-auth' {
  interface User {
    perfil: PerfilUsuario
    corretorId: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : undefined
        const senha = typeof credentials?.senha === 'string' ? credentials.senha : undefined
        if (!email || !senha) return null

        const usuario = await prisma.usuario.findUnique({ where: { email } })
        if (!usuario || !usuario.ativo) return null

        const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          corretorId: usuario.corretorId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.perfil = user.perfil
        token.corretorId = user.corretorId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id ?? ''
        session.user.perfil = (token.perfil as PerfilUsuario | undefined) ?? 'corretor'
        session.user.corretorId = (token.corretorId as string | null | undefined) ?? null
      }
      return session
    },
  },
})
