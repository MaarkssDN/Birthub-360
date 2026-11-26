# Governança — Condições de aprovação fase 2 (registro formal)

**Data:** 2026-11-25 · **Autor:** Agente 00 (Astra/Devin) · **Origem:** Deliberação do Orquestrador Humano — fechamento da fase 2
**Status:** VIGENTE — aprovação condicional NÃO é autorização irrestrita.

## C-1 · ACH-03 — Sanitizer PII (Agente 67 Teca, squad-60)

Parecer Silas r2 (`.agents/reviews/squad-60-67-teca-templates-pii-r2-20261124.md`, SHA auditado `047de6f4ca`):

- **PROIBIDO** wirear `src/features/notifications/templates/sanitizer.ts` em qualquer canal HTML
  (e-mail HTML, renderização HTML de templates) até que entidades HTML (`&lt;`, `&#64;`, numéricas)
  sejam decodificadas antes da varredura PII, com regressões.
- Canais de texto puro (WhatsApp/SMS) não são afetados pela limitação.
- Adoção em pipelines (`CadenceDispatchers`/44, WhatsApp/56, e-mail/55, mensageria) exige handoff
  formal + correção do ACH-03 quando o canal for HTML.
- Pendências de adoção registradas: `notification.service.ts:142` loga `input.title`;
  `src/services/cadence/templateRenderer.service.ts` órfão interpola `{{var}}` sem escape.

## C-2 · Voice transfer B-07 latente (Agentes 64 Tito / achado adjacente)

- `src/features/voice/voice-command-executor.service.ts:340-352` (`handleTransferCall`) retorna
  `executed:true, verified:true` **sem persistência** — falso positivo B-07.
- **PROIBIDA** qualquer fiação funcional de `src/features/voice/**`, `src/features/ai-voice/**` e
  `src/lib/voice-runtime/**` até correção prévia (execução comprovada + persistência).
- Ownership desses paths está órfão na MATRIZ — ver `proposta-ownership-orfaos-20261125.md`.
- O pipeline canônico `voice-hub/commands/**` (contrato-futuro do Agente 64) só pode ser conectado
  via handoff formal 60→22 (mount) com as regras B-07 do handoff `64-para-60-voice-commands-wiring.md`.

## C-3 · Fundações sem consumidor — regra do primeiro wiring

Fundações aprovadas **sem call-site de produção** (aceitas como entrega de fundação):

| Fundação | Agente | Local |
|---|---|---|
| `withRetry` | 24 Ivo | `src/lib/resilience/withRetry.ts` |
| `detectScoredDuplicates` / `planContactMerge` | 48 Jade | `src/features/crm/deduplication/dedup.service.ts` |
| `recordOutboundEmailMessage` | 55 Ícaro | `src/lib/integrations/email/outboundEmailLog.ts` |
| `ingestInboundEmailReply` | 55 Ícaro | `src/features/integrations/email/emailReply.webhook.ts` |
| Deep link handler | 84 Pia | `src/mobile/deeplinks/handler.ts` |
| Sanitizer PII | 67 Teca | `src/features/notifications/templates/sanitizer.ts` (ver C-1) |
| `rawEmailParser` / `inboundAdapter` | 55 Ícaro | `src/lib/integrations/email/` |

**Regra:** o primeiro consumidor de cada fundação exige handoff formal do consumidor ao dono da
fundação + registro em `.agents/runs/` antes do merge. Nenhuma fundação pode ser tratada como
"funcionalidade entregue" sem caller comprovado.

## C-4 · Condições menores registradas (não bloqueantes, pendentes de roteamento)

- `src/lib/resilience/retry.ts` órfão → handoff ao Agente 26 (billing) para wiring ou remoção.
- `src/lib/queue/dlq/**` reservado ao 24 mas vazio → decisão conjunta 23+24 pendente.
- `src/lib/queue/AGENTS.md` diverge da MATRIZ (diz dono=16; matriz=23/24) → correção pendente.
- `erp/cnpj.service.ts` órfão → conectar ao fluxo de enriquecimento ou remover (Squad 50).
- `upsertOmieCustomer` fabrica `createdAt` e ignora `faultcode` → próxima fatia candidata (Squad 50).
- `OperationalStateContainer` e `ui/EmptyState` sem `role`/`aria-live` → Agente 33 (handoff aberto).
- `StaleDataIndicator` sem consumidor → adoção sugerida squads 50/59/85.
- Deep links: wiring `appUrlOpen` → `MobileDeepLinkRouter` pendente (80/81); polish de search/case.
- Docker overlays sem dono + credencial literal langfuse → ver proposta de ownership.
- Runbook `P0-07-ROLLOUT-ESTATICOS-PROTEGIDOS` citado em missão **não existe** — confirmar nome ou criar (docs = Agente 08).
