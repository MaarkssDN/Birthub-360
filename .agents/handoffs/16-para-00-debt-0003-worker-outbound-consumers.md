# Handoff — DEBT-0003: consumers outbound-sync nos workers dedicados

- De: Agente 16 (Runtime, Workers e Escala)
- Para: Agente 00 (Coordenador) — com ciência de 06/06A (domínio Bitrix) e 04 (CRM)
- Onda: review-20261119 (DEBT-0003)
- Status: resolvido (código) — severidade real pendente de decisão humana de topologia/env
- Prioridade: normal
- Bloqueador-ref: `.agents/runs/00-reconciliacao-release-readiness-20261119.md` (DEBT-0003)

## Problema

As filas `bitrix-outbound-sync` e `external-crm-outbound-sync` só tinham consumers no modo
embedded (`src/bootstrap/workers.ts:192-193`, gated por `ENABLE_EMBEDDED_WORKERS`). Nenhum
entrypoint de worker dedicado as registrava — nem `worker.ts` ("all"), que é o único
entrypoint efetivamente buildado/deployado hoje (`build:worker`/`start:worker` no
`package.json`). Em topologia dedicada (worker.ts + web sem `ENABLE_EMBEDDED_WORKERS`),
jobs enfileirados por `queueLeadPushToBitrix`/`queueLeadPushToExternalCrms` (produtores em
`src/features/crm/application/LeadUseCases.ts`, `src/features/prospecting/services/prospecting/promote.ts`,
`src/features/intelligence/tools/integrationTools.ts`) se acumulavam sem consumidor.

Causa raiz do escape: `tests/unit/architecture/worker-registry-parity.test.ts` fazia glob
apenas de `*.worker.ts`; `bitrixOutbound.queue.ts` e `externalCrmOutbound.queue.ts` exportam
`createXWorker` mas terminam em `.queue.ts` — fora do glob.

## Alteração necessária (executada)

Registro replicando o padrão embedded, sem tocar `src/lib/queue/**` (sem conflito de slot
com 06/07 — nenhum handoff aberto sobre `src/lib/queue/**` no momento da execução):

| Entry point | Worker registrado | Justificativa de domínio |
|---|---|---|
| `worker.ts` ("all") | `createBitrixOutboundWorker()` + `createExternalCrmOutboundWorker()` | entrypoint dedicado real de produção; paridade com embedded |
| `worker-extracoes.ts` | `createBitrixOutboundWorker()` (`bitrix-outbound-sync`) | co-localizado com `bitrix-sync`/`bitrix-extraction-purge` (domínio Bitrix/integrações) |
| `worker-crm.ts` | `createExternalCrmOutboundWorker()` (`external-crm-outbound-sync`) | push de lead para CRMs externos é outbound do ciclo de vida do lead (produtor principal: `LeadUseCases`) |

`worker-core.ts`, `worker-ia.ts`, `worker-mercado.ts`, `worker-prospecting.ts` **não**
receberam os consumers: cada fila deve ter exatamente um consumidor por topologia
dedicada; a divisão acima cobre as duas filas sem duplicar processamento.

Teste: `tests/unit/architecture/worker-registry-parity.test.ts` — glob estendido de
`*.worker.ts` para `*.{worker,queue}.ts` em `src/lib/queue/`, fechando o buraco que
permitiu o DEBT-0003. Nenhum `.queue.ts` existe em `src/features/*/jobs/` (verificado).

## Evidência

- `npx tsc --noEmit` — limpo.
- `npm run lint` — exit 0 (1561 warnings pré-existentes, nenhum novo).
- `npx vitest run tests/unit/architecture/worker-registry-parity.test.ts` — 4/4.
- `npx vitest run tests/unit/bootstrap tests/unit/features/integrations/bitrix/outboundSync-dedup*.test.ts tests/unit/features/integrations/shared/ExternalCrmService.outbound.test.ts tests/unit/features/prospecting/outbound` — 95/95.
- `npm run build:worker` — `dist/worker.cjs` gerado com os novos imports.

## Pendência — decisão humana (fora do código)

A **severidade real** do DEBT-0003 depende de `ENABLE_QUEUES`/`ENABLE_EMBEDDED_WORKERS` e da
topologia efetiva em produção (EC2): se produção roda `worker.ts` dedicado sem embedded,
o débito era real e jobs de push outbound ficavam parados; se roda embedded ou filas
desligadas, era latente. Confirmar com 10/00 qual processo consome essas filas em prod e
se os entrypoints `worker-crm.ts`/`worker-extracoes.ts` serão efetivamente deployados
(hoje não há script npm nem referência em `render.yaml`/`Dockerfile` para eles — só
`worker.ts` é buildado). Nenhuma mudança em `src/lib/queue/**` foi necessária.
