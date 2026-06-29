import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { leads as leadsIniciais } from '@/data/leads'
import { corretores as corretoresIniciais } from '@/data/corretores'
import { distribuicoes as distribuicoesIniciais } from '@/data/distribuicoes'
import { usuarios as usuariosIniciais } from '@/data/usuarios'
import { calcularLeadScore, definirTemperaturaLead } from '@/lib/score'
import { distribuirLeadAutomaticamente } from '@/lib/distribution'
import type {
  Lead, Corretor, Distribuicao, StatusLead, Usuario,
  FonteEntrada, TipoImovel, PrazoCompra, OrigemLead,
} from '@/lib/types'

// ── Atividade ──────────────────────────────────────────────────────────────

export interface Atividade {
  id: string
  leadId: string
  tipo: 'status' | 'redistribuicao' | 'nota'
  titulo: string
  descricao: string
  createdAt: string
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface CriarLeadPayload {
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
  fonteEntrada: FonteEntrada
}

export interface AtualizacaoAtendimentoPayload {
  leadId: string
  statusAnterior: StatusLead
  statusNovo: StatusLead
  observacao?: string
  proximaAcao?: string
  dataProximaAcao?: string
}

// ── Estado inicial ─────────────────────────────────────────────────────────

export const ESTADO_INICIAL = {
  leads:         leadsIniciais as Lead[],
  corretores:    corretoresIniciais as Corretor[],
  distribuicoes: distribuicoesIniciais as Distribuicao[],
  atividades:    [] as Atividade[],
  usuarios:      usuariosIniciais as Usuario[],
  usuarioAtual:  usuariosIniciais[0] as Usuario, // gerente por padrão
}

// ── Interface da store ─────────────────────────────────────────────────────

export interface ZelvoStore {
  leads:         Lead[]
  corretores:    Corretor[]
  distribuicoes: Distribuicao[]
  atividades:    Atividade[]
  usuarios:      Usuario[]
  usuarioAtual:  Usuario

  // Gestão de usuário
  selecionarUsuario: (id: string) => void
  isGerente: () => boolean
  isCorretor: () => boolean

  // Lead CRUD
  adicionarLead:  (payload: CriarLeadPayload) => Lead
  atualizarLead:  (id: string, dados: Partial<CriarLeadPayload>) => void

  // Funil comercial
  alterarStatusLead: (id: string, novoStatus: StatusLead) => void
  adicionarAtualizacaoAtendimento: (payload: AtualizacaoAtendimentoPayload) => void

  // Distribuição
  distribuirLead:   (id: string) => void
  redistribuirLead: (id: string, corretorId: string) => void

  // Atividades
  adicionarAtividade: (payload: Omit<Atividade, 'id' | 'createdAt'>) => void

  // Seletores helper
  buscarLeadPorId:              (id: string) => Lead | undefined
  buscarCorretorPorId:          (id: string) => Corretor | undefined
  buscarDistribuicaoPorLeadId:  (leadId: string) => Distribuicao | undefined

