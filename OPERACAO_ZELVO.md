# Guia de Operação — Zelvo

Manual do dia a dia para gerentes e corretores do Zelvo CRM.

---

## Primeiro acesso — Onboarding

Ao acessar o sistema pela primeira vez após o deploy, o gerente vê o **banner de onboarding** no dashboard. Clique em "Configurar agora" ou acesse `/onboarding` diretamente.

O wizard orienta 6 etapas obrigatórias:

1. **Configurar a empresa** — nome, CNPJ, contatos
2. **Cadastrar corretores** — ao menos um corretor ativo
3. **Criar usuários** — ao menos um login de corretor
4. **Configurar score** — regras de pontuação de leads
5. **Configurar distribuição** — regras de roteamento por nível
6. **Criar lead de teste** — validar que o pipeline funciona

Quando todas as etapas forem marcadas, o banner desaparece e o sistema entra em operação normal.

---

## Configurações (`/configuracoes`)

A página de Configurações é dividida em 10 abas. Apenas gerentes têm acesso.

### Empresa

Dados institucionais da imobiliária: nome, CNPJ, telefone, email, site, cidade, estado, segmento e URL do logo.

- Salvar altera o registro único de `Empresa` no banco.
- O nome aparece no topo do sistema e em emails automáticos.

### Usuários

Gerenciamento de logins do sistema.

**Criar usuário:**
1. Clique em "Novo Usuário"
2. Preencha nome, email, senha e perfil (`gerente` ou `corretor`)
3. Opcionalmente vincule a um corretor existente

**Ações disponíveis:**
- **Editar** — altera dados; a senha só é alterada se o campo for preenchido
- **Gerar link de acesso** — cria um token de reset de senha com validade de 24h e exibe o link para enviar manualmente ao usuário
- **Desativar** — bloqueia o login sem remover dados; o usuário não pode se autodesativar

### Corretores

Gerenciamento da equipe de vendas.

**Criar corretor:**
- Nome, telefone, email, nível (A/B/C/D)
- Capacidade máxima de leads em aberto
- Participação na distribuição automática (ativar/desativar)
- Nível manual (impede recálculo automático do nível pelo score)

**Ações:**
- **Ativar / Inativar** — corretores inativos não recebem leads
- **Editar** — altera todos os campos, incluindo capacidade e participação na distribuição

> Corretores com `participaDistribuicao = false` são excluídos do algoritmo mesmo que ativos.

### Score

Define as regras de pontuação usadas para calcular `scoreLead` e `temperaturaLead`.

**Campos de pontuação positiva:**
- Renda mínima para pontos / pontos por renda suficiente
- Entrada mínima / pontos por entrada suficiente
- Pontos por FGTS, urgência, empreendimento, região, financiamento aprovado

**Campos de penalidade:**
- Renda baixa: limite e penalidade
- Sem previsão de compra: penalidade
- Região de interesse vazia: penalidade

**Temperaturas:**
- Score ≥ Premium → Lead Premium
- Score ≥ Quente → Quente
- Score ≥ Morno → Morno
- Abaixo de tudo → Frio

Clique em "Restaurar padrão" para voltar aos valores de fábrica.

### Distribuição

Controla como os leads são roteados para corretores.

**Roteamento por temperatura:**
- Define quais níveis de corretor recebem cada temperatura de lead
- Padrão: Premium → A; Quente → A e B; Morno → B e C; Frio → C e D

**Critérios de desempate (ordem aplicada):**
1. Menor número de leads em aberto
2. Maior score do corretor
3. Maior taxa de conversão
4. Menor tempo médio de atendimento

**Configurações adicionais:**
- Capacidade máxima padrão (sobreposta por `capacidadeMaximaLeads` do corretor)
- Fallback: se nenhum corretor do nível ideal disponível, expande para outros níveis
- Distribuição manual: permite atribuição direta sem passar pelo algoritmo

**Testar distribuição:**
- Selecione uma temperatura e clique "Testar" para ver qual corretor receberia o lead e o motivo.

### Funil

Lista as etapas do funil de vendas. Cada etapa tem:
- **Nome** e **cor** (para visualização no kanban)
- **Ordem** de aparição
- **Ativa** — etapas inativas não aparecem no funil
- **Etapa final** — marca fim do ciclo de vida do lead
- **Conta como conversão** — incrementa métricas de venda
- **Libera lead aberto** — decrementa `leadsEmAberto` do corretor

Clique em "Restaurar padrão" para voltar às 9 etapas de fábrica.

### Intake Externo

Exibe a configuração de integração com formulários externos.

- **URL de intake:** `POST /api/leads/intake` — endpoint que recebe leads de sistemas externos
- **Status do secret:** indica se `LEAD_INTAKE_SECRET` está configurado (nunca exibe o valor)
- **Status de origens:** indica se `LEAD_INTAKE_ALLOWED_ORIGINS` está configurado
- **Exemplo de payload:** JSON pronto para copiar e usar em integrações

