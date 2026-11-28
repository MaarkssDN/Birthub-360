# Handoff — Estabilização Schemathesis PR #549 (resultados Agente 21/Zara)

```
De: 21 — Zara (Contratos de API, OpenAPI e Schemas Zod)
Para: 00 — Astra (coordenação) · cc: 22 — Hugo · 96 — Nera · 51 — Bela · 07 — IA
Onda: agente/00-recuperacao-onda-consolidacao-20261124 / api-schema-fuzz
Status: correções de spec aplicadas em docs/openapi.yaml (não commitado)
```

## Fonte dos findings

Artifact `schemathesis-report-45952185707` (run schedule na main, Schemathesis
4.33.4, 555 ops / 219.473 casos): ST103×511, ST401×2, ST101×14, ST201×6,
ST202×7, ST108×3, ST204×13. Contagens batem com as da missão.

## O que foi corrigido em `docs/openapi.yaml` (único arquivo alterado)

### ST103 — Undocumented status code (511 findings → esperado ~0)

- **483× `401`**: adicionada `'401': { $ref: '#/components/responses/Unauthorized' }`
  a TODA operação com segurança efetiva não-vazia que não a declarava
  (segurança global `sessionCookie` herdada ou explícita). Inserção textual
  cirúrgica preservando comentários/formatação (diff: somente linhas
  adicionadas, zero removidas na parte em massa).
- **18× `400`**: adicionada `'400': { $ref: '#/components/responses/BadRequest' }`
  nas operações onde o fuzz observou 400 real (access-requests approve/deny/
  revoke, agent-builder proposals approve/reject, agent-bus complete/fail,
  7× `agent/commercial-cell/*/run`, `agent/tts`, `auth/sign-in/email`,
  `commercial-intelligence/predictive/rebalance/approvals`,
  `integrations/bitrix/webhook/{connectionId}`).
- **3× `404`**: `GET`+`POST /calendar/book/{slug}` (slug inexistente) e
  `POST /integrations/bitrix/webhook/{connectionId}` (conexão inexistente/
  inativa — o handler retorna 404 genérico anti-enumeração).

### ST401 — IgnoredAuth (2 findings → esperado 0)

- `GET /auth/get-session` e `POST /auth/sign-out` marcados `security: []`:
  são públicos por design do Better Auth (get-session responde `200 null`
  sem sessão; sign-out é no-op idempotente). Documentado em `description`.

### ST108 — Response violates schema (3 findings → esperado 0)

- `POST /auth/sign-up/email` e `POST /auth/sign-in/email`: resposta `400`
  não usa mais `$ref BadRequest` (envelope `{success,error}`) — Better Auth
  retorna `{code, message}`. Schema inline próprio adicionado.
- `GET /auth/get-session` `200`: schema agora `anyOf: [AuthSessionResponse,
  { enum: [null] }]` (sem sessão a lib retorna `null`).

### ST202 — Schema-valid request rejected (7 findings → esperado ~0)

- `POST /auth/sso-discover`: body agora exige `domain` OU `email` via `anyOf`,
  com `pattern`/`minLength` espelhando a validação real do handler
  (`bootstrap/auth.ts`).
- `POST /public/demo-leads`: `consent` agora `enum: [true]` (zod
  `z.literal(true)`); `email` com `maxLength: 320` + `pattern` idêntico ao
  regex do zod 4 (validado contra `z.string().email()` localmente);
  `whatsapp` com `maxLength: 40` + pattern de telefone BR (10–13 dígitos).
- `POST /public/lead-capture`: idem + `empresa`/`mensagem` opcionais
  documentados (o zod os aceita e o spec omitia).
- `POST /public/data-subject-requests`: `email` com o mesmo pattern zod.
- `POST /public/data-subject-requests/verify`: `protocol` (4–64) e `token`
  (10–200) com minLength/maxLength do `dsrVerifySchema`.
- `POST /integrations/bitrix/webhook/{connectionId}`: body form-urlencoded
  agora documenta `auth[application_token]` obrigatório (campo real do
  Bitrix) + `event`, `ts`, `data`.

### ST201 — Schema-violating request accepted (6 findings → parcial)

- `POST /agent/swarm/learn`: `requestBody` removido — o handler ignora corpo
  (`userId`/`organizationId` vêm da sessão). Description explica.
