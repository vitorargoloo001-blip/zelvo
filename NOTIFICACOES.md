# Notificações V1 — Zelvo CRM

Sistema de notificações internas e e-mails transacionais do Zelvo.

---

## Arquitetura

```
Evento (intake / redistribuição / status)
    └── notificationService.ts  →  tabela Notificacao (Postgres)
    └── emailService.ts         →  Resend API + tabela EmailLog
    └── alertService.ts         →  verificações periódicas (gerente dispara)
```

Todas as chamadas de notificação são **fire-and-forget** — nunca bloqueiam a resposta da API:

```typescript
Promise.all([
  notificarLeadAtribuido(lead, corretor),
  enviarEmailNotificacaoLeadAtribuido(corretor, lead),
]).catch(() => {})
```

---

## Modelos Prisma

### `Notificacao`
| Campo      | Tipo     | Descrição                                     |
|------------|----------|-----------------------------------------------|
| id         | String   | CUID                                          |
| usuarioId  | String   | Destinatário (Usuario.id)                     |
| leadId     | String?  | Lead relacionado (opcional)                   |
| corretorId | String?  | Corretor relacionado (opcional)               |
| tipo       | String   | Ver `TipoNotificacao` abaixo                  |
| titulo     | String   | Título curto exibido no sino                  |
| mensagem   | String   | Corpo completo da notificação                 |
| lida       | Boolean  | `false` por padrão                            |
| prioridade | String   | `baixa` / `media` / `alta` / `critica`        |
| metadata   | Json?    | Dados extras opcionais                        |
| createdAt  | DateTime | Criação                                       |

### `EmailLog`
| Campo       | Tipo     | Descrição                                    |
|-------------|----------|----------------------------------------------|
| id          | String   | CUID                                         |
| usuarioId   | String?  | Usuário relacionado                          |
| leadId      | String?  | Lead relacionado                             |
| destinatario| String   | E-mail do destinatário                       |
| assunto     | String   | Subject do e-mail                            |
| status      | String   | `pendente` / `enviado` / `erro`              |
| provider    | String   | `resend` (padrão)                            |
| erro        | String?  | Mensagem de erro se houver                   |
| metadata    | Json?    | Dados extras                                 |
| createdAt   | DateTime | Criação                                      |

---

## Tipos de notificação (`TipoNotificacao`)

| Tipo                        | Quem recebe | Gatilho                                      |
|-----------------------------|-------------|----------------------------------------------|
| `lead_atribuido`            | Corretor    | Lead distribuído para o corretor             |
| `lead_premium_recebido`     | Corretor    | Lead Premium distribuído — prioridade alta   |
| `lead_premium_parado`       | Gerentes    | Lead Premium > 10 min sem contato            |
| `lead_sem_proxima_acao`     | Gerentes    | Lead ativo > 48h sem próxima ação            |
| `corretor_sobrecarregado`   | Gerentes    | Corretor com > 15 leads em aberto            |
| `status_atualizado`         | Gerentes    | Lead marcado como Convertido ou Perdido      |
| `nova_tentativa_entrada`    | Gerentes    | Duplicata detectada no intake externo        |

---

## Prioridades

| Valor     | Uso                                        |
|-----------|--------------------------------------------|
| `critica` | Situações que requerem ação imediata       |
| `alta`    | Lead Premium recebido, corretor sobrec.    |
| `media`   | Lead atribuído, status convertido/perdido  |
| `baixa`   | Informativo, sem urgência                  |

---

## API Routes

### Notificações do usuário

```
GET  /api/notificacoes?limit=100
     → { notificacoes: Notificacao[] }
     Requer autenticação.

GET  /api/notificacoes/count
     → { naoLidas: number }
     Retorna 0 (não 401) se não autenticado — seguro para polling.

PATCH /api/notificacoes/marcar-todas-lidas
      → { ok: true }
      Requer autenticação.

PATCH /api/notificacoes/[id]/lida
      → { ok: true }
      Requer autenticação.

POST  /api/notificacoes/teste
      → { ok: true, notificacaoId: string }
      Cria notificação de teste para o usuário logado.
```

### Alertas gerenciais

```
POST /api/alertas/verificar
     → { leadsParados: number, leadsSemAcao: number, corresSobrecarregados: number }
     Requer perfil gerente.
```

### Diagnóstico

