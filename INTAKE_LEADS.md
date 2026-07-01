# Intake de Leads Externos — Zelvo

Documentação do endpoint `POST /api/leads/intake`, usado por landing pages e
formulários de qualificação para enviar leads diretamente ao Zelvo.

---

## Endpoint

```
POST https://zelvo-app.vercel.app/api/leads/intake
```

---

## Headers obrigatórios

| Header                   | Valor                            |
|--------------------------|----------------------------------|
| `Content-Type`           | `application/json`               |
| `x-zelvo-intake-secret`  | Valor de `LEAD_INTAKE_SECRET`    |

---

## Payload (JSON)

### Campos obrigatórios

| Campo           | Tipo     | Descrição                                     |
|-----------------|----------|-----------------------------------------------|
| `nome`          | string   | Nome completo do lead                         |
| `telefone`      | string   | Telefone com DDD (normalizado automaticamente)|
| `cidade`        | string   | Cidade de interesse                           |
| `rendaFamiliar` | number   | Renda familiar mensal em reais                |
| `prazoCompra`   | string   | Prazo de compra pretendido                    |

### Campos opcionais

| Campo                    | Tipo    | Descrição                                             |
|--------------------------|---------|-------------------------------------------------------|
| `email`                  | string  | E-mail do lead (recebido, não armazenado no momento)  |
| `regiaoInteresse`        | string  | Região/bairro de interesse                            |
| `tipoImovel`             | string  | `Apartamento`, `Casa`, `Terreno`, `Comercial`, `Rural`|
| `valorEntrada`           | number  | Valor de entrada disponível                           |
| `possuiFgts`             | boolean | Possui FGTS disponível                                |
| `financiamentoAprovado`  | boolean | Financiamento já aprovado                             |
| `empreendimentoInteresse`| string  | Nome do empreendimento de interesse                   |
| `origem`                 | string  | `Meta Ads`, `Google Ads`, `WhatsApp`, `Landing Page`, etc. |
| `campanha`               | string  | Identificador da campanha                             |
| `fonteEntrada`           | string  | Sempre sobrescrito para `formulario_externo`          |
| `formularioOrigem`       | string  | Nome do formulário/landing page de origem             |
| `utmSource`              | string  | UTM Source                                            |
| `utmMedium`              | string  | UTM Medium                                            |
| `utmCampaign`            | string  | UTM Campaign                                          |
| `utmContent`             | string  | UTM Content                                           |
| `utmTerm`                | string  | UTM Term                                              |
| `dispositivo`            | string  | `mobile`, `desktop`, `tablet`                         |

### Valores aceitos para `prazoCompra`

- `até 30 dias`
- `1 a 3 meses`
- `3 a 6 meses`
- `acima de 6 meses`
- `sem previsão`

---

## Exemplo de requisição (fetch)

```javascript
fetch("https://zelvo-app.vercel.app/api/leads/intake", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-zelvo-intake-secret": "SEU_TOKEN_AQUI"
  },
  body: JSON.stringify({
    nome:                     "Maria Lopes",
    telefone:                 "27999999999",
    cidade:                   "Vitória",
    regiaoInteresse:          "Serra",
    tipoImovel:               "Apartamento",
    rendaFamiliar:            5200,
    valorEntrada:             15000,
    possuiFgts:               true,
    prazoCompra:              "até 30 dias",
    financiamentoAprovado:    false,
    empreendimentoInteresse:  "Verbena",
    origem:                   "Landing Page",
    campanha:                 "campanha_verbena_julho",
    formularioOrigem:         "Landing Page Verbena",
    utmSource:                "meta",
    utmMedium:                "paid_social",
    utmCampaign:              "verbena_julho",
    utmContent:               "criativo_01",
    utmTerm:                  "",
    dispositivo:              "mobile"
  })
})
.then(r => r.json())
.then(console.log)
```

---

## Respostas

### Sucesso — lead criado e distribuído (201)

```json
{
  "success": true,
  "leadId": "clx1abc...",
  "score": 87,
  "temperatura": "Premium",
  "corretorAtribuido": "João Silva",
  "message": "Lead recebido, qualificado e distribuído com sucesso."
}
```

### Sucesso — lead duplicado (200)

Mesmo telefone encontrado nos últimos 30 dias. Uma atividade é registrada no
lead existente e nenhum novo lead é criado.

```json
{
  "success": true,
  "leadId": "clx1abc...",
  "score": 87,
  "temperatura": "Premium",
  "message": "Lead já existente atualizado com nova tentativa de entrada."
}
```

### Erro — token inválido (401)

```json
{ "success": false, "error": "Não autorizado." }
```

### Erro — origem não permitida (403)

```json
{ "success": false, "error": "Origem não permitida." }
```

### Erro — campos obrigatórios ausentes (400)

```json
{
  "success": false,
  "error": "Campos obrigatórios ausentes: nome, telefone, cidade, rendaFamiliar, prazoCompra."
}
```

### Erro — payload JSON inválido (400)

```json
{ "success": false, "error": "Payload JSON inválido." }
```

---

## Variáveis de ambiente na Vercel

Configure em **Settings → Environment Variables** (Production):

| Variável                      | Obrigatória | Descrição                                                       |
|-------------------------------|-------------|------------------------------------------------------------------|
| `LEAD_INTAKE_SECRET`          | Recomendada | Token secreto enviado no header `x-zelvo-intake-secret`          |
| `LEAD_INTAKE_ALLOWED_ORIGINS` | Opcional    | Lista CSV de origens permitidas (ex: `https://site.com.br`)     |

> **Importante:** Nunca use `NEXT_PUBLIC_` nessas variáveis. Elas devem
> permanecer exclusivamente no servidor.

### Gerar o token secreto

```bash
openssl rand -hex 32
```

---

## O que acontece ao receber um lead

1. Token e origem são validados
2. Campos obrigatórios são verificados
3. Telefone é normalizado (remove formatação, adiciona `55`)
4. Duplicidade é verificada (mesmo telefone nos últimos 30 dias)
5. Score é calculado (0–100)
6. Temperatura é definida: Premium (≥80), Quente (≥60), Morno (≥40), Frio (<40)
7. Corretor é selecionado automaticamente:
   - Premium → Nível A
   - Quente → Nível A ou B
   - Morno → Nível B ou C
   - Frio → Nível C ou D
   - Desempate: maior score, menos leads em aberto, maior taxa de conversão
8. Lead é salvo no banco com todos os UTMs e metadados
9. Registro de Distribuição é criado
10. 4 atividades são registradas: recebimento, score, temperatura, distribuição
11. Resposta JSON é retornada com leadId, score, temperatura e corretor

---

## Logs server-side (seguros)

O endpoint loga no console da Vercel:

```
[intake] 2026-06-30T12:00:00.000Z | origem=Landing Page | tel=*******9999 | campanha=verbena_julho | cidade=Vitória
[intake] 2026-06-30T12:00:00.000Z | OK | leadId=clx1... | score=87 | temp=Premium | corretor=João Silva
```

Números de telefone são mascarados — apenas os 4 últimos dígitos são exibidos.
Nenhum dado sensível completo aparece nos logs.

---

## Cuidados de segurança

- **Nunca** exponha `LEAD_INTAKE_SECRET` no frontend ou em repositórios públicos
- Configure `LEAD_INTAKE_ALLOWED_ORIGINS` com as URLs exatas das suas landing pages
- Use HTTPS sempre — o token viaja no header da requisição
- Rotacione o token periodicamente (`openssl rand -hex 32` gera um novo)
- Monitore os logs da Vercel para tentativas não autorizadas (status 401/403)