- **PENDENTE (artefato de harness)**: `POST /api-keys`,
  `POST /auth-extra/sessions/revoke-others`, `POST /auth-extra/welcome-email`,
  `POST /auth/sign-out` (este último já resolvido via `security: []`) e
  `POST /agent/swarm/learn` tinham "Missing `better-auth.session_token` at
  cookie" aceito. Causa provável: o workflow injeta a sessão via
  `schemathesis run -H "Cookie: ..."`, header explícito aplicado a TODAS as
  requests — o caso negativo "sem cookie" do Schemathesis não remove o header
  `-H`, então o endpoint recebe sessão válida e responde 2xx. **Não é bug de
  contrato nem de produto**: em produção sem cookie → 401. Correção exige
  mudança no workflow (ex.: auth nativa do Schemathesis em vez de `-H`),
  fora do meu ownership — decisão 08A/00.

## Pendências que NÃO são de spec (precisam de owner de código)

### ST101 — Server error (14 findings) — bugs reais de produto

| Operação | Causa | Owner sugerido |
|---|---|---|
| `POST /agent/ecosystem/connectors/{provider}/test` | `prisma.slackConnection.findFirst({ where: { enabled: true }, select: { channelName } })` em `src/features/intelligence/services/universalConnectors.service.ts:60` — o model `SlackConnection` (schema.prisma:3037) **não tem** `enabled` nem `channelName` → erro de validação Prisma → 500 | 07 (IA) + 01 (schema: adicionar colunas ou corrigir query) |
| `POST /integrations/birth-voice/webhook`, `POST /integrations/stripe/webhook/{connectionId}` | 500 "Configuração de rota inválida" | 61/26 |
| `POST /integrations/3cx/webhook`, `/integrations/chatwoot/webhook`, `/webhooks/voice-result`, `/webhooks/email/webhook`, `/webhooks/signature/webhook` | 503 "Webhook não configurado" — comportamento fail-closed correto em ambiente sem credencial; ST101 dispara em qualquer 5xx | 50/66/61 — decidir se 503 é a resposta certa ou se documentar/excluir check |
| `POST /auth/sso-discover` | 503 `SSO_NOT_CONFIGURED` (Google/Microsoft sem credenciais no CI) | 96 — idem |
| `POST`+`GET /public/data-subject-requests*` | 503 `unavailable` (provável `LANDING_LEAD_ORGANIZATION_ID` ausente no ambiente de teste) | 01/21 — seed/config do job |
| `TRACE /auth/sso-providers` | 500 — `app.all` do Better Auth captura TRACE e quebra | 22/96 |

### ST204 — Wrong response to undeclared method (13 findings)

TRACE retorna 404 (ou 401/500) onde se espera 405. Correção exige middleware
de método não permitido ou handler TRACE — código de produto (Agente 22),
não representável no spec OpenAPI. Severidade baixa.

## Validação local executada

- `python yaml.safe_load` — spec parseia (495 paths).
- `npm run verify:openapi-drift` — ✅ 0 deriva (81 prefixos, 79 routers).
- `npx vitest run tests/unit/contracts/openapi-contracts-reconciliation.test.ts
  tests/unit/shared/contracts/lead-openapi-contract.test.ts` — 4/4 verde.
- Pattern de e-mail dos endpoints públicos foi validado contra
  `z.string().email()` (zod 4.6.7) em 13 casos — paridade total.

## Riscos / observações

- As 483 adições de `401` refletem comportamento real: o fuzz roda com
  usuário sem organização → `requireTenant` responde 401 em massa. Se no
  futuro o job provisionar org (triage §8 do run genesis), os 401 continuarão
  válidos como resposta possível (sessão inválida).
- `whatsapp` pattern aproxima a regra BR (10–13 dígitos); caso residual de
  ST202 é possível para entradas-limite (ex.: 12 dígitos sem prefixo 55).
- `enum: [null]` em `anyOf` é JSON Schema válido; se o Schemathesis tiver
  quirk com `null` em enum, alternativa é `nullable: true` (OAS 3.0) —
  monitorar o próximo run.
- Schemas `fix-openapi-schemathesis*.py` foram one-off e removidos; a
  transformação em massa foi puramente aditiva (+504 linhas `401/400/404`).
