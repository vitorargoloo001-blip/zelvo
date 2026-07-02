import { NextResponse } from 'next/server'
import { usuarioAutenticado } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { distribuirLeadAutomaticamente } from '@/lib/distribution'
import { DISTRIBUICAO_REGRAS_PADRAO } from '@/lib/scoreDefaults'
import type { Lead, Corretor, DistribuicaoRegras } from '@/lib/types'

export async function POST(req: Request) {
  const u = await usuarioAutenticado()
  if (!u) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (u.perfil !== 'gerente') return NextResponse.json({ erro: 'Acesso restrito.' }, { status: 403 })

  const body = await req.json()
  const temperatura: string = body.temperatura ?? 'Quente'

  const leadMock: Lead = {
    id: 'mock',
    nome: 'Lead de Teste',
    telefone: '(11) 99999-9999',
    cidade: 'São Paulo',
    regiaoInteresse: 'Zona Sul',
    tipoImovel: 'Apartamento',
    rendaFamiliar: 8000,
    valorEntrada: 30000,
    possuiFgts: true,
    prazoCompra: 'até 30 dias',
    financiamentoAprovado: true,
    empreendimentoInteresse: 'Condomínio A',
    origem: 'Landing Page',
    campanha: 'teste',
    scoreLead: 85,
    temperaturaLead: temperatura as Lead['temperaturaLead'],
    status: 'Novo',
    corretorAtribuido: null,
    fonteEntrada: 'manual',
    createdAt: new Date().toISOString(),
  }

  const rows = await prisma.corretor.findMany()
  const corretores: Corretor[] = rows.map(r => ({
    id: r.id,
    nome: r.nome,
    telefone: r.telefone,
    email: r.email,
    nivel: r.nivel,
    scoreCorretor: r.scoreCorretor,
    leadsRecebidos: r.leadsRecebidos,
    leadsEmAberto: r.leadsEmAberto,
    visitasMarcadas: r.visitasMarcadas,
    propostasEnviadas: r.propostasEnviadas,
    vendasFechadas: r.vendasFechadas,
    taxaConversao: r.taxaConversao,
    tempoMedioAtendimento: r.tempoMedioAtendimento,
    ativo: r.ativo,
    capacidadeMaximaLeads: r.capacidadeMaximaLeads,
    participaDistribuicao: r.participaDistribuicao,
    nivelManual: r.nivelManual,
    observacoes: r.observacoes ?? undefined,
  }))

  const configRow = await prisma.distribuicaoConfig.findFirst({ where: { ativo: true } })
  const regras: DistribuicaoRegras = configRow
    ? (configRow.regras as unknown as DistribuicaoRegras)
    : DISTRIBUICAO_REGRAS_PADRAO

  const resultado = distribuirLeadAutomaticamente(leadMock, corretores, regras)

  return NextResponse.json({
    leadMock: { temperatura, scoreLead: leadMock.scoreLead },
    corretorEscolhido: resultado.corretor
      ? { id: resultado.corretor.id, nome: resultado.corretor.nome, nivel: resultado.corretor.nivel, leadsEmAberto: resultado.corretor.leadsEmAberto }
      : null,
    motivo: resultado.distribuicao?.motivoDistribuicao ?? 'Nenhum corretor disponível',
    totalCandidatos: corretores.filter(c => c.ativo && c.participaDistribuicao).length,
  })
}
