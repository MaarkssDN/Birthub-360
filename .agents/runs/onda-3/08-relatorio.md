# Relatório Onda 3 — Agente 08 (QA e Release)

Demanda: DEM-20261113-004 · Branch: `agente/08-onda3-qa` · Base: `integracao/onda-3`
Data: 2026-11-13

## MEL-19 — Gate de migrations seguras no CI ✅

**Diagnóstico**: `scripts/db/check-migration-safety.ts` existia mas (a) não era executado por nenhum workflow e (b) não implementava a regra do bloco `-- ROLLBACK:` prevista em `docs/security/runbooks/MIGRATION_ROLLBACK.md` (Passo 4) e `prisma/AGENTS.md`.

**Alterações**:
- `scripts/db/check-migration-safety.ts`:
  - Novo detector `ROLLBACK_BLOCK_PATTERN` (`/^\s*--\s*ROLLBACK\s*:/im`) e campo `hasRollbackBlock` em `SafetyCheckResult`.
  - Regra: migration destrutiva **nova** (fora da whitelist) passa o gate somente se tiver `-- ROLLBACK:`; caso contrário falha com exit 1 e mensagem apontando o runbook.
  - `FROZEN_HISTORICAL_DROPS`: adicionadas 4 migrations já aplicadas em `origin/main` que contêm DROPs mas precedem a regra do bloco (`20261020240000_lgpd_tenant_key_envelope_cascade_hardening`, `20261021000000_lgpd_chain_restrict_org_no_app_delete`, `20261021010000_langgraph_checkpoint_tables`, `20261112000000_tenant_fk_cascade_to_restrict`) — imutáveis por `prisma/AGENTS.md`; o gate de ROLLBACK vale só para migrations novas.
- `.github/workflows/migration-safety.yml` (novo): job em `pull_request` com `paths` = `prisma/migrations/**`, `prisma/schema.prisma`, o próprio script e o workflow; + `workflow_dispatch`. Steps: checkout pinado (mesmo SHA dos demais workflows), setup-node 22 com cache npm, `npm ci`, `npx tsx scripts/db/check-migration-safety.ts`.
- `docs/architecture/MIGRATION_SAFETY_POLICY.md` §3: documentada a exceção do bloco `-- ROLLBACK:` e o workflow de CI.

**Evidências**:
- `npx tsx scripts/db/check-migration-safety.ts` → `✅ All migrations comply` (153 migrations, 19 frozen).
- Teste negativo com migrations sintéticas: destrutiva sem ROLLBACK → `passed=false`; com `-- ROLLBACK:` → `passed=true`; aditiva → `passed=true`.
- `npx yaml-lint .github/workflows/migration-safety.yml` → OK.
- Script fora do `tsconfig.json` (include = `src`, `server.ts`); executado via `tsx`, sem erro de tipo.

**Teste local documentado**: `npx tsx scripts/db/check-migration-safety.ts` (também no header do workflow).

## MEL-23 — Dead code via knip ✅ (triagem)

- `npx knip --reporter json` executado (exit 1 = issues; config `knip.json` funciona, sem correção necessária).
- Achados: 343 arquivos não referenciados, 729 exports, 675 types, 31 deps + 11 devDeps sem uso, 15 imports não declarados, 16 exports duplicados, 1 binário.
- **Nenhuma remoção em massa e nenhuma remoção cirúrgica**: todos os candidatos de arquivo morto estão em `src/**` (fora do escopo de edição do 08) e nenhum atinge certeza absoluta (imports dinâmicos/barrels/rotas lazy). Entregável completo em `.agents/runs/onda-3/08-mel23-knip-triagem.md` com classificação (falsos positivos de config vs. órfãos prováveis) e recomendações de handoff por domínio.
- Destaques para o 00: 15 deps `unlisted` (`zustand`, `ws`, `crawlee`, `@radix-ui/react-dialog`, `@opentelemetry/*`, `@temporalio/*`, `@hapi/boom`, `@noble/hashes`) → handoff 01; suspeita de `worker-*.ts` raiz mortos → 16/00; `src/features/settings/**` não roteado → 02.

## Gates

- YAML validado (`yaml-lint`) ✅
- `check-migration-safety.ts` executado via tsx com cenário positivo e negativo ✅
- knip executado com saída capturada e triada ✅
- `npx tsc --noEmit` completo não rodado: nenhum arquivo coberto pelo tsconfig foi alterado (script de verificação roda via tsx; `src/`/`server.ts` intocados).

## Arquivos alterados/criados

- `scripts/db/check-migration-safety.ts` (editado)
- `.github/workflows/migration-safety.yml` (novo)
- `docs/architecture/MIGRATION_SAFETY_POLICY.md` (editado)
- `.agents/runs/onda-3/08-mel23-knip-triagem.md` (novo)
- `.agents/runs/onda-3/08-relatorio.md` (este arquivo)

Sem push, sem merge — conforme regras.
