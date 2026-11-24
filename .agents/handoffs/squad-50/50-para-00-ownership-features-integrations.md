# HANDOFF 50 → 00 (Astra): Ownership de `src/features/integrations/**` e lacunas do Squad 50

- **De:** Agente 50 — Atlas (Coordenador Squad 50) · **Para:** Agente 00 — Astra
- **Data:** 2026-11-24 · **Base:** `93e82c220` · **Branch:** `coord/squad-50`
- **Tipo:** deliberação de governança/ownership — **bloqueia despacho de 51–54 e 57**

## Contexto

`MATRIZ_PROPRIEDADE.md` atribui ao Squad 50 apenas `src/lib/integrations/<provider>/**`, mas a
implementação real dos conectores vive majoritariamente em `src/features/integrations/**`
(~132 arquivos TS no conjunto `src/lib/integrations` + `src/features/integrations`).

Evidências (`93e82c220`):

- `src/features/integrations/AGENTS.md` declara dono legado "Agente 06 — Integrações e Bitrix"
  para Bitrix, Extrações, Google, WhatsApp, 3CX e voz.
- `src/lib/integrations/bitrix/` contém apenas 4 utilitários finos (`client.ts` circuit breaker,
  `batch/extractor.ts`, `mapping/mapper.ts`); o domínio Bitrix real está em
  `src/features/integrations/bitrix/` (~60 arquivos: `service/client.ts` com retry 4×/timeout 15s,
  `service/extraction.ts` 1041 linhas, `service/syncRules.ts`, `service/idempotentSync.ts`,
  `paginatedExtractor.ts`, `bitrix.webhook.ts`, `bitrixWebhook.queue.ts`, `service/__tests__/`).
- Análogo para e-mail (`features/integrations/email/`), Google (`features/integrations/google/`),
  WhatsApp (`features/integrations/whatsapp/`), 3CX, birth-voice.

## Pedidos ao Astra

1. **Deliberar propriedade de `src/features/integrations/**`:**
   - Opção A: estender a matriz do Squad 50 para cobrir `src/features/integrations/{bitrix,email,google,whatsapp,threecx,birth-voice}/**` (subdividido entre 51–59 conforme especialidade).
   - Opção B: criar handoff formal Squad 50 → dono legado (Agente 06/rota sucessora) para cada conector.
   - Opção C: mover código para `src/lib/integrations/` (refactor grande — não recomendado agora, P2/P3).
2. **Classificar conectores sem dono na matriz:** `chatwoot`, `hubspot`, `monday`, `omie`,
   `pipedrive`, `rdstation`, `slack`, `stripe`, `signature`, `components`, `routes`, `shared`
   (em `src/features/integrations/`). Provável: rotas/contratos → Squad 20 (21/22); CRM connectors
   → Squad 40 ou Squad 50 conforme natureza.
3. **`BITRIX24-LEAD-FLOW-AUDIT.md` ausente:** a skill `integration-audit` manda lê-lo antes de
   reauditar Bitrix, mas o arquivo não existe no repositório (verificado em `93e82c220`).
   Restaurar o documento ou autorizar reconstrução de evidência (Squad 50 já produziu matriz
   preliminar em `.agents/runs/squads/squad-50-matriz-prontidao-conectores.md`).
4. **`src/lib/integrations/index.ts`** (ownership exclusivo do Agente 50) não existe. Squad 50
   propõe NÃO criá-lo até haver ≥2 consumidores reais de um registry/contrato de integrações
   (simplicidade, AGENTS.md §2 P2). Ratificar ou indicar consumidor.

## Impacto se não deliberado

- 51 Bela, 52 Lino, 53 Vega, 54 Rita, 57 Nico ficam restritos a missões read-only (auditoria sem
  escrita em `features/`), atrasando correções de idempotência/paginação/webhooks já evidenciadas.

## Evidência

- `.agents/runs/squads/squad-50-plano.md` §2 e §4-R1.
- `.agents/runs/squads/squad-50-matriz-prontidao-conectores.md`.
