# Run — Agente 05 · TAREFA-SANEAMENTO-019 / BT360-DT-0027

- **Data:** 2026-11-10
- **Branch:** `agente/05-cache-enriquecimento-ttl` (worktree `agente-05-cache-enriquecimento-ttl`)
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-05-acumulo-de-cache-de-enriquecimento-sem-expurgo-automatico-em-tabelas-t.md` → `resolvido`

## O que foi feito

Ciclo de vida/expurgo do cache de enriquecimento (tabela `EnrichmentLog`), tudo dentro de `src/features/prospecting/**`:

- `domain/IEnrichmentRepository.ts`: novo método `deleteEnrichmentLogsCreatedBefore(cutoff)`.
- `infra/PrismaEnrichmentRepository.ts`: implementação via `enrichmentLog.deleteMany({ createdAt: { lt: cutoff } })`.
- `services/enrichment.service.ts`: `getEnrichmentLogRetentionMs` (env `ENRICHMENT_LOG_RETENTION_DAYS`, default 60d), `computeEnrichmentLogCutoff`, `purgeExpiredEnrichmentLogs`, `maybePurgeExpiredEnrichmentLogs` (throttle 24h/processo, falha isolada com `logger.warn`), `resetEnrichmentLogPurgeThrottleForTests`. Gancho oportunista em `enrichCompany` — sem depender de `src/lib/queue/**` (slot do Agente 16).
- `services/__tests__/enrichmentRetention.test.ts`: 10 testes (sucesso e falha).

## Decisões

- Purga oportunista em vez de cron: agendador é propriedade do Agente 16; `enrichCompany` é o único caminho que produz as linhas.
- Falha de banco no expurgo não derruba o enriquecimento (manutenção best-effort), mas é observável via `logger.warn`.
- Nenhuma migração/schema alterada; `createdAt` já existia em `EnrichmentLog`.

## Gates executados (worktree, com node_modules compartilhado)

- `npx tsc --noEmit` — passou.
- `npm run lint` (biome) — passou; 0 diagnósticos nos arquivos alterados (warnings pré-existentes em outros arquivos).
- `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/enrichmentRetention.test.ts` — 10/10.

## Pendências

- Parecer formal do Agente 24 antes de integrar.
