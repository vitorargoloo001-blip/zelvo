export type TemperaturaLead = 'Premium' | 'Quente' | 'Morno' | 'Frio'
export type PerfilUsuario = 'gerente' | 'corretor'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  corretorId?: string
}
export type NivelCorretor = 'A' | 'B' | 'C' | 'D'
export type StatusLead =
  | 'Novo'
  | 'Distribuído'
  | 'Contato iniciado'
  | 'Em Atendimento'
  | 'Visita agendada'
  | 'Proposta enviada'
  | 'Convertido'
  | 'Perdido'
  | 'Nutrição'
export type PrazoCompra = 'até 30 dias' | '1 a 3 meses' | '3 a 6 meses' | 'acima de 6 meses' | 'sem previsão'
export type TipoImovel = 'Apartamento' | 'Casa' | 'Terreno' | 'Comercial' | 'Rural'
export type OrigemLead = 'Meta Ads' | 'Google Ads' | 'WhatsApp' | 'Landing Page' | 'Indicação' | 'Portal Imobiliário'
export type FonteEntrada = 'manual' | 'formulario_externo' | 'importacao'

export interface Lead {
  id: string
  nome: string
  telefone: string
  cidade: string
  regiaoInteresse: string
  tipoImovel: TipoImovel
  rendaFamiliar: number
  valorEntrada: number
  possuiFgts: boolean
  prazoCompra: PrazoCompra
  financiamentoAprovado: boolean
  empreendimentoInteresse: string
  origem: OrigemLead
  campanha: string
  scoreLead: number
  temperaturaLead: TemperaturaLead
  status: StatusLead
  corretorAtribuido: string | null
  createdAt: string

  // Atendimento comercial
  observacao?: string
  proximaAcao?: string
  dataProximaAcao?: string

  // Campos de rastreabilidade — preparados para entrada via formulário externo
  fonteEntrada: FonteEntrada
  formularioOrigem?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  ipOrigem?: string
  dispositivo?: string
  dataEnvioFormulario?: string
}

export interface Corretor {
  id: string
  nome: string
  telefone: string
  email: string
  nivel: NivelCorretor
  scoreCorretor: number
  leadsRecebidos: number
  leadsEmAberto: number
  visitasMarcadas: number
  propostasEnviadas: number
  vendasFechadas: number
  taxaConversao: number
  tempoMedioAtendimento: number
  ativo: boolean
  capacidadeMaximaLeads: number
  participaDistribuicao: boolean
  nivelManual: boolean
  observacoes?: string
}

export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  site?: string
  cidade?: string
  estado?: string
  segmento?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ScoreRegras {
  rendaMinima: number
  rendaPontosPositivos: number
  entradaMinima: number
  entradaPontosPositivos: number
  fgtsPontos: number
  urgenciaPontos: number
  empreendimentoPontos: number
  regiaoPontos: number
  financiamentoPontos: number
  rendaBaixaLimite: number
  rendaBaixaPenalidade: number
  semPrevisaoPenalidade: number
  regiaoVaziaPenalidade: number
  temperaturas: {
    premium: number
    quente: number
    morno: number
  }
}

export interface ScoreConfig {
  id: string
  nome: string
  ativo: boolean
  regras: ScoreRegras
  createdAt: string
  updatedAt: string
}

export interface DistribuicaoRegras {
  nivelPorTemperatura: Record<string, string[]>
  capacidadeMaximaPadrao: number
  considerarMenorLeadsAberto: boolean
  considerarMaiorScore: boolean
  considerarMaiorConversao: boolean
  considerarMenorTempoAtendimento: boolean
  permitirFallback: boolean
  permitirDistribuicaoManual: boolean
}

export interface DistribuicaoConfig {
  id: string
  ativo: boolean
  regras: DistribuicaoRegras
  createdAt: string
  updatedAt: string
}

export interface EtapaFunil {
  id: string
  nome: string
  cor: string
  ordem: number
  ativa: boolean
  etapaFinal: boolean
  contaComoConversao: boolean
  liberaLeadAberto: boolean
}

export interface FunilConfig {
  id: string
  etapas: EtapaFunil[]
  createdAt: string
  updatedAt: string
}

export interface NotificacaoConfig {
  id: string
  notificacoesInternasAtivas: boolean
  emailNovoLead: boolean
  emailLeadPremium: boolean
  alertaPremiumParado: boolean
  minutosPremiumParado: number
  alertaSemProximaAcao: boolean
  alertaCorretorSobrecarregado: boolean
  limiteLeadsEmAberto: number
  createdAt: string
  updatedAt: string
}

export interface OnboardingStatus {
  id: string
  empresaConfigurada: boolean
  corretoresConfigurados: boolean
  usuariosConfigurados: boolean
  scoreConfigurado: boolean
  distribuicaoConfigurada: boolean
  testeLeadCriado: boolean
  concluido: boolean
  createdAt: string
  updatedAt: string
}

export interface UsuarioCompleto {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  corretorId?: string
  corretorNome?: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface Distribuicao {
  id: string
  leadId: string
  corretorId: string
  scoreLeadNoMomento: number
  scoreCorretorNoMomento: number
  motivoDistribuicao: string
  createdAt: string
}

// Payload recebido do formulário externo.
// Futuramente conectado a: POST /api/leads/intake
export interface LeadExternalPayload {
  // Dados do lead (espelho do formulário de qualificação)
  nome: string
  telefone: string
  cidade: string
  regiaoInteresse?: string
  tipoImovel: TipoImovel
  rendaFamiliar: number
  valorEntrada: number
  possuiFgts: boolean
  prazoCompra: PrazoCompra
  financiamentoAprovado: boolean
  empreendimentoInteresse?: string
  origem: OrigemLead

  // Metadados da entrada externa
  formularioOrigem: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  ipOrigem?: string
  dispositivo?: string
  dataEnvioFormulario?: string
}
