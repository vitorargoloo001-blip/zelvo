/**
 * dataMode.ts
 *
 * Controla qual fonte de dados o Zelvo usa em runtime.
 *
 * Para ativar o modo cloud:
 *   1. Provisione um banco Vercel Postgres (Storage → Postgres) — injeta
 *      POSTGRES_PRISMA_URL e POSTGRES_URL_NON_POOLING automaticamente
 *   2. Altere NEXT_PUBLIC_DATA_MODE=cloud no .env.local (ou na Vercel)
 *   3. Rode `npx prisma migrate deploy` e `npx prisma db seed`
 *
 * Quando DATA_MODE='cloud', os repositories chamam o Postgres via Prisma
 *   em vez da zelvoStore local.
 */

export type DataMode = 'local' | 'cloud'

// Remove BOM (U+FEFF) que o Vercel pode inserir ao salvar variáveis de ambiente
const _rawMode = process.env.NEXT_PUBLIC_DATA_MODE?.replace(/^﻿/, '').trim()
export const DATA_MODE: DataMode = (_rawMode === 'cloud' ? 'cloud' : 'local')

export const IS_LOCAL_MODE = DATA_MODE === 'local'
export const IS_CLOUD_MODE = DATA_MODE === 'cloud'
