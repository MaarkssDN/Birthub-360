# 03 — Backups e Integridade

**Local:** `C:\Github\_backups\genesis-20261121\`
**Data:** 2026-11-21 · **Executor:** Devin AI

## Inventário de backups

### `handoff-devin-consolidacao/` (worktree contaminada — quarentena)

| Arquivo | Conteúdo | Tamanho |
|---|---|---|
| `00-snapshot.txt` | HEAD, branch, `git status` completo, estatísticas | 71 linhas |
| `01-status-porcelain.txt` | As 55 entradas staged | 55 linhas |
| `02-diff-cached.patch` | `git diff --cached --binary` (index vs HEAD) | 4.525 linhas |
| `03-diff-unstaged.patch` | `git diff --binary` — **vazio** (confirma worktree ≡ index) | 0 |
| `04-diff-HEAD.patch` | `git diff HEAD --binary` — idêntico ao cached | 4.525 linhas |
| `05-index-lsfiles.txt` | `git ls-files -s` — índice completo (13.291 entradas) | 13.291 linhas |
| `06-agents-staged.patch` | Diff staged restrito a `.agents/` | 405 linhas |
| `agents-files/` | Cópia dos 7 arquivos `.agents/` staged no disco + versões HEAD dos 2 pareceres deletados | 9 arquivos |

**Cobertura:** o estado staged é 100% reproduzível aplicando `02-diff-cached.patch` sobre `HEAD=86288f30b`. O estado do worktree é idêntico ao index (sem unstaged, sem untracked). Não há conteúdo fora do patch.

### `wt-handoff-00-consolidacao/`

Backup de arquivos **não necessário** — prova de redundância: `git diff b0deaf097 5cddf447e` = 0 arquivos; todo o conteúdo já existe no remoto (`origin/chore/handoff-00-consolidacao-global-20261120 @ b0deaf09`) e no object store local. O commit órfão `5cddf447e` permanece no repositório.

## Verificação de integridade

- Manifesto: `C:\Github\_backups\genesis-20261121\SHA256SUMS-handoff-devin.txt` — 16 arquivos hasheados.
- `sha256sum -c` executado em 21/11/2026: **16/16 OK** (0 falhas).
- Hashes dos patches: `02` = `04` = `b978b4a4…` (confirma cached ≡ HEAD diff).

## Execução (aprovada pelo Orquestrador em 21/11/2026)

1. ✅ Integridade re-verificada: `sha256sum -c` → **16/16 OK**; `git status` idêntico à fotografia; HEAD inalterado `86288f30b`.
2. ✅ Restauração executada: `git restore --source=HEAD --staged --worktree -- src tests docs prisma` + restauração dos 2 pareceres (`09-auditoria-onda3-pii-encoding-outbox.md`, `09-parecer-onda-01-bloqueadores-criticos.md`).
3. ✅ Resultado: restam staged apenas os 7 arquivos `.agents/` legítimos (+102/−70); diff final salvo em `07-agents-legit-final.patch`. Código B-01..B-14 restaurado e verificado em disco.
4. ⏳ Realinhamento da branch órfã: **executado** — branch em `b0deaf09` (tracking origin), worktree limpa; `5cddf447e` preservado na tag `backup/genesis-20261121-wt-handoff-00-snapshot`.
5. ⏳ Docs legítimos → branch nova baseada em `main`: pendente (Onda II da integração).
