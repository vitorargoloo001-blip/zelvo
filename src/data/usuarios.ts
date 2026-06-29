import type { Usuario } from '@/lib/types'

export const usuarios: Usuario[] = [
  {
    id: 'user-gerente-1',
    nome: 'Carlos Gerente',
    email: 'gerente@zelvo.app',
    perfil: 'gerente',
  },
  {
    id: 'user-corretor-1',
    nome: 'João Silva',
    email: 'joao.silva@zelvo.com',
    perfil: 'corretor',
    corretorId: 'c1',
  },
  {
    id: 'user-corretor-2',
    nome: 'Maria Santos',
    email: 'maria.santos@zelvo.com',
    perfil: 'corretor',
    corretorId: 'c2',
  },
  {
    id: 'user-corretor-3',
    nome: 'Juliana Ferreira',
    email: 'juliana.ferreira@zelvo.com',
    perfil: 'corretor',
    corretorId: 'c3',
  },
  {
    id: 'user-corretor-4',
    nome: 'Pedro Oliveira',
    email: 'pedro.oliveira@zelvo.com',
    perfil: 'corretor',
    corretorId: 'c4',
  },
  {
    id: 'user-corretor-5',
    nome: 'Ana Costa',
    email: 'ana.costa@zelvo.com',
    perfil: 'corretor',
    corretorId: 'c5',
  },
]
