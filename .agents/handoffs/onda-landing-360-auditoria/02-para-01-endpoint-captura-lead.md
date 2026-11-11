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

Implementado pelo Agente 01 na branch `agente-01/lead-publico-endpoint` (PR #216).
O `/api/leads` autenticado **não foi aberto**. Ajustado às observações do Agente 21
e às decisões do Marcelo (2026-11-11): IP somente hasheado, WhatsApp opcional,
retenção operacional 90 dias sem avanço ou 30 dias após a demo (configurável).
**Isso não aprova texto legal final.**

### Contrato — `POST /api/public/demo-leads`

A rota foi renomeada de `/api/public/leads` para `/api/public/demo-leads` (barato e
seguro: o PR ainda não estava na main; o cliente do Agente 02 ainda aponta para o
placeholder `PENDENTE_CONTRATO_AGENTE_01`).

- **Autenticação:** nenhuma. Sem `authenticateToken` / `requireTenant`.
- **Tenant:** somente `LANDING_LEAD_ORGANIZATION_ID` no servidor. `tenantId` do cliente é ignorado.
- **Rate limit:** `PUBLIC_LEAD_RATE_LIMIT_MAX` (padrão **5**) POST por IP / 15 min → `429 { "ok": false, "error": "rate_limited" }`.
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
  "purpose": "agendamento_demonstracao",
  "website": ""
}
```

| Campo | Obrigatório | Regras |
|---|---|---|
| `nome` | sim | string 2–200, trim |
| `email` | sim | e-mail válido, lowercase. Domínio gratuito aceito. |
| `whatsapp` | **não** (decisão Marcelo) | Se enviado, BR com DDD (com/sem máscara/DDI 55). Vazio/omitido é aceito. |
| `equipe` | sim | `"1 a 5"` \| `"6 a 15"` \| `"16 a 50"` \| `"50+"` |
| `consent` | sim | literal `true`. `false`/omitido → 400 `fields.consent = "required"` e **nada é persistido**. |
| `consentTextVersion` | sim | literal `"landing-demo-v1"` (stale → 400). |
| `purpose` | sim | lista fechada; hoje só `"agendamento_demonstracao"`. |
| `website` | não | Honeypot. Preenchido → 202 e não persiste. |

Texto canônico (servidor; **não é texto legal final**):

> Concordo com o tratamento dos dados estritamente para agendamento da demonstração conforme a LGPD.

#### Respostas

| Status | Corpo | Quando |
|---|---|---|
| 202 | `{ "ok": true }` | Captura nova, reenvio idempotente do mesmo e-mail, ou honeypot. Sem id/PII. |
| 400 | `{ "ok": false, "error": "invalid_payload", "fields": { "<campo>": "required" \| "invalid" \| "stale" } }` | Validação (inclui `consent !== true`). |
| 429 | `{ "ok": false, "error": "rate_limited" }` | Rate limit. |
| 503 | `{ "ok": false, "error": "unavailable" }` | Tenant ausente ou falha interna. |

#### Prova de consentimento

Gravada em **dois** lugares, no ato do POST bem-sucedido:

1. `PublicLeadConsent` (tabela nova, migration `20261111040000_public_lead_consent_and_rls`) — texto, versão, finalidade, `grantedAt` (servidor), ligada ao Lead. Facilita consulta operacional junto ao CRM.
2. Cadeia existente `ConsentAuditRecord` / `ConsentEventDetail` via `consentAuditChain.recordConsent`: `purpose` na cadeia é `AGENDAMENTO_DEMONSTRACAO` (a API pública continua com `agendamento_demonstracao` porque o padrão da cadeia exige `CAIXA_ALTA_COM_UNDERSCORE`), `termsVersion` = `landing-demo-v1`, `occurredAt` do servidor, `subjectRef` = e-mail tokenizado (HMAC) pela cadeia. O texto canônico e o **hash do IP** (se o sal estiver configurado) vão em `ConsentEventDetail.detail` (expurgável, fora do hash da cadeia).

Se a cadeia falhar depois da persistência operacional, o lead não é apagado; o erro é logado sem PII.

#### IP

Somente hasheado (HMAC-SHA256, sal `PUBLIC_LEAD_IP_HASH_SECRET`). Nunca persistido nem logado em claro. Sem o segredo, o IP simplesmente não é gravado.

#### Retenção (operacional, não é texto legal final)

Env configurável, com os valores aprovados pelo Marcelo como default: `LANDING_LEAD_RETENTION_IDLE_DAYS=90` (sem avanço) e `LANDING_LEAD_RETENTION_AFTER_DEMO_DAYS=30` (após a demo). **O job de purge/anonimização é follow-up** — não está implementado neste PR.

#### E-mail de confirmação / DSR

Existe mailer transacional (`src/lib/email/mailer.ts`, SMTP). Integração mínima atrás de `LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED` (default `false`): se ligado e o SMTP estiver configurado, envia confirmação apontando para `/privacy`. Não inventa token de opt-out de 1 clique (canal ainda não existe). Falha de SMTP não derruba a captura.

Cadência automática: não disparada.
