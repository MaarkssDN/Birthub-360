# Parecer 24 — Revisão Independente

- **Missão**: DEBT-0003 — consumers outbound-sync (`bitrix-outbound-sync`, `external-crm-outbound-sync`) ausentes dos workers dedicados
- **Autor**: Agente 16 (Runtime, Workers e Escala) — `agente/16-worker-outbound-consumers`
- **Auditor**: Agente 24 (Revisão Independente)
- **PR**: #440 — commit revisado `2d595db61888f7e4ca7c6408a41b82e625ff32cc` (worktree `C:\Github\Birthub-360-worktrees\agente-16-worker-outbound`)
- **Data**: 2026-11-19

## Arquivos da entrega

- `worker.ts` — registra `createBitrixOutboundWorker()` + `createExternalCrmOutboundWorker()`
- `worker-extracoes.ts` — registra `createBitrixOutboundWorker()` (`bitrix-outbound-sync`)
- `worker-crm.ts` — registra `createExternalCrmOutboundWorker()` (`external-crm-outbound-sync`)
- `tests/unit/architecture/worker-registry-parity.test.ts` — glob `*.worker.ts` → `*.{worker,queue}.ts`
- `.agents/handoffs/16-para-00-debt-0003-worker-outbound-consumers.md` (novo)

Escopo respeitado: nenhum arquivo de `src/lib/queue/**` (propriedade compartilhada 06/16/07) foi modificado — apenas entrypoints `worker*.ts` e o teste de arquitetura. `src/bootstrap/workers.ts` (embedded) já registrava ambos (linhas 192-193) e não foi tocado.

## Verificações executadas por mim

| Verificação | Resultado |
|---|---|
| `npx vitest run tests/unit/architecture/worker-registry-parity.test.ts` no commit exato | **4/4 passam** |
| `npx tsc --noEmit` no worktree | **limpo** |
| Fábricas existem e exportam `createXWorker` | `bitrixOutbound.queue.ts:56`, `externalCrmOutbound.queue.ts:61` |
| Filas são dirigidas por produtores (sem scheduler necessário) | `queueLeadPushToBitrix`/`queueLeadPushToExternalCrms` enfileiram sob demanda (`jobId` determinístico por org+lead); consumers puros bastam |
| Topologia de deploy real | `package.json` só builda `worker.ts` (`build:worker` → `dist/worker.cjs`); `Dockerfile:31` usa esse script; **nenhum** script/referência para `worker-crm.ts`/`worker-extracoes.ts` em `package.json`, `render.yaml`, `Dockerfile`, `docker-compose.yml` ou workflows — confirmado, o handoff documenta isso com honestidade |
| Causa raiz do escape | confirmada: o glob antigo só cobria `*.worker.ts`; `*.queue.ts` (`enrichment`, `search`, `knowledgeIngestion`, `whatsappCommand`, `bitrixOutbound`, `externalCrmOutbound`) exportam fábricas `createXWorker` — `enrichment.queue.ts:104` e `search.queue.ts:46` já exportavam e estavam registrados por sorte, não por gate |
| Duplicação embedded × dedicado | impossível no mesmo processo: embedded só liga com `ENABLE_EMBEDDED_WORKERS` e `src/lib/queue/redis.ts` aborta boot se isso for true em produção; topologias são mutuamente exclusivas por env |

## Análise dos pontos pedidos

1. **Consumers no entrypoint correto**: `worker.ts` ("all") é o único entrypoint buildado/deployado hoje — registrar lá resolve o débito na topologia real de produção. `worker-extracoes.ts`/`worker-crm.ts` recebem registro parcial coerente com seus domínios (Bitrix em extrações; outbound de CRM no worker de CRM), preparando shards caso a topologia mude.
2. **Topologia (1 consumidor por fila)**: dentro de cada entrypoint cada fila tem exatamente 1 consumer. Se `worker.ts` e um shard rodarem simultaneamente no futuro, ambos consumiriam a mesma fila — mas BullMQ distribui jobs entre consumers concorrentes (cada job processado uma vez; `jobId` determinístico ainda deduplica re-enqueues). Não há risco de processamento duplicado, apenas redundância inócua. O invariante declarado no handoff ("exatamente um consumidor por topologia") é uma escolha conservadora, não uma correção obrigatória.
3. **Parity test cobre `*.queue.ts`**: sim — o glob foi estendido e agora pegará qualquer fábrica `createXWorker` exportada de `*.queue.ts` em `src/lib/queue/` ou `*.worker.ts` em `src/features/*/jobs/`. Verificado que `enrichment.queue.ts`/`search.queue.ts` (que já exportavam fábricas fora do glob antigo) estão registrados nos dois entrypoints testados — o teste passa legitimamente, não por conjunto vazio (o sanity check `discovered.length > 0` protege contra glob quebrado).
4. **Sem duplicação embedded×dedicado**: confirmado — modo embedded e dedicado são mutuamente exclusivos por `ENABLE_EMBEDDED_WORKERS`/guarda de produção.
5. **Wiring pendente de deploy documentado**: sim — o handoff declara explicitamente que `worker-crm.ts`/`worker-extracoes.ts` não têm script npm nem referência em `render.yaml`/`Dockerfile`, que só `worker.ts` é efetivamente deployado, e que a severidade real depende da topologia de prod (`ENABLE_QUEUES`/`ENABLE_EMBEDDED_WORKERS`) — pendência escalada ao 00/10 como decisão humana, corretamente fora do escopo de código.

## Achados

- **Info** — O parity test verifica apenas *import* nos entrypoints `worker.ts`/`bootstrap/workers.ts`; não cobre `worker-crm.ts`/`worker-extracoes.ts` nem a instanciação efetiva (`new Worker` dentro das factories é responsabilidade do arquivo da fila). Se um dia um shard dedicado for deployado sem o consumer correspondente, nenhum gate pega — mas isso é uma lacuna de teste de arquitetura menor, não um defeito desta entrega. 16/08 podem avaliar estender o teste aos `worker-*.ts` no futuro.
- **Info** — `worker.ts` registrando ambas as filas significa que, se shards forem deployados no futuro **sem** remover `worker.ts`, as filas terão 2 consumers (competing consumers BullMQ — benigno). Se a intenção for shard exclusivo, a topologia de deploy precisará excluir `worker.ts` ou aceitar a redundância. Já sinalizado no handoff para decisão do 00.
- **Info** — Severidade real do DEBT-0003 (era live ou latente?) depende de env/topologia de produção — pendência humana documentada, não bloqueia código.

## Veredito

**APROVADO** — causa raiz identificada corretamente (glob do parity test), correção mínima e cirúrgica (4 arquivos de registro + teste + handoff), evidência executável reproduzida por mim no commit exato (parity 4/4, `tsc` limpo). O débito está sanado na única topologia de deploy existente (`worker.ts` dedicado); os shards ficam preparados e a pendência de decisão de topologia/env está formalmente escalada. Nenhum arquivo de terceiro foi tocado.