  // Reset
  resetarDados: () => void
}

// ── Helper: atualiza métricas do corretor ao mudar status ──────────────────

function atualizarMetricasCorretor(
  c: Corretor,
  novoStatus: StatusLead,
  statusAnterior: StatusLead
): Corretor {
  let updated = { ...c }
  const abrindo  = !['Convertido', 'Perdido'].includes(statusAnterior) && !['Convertido', 'Perdido'].includes(novoStatus)
  const fechando = novoStatus === 'Convertido' || novoStatus === 'Perdido'
  const reabrindo = ['Convertido', 'Perdido'].includes(statusAnterior) && !['Convertido', 'Perdido'].includes(novoStatus)

  void abrindo // não altera leadsEmAberto em movimentos internos do funil
  if (fechando) updated.leadsEmAberto = Math.max(0, updated.leadsEmAberto - 1)
  if (reabrindo) updated.leadsEmAberto = updated.leadsEmAberto + 1
  if (novoStatus === 'Convertido')       updated.vendasFechadas    = updated.vendasFechadas + 1
  if (novoStatus === 'Visita agendada')  updated.visitasMarcadas   = updated.visitasMarcadas + 1
  if (novoStatus === 'Proposta enviada') updated.propostasEnviadas = updated.propostasEnviadas + 1
  return updated
}

// ── Criação da store ───────────────────────────────────────────────────────

export const useZelvoStore = create<ZelvoStore>()(
  persist(
    (set, get) => ({
      ...ESTADO_INICIAL,

      // ── selecionarUsuario ───────────────────────────────────────────────
      selecionarUsuario: (id) => {
        const usuario = get().usuarios.find(u => u.id === id)
        if (usuario) set({ usuarioAtual: usuario })
      },
      isGerente: () => get().usuarioAtual.perfil === 'gerente',
      isCorretor: () => get().usuarioAtual.perfil === 'corretor',

      // ── adicionarLead ───────────────────────────────────────────────────
      adicionarLead: (payload) => {
        const agora = new Date().toISOString()
        const id    = `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

        const camposScore = {
          nome: payload.nome, telefone: payload.telefone, cidade: payload.cidade,
          regiaoInteresse: payload.regiaoInteresse, tipoImovel: payload.tipoImovel,
          rendaFamiliar: payload.rendaFamiliar, valorEntrada: payload.valorEntrada,
          possuiFgts: payload.possuiFgts, prazoCompra: payload.prazoCompra,
          financiamentoAprovado: payload.financiamentoAprovado,
          empreendimentoInteresse: payload.empreendimentoInteresse,
          origem: payload.origem, campanha: payload.campanha,
          fonteEntrada: payload.fonteEntrada,
        }

        const scoreLead      = calcularLeadScore(camposScore)
        const temperaturaLead = definirTemperaturaLead(scoreLead)

        const lead: Lead = {
          id, ...camposScore, scoreLead, temperaturaLead,
          status: 'Novo', corretorAtribuido: null, createdAt: agora,
        }

        const { corretores } = get()
        const { corretor, distribuicao: distParcial } = distribuirLeadAutomaticamente(lead, corretores)

        let distribuicao: Distribuicao | null = null
        if (corretor && distParcial) {
          lead.corretorAtribuido = corretor.id
          lead.status = 'Distribuído'
          distribuicao = { id: `d_${Date.now()}`, createdAt: agora, ...distParcial }
        }

        set(state => ({
          leads: [...state.leads, lead],
          distribuicoes: distribuicao ? [...state.distribuicoes, distribuicao] : state.distribuicoes,
          corretores: corretor
            ? state.corretores.map(c =>
                c.id === corretor.id
                  ? { ...c, leadsEmAberto: c.leadsEmAberto + 1, leadsRecebidos: c.leadsRecebidos + 1 }
                  : c
              )
            : state.corretores,
        }))

        return lead
      },

      // ── atualizarLead ───────────────────────────────────────────────────
      atualizarLead: (id, dados) => {
        set(state => ({
          leads: state.leads.map(l => {
            if (l.id !== id) return l
            const updated = { ...l, ...dados }
            const recalcular = dados.rendaFamiliar !== undefined || dados.valorEntrada !== undefined ||
              dados.possuiFgts !== undefined || dados.prazoCompra !== undefined ||
              dados.empreendimentoInteresse !== undefined || dados.regiaoInteresse !== undefined ||
              dados.financiamentoAprovado !== undefined

            if (recalcular) {
              const scoreLead      = calcularLeadScore(updated as Parameters<typeof calcularLeadScore>[0])
              const temperaturaLead = definirTemperaturaLead(scoreLead)
              return { ...updated, scoreLead, temperaturaLead }
            }
            return updated
          }),
        }))
      },

      // ── alterarStatusLead ───────────────────────────────────────────────
      alterarStatusLead: (id, novoStatus) => {
        const agora = new Date().toISOString()
        const lead  = get().leads.find(l => l.id === id)
        if (!lead) return

        set(state => ({
          leads: state.leads.map(l => l.id === id ? { ...l, status: novoStatus } : l),
          corretores: lead.corretorAtribuido
            ? state.corretores.map(c =>
                c.id === lead.corretorAtribuido
                  ? atualizarMetricasCorretor(c, novoStatus, lead.status)
                  : c
              )
            : state.corretores,
          atividades: [
            ...state.atividades,
            {
              id: `a_${Date.now()}`,
              leadId: id,
              tipo: 'status' as const,
              titulo: `Status: ${novoStatus}`,
              descricao: `Lead movido de "${lead.status}" para "${novoStatus}".`,
              createdAt: agora,
            },
          ],
        }))
      },

      // ── adicionarAtualizacaoAtendimento ─────────────────────────────────
      adicionarAtualizacaoAtendimento: (payload) => {
        const agora      = new Date().toISOString()
        const lead       = get().leads.find(l => l.id === payload.leadId)
        if (!lead) return

        const statusMudou = payload.statusNovo !== payload.statusAnterior

        // Monta a descrição da atividade
        const partes: string[] = []
        if (statusMudou) partes.push(`Status alterado: "${payload.statusAnterior}" → "${payload.statusNovo}".`)
        if (payload.observacao) partes.push(`Obs: ${payload.observacao}`)
        if (payload.proximaAcao) {
          const data = payload.dataProximaAcao
            ? ` (${new Date(payload.dataProximaAcao + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`
            : ''
          partes.push(`Próxima ação: ${payload.proximaAcao}${data}`)
        }

        set(state => ({
          leads: state.leads.map(l => {
            if (l.id !== payload.leadId) return l
            return {
              ...l,
              status: payload.statusNovo,
              observacao:       payload.observacao       ?? l.observacao,
              proximaAcao:      payload.proximaAcao      ?? l.proximaAcao,
              dataProximaAcao:  payload.dataProximaAcao  ?? l.dataProximaAcao,
            }
          }),
          corretores: statusMudou && lead.corretorAtribuido
            ? state.corretores.map(c =>
                c.id === lead.corretorAtribuido
                  ? atualizarMetricasCorretor(c, payload.statusNovo, payload.statusAnterior)
                  : c
              )
            : state.corretores,
          atividades: [
            ...state.atividades,
            {
              id: `a_${Date.now()}`,
              leadId: payload.leadId,
              tipo: statusMudou ? 'status' as const : 'nota' as const,
              titulo: statusMudou ? `Status: ${payload.statusNovo}` : 'Atendimento atualizado',
              descricao: partes.join(' ') || 'Sem observações.',
              createdAt: agora,
            },
          ],
        }))
      },

      // ── distribuirLead ──────────────────────────────────────────────────
      distribuirLead: (id) => {
        const agora = new Date().toISOString()
        const { leads, corretores } = get()
        const lead = leads.find(l => l.id === id)
        if (!lead) return

        const { corretor, distribuicao: distParcial } = distribuirLeadAutomaticamente(lead, corretores)
        if (!corretor || !distParcial) return

        const distribuicao: Distribuicao = { id: `d_${Date.now()}`, createdAt: agora, ...distParcial }

        set(state => ({
          leads: state.leads.map(l =>
            l.id === id ? { ...l, corretorAtribuido: corretor.id, status: 'Distribuído' } : l
          ),
          distribuicoes: [...state.distribuicoes, distribuicao],
          corretores: state.corretores.map(c =>
            c.id === corretor.id
              ? { ...c, leadsEmAberto: c.leadsEmAberto + 1, leadsRecebidos: c.leadsRecebidos + 1 }
              : c
          ),
        }))
      },

      // ── redistribuirLead ────────────────────────────────────────────────
      redistribuirLead: (id, corretorId) => {
        const agora = new Date().toISOString()
        const { leads, corretores } = get()
        const lead         = leads.find(l => l.id === id)
        const novoCorretor = corretores.find(c => c.id === corretorId)
        if (!lead || !novoCorretor) return

        const motivo =
          `Redistribuição manual — Lead ${lead.temperaturaLead} reatribuído para ${novoCorretor.nome} ` +
          `(Nível ${novoCorretor.nivel}, score ${novoCorretor.scoreCorretor}).`

        const distribuicao: Distribuicao = {
          id: `d_${Date.now()}`, leadId: id, corretorId,
          scoreLeadNoMomento: lead.scoreLead, scoreCorretorNoMomento: novoCorretor.scoreCorretor,
          motivoDistribuicao: motivo, createdAt: agora,
        }

        set(state => ({
          leads: state.leads.map(l =>
            l.id === id ? { ...l, corretorAtribuido: corretorId, status: 'Distribuído' } : l
          ),
          distribuicoes: [...state.distribuicoes, distribuicao],
          corretores: state.corretores.map(c => {
            if (c.id === corretorId)
              return { ...c, leadsEmAberto: c.leadsEmAberto + 1, leadsRecebidos: c.leadsRecebidos + 1 }
            if (c.id === lead.corretorAtribuido)
              return { ...c, leadsEmAberto: Math.max(0, c.leadsEmAberto - 1) }
            return c
          }),
          atividades: [
            ...state.atividades,
            {
              id: `a_${Date.now()}`, leadId: id,
              tipo: 'redistribuicao' as const,
              titulo: `Redistribuído para ${novoCorretor.nome}`,
              descricao: motivo, createdAt: agora,
            },
          ],
        }))
      },

      // ── adicionarAtividade ──────────────────────────────────────────────
      adicionarAtividade: (payload) => {
        set(state => ({
          atividades: [
            ...state.atividades,
            { ...payload, id: `a_${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        }))
      },

      // ── seletores helper ────────────────────────────────────────────────
      buscarLeadPorId:             (id)     => get().leads.find(l => l.id === id),
      buscarCorretorPorId:         (id)     => get().corretores.find(c => c.id === id),
      buscarDistribuicaoPorLeadId: (leadId) => {
        const lista = get().distribuicoes.filter(d => d.leadId === leadId)
        return lista[lista.length - 1]
      },

      // ── resetarDados ────────────────────────────────────────────────────
      resetarDados: () => set({ ...ESTADO_INICIAL }),
    }),
    {
      name: 'zelvo-mvp-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
