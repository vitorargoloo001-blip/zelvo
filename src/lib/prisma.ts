import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Singleton para evitar esgotar conexões durante hot-reload do `next dev`.
// Usa a URL pooled (pgbouncer) — a URL direta é só para a CLI (prisma.config.ts).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function criarPrismaClient() {
  const adapter = new PrismaPg(process.env.POSTGRES_PRISMA_URL ?? '')
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? criarPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
