import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(process.env.POSTGRES_PRISMA_URL ?? '')
const prisma = new PrismaClient({ adapter })
const SENHA_DEMO = 'zelvo@2025'

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_DEMO, 12)

  // ── Corretores ────────────────────────────────────────────────────────────
  const corretores = [
    { id: 'c1', nome: 'João Silva',       telefone: '(11) 99999-1001', email: 'joao.silva@zelvo.com',       nivel: 'A' as const, scoreCorretor: 94, leadsRecebidos: 120, leadsEmAberto: 6,  visitasMarcadas: 48, propostasEnviadas: 35, vendasFechadas: 28, taxaConversao: 23, tempoMedioAtendimento: 12, ativo: true },
    { id: 'c2', nome: 'Maria Santos',     telefone: '(11) 99999-1002', email: 'maria.santos@zelvo.com',     nivel: 'A' as const, scoreCorretor: 89, leadsRecebidos: 105, leadsEmAberto: 8,  visitasMarcadas: 41, propostasEnviadas: 30, vendasFechadas: 22, taxaConversao: 21, tempoMedioAtendimento: 15, ativo: true },
    { id: 'c3', nome: 'Juliana Ferreira', telefone: '(11) 99999-1003', email: 'juliana.ferreira@zelvo.com', nivel: 'A' as const, scoreCorretor: 87, leadsRecebidos: 98,  leadsEmAberto: 11, visitasMarcadas: 38, propostasEnviadas: 28, vendasFechadas: 19, taxaConversao: 19, tempoMedioAtendimento: 18, ativo: true },
    { id: 'c4', nome: 'Pedro Oliveira',   telefone: '(11) 99999-1004', email: 'pedro.oliveira@zelvo.com',   nivel: 'B' as const, scoreCorretor: 76, leadsRecebidos: 87,  leadsEmAberto: 12, visitasMarcadas: 29, propostasEnviadas: 20, vendasFechadas: 13, taxaConversao: 15, tempoMedioAtendimento: 24, ativo: true },
    { id: 'c5', nome: 'Ana Costa',        telefone: '(11) 99999-1005', email: 'ana.costa@zelvo.com',        nivel: 'B' as const, scoreCorretor: 71, leadsRecebidos: 78,  leadsEmAberto: 9,  visitasMarcadas: 25, propostasEnviadas: 17, vendasFechadas: 11, taxaConversao: 14, tempoMedioAtendimento: 28, ativo: true },
    { id: 'c6', nome: 'Carlos Mendes',    telefone: '(11) 99999-1006', email: 'carlos.mendes@zelvo.com',    nivel: 'C' as const, scoreCorretor: 58, leadsRecebidos: 64,  leadsEmAberto: 15, visitasMarcadas: 16, propostasEnviadas: 10, vendasFechadas: 6,  taxaConversao: 9,  tempoMedioAtendimento: 42, ativo: true },
    { id: 'c7', nome: 'Fernanda Lima',    telefone: '(11) 99999-1007', email: 'fernanda.lima@zelvo.com',    nivel: 'C' as const, scoreCorretor: 52, leadsRecebidos: 55,  leadsEmAberto: 7,  visitasMarcadas: 12, propostasEnviadas: 8,  vendasFechadas: 4,  taxaConversao: 7,  tempoMedioAtendimento: 50, ativo: true },
    { id: 'c8', nome: 'Roberto Alves',    telefone: '(11) 99999-1008', email: 'roberto.alves@zelvo.com',    nivel: 'D' as const, scoreCorretor: 34, leadsRecebidos: 30,  leadsEmAberto: 3,  visitasMarcadas: 5,  propostasEnviadas: 3,  vendasFechadas: 1,  taxaConversao: 3,  tempoMedioAtendimento: 75, ativo: true },
  ]

  for (const c of corretores) {
    await prisma.corretor.upsert({ where: { id: c.id }, update: c, create: c })
  }
  console.log(`✓ ${corretores.length} corretores seedados`)

  // ── Usuários ──────────────────────────────────────────────────────────────
  const usuarios = [
    { id: 'user-gerente-1', nome: 'Carlos Gerente',    email: 'gerente@zelvo.com',            perfil: 'gerente' as const,  corretorId: null },
    { id: 'user-corretor-1', nome: 'João Silva',       email: 'joao.silva@zelvo.com',         perfil: 'corretor' as const, corretorId: 'c1' },
    { id: 'user-corretor-2', nome: 'Maria Santos',     email: 'maria.santos@zelvo.com',       perfil: 'corretor' as const, corretorId: 'c2' },
    { id: 'user-corretor-3', nome: 'Juliana Ferreira', email: 'juliana.ferreira@zelvo.com',   perfil: 'corretor' as const, corretorId: 'c3' },
    { id: 'user-corretor-4', nome: 'Pedro Oliveira',   email: 'pedro.oliveira@zelvo.com',     perfil: 'corretor' as const, corretorId: 'c4' },
    { id: 'user-corretor-5', nome: 'Ana Costa',        email: 'ana.costa@zelvo.com',          perfil: 'corretor' as const, corretorId: 'c5' },
  ]

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, perfil: u.perfil, corretorId: u.corretorId, ativo: true },
      create: { ...u, senhaHash, ativo: true },
    })
  }
  console.log(`✓ ${usuarios.length} usuários seedados`)
  console.log(`  Senha de demo: ${SENHA_DEMO}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
