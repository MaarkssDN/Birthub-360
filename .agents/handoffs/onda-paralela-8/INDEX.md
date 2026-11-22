# Onda Paralela — 8 Missões Independentes (2026-11-10)

Coordenador: Agente 00
Branch de integração: `integracao/onda-saneamento-20261110`
Worktrees: `.claude/worktrees/ag-<NN>` (gitignored)

## Diagnóstico do coordenador (evidências reais)

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` (tsconfig.json) | PASS — 0 erros |
| `npx prisma validate` | PASS — schema válido |
| `npm audit --omit=dev` | PASS — 0 vulnerabilidades |
| `npm run lint:architecture` (depcruise) | PASS c/ 69 known + **81 stale baseline violations** |
| `npm run check:hotspots` | **FAIL** — `src/features/characters/characterCatalog.ts` 1113 linhas > 1000 sem exceção |
| `npx biome lint src` | 1437 warnings (a11y, `!important`, unused params) |
| `npx knip` | 337 arquivos src não referenciados, 760 exports / 695 types não usados, 15 duplicate exports, 1 unresolved import, 15 unlisted deps |
| `vitest.unit` | em execução no momento do disparo |

## Bugs comprovados encontrados no diagnóstico

1. `src/lib/voice-hub/services/authService.ts:17` importa `createTenant` de `../repositories/organizationRepository.js` — módulo inexistente; a função existe em `tenantRepository.ts`. tsconfig exclui voice-hub, então o typecheck não pega; quebra em runtime no caminho de signup.
2. `src/features/prospecting/crawlee/crawler.ts` importa `crawlee`, pacote ausente de package.json/node_modules; consumido por `src/features/temporal-workers/activities.ts`.
3. `src/features/characters/characterCatalog.ts` bloqueia o gate `check:hotspots`.
4. `as any` concentrado: `marketIntelligenceCompany.service.ts` (14), `leads.routes.ts` (10), `aiSchemas.ts` (8), `UniversalEcosystemPanel.tsx` (7), `ai.ts` (6), `AnalyticsController.ts` (6), `tabMeta.ts` (6).

## Missões

| # | Agente | Branch | Escopo de arquivos | Evidência |
|---|---|---|---|---|
| M01 | 11 — Marca | agente/11-hotspot-characters | `src/features/characters/**`, `docs/architecture/HOTSPOT_EXCEPTIONS.md` | check:hotspots FAIL |
| M02 | 02 — Produto/UX | agente/02-asany-layout | `src/components/layout/tabMeta.ts`, `src/features/intelligence/components/UniversalEcosystemPanel.tsx` | knip `as any` |
| M03 | 18 — Contratos/API | agente/18-asany-analytics | `src/features/analytics/presentation/AnalyticsController.ts` | knip `as any` |
| M04 | 01A — RLS/Reterção | agente/01a-tenancy-audit | `src/features/crm/**`, `src/features/crm360/**` | auditoria tenancy |
| M05 | 07 — IA | agente/07-duplicate-exports | `src/features/intelligence/agents/**`, `src/features/intelligence/tools/**` | knip duplicates |
| M06 | 06 — Integrações | agente/06-bitrix-dead-exports | `src/services/bitrix/**`, `src/features/integrations/**` | knip unused exports |
| M07 | 08 — QA/Release | agente/08-unit-failures | `tests/unit/**` + fonte estritamente relacionada | suíte vitest |
| M08 | 15 — Segurança | agente/15-auth-import-fix | `src/lib/voice-hub/services/authService.ts`, `src/lib/security/**` | unresolved import |

## Regras da onda

- Cada agente trabalha exclusivamente em seu worktree/branch.
- Não alterar `AGENTS.md`, `.env*`, `package.json`, lockfile, `prisma/schema.prisma`, `server.ts`.
- Não commitar fora do próprio escopo; commits pequenos na própria branch.
- Verificação mínima: `npx tsc --noEmit` (quando o escopo for coberto pelo tsconfig), `npx biome lint <arquivos>`, e teste direcionado quando existir.
- Relatório final por agente: problema, causa-raiz, arquivos, solução, testes executados, riscos.
