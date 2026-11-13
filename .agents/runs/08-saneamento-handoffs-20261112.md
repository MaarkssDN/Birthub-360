# Run — Agente 08 — QA e Release — execução de handoffs pendentes (2026-11-12)

**Branch:** `agente/08-qa-saneamento` (worktree `C:\Github\Birthub-360-worktrees\agente-08-qa`, base `origin/main` @ `a8ce7646f`, pós-merge do PR #240)
**Missão:** executar todos os handoffs com `Status: aberto`/`em-andamento` destinados ao Agente 08.

## Handoffs tratados

| Handoff | Status final | Evidência |
|---|---|---|
| `onda-paralela-8/00-para-08-unit-failures.md` | **resolvido** | `npm run test:unit` completo: 771 arquivos / 5918 testes / 0 falhas / 1 skip (41min). `universalTools.integrationSecrets.test.ts` (suspeita do diagnóstico) passou 23/23 — erro era log esperado. |
| `onda-saneamento-20261110/00-para-08-62-arquivos-...` (TAREFA-SANEAMENTO-007 / DIV-08-002) | **resolvido** (já implementado em main) | `vitest.unit.config.ts` já inclui `src/**/*.test.ts(x)` e `src/**/__tests__/**` desde `fc30b3325` (2026-10-16). 309 arquivos de teste sob `src/` descobertos e executados na suíte (ex.: `src/features/mesa-tratamento/services/__tests__/mesa-triage.service.test.ts`). |
| `onda-saneamento-20261110/00-para-08-dockerfile-...` (TAREFA-SANEAMENTO-024 / BT360-DT-0045) | **resolvido** (já implementado em main) | `Dockerfile:36-56` fixa a versão da CLI a partir do `node_modules` pós-`npm ci`, reinstala com `--no-save` na versão exata e aborta o build se CLI/lock/client divergirem. Commit `508a05271` (2026-10-14). |
| `onda-saneamento-20261110/00-para-08-instrucao-...` (TAREFA-SANEAMENTO-047 / BT360-DT-0047) | **resolvido** (já implementado em main) | `docs/development/LOCAL_FIRST.md:74-85` já inclui `-f docker-compose.postgres-local.yml` no `up` e `prisma migrate deploy` em seguida. Commit `63f59a064` (2026-10-14). |
| `onda-saneamento-20261110/11-para-08-guard-de-fixtures-...` (BT360-DT-0058) | **resolvido** (implementado nesta sessão) | Novo `tests/unit/brand/fixtures-brand-hygiene.test.ts` (commit `95137518b`): varre `tests/fixtures/**` (ZIP/docx via `unzipper` + scan latin-1), bloqueia `AtlasGR`, `Total Trac`, `prospector-atlas`, `#ff5618`; caminho de falha coberto com buffers sintéticos. `npx vitest run -c vitest.unit.config.ts tests/unit/brand/` → 5/5 verdes. |
| `00-para-08-cobertura-testes-modulos.md` (Onda F5) | **em-andamento** | Os 6 módulos já têm specs dedicadas (tabela na seção Resolução do handoff). Priorização pedida revelou **gaps de produto**, não de teste: sem model de ledger de créditos no schema (AC-MKT-003), sem badge FONTE_PARCIAL em market-intelligence (AC-MKT-002), sem conceito de SLA em mesa-tratamento. Handoff `08-para-00-cobertura-modulos-gaps-produto.md` aberto para decisão do 00. |

## Commits

- `95137518b` — `test(brand): guard de fixtures contra reintroducao de marcas legadas (handoff 11-para-08)`
- `5fc7308d4` — `docs(handoffs): resolver TAREFA-SANEAMENTO-007/024/047 e guard de fixtures; registrar gaps de produto da cobertura (agente 08)`
- (este relatório em commit posterior)

## Gates executados

- `npx tsc --noEmit` → **limpo** (exit 0).
- `npm run lint` (`biome lint src`) → 0 erros; 1498 warnings pré-existentes em `src/**`, nenhum introduzido (arquivos alterados fora de `src/`).
- `npm run test:unit` → **771 arquivos / 5918 testes / 0 falhas** (execução serial completa, ~41min).
- `npx vitest run -c vitest.unit.config.ts tests/unit/brand/` → 5/5 verdes (inclui o novo guard).

## Pendências / handoffs abertos por este agente

- `.agents/handoffs/08-para-00-cobertura-modulos-gaps-produto.md` — decisão do 00 sobre os ACs do Documento Mestre sem implementação (créditos/ledger, FONTE_PARCIAL, SLA de mesa).
- `.agents/handoffs/00-para-08-cobertura-testes-modulos.md` permanece `em-andamento` até a decisão acima.
- Observação registrada no handoff TAREFA-SANEAMENTO-047: `README.md` bootstrap usa `docker-compose.services.yml` sem o overlay `postgres-local` (obrigatório segundo o cabeçalho do próprio arquivo) — fora do escopo do handoff, sinalizado ao 00.
- `npm run build`, `test:integration`, `test:e2e` não executados nesta sessão (fora do necessário para os handoffs tratados; suíte unitária era o gate exigido).
