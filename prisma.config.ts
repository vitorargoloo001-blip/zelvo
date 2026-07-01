import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// dotenv/config só carrega .env por padrão; o projeto segue a convenção do
// Next.js e guarda segredos em .env.local.
config({ path: '.env.local' })

// db push usa a URL pooled (pgbouncer) pois não requer advisory locks.
// O runtime do Prisma Client usa a mesma URL pooled passada via `datasourceUrl`
// no construtor em src/lib/prisma.ts, não por este arquivo.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('POSTGRES_PRISMA_URL'),
  },
})
