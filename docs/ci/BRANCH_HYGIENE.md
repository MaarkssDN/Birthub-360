# Higiene de Branches Remotas (TAREFA-SANEAMENTO-025 / BT360-DT-0048)

## Problema

O repositório acumulou centenas de branches remotas (`git branch -r` já passou de
400), degradando rastreabilidade e aumentando o risco de agentes usarem branches
desatualizadas como base. Causa raiz: ausência de exclusão automática pós-merge e
de governança periódica de expurgo.

## O que existe agora

- `scripts/git/branch-hygiene.mjs` — auditor/limpeza governada (Node, sem deps).
- `.github/workflows/branch-hygiene.yml` — agenda semanal (audit somente leitura)
  + `workflow_dispatch` com modos `audit` e `clean`.

## Critérios de classificação

| Situação | Decisão | Delete automático? |
|---|---|---|
| `main`, `master`, `develop`, `HEAD` | keep (protegida) | nunca |
| Qualquer branch com PR aberto | keep | nunca |
| `agente/*` com < 90 dias | keep (graça do enxame) | nunca |
| Mergeada em `main`/`master`, inativa > 30d | candidate | sim (modo clean) |
| `archive/*` com > 180d | candidate | só com `include_archives` |
| Não mergeada (qualquer prefixo) | review | nunca — exige humano |

O modo `clean` **aborta (fail-closed)** se `gh` não conseguir listar os PRs
abertos — sem essa lista, deletar é inseguro.

## Como usar

### Auditoria local (somente leitura)

```bash
git fetch origin
gh auth status   # necessário para a checagem de PRs abertos
node scripts/git/branch-hygiene.mjs audit \
  --json-out branch-hygiene-report.json \
  --summary-out branch-hygiene-summary.md
```

### Limpeza local (manual, destrutiva)

```bash
node scripts/git/branch-hygiene.mjs clean \
  --confirm DELETE-MERGED-BRANCHES \
  [--include-archives] \
  --json-out branch-hygiene-report.json
```

### No GitHub Actions

- **Automático**: toda segunda 06:17 UTC roda `audit` e publica o relatório no
  Step Summary + artefato `branch-hygiene-report`.
- **Manual**: Actions → "Git Branch Hygiene" → Run workflow → `mode=clean`,
  `confirm=DELETE-MERGED-BRANCHES`. `include_archives=true` inclui `archive/*`
  expiradas.

## Ação humana pendente (não coberta por workflow)

1. **Habilitar "Automatically delete head branches"** em
   *Settings → General → Pull Requests* do repositório. Isso elimina a maior
   fonte de proliferação (branches de PRs mergeados) na origem e é a correção
   definitiva da causa raiz. Requer admin do repositório.
2. **Revisar o relatório de `review`** (branches não mergeadas inativas): decidir
   caso a caso se há trabalho a resgatar antes de qualquer expurgo manual.
3. **`archive/*`**: são snapshots intencionais; a deleção com
   `include_archives` deve ser precedida de revisão do relatório, pois o ref pode
   ser o único ponteiro para commits não mergeados.

## Limitações conhecidas

- O merge-check usa `git merge-base --is-ancestor` contra `origin/main` (ou
  `origin/master` se `main` não existir). Branch mergeada via squash/rebase
  aparece como "não mergeada" → vai para `review`, nunca para delete automático
  (comportamento conservador intencional).
- `gh pr list --limit 1000` cobre o volume atual; se PRs abertos excederem 1000,
  ampliar o limite no script.
