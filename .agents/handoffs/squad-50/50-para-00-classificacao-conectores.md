# HANDOFF 50 → 00 (Astra): Classificação dos conectores sem dono + proposta de owners

- **De:** Agente 50 — Atlas · **Para:** Agente 00 — Astra
- **Data:** 2026-11-24 · **Base:** `93e82c220` · **Branch:** `coord/squad-50`
- **Tipo:** classificação + proposta de ownership — evidência `arquivo:linha`

## Classificação

| Conector | Caminho | Estado | Evidência |
|---|---|---|---|
| **Chatwoot** | `features/integrations/chatwoot/` | **PARCIAL** — webhook inbound assinado (HMAC-SHA256 + timestamp + dedup `claimWebhookDelivery`), helpers 65L; sem client/API outbound visível | `chatwoot.webhook.ts:18-49`; `chatwoot.helpers.ts:45-54`; mount pré-auth `bootstrap/webhooks.ts:43` |
| **HubSpot** | `features/integrations/hubspot/HubspotProvider.ts` | **IMPLEMENTADO (framework CRM externo)** — provider OAuth Bearer registrado; sem webhook inbound próprio | `HubspotProvider.ts:1-149`; registro `shared/ExternalCrmService.ts:10`; rotas `externalCrm.routes.ts` (ADMIN/GESTOR, config criptografada via `piiFields`) |
| **Monday** | `features/integrations/monday/MondayProvider.ts` | **IMPLEMENTADO (framework)** — idem HubSpot | `MondayProvider.ts:1-159`; `ExternalCrmService.ts:13` |
| **Pipedrive** | `features/integrations/pipedrive/PipedriveProvider.ts` | **IMPLEMENTADO (framework)** — idem | `PipedriveProvider.ts:1-131`; `ExternalCrmService.ts:11` |
| **RD Station** | `features/integrations/rdstation/RdStationProvider.ts` | **IMPLEMENTADO (framework)** — idem | `RdStationProvider.ts:1-120`; `ExternalCrmService.ts:12` |
| **Omie (ERP)** | `features/integrations/omie/` | **IMPLEMENTADO** — service 292L com retry/backoff 4×, timeout 15s, allowlist SSRF `app.omie.com.br`, credenciais appKey/appSecret (last4 na listagem); rotas montadas com auth | `omie.service.ts:14-26`; mount `bootstrap/routes.ts:223` |
| **Slack** | `features/integrations/slack/` | **IMPLEMENTADO** — service 304L, dois caminhos (Incoming Webhook + Bot Token), validação `https://hooks.slack.com/`, retry/backoff, `urlGuard` | `slack.service.ts:13-25`; `integrationsPing.routes.ts:128-147`; mount `bootstrap/routes.ts:221` |
| **Stripe** | `features/integrations/stripe/` | **IMPLEMENTADO** — service 418L, webhook com `stripe-signature` validado, `StripeChargeAdapter` | `stripe.webhook.ts:58-59`; `stripe.service.ts`; `infra/StripeChargeAdapter.ts` |
| **Signature (assinatura doc.)** | `features/integrations/signature/` | **IMPLEMENTADO** — webhook HMAC-SHA256 + dedup `claimWebhookDelivery('signature')` | `signatureStatus.webhook.ts:48-122`; mount `bootstrap/webhooks.ts:34` |

## Fila de saída CRM externo

`src/lib/queue/externalCrmOutbound.queue.ts` (`push-lead`, jobId dedup L99-100) +
`shared/externalCrm.routes.ts` montada em `/api/integrations/external-crm` com
`authenticateToken + requireTenant + requireRole(['ADMIN','GESTOR'])` (`bootstrap/routes.ts:226`,
`externalCrm.routes.ts:21`). Providers HubSpot/Monday/Pipedrive/RDStation são **outbound-only**:
`inboundEventsEnabled` existe no modelo mas não há rotas de webhook inbound para eles em
`bootstrap/webhooks.ts` — registrar como gap conhecido, não bug.

## Proposta de owners

| Conector(s) | Owner proposto | Justificativa |
|---|---|---|
| HubSpot, Monday, Pipedrive, RD Station | **Squad 50** — novo slot ou rateio 51–54 (sugestão: 54 Rita estende para "mapeamento DE-para multi-CRM"; providers ficam em `features/integrations/<provider>/`) | São conexões externas CRM genéricas, mesmo padrão do Bitrix; fila `externalCrmOutbound` já existe |
| Omie | **Squad 50** — 58 Elisa (já é "Enriquecimento e ERP") | Encaixa literalmente no papel do 58 |
| Slack | **Squad 50** — notificação outbound; ou Squad 60 (68-Paco notificações) se for tratado como canal | Hoje é só webhook/token de saída — sugiro Squad 50 com contrato para Paco |
| **Stripe** | **Squad 20 — 26 Dália** (Billing) para semântica de cobrança/faturas/webhooks financeiros; Squad 50 apenas consulta de transporte se necessário | Regra do despacho: "billing Stripe → cuidado Squad 20/Dália" |
| Chatwoot | **Delimitar com Squad 60** — webhook inbound é canal de atendimento (Kiko/Teca); transporte do webhook pode ficar Squad 50 | Mesmo critério do overlap WhatsApp |
| Signature | Provável domínio de contratos/documentos — **Squad 20 (21/22)** ou produto; não é integração de "ecossistema externo" no sentido Bitrix | Webhook já implementado e assinado; apenas classificação de dono |

## Pedido

1. Ratificar owners da tabela acima (ou indicar alternativa).
2. Confirmar que providers CRM externos (`ExternalCrmService` + `externalCrmOutbound.queue`)
   entram no escopo do Squad 50 — sugiro formalizar como "frente Multi-CRM" do squad.
3. `src/lib/queue/externalCrmOutbound.queue.ts` pertence a 23-Pina (Squad 20): se Squad 50 for
   dono funcional dos providers, registrar handoff de consumo de fila.
