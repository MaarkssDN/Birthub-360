# Handoff 06 → 00 — Aprovação retroativa de alterações em `worker.ts` e `src/bootstrap/workers.ts`

```
De: 06 — Integrações e Bitrix
Para: 00 — Coordenador
Onda: 2 (regularização retroativa — DEM-20261114-003)
Status: resolvido
Prioridade: alto
Bloqueador-ref: commit 3ec8c096d (mergeado em main); reprovação do Agente 24
Sprint destino: regularização de governança

## Resolução (Agente 00, 2026-11-14)

APROVADO retroativamente. O `startWebhookWorker()` em `worker.ts` e
`src/bootstrap/workers.ts` corrigia bug real de produção: a fila `webhooks`
acumulava jobs sem consumidor (DLQ nunca esvaziava). Registrado que
`worker.ts`/entrypoints de worker são domínio do Agente 16 — futuras
alterações nesses arquivos exigem handoff 06→16 + aprovação do 00.
```

## Problema

O MEL-08 (Onda 2) exigia que a fila BullMQ `webhooks` tivesse consumidor em produção. O Agente 06
alterou `worker.ts` (entrypoint do worker dedicado — propriedade do Agente 16, conforme
`.agents/prompts/16-runtime-workers-escala.md:31`) e `src/bootstrap/workers.ts` (modo embutido
`ENABLE_EMBEDDED_WORKERS`) **sem handoff prévio nem aprovação do 00** — `server.ts`/`worker.ts` e
arquivos de bootstrap exigem aprovação explícita do Coordenador (AGENTS.md §15).

## Arquivo(s) envolvido(s)

- `worker.ts` (raiz) — +5 linhas: import de `startWebhookWorker` e registro
  `{ name: 'webhooks', worker: webhookWorker }` em `startWorkerServer`.
- `src/bootstrap/workers.ts` — +7 linhas: mesmo registro no caminho `startEmbeddedWorkers()`
  (guarda `embeddedWorkersEnabled`), novo campo `webhookWorker` em `EmbeddedWorkersHandle`.
- `tests/unit/bootstrap/shutdown.test.ts` — +2 linhas (cobertura do novo handle).

## O que foi alterado e por quê

Antes da alteração, `src/lib/voice-hub/services/webhook.service.ts` enfileirava entregas na fila
`webhooks`, mas **nenhum processo consumia** — os webhooks de saída nunca saíam (nem em modo
dedicado nem embutido). A alteração registra `startWebhookWorker()` nos dois entrypoints, com a
mesma justificativa documentada em comentário `MEL-08 (Onda 2)` nos dois arquivos.

## Por que isso importa (evidência)

- Sem o registro, o MEL-08 seria letra morta: HMAC/retry já existiam no worker, mas o worker
  nunca rodava em produção.
- O shutdown gracioso cobre o novo handle (`webhookWorker` entra em `EmbeddedWorkersHandle` e nos
  testes de shutdown).

## Alteração necessária (pedido ao 00)

1. **Ratificar retroativamente** as alterações em `worker.ts` e `src/bootstrap/workers.ts`, ou
   abrir handoff formal ao Agente 16 (dono do entrypoint de worker) para revisão de código.
2. Decidir se o registro da fila `webhooks` deve ser revisto quanto a `concurrency`/ordem de
   inicialização — fora do escopo desta regularização.
3. Atualizar a matriz de propriedade se `src/bootstrap/workers.ts` não tiver dono explícito.

## Contexto adicional

- Alteração correlata em `src/lib/voice-hub/services/webhook.worker.ts` (dono 12) está em handoff
  separado: `06-para-12-voice-hub-webhook-worker.md`.
- Nada aqui é bloqueador de runtime: o código está mergeado e funcional; a pendência é
  **governança**, não correção.
