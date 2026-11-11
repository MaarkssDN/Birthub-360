- De: 02 — Produto e UX (em nome da auditoria da landing)
- Para: 01 — Plataforma, Segurança e Dados
- Onda: landing-360-auditoria
- Status: resolvido (PR aberto, aguardando revisão 24 / OK do Marcelo para migration em produção)
- Prioridade: bloqueador

## Problema

A landing page captura leads (nome, e-mail corporativo, WhatsApp, tamanho de
equipe, consentimento LGPD) mas **não existe endpoint que receba esses dados**.
O formulário hoje é cenográfico — ver `auditoria-para-02-form-lead-fake.md`.

## Arquivo(s) envolvido(s)

- Novo endpoint (sugestão: `POST /api/leads` ou equivalente no domínio de
  prospecção/CRM já existente — verificar se já há model `Lead`/`Prospect`
  reaproveitável em `prisma/schema.prisma` antes de criar tabela nova)
- `src/features/landing/pages/Landing360.tsx` (consumidor — propriedade do 02)

## Alteração necessária

1. Verificar se já existe fluxo de captura de lead (prospecção, marketing,
   PublicBookingPage `/book/:slug`) e reutilizar o contrato — não duplicar.
2. Se for endpoint novo: validação Zod dos campos (nome, email, whatsapp,
   equipe, consent), rate limit, persistência com finalidade declarada
   (agendamento de demonstração) e trilha de consentimento LGPD.
3. Resposta deve distinguir sucesso real de erro; nada de 200 fake.
4. Definir para onde o lead vai (fila de SDR? CRM? notificação?) — alinhar com 05/17
   se houver cadência de contato envolvida.

## Teste esperado

- POST com payload válido → registro persistido + resposta 2xx.
- POST com e-mail inválido / sem consent → 4xx com erro claro.
- Rate limit dispara após N requisições.
- Nenhum PII em logs (ver skill lgpd-pii-sanitizer).

## Contexto adicional

- O 02 depende deste contrato para fechar o item 1 da auditoria.
- Consentimento: o texto atual promete "tratamento estritamente para
  agendamento da demonstração" — a finalidade registrada deve bater com isso
  ou o texto deve ser corrigido pelo 21/02.

## Resolução

Implementado pelo Agente 01 na branch `agente-01/lead-publico-endpoint`.
O `/api/leads` autenticado **não foi aberto**. O contrato abaixo é a fonte da verdade
para o Agente 02 (wire do form) e o Agente 21 (validação do consentimento).

### Contrato — `POST /api/public/leads`

- **Autenticação:** nenhuma. Sem `authenticateToken` / `requireTenant`.
- **Tenant:** resolvido **somente** no servidor por `LANDING_LEAD_ORGANIZATION_ID` (cuid da
  Organization dona da landing institucional). Qualquer `tenantId`/`organizationId` enviado
  pelo cliente é **ignorado**. Sem a env, a API responde `503 { "ok": false, "error": "unavailable" }`.
- **Content-Type:** `application/json`

#### Payload

```json
{
  "nome": "Mariana Albuquerque",
  "email": "voce@suaempresa.com.br",
  "whatsapp": "(11) 99999-9999",
  "equipe": "6 a 15",
  "consent": true,
  "consentTextVersion": "landing-demo-v1",
  "website": ""
}
```

| Campo | Obrigatório | Regras |
|---|---|---|
| `nome` | sim | string 2–200, trim |
| `email` | sim | e-mail válido, normalizado em lowercase. Não há rejeição de domínio gratuito (decisão: o rótulo "corporativo" é UX do 02, não regra de servidor). |
| `whatsapp` | sim | BR com DDD, com ou sem máscara, com ou sem DDI 55 (10–11 dígitos, ou 12–13 com 55). Gravado normalizado com DDI 55. |
| `equipe` | sim | enum exatamente: `"1 a 5"` \| `"6 a 15"` \| `"16 a 50"` \| `"50+"` |
| `consent` | sim | literal `true`. `false` ou omitido → 400 `fields.consent = "required"`. |
| `consentTextVersion` | sim | literal `"landing-demo-v1"`. Versão antiga → 400 `fields.consentTextVersion = "stale"` (o form precisa atualizar). |
| `website` | não | **Honeypot.** Omitir ou enviar string vazia. Se preenchido, a API responde o mesmo 202 e **não persiste**. O 02 deve incluir um input oculto (`aria-hidden` / CSS off-screen) com `name/json` `website`. |

O servidor **não** confia no texto de consentimento enviado pelo cliente. Grava o texto canônico:

> Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.

- Versão: `landing-demo-v1`
- Finalidade persistida: `agendamento_demonstracao`
- Timestamp: `grantedAt` (servidor) na tabela `PublicLeadConsent` (migration nova `20261111040000_public_lead_consent_and_rls`, **precisa do OK do Marcelo para aplicar em produção**).

#### Respostas

| Status | Corpo | Quando |
|---|---|---|
| 202 | `{ "ok": true }` | Captura nova, **reenvio do mesmo e-mail** (idempotente, não altera dados, não revela que o e-mail já existia) ou honeypot preenchido. Sem `id`/`leadId`/PII na resposta. |
| 400 | `{ "ok": false, "error": "invalid_payload", "fields": { "<campo>": "required" \| "invalid" \| "stale" } }` | Validação Zod. |
| 429 | `{ "ok": false, "error": "rate_limited" }` | Mais de `PUBLIC_LEAD_RATE_LIMIT_MAX` (padrão **5**) POST no mesmo IP em **15 minutos**. Headers padrão do express-rate-limit (`RateLimit-*`). |
| 503 | `{ "ok": false, "error": "unavailable" }` | Env/tenant não configurado ou falha interna. Resposta genérica, sem detalhe. |

Não há GET/listagem pública. Não há enumeração por e-mail (o reenvio de um e-mail já capturado devolve o mesmo 202).

#### Persistência e fila

O lead é gravado no CRM da organização configurada: `Company` (rótulo = domínio do e-mail) + `Contact` (PII cifrada em repouso, padrão já existente) + `Lead` (`status: Lead_Recebido`, `source: landing_360`, `tags: ["Landing 360", "Demonstração"]`, `customFields.equipe`). Cadência SDR, notificação e alinhamento com os Agentes 05/17 ficam como passo seguinte — este PR só garante a persistência auditável.

Constantes canônicas: `src/features/public-leads/publicLead.constants.ts`.
