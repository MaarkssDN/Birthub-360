# Relatório — Agente 16 · Onda 3 (MEL-21 + MEL-22)

Data: 2026-11-14 · Branch: `agente/16-onda3-runtime` · Base: `integracao/onda-3`
Worktree: `C:\Github\Birthub-360-worktrees\agente-16-onda3-runtime`

## Entregas

### MEL-21 — Auditoria do outbox/relay
- Auditoria completa: `.agents/runs/onda-3/16-mel21-outbox-auditoria.md` (10 gaps G1–G10 com evidência arquivo:linha).
- Correções no meu domínio:
  1. **Relay da outbox nunca era iniciado** — `startDomainEventOutboxRelay()` não tinha callers; FAILED/PENDING ficavam parados. Ligado em `worker.ts` (processo dedicado, com `bitrixEventMeshBridge.register()` para o conjunto completo de consumidores) e em `src/bootstrap/workers.ts` (`startEmbeddedWorkers`, cobre modo embutido; `OutboxRelay.close()` adicionado para shutdown).
  2. **Handlers de consumo sem tenant** — `deliver()` agora executa cada handler com `requestContext.run({ tenantId: event.organizationId })`.
  3. **Dedup de enqueue** — `enrichment.queue.ts` (jobId `enrich-company:{org}:{company}:{auto|force}`), `whatsappSignal.worker.ts` (jobId com organizationId), `newsMonitor.worker.ts` (jobId `news-scan:{org}:{company}` + `getJob` para não consumir cota do scan).
- Handoffs: `16-para-00-outbox-produtores-sem-idempotency-key.md` (G4, ~40 produtores), `16-para-06-bitrix-event-mesh-bridge-consumo.md` (G3 falhas engolidas + G6 nomes de consumidor).
- Gaps maiores registrados sem correção: ordenação por agregado (G5), lease de consumo vs handler longo (G7), `publishInTransaction` sem uso (G10), código morto (G9).

### MEL-22 — Cache Redis por tenant
- Auditoria: `.agents/runs/onda-3/16-mel22-cache-redis-tenant.md` (matriz de todos os namespaces).
- Resultado: todos os caches de `src/lib/**` já têm discriminador de tenant ou são globais por desenho (circuit breaker de provider, locks de job único). Não existe utilitário `cache-key-discriminator` em código — o padrão canônico está em `semanticCache.ts`/`reportCache.ts`.
- **Gap real em feature de outro dono**: `providerCache.ts` (05) gera chaves sem `organizationId` → handoff `16-para-05-provider-cache-sem-tenant.md`.
- Invalidação: TTL-based coerente nos caches auditados; `semanticCache.invalidateTenant` existe.

## Gates

- `npx tsc --noEmit` → **exit 0**
- `npm run lint` (biome lint src) → **exit 0** (1520 warnings pré-existentes fora do escopo)
- `vitest run tests/unit/bootstrap/shutdown.test.ts tests/unit/architecture/worker-registry-parity.test.ts tests/unit/queue/outbox.remed05-tenant-guard.test.ts` → **18/18 passam**
- `vitest run src/lib/queue tests/unit/queue` → 43/44; falha única `outbox.remed05-boot.test.ts` (timeout 5s no import do setupDI) **reproduz no baseline sem minhas alterações** (verificado com `git stash`) — flake/ambiente, não regressão.

## Observações para o 00

- `src/lib/queue/AGENTS.md` declara dono "Agente 07", mas a missão da Onda 3 atribui `src/lib/queue/**` ao 16 e o histórico REMED-05 é do 16 — convém alinhar o AGENTS.md local (decisão do 00/24).
- O relay no processo worker exige que os consumidores estejam registrados lá — registrei o `bitrixEventMeshBridge` em `worker.ts`. Se novos subscribers surgirem, precisam ser registrados em ambos os entrypoints (mesma ordem, para nomes default `${eventType}#${index}` estáveis — ver G6/handoff 06).
