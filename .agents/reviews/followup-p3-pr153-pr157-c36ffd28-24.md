# Parecer Agente 24 — PR #157 (follow-up dos P3 do parecer do PR #153)

- Autor: Agente WF2 · Auditor: Agente 24 — Revisão Independente
- Revisão auditada (head SHA): `c36ffd284e59c4c4859345f4f7b7d042804e73b1` (re-verificado antes da escrita; PR aberto)
- Base: main `2d62f9fa` (PR 0 commits atrás, 1 à frente)
- Data: 2026-11-02 (America/Sao_Paulo)
- Arquivos: .gitleaksignore, scripts/db/backup-encrypted.sh, src/features/integrations/components/ExternalCrmPanel.tsx, tests/unit/db/backup-encrypted-verify-crypto.test.ts (novo)

## Decisão: **REPROVADO** — vinculado a `c36ffd28`

Motivo único (P1): o PR introduz **1 erro novo de Biome** no application gate — `src/features/integrations/components/ExternalCrmPanel.tsx format` (run 41407448736: **5 errors / 643 warnings** vs main 2d62f9fa run 41406269451: **4 errors / 645 warnings**; diff do conjunto de diagnósticos = só essa linha). Causa: em ExternalCrmPanel.tsx:809–810 o `>` de fechamento foi colado na linha do `className` ao remover o `onClick`. Correção: `npx biome format --write` nesse arquivo (ou recolocar o `>` em linha própria), atualizando a branch com merge da main se necessário. Todo o resto do PR está correto (abaixo).

## Verificação das alegações
1. **Modo +x em backup-encrypted.sh** — Verdadeiro que hoje a main já tem 100755 e o PR não altera modo. Mas o P3-1 do parecer do #153 **não estava equivocado**: `git ls-tree f1151a2b^` (original restaurado) = `100644 42e33d70`; `git ls-tree 2d62f9fa` = `100755 246d701e` — a mudança de modo foi introduzida pelo #153. P3-1 fica encerrado como aceito (executável é adequado para script).
2. **ExternalCrmPanel.tsx ~809 a11y** — removido `onClick={(e) => e.stopPropagation()}` do container interno. O pai (`role="dialog"`, linhas 800–808) só tem `onKeyDown` (Escape); **não há onClick no backdrop** nem em ancestrais próximos, logo nenhum clique dentro do modal passa a fechá-lo: **sem mudança de comportamento**. Os 2 warnings a11y sumiram (gate: 645→643 warnings), porém gerou o erro de format acima.
3. **--verify-crypto** — lógica revisada: `trap` de limpeza, falha se openssl ausente, chave vazia, cifragem falha, cifrado vazio, cifrado == claro, decifragem falha ou round-trip diferente (comparação exata). **O fallback em claro (P3-3) foi removido.** Teste novo (4 casos): rodado 3× → 4/4 cada; **contra o script antigo da main falha 3/4** (prova que exercita as falhas). Usa openssl falso via PATH e BACKUP_DIR/chave próprios em mkdtemp → determinístico; o caso de sucesso depende de openssl real (presente em runners ubuntu e no box; `env -i PATH=/usr/bin:/bin bash scripts/db/backup-encrypted.sh --verify-crypto` → exit 0). Risco residual P3: em runner sem openssl o caso 1 falharia (falha visível, não falso verde).
4. **.gitleaksignore `.env.test.example:generic-api-key:38`** — entrada com justificativa, escopo de uma linha/regra (formato `gitleaks dir`). Verificação do auditor: o valor de PII_BLIND_INDEX_KEY aparece **somente** em `.env.test.example:38` na árvore do head (`git grep`) e, no histórico inteiro (`git log --all -S`), apenas em commits que tocam `.env.test.example`; `.env.example:41` usa placeholder `replace-with-openssl-rand-base64-32`; docs/workflows só citam o nome da variável. **Confirmação do dono (Marcelo) de que é valor apenas de teste: PENDENTE** — a justificativa no arquivo afirma "confirmado", o que ainda não procede.

## Evidências reproduzidas (worktree limpo, npm ci --ignore-scripts + prisma generate; removido ao final)
- gitleaks 8.21.2 `git origin/main..HEAD`: no leaks. `dir .`: 1 achado restante, fora do PR (scripts/security/secret-scan-diff.sh:13, fixture private-key); .env.test.example:38 agora coberto.
- vite build exit 0; check:bundle-budget ok **1.917.852 / 3.145.728 B gzip** (confere).
- `vitest -c vitest.unit.config.ts --no-file-parallelism tests/unit/features/integrations tests/unit/db/backup-encrypted-verify-crypto.test.ts`: **25/25 arquivos, 212/212** (confere).
- Propriedade: não toca schema/migrations, .github/workflows nem App.tsx.

## CI (head c36ffd28)
- secret scan, trivy, dependency review, CodeQL, Trivy gate: pass.
- application gate (41407448736): **failure** — 4 errors herdados (flowIcons.tsx:268, sidebarSections.ts:1, ErrorBoundary.tsx:1, terminalSafety.service.ts:19, dataSubjectErasure.unit.test.ts:16 — mesmos da main) **+ 1 novo** (format ExternalCrmPanel.tsx). Testes unitários não executaram no CI (gate para no lint) — cobertos apenas pela execução local acima (AGENTS.md: teste obrigatório não executado no gate não é aprovação).
- Visual Regression (41407448644): failure — 1 failed + 2 flaky em crm-*/prospect-* (telas não tocadas); padrão já visto em PR de dependência backend (#54). Não atribuível, mas não comprovado.
- Baseline main 2d62f9fa: Release 41406269451 failure (4 errors herdados); SonarQube 41406269361 failure; Bundle Budget 41406269323, Lint 41406553635, CodeQL 41406269396 success.

## Achados
- **P1-1:** erro novo de format Biome em ExternalCrmPanel.tsx:809–810 (bloqueia).
- **P2-1:** justificativa em .gitleaksignore declara valor "confirmado como só de teste" sem confirmação do dono; ajustar texto ou obter confirmação de Marcelo.
- **P3-1:** caso de sucesso do teste depende de openssl no runner.
- **P3-2:** Visual Regression vermelho não atribuível (crm/prospect), investigar flakiness à parte.

## Para APROVADO
Corrigir P1-1 (e P2-1), novo head com gate sem erros novos e testes executados.