```
GET /api/diagnostico/notificacoes
    → { totalNotificacoes, naoLidas, emailsEnviados, emailsErro, resendConfigurado, fromConfigurado }
    Requer perfil gerente.
```

---

## Componentes UI

### `NotificationBell` (`src/components/NotificationBell.tsx`)
- Sino no `LoggedInUserBar` com badge de contagem
- Polling de `/api/notificacoes/count` a cada 30 segundos
- Dropdown com as 10 últimas notificações ao clicar
- Botões "Marcar lidas" individual e em massa
- Link para `/notificacoes` no rodapé do dropdown

### `/notificacoes` (`src/app/notificacoes/page.tsx`)
- Lista completa com até 100 notificações
- Filtros: Todas, Não lidas, Alta prioridade, Leads, Sistema
- Marcar como lida por item ou todas de uma vez
- Link "Abrir lead" quando `leadId` está presente
- Exibe data/hora completa e tempo relativo

---

## Serviços

### `notificationService.ts`
```typescript
criarNotificacao(data)
listarNotificacoesUsuario(usuarioId, limit?)
contarNaoLidas(usuarioId)
marcarComoLida(notificacaoId, usuarioId)
marcarTodasComoLidas(usuarioId)

// Helpers de domínio
notificarLeadAtribuido(lead, corretor)
notificarLeadRedistribuido(lead, novoCorretor)
notificarGerenteStatusAlterado(lead, novoStatus)
notificarNovaTentativaEntrada(lead)
notificarGerenteLeadPremiumParado(lead)   // com deduplicação 30 min
```

### `emailService.ts`
- Usa `require('resend')` dinamicamente para evitar problemas com edge runtime
- `FROM = process.env.RESEND_FROM_EMAIL ?? 'Zelvo CRM <noreply@zelvo.com.br>'`
- Sem `RESEND_API_KEY`: cria `EmailLog` com status `pendente` e loga aviso; não lança exceção

```typescript
enviarEmailNotificacaoLeadAtribuido(corretor, lead, usuarioId?)
enviarEmailLeadPremium(corretor, lead, usuarioId?)
```

### `alertService.ts`
```typescript
verificarLeadsParados()           // Premium > 10 min, Quente > 24h
verificarLeadsSemProximaAcao()    // ativo > 48h sem proximaAcao
verificarCorretoresSobrecarregados() // leadsEmAberto > 15
verificarAlertasGerenciais()      // roda os três em paralelo
deduplicarNotificacao(...)        // janela configurável em minutos
```

---

## Variáveis de ambiente

| Variável           | Obrigatória | Descrição                                         |
|--------------------|-------------|---------------------------------------------------|
| `RESEND_API_KEY`   | Não         | Habilita envio real de e-mails                    |
| `RESEND_FROM_EMAIL`| Não         | Endereço "De:" (requer domínio verificado)        |

> Nenhuma destas variáveis deve ter prefixo `NEXT_PUBLIC_`.

---

## Deduplicação de alertas

Para evitar spam de notificações gerenciais repetidas:

```typescript
deduplicarNotificacao(usuarioId, tipo, leadId?, corretorId?, janelaMinutos)
```

Verifica se já existe uma notificação do mesmo tipo/lead/corretor dentro da janela de tempo.
Retorna `true` se deve criar, `false` se deve pular.

- Leads parados / sem ação: janela de **30 minutos**
- Corretores sobrecarregados: janela de **60 minutos**
- Lead Premium parado: janela de **30 minutos**

---

## Integração com fluxos existentes

| Fluxo                          | Arquivo                                      | O que dispara                                   |
|--------------------------------|----------------------------------------------|-------------------------------------------------|
| Intake externo                 | `api/leads/intake/route.ts`                  | `notificarLeadAtribuido` + e-mail               |
|                                |                                              | `notificarNovaTentativaEntrada` (duplicata)     |
| Redistribuição                 | `api/leads/[id]/redistribuir/route.ts`       | `notificarLeadRedistribuido`                    |
| Atualização de status          | `api/leads/[id]/status/route.ts`             | `notificarGerenteStatusAlterado` (Conv./Perdido)|

---

## V2 — Melhorias planejadas

- Configurações de notificação editáveis por perfil (toggle por tipo, limites ajustáveis)
- Push notifications (Web Push / PWA)
- Digest diário por e-mail (resumo de atividades)
- Integração com webhooks externos
- Histórico de e-mails com reenvio manual
