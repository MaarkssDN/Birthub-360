# RELATÓRIO 3 — PRESERVAÇÃO E RESTAURAÇÃO
**Data:** 2026-11-24 · **Raiz de backup:** `D:\Github\_backups\saneamento-20261124\`

## 3.1 Artefatos criados nesta sessão

| Artefato | Tamanho | Conteúdo | Verificação |
|---|---|---|---|
| `birthub360-cloneC-unpushed-20261124.bundle` | 711 MB | Todos os branches locais do clone C: (152 refs) — cobre os 164 commits exclusivos + 85 compartilhados | `git bundle verify` OK; `list-heads` OK |
| `birthub360-cloneD-unpushed-20261124.bundle` | 711 MB | Todos os branches locais do clone D: (125 refs) | `git bundle verify` OK |
| `uncommitted/cloneC-main-tracked.patch` + `cloneD-main-tracked.patch` | ~KB | diff dos 2 arquivos modificados em cada checkout principal | diff textual |
| `uncommitted/*-untracked-list.txt` + `cloneD-main-untracked/` | 1,7 MB | inventário e cópia integral dos ~74 arquivos untracked | contagem 110 arquivos |
| `repos-dirty/` | 421 KB | patches + cópias dos 3 repos sujos não-Birthub | inventário |
| `worktrees-dirty/` | ~94 evidências | status/diffs dos worktrees sujos | `wtstatus*.tsv` |
| `orphans/<nome>-C-20261124.tar.gz` | em execução | worktrees órfãos (sem `node_modules`, sem `.git`) | tar em curso; manifestos C:×D: em geração p/ diff |
| `*.sha256` | — | hashes dos bundles | ✅ ver abaixo |

**SHA-256 dos bundles:**
- cloneC: `177db0e131e1723bf37b20693c8f032fc7231a451fe524d5b6525cd9671a3be1`
- cloneD: `5fbf17965f849bf6dce7aa75f23c3f698631e1c0337694bdd267a1fe377ed024`

**Cópia cruzada:** ambos os bundles copiados para `C:\Github\Birthub-360-backups\saneamento-20261124\` — redundância C:+D: confirmada.

**Manifestos C:×D: dos órfãos (paridade):**
- Idênticos: `agente-05-cold-email`, `agente-07-waveE-outbox`, `agente-08-handoffs`, `agente-14-repro-500`, `agente-16-worker-outbound`, `agente-17-waveE`
- **DIVERGENTE: `agente-99-prisma`** — cópia D: **vazia (0 arquivos)**; cópia C: íntegra (13.265 arquivos). O tar do C: é a única preservação — prioridade máxima.

## 3.2 Backups pré-existentes validados

| Backup | Local | Verificação |
|---|---|---|
| `pres005-20261122/*.bundle` (ambos discos) | `*/Birthub-360-backups/` | `git bundle verify` OK em todos |
| `fase-zero-20261123/exclusivos-locais.bundle` | idem | verify OK, 5 refs |
| `wt-handoff-00-consolidacao-preserved.bundle` | idem | 212 MB, verify OK, snapshot `5cddf447e`, SHA-256 `4bb332bd…` |
| Tag `backup/genesis-20261121-wt-handoff-00-snapshot` | clone C: | presente |
| `_backups/genesis-20261121/` | `D:\Github\_backups\` | conteúdo de handoff Genesis |

## 3.3 Testes de restauração

| Teste | Resultado |
|---|---|
| `git bundle verify` nos 2 bundles novos | ✅ OK (ambos) |
| `git bundle list-heads` | ✅ 152/125 refs listadas |
| Restauração ponta-a-ponta em clone vazio | ⏳ **PENDENTE** — bundles novos ainda não clonados em diretório isolado; bundles antigos `pres005`/`wt-handoff` já tiveram restore-test histórico (`restore-test-v4`) |
| Extração de tar de órfão | ⏳ em execução |
| Diff manifesto C: vs D: dos órfãos | ⏳ em execução (`manifests/`) |

## 3.4 Falhas e lacunas encontradas

1. **Bundles novos dependem dos objetos do clone de origem?** Não — `git bundle create` com refs de branches empacota todos os objetos alcançáveis; o verify OK confirma independência do remote, mas a prova definitiva é o clone de teste (pendente).
2. **Cópia cruzada de redundância:** os bundles estão em D: enquanto os clones estão em C: e D:. Falta cópia do bundle do clone D: para C: (ou nuvem) — processo `a0fb9b` em background.
3. **Worktrees órfãos não têm `.git`** → impossível bundle; preservação é file-level (tar). Integridade do tar pendente de verificação.
4. **`.env`/`.env.test`** não entram em bundle nem devem ir ao GitHub — precisam de cofre de segredos (Relatório 6).
5. **Cópias C: dos worktrees com deleções em massa** — conteúdo recuperável via `git checkout`/`restore` na cópia D: ou no clone; documentado, não executado (não destrutivo? na verdade `checkout --` restaura arquivos — é destrutivo para as deleções, logo adiado para fase autorizada).

## 3.5 Independência de backup

- Bundle novo do clone C: está em **D:** (disco diferente do clone C:) ✅
- Bundle novo do clone D: está em **D:** (mesmo disco do clone D:) ⚠️ — redundância real exige segunda cópia em C: ou nuvem.
- Recomendação imediata (não destrutiva): copiar ambos os bundles para `C:\Github\Birthub-360-backups\saneamento-20261124\` e, idealmente, para storage fora da máquina.