Ver guia completo em [INTAKE_LEADS.md](./INTAKE_LEADS.md).

### Notificações

Configurações de alertas e limites operacionais.

| Campo | Descrição |
|-------|-----------|
| Notificações internas | Ativa/desativa o sino de notificações no app |
| Email: novo lead | Notifica o corretor por email ao receber um lead |
| Email: lead premium | Email dedicado para leads Premium |
| Alerta: premium parado | Alerta se lead Premium ficar sem atividade por N minutos |
| Minutos para alerta Premium | Tempo em minutos para disparar o alerta (padrão: 10) |
| Alerta: sem próxima ação | Alerta leads sem data de próxima ação configurada |
| Alerta: corretor sobrecarregado | Alerta quando `leadsEmAberto` ≥ limite |
| Limite leads em aberto | Número máximo antes de alertar (padrão: 15) |

### Segurança

Exibe informações da sessão atual:
- Nome, email e perfil do usuário logado
- ID da sessão (para suporte/debug)
- Botão de logout (encerra a sessão e redireciona para `/login`)

Não armazena nem exibe senhas ou tokens.

### Sistema

Health check em tempo real do ambiente de produção:

- **Banco de dados:** status da conexão e totais de registros (leads, corretores, usuários, distribuições, notificações)
- **Secrets:** presença das variáveis críticas (sem revelar valores)
- **Ambiente:** NODE_ENV, versão do app
- **Último check:** timestamp da última verificação

---

## Como o gerente opera no dia a dia

### Recebimento de leads

Leads chegam via:
1. **Criação manual** — botão "Novo Lead" no dashboard ou em `/leads/novo`
2. **Intake externo** — `POST /api/leads/intake` com Bearer token
3. **Importação** (futura)

Ao chegar, cada lead:
1. Recebe `scoreLead` calculado pelas regras de Score
2. Recebe `temperaturaLead` baseada nos thresholds configurados
3. É distribuído automaticamente ao melhor corretor disponível

### Acompanhar o pipeline

- **Dashboard** — métricas gerais: leads por temperatura, por status, distribuições recentes
- **/leads** — lista filtrável por status, temperatura, corretor, data
- **Funil** — visão kanban das etapas configuradas
- **Corretores** — ranking com score, taxa de conversão e carga atual

### Redistribuir um lead

Abra o detalhe do lead → "Redistribuir" → escolha o corretor manualmente (se `permitirDistribuicaoManual = true`) ou acione nova distribuição automática.

### Monitorar a equipe

- **Ranking de corretores** — `/corretores` mostra desempenho comparado
- **Notificações** — alertas de leads parados, corretores sobrecarregados e leads sem próxima ação aparecem no sino (🔔) no header

---

## Como o corretor opera

### Ver meus leads

Acesse `/meus-leads` (ou dashboard do corretor). Exibe apenas os leads atribuídos a você.

### Atualizar status e próxima ação

Abra o lead → edite `status`, `observacao`, `proximaAcao` e `dataProximaAcao`.

Dica: sempre defina uma data de próxima ação para evitar alertas de "sem ação".

### Registrar atividade

Em cada lead, o histórico de atividades (contato iniciado, nota, redistribuição) fica registrado em ordem cronológica.

---

## Testar lead externo (intake)

```bash
curl -X POST https://SEU_DOMINIO/api/leads/intake \
  -H "Authorization: Bearer SEU_LEAD_INTAKE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "telefone": "(11) 99999-0001",
    "cidade": "São Paulo",
    "regiaoInteresse": "Zona Sul",
    "tipoImovel": "Apartamento",
    "rendaFamiliar": 8000,
    "valorEntrada": 40000,
    "possuiFgts": true,
    "prazoCompra": "até 30 dias",
    "financiamentoAprovado": true,
    "empreendimentoInteresse": "Parque Verde",
    "origem": "Landing Page",
    "campanha": "julho-2026"
  }'
```

**Resposta esperada (201):**
```json
{
  "id": "clxxx...",
  "scoreLead": 90,
  "temperaturaLead": "Premium",
  "corretorAtribuido": "clyyy...",
  "motivoDistribuicao": "Melhor score disponível nível A"
}
```

---

## Diagnóstico rápido

| Problema | Onde verificar |
|----------|---------------|
| Lead não foi distribuído | `/diagnostico` → ver se há corretores ativos com capacidade disponível |
| Email não enviado | `/api/system/health` → checar presença de `RESEND_API_KEY` |
| Intake rejeitando requisições | `/configuracoes` → aba "Intake Externo" → ver status do secret e origens |
| Score incorreto | `/configuracoes` → aba "Score" → revisar regras e thresholds |
| Corretor não recebe leads | Verificar `ativo = true` e `participaDistribuicao = true` em Corretores |
| Sessão expira rápido | Verificar `NEXTAUTH_SECRET` e `NEXTAUTH_URL` nas variáveis de ambiente |
