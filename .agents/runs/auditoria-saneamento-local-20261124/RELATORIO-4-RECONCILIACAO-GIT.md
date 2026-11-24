# RELATÓRIO 4 — RECONCILIAÇÃO GIT
**Data:** 2026-11-24

## 4.1 Os dois clones: divergência confirmada

| Branch exemplo | Clone C: | Clone D: | Remote `origin/*` |
|---|---|---|---|
| `integracao/onda-3-dem20261123` | `c69447eb6` | `32d07c375` | — |
| `integracao/onda-4-dem20261123` | (SHA onda real) | `32d07c375` | — |

10 branches homônimas com SHAs divergentes. O clone D: está "congelado" em `32d07c375` — SHA que existe no remote apenas como ref órfão `refs/remotes/local/audit` (`fb95a7008`, sem remote `local` configurado). **Interpretação:** o clone D: é uma cópia/espelho mais antigo; o clone C: contém o trabalho real posterior das ondas. Nenhum clone é "descartável" — ambos têm commits exclusivos (C: 164, D: 4).

## 4.2 Trabalho duplicado / integrado

| Trabalho | Status |
|---|---|
| Squads/ondas 1–4 (`dem-20261123-onda1..4`, `squads/squad-*`) | branches registradas; commits não publicados contidos nos bundles; PRs de preservação #531–#539 abertos |
| Handoffs históricos (Devin/Genesis, Agente 11, design system) | PR #532/#535 abertos; cópias em `uncommitted/` |
| Design System (`agente/03-telas-brand-system`) | 2 commits não publicados → bundle |
| `integracao/consolidacao-dem20261123-candidato` | **210 commits à frente** do upstream — branch candidata mais pesada, prioridade máxima de publicação |
| `agente/09-audit-onda3` | 71 commits não publicados |
| `consolidacao_backlog_birthub360` | 1 commit |
| Ref `local/audit` (67 commits) | absorvido pelas branches locais; não é remote real |

## 4.3 Duplicação física C: × D:

- As árvores `Birthub-360-worktrees` em C: e D: são **cópias físicas independentes** (não junctions), ambas com `.git` apontando para o admin do clone C:.
- C: cópias de `agente-01-waveF-ux05a`, `agente-02-waveF-ux09`, `wt-handoff-devin-central` têm deleções em massa; D: cópias intactas → **D: é a fonte autoritativa de conteúdo para esses três**.
- Manifestos C:/D: dos órfãos em geração para confirmar paridade dos demais.

## 4.4 Pendências de reconciliação (exigem decisão)

1. **Qual clone vira a fonte da verdade?** Recomendação: clone C: (mais commits, trabalho real das ondas). Clone D: contribui 4 commits exclusivos → merge/cherry-pick antes de aposentar.
2. **Branches homônimas divergentes** (10): escolher SHA vencedor por branch; registrar no plano de publicação.
3. **`integracao/consolidacao-dem20261123-candidato` (+210)**: verificar se já é ancestral de outra branch candidata ou se é linha única de consolidação.
4. **PRs #531–#539 abertos**: são de preservação documental; decidir merge/fechamento.
5. **`local/audit`**: confirmar com o humano se o remote `local` foi descontinuado intencionalmente.
6. **Stashes:** 0 nos dois clones — nada a reconciliar.
7. **Reflogs:** 36 entradas HEAD / 1.981 all-refs no clone C: — commits reflog-only (não alcançáveis por nenhuma ref) podem existir; recomenda-se `git fsck --unreachable` na fase de saneamento (não executado — custo/risco).
