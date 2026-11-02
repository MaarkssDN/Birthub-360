# Parecer 24 — PR #154 (Agente WF3) — head `e3693ebcb919bd97898d4a963aefee7b4d294e12`

**Veredito: BLOQUEADO** (vinculado exclusivamente ao SHA `e3693ebc`). Revisão em 2026-11-02 ~04:40 (UTC-3).

## Head re-verificado
O pedido citava `1304b488`, mas o head mudou durante a revisão:
- `07269e57` — merge de `origin/main` (2d62f9fa, #153) no branch (sem force-push; conforme regra do 00).
- `e3693ebc` — `fix(ai-gateway): ordenação determinística no semanticCache (Sonar S2871)`.

**O PR deixou de ser test-only.** Diff efetivo vs main (`git diff origin/main...e3693ebc`): 3 arquivos, +24/−2:
- `tests/unit/features/intelligence/commercial-v3/commercialV3.routes.test.ts` (+6/−1)
- `src/lib/ai/gateway/semanticCache.ts:89` (+1/−1) — código de produção
- `tests/unit/ai/gateway/semanticCache.test.ts` (+17)

Propriedade: sem schema/migrations, workflows, `App.tsx` ou configuração. OK.

## Mérito
1. **400 para `?agentId` desconhecido — correto.**
   - Rota: `src/features/intelligence/commercial-v3/routes/commercialV3.routes.ts:25-27` (`listSkillsQuerySchema` = `z.enum(COMMERCIAL_V3_AGENT_IDS).optional()`) aplicado em `:115-116` via `validateRequest({ query })`.
   - OpenAPI: `docs/openapi.yaml:485-489` (query `agentId` com `enum`) e `:524` (`'400': BadRequest`).
   - Contrato: `src/features/intelligence/commercial-v3/__tests__/commercialV3.contracts.test.ts:170-178` (400, `success:false`, `VALIDATION_ERROR`).
   - Prova de regressão: com o arquivo de teste da main, `commercialV3.routes.test.ts` falha localmente (`expected 400 to be 200`, 1 failed | 3 passed); com o PR passa.
2. **`total` 463 — estável, não frágil.** Fixture versionada `src/features/intelligence/commercial-v3/assets/03_CATALOGO/INDICE_GERAL_463.json` tem `skills` = 463 (19 agentes); o mesmo valor já é asserido em `commercialV3.contracts.test.ts:147-156`. Só muda se o catálogo mudar, o que deve quebrar o teste mesmo.
3. **semanticCache.ts:89** — comparator explícito por code unit UTF-16 é semanticamente idêntico ao `sort()` padrão para strings: sem mudança de comportamento, apenas satisfaz S2871. Teste novo cobre ordem independente de inserção. P3: o teste foi inserido entre o comentário `// CRITÉRIO DE SUCESSO 4: TTL dinâmico` e o teste de TTL (`semanticCache.test.ts:197-198`), deixando o comentário deslocado — não bloqueante.

## Execução local (clone limpo `/workspace/rv154`, head `e3693ebc`)
- `vitest run -c vitest.unit.config.ts tests/unit/features/intelligence/commercial-v3 src/features/intelligence/commercial-v3`: **7 arquivos, 62/62 passaram** (também 62/62 em `1304b488`).
- `tests/unit/ai/gateway/semanticCache.test.ts`: **9/9 passaram**.
- Limitação: `pnpm install --frozen-lockfile` falha na main (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`, overrides vs lockfile — achado herdado) e `npm ci` falhou por falta de inodes no box; usei `node_modules` de outra worktree com a mesma árvore de dependências.

## CI no head `e3693ebc` vs baseline main `2d62f9fa`
| Workflow | PR (`e3693ebc`) | main (`2d62f9fa`) |
|---|---|---|
| Central Birth Hub 360 Release | **failure** — run 41406771876 | failure — run 41406269451 |
| Frontend Bundle Budget | success — 41406771872 | success — 41406269323 |
| CodeQL / Trivy / Dependency Review | success — 41406771915 / 41406771927 / 41406771945 | — |
| SonarQube Analysis | em andamento — 41406771892 | em andamento — 41406269361 |
| Visual Regression | em andamento — 41406771987 | — |

Application gate (ambos): falha no passo "Run Prettier check" (`biome format`): **4 erros idênticos** em PR e main — `AIPendingActionsInbox.tsx`, `aiPendingAction.service.ts`, `agentCapabilities.normalized.json`, `semanticCache.ts`. Lint: 645 warnings (inclui os 8 diagnósticos já conhecidos: ErrorBoundary.tsx, sidebarSections.ts, terminalSafety.service.ts, dataSubjectErasure.unit.test.ts etc.), mesmo quadro da main. **Nenhuma falha nova introduzida pelo PR** — `semanticCache.ts` já falhava formatação na main (verificado localmente: mesma saída antes/depois da linha 89).

Consequência: Type Check, Architecture, OpenAPI drift, **Unit Tests**, Integration, Build e E2E foram **skipped** no head. Run anterior em `1304b488` (41406459326) também falhou no gate e o Sonar (41406459128) foi cancelado.

## Justificativa do BLOQUEADO
Mérito sem P1/P2. Porém, pelo AGENTS.md §28 e "Nunca declarar um teste como aprovado se ele não foi executado", os testes unitários obrigatórios não rodaram em CI neste SHA, e o objetivo declarado do PR (Sonar S2871) não tem resultado do Sonar ainda.

## O que desbloqueia
1. Main verde no application gate (WF1: formatação dos 4 arquivos acima, incluindo `semanticCache.ts`).
2. Merge da main no branch do #154 (sem rebase/force-push) e novo run com Unit Tests executados e verdes.
3. SonarQube Analysis concluído com gate verde (ou S2871 resolvido) no novo SHA.
4. Atualizar a descrição do PR: não é mais test-only (inclui `semanticCache.ts`).
Novo parecer será emitido para o novo SHA.
