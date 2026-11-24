# RELATÓRIO 1 — INVENTÁRIO FORENSE GLOBAL
**Missão:** Operação de Saneamento Local e Transição para a Nuvem (Agente 00)
**Data da coleta:** 2026-11-24 · **Execução:** sessão Devin Desktop
**Escopo:** `C:\Github`, `D:\Github`, worktrees externos vinculados, bundles e backups.
**Método:** inspeções não destrutivas (`status`, `worktree list`, `for-each-ref`, `rev-list`, `bundle verify`, `fetch` somente-leitura de refs remotas). Nenhuma exclusão, reset, prune ou push executado.

---

## 1. Topologia descoberta (diferença vs. auditorias anteriores)

As auditorias históricas (16 → 35 → 41 worktrees) contavam **um único repositório**. A fotografia atual revela uma topologia bem mais complexa:

| Fato | Detalhe |
|---|---|
| **Dois clones completos** do Birthub-360 | `C:\Github\Birthub-360` (148 branches locais, 110 worktrees registrados) e `D:\Github\Birthub-360` (124 branches, ~94 registros). Mesmo remote `github.com/MaarkssDN/Birthub-360`, mesmo branch atual `chore/handoff-00-despacho-wave-a-b-20261120` @ `a60a76b5e`. |
| **Divergência real entre clones** | 10 branches homônimas apontam para SHAs diferentes (ex.: `agente/*-onda3` = `32d07c375` no clone D vs. SHAs reais de entrega no clone C). |
| **Worktrees físicos duplicados** | As mesmas árvores existem em `C:\Github\Birthub-360-worktrees\*` e `D:\Github\Birthub-360-worktrees\*` (não são junctions — cópias físicas independentes). Os arquivos `.git` de ambas apontam para o admin do **clone C:**. |
| **Cópias C: parcialmente deletadas** | Ao menos 3 worktrees (`agente-01-waveF-ux05a` 753 arquivos, `agente-02-waveF-ux09` 497, `wt-handoff-devin-central` 1218) exibem deleções em massa no clone C:, enquanto as cópias em D: estão limpas. |
| **Ref remoto órfão** | `refs/remotes/local/audit` (`fb95a7008`) existe no clone C: sem remote `local` configurado — mascarava 73 commits na contagem inicial de "publicados". |
| **Worktrees órfãos reais** | ~11 diretórios com checkouts completos (~10–13 mil arquivos cada) cujos admin dirs `.git/worktrees/<nome>` não existem em **nenhum** dos clones. |
| **Worktrees `wt-*` soltos** | `C:\Github\wt-*` e `D:\Github\wt-*` apontam para admin dirs inexistentes (órfãos) ou contêm só `node_modules`/`nul`. |

## 2. Inventário de repositórios (diretórios com `.git`)

### Birthub-360 — clones principais
| Item | Clone C: | Clone D: |
|---|---|---|
| Caminho | `C:\Github\Birthub-360` | `D:\Github\Birthub-360` (cwd) |
| Remote | `origin → github.com/MaarkssDN/Birthub-360` (blob:none) | idem |
| Branch atual | `chore/handoff-00-despacho-wave-a-b-20261120` | idem |
| HEAD | `a60a76b5e` (= origin, 0/0) | `a60a76b5e` (= origin, 0/0) |
| Branches locais | 148 | 124 |
| Worktrees registrados | 110 | ~94 (apontam p/ caminhos físicos em C:) |
| Stashes | 0 | 0 |
| Reflog | 36 entradas HEAD / 1.981 all-refs | verificado |
| Dirty no checkout principal | 76 itens | 78 itens (mesmo conteúdo não commitado, ver §5) |
| Commits não alcançáveis por `origin/*` | **249 SHAs únicos** (83 branches) | **89 SHAs** (57 branches) |

**União de commits não publicados: 253 SHAs** — sendo 164 exclusivos do clone C:, 4 exclusivos do clone D:, 85 presentes nos dois.

### Clone auxiliar
| `D:\Github\birthub-360-repo` | clone separado, branch `agente/00-handoff-reconciliacao-20261120` @ `3c28c80e5f79`, **0 commits não publicados**, working tree limpa. |

### `D:\Github\Birthub-360-audit-main`
Detached HEAD `0d790443d`, marcado `prunable` (gitdir aponta para local inexistente), mas o diretório contém checkout completo. Classe F.

### Demais repositórios em `D:\Github` (todos com remote GitHub, main limpa)
`Agente-de-Codigo-Local`, `BIRTH-VOICES-360`, `Birthub-Growth-Office`, `Birthub-Social`, `CENTRAL-DE-INTELIG-NCIA-COMERCIAL`, `Central-de-Auditoria-e-Handoffs`, `Central-de-Handoff-de-IA`, `DEFININDO-OS-AGENTES`, `DevForge-CLI-Studio`, `HUB-DE-CASA-INTELIGENTE`, `LISTA-DE-PROSPEC-O`, `Land-page`, `PERSONAGENS-AGENTES`, `RETOMADA-GLOBAL-E-AJUSTES-DO-BIRTHUB-360`, `Social-Selling` — **0 commits não publicados em todos**.

### Pares duplicados (mesmo remote, um sujo / um limpo)
| Par | Sujo (classe C) | Limpo |
|---|---|---|
| Central de Handoff de IA | `D:\Github\Central de Handoff de IA` — 22 arquivos modificados (+2.990/−1.363) e 9 untracked (componentes `AiAvatar`, `ConsensusVoteModal`, `debate.ts`, `models.ts`…) | `D:\Github\Central-de-Handoff-de-IA` |
| DEFININDO OS AGENTES | 4 untracked (`auditoria-v2/ENTREGAVEL-*`, `V2.1/`) | `D:\Github\DEFININDO-OS-AGENTES` |
| RETOMADA GLOBAL… | 1 untracked (`deploy/`) | `D:\Github\RETOMADA-GLOBAL-E-AJUSTES-DO-BIRTHUB-360` |

### Diretórios sem `.git` (não são repositórios)
`Birthub-360-backups` (ambos discos — contêm bundles/patches, ver Relatório 3), `Birthub-360-worktrees`, `Birthub-360-wt`, `_backups`, `pr-tools-guard` (contém `repo/` — verificar conteúdo), `Central-de-Auditoria-e-Handoffs-wt` (vazio).

## 3. Worktrees — fotografia atual

- **Registrados no clone C:** 110 entradas (inclui `.claude/worktrees/*` ×5, `dem-20261123-onda1..4`, `dem-20261124-pos4`, `squads/*` ×~20, `handoff-*`, `preserva-*`, `wE-*`, gemini antigravity ×6).
- **Registrados no clone D:** ~94 entradas — a maioria aponta para os **mesmos caminhos físicos em C:** (registros-espelho/stale).
- **Worktrees físicos órfãos** (sem admin dir em nenhum clone): `genesis-brand`, `consolidacao-20261120`, `agente-99-prisma`, `agente-17-waveE`, `agente-16-worker-outbound`, `agente-14-repro-500`, `agente-08-handoffs`, `agente-07-waveE-outbox`, `agente-05-cold-email` (~10–13,6 mil arquivos cada), mais parciais `agente-17-cadence-debts` (51 arquivos, sem `.git`), `agente-04-waveE` (24 arquivos soltos), `dem-20261123-consolidacao/wt-00-candidato`.
- **`C:\Github\wt-*` e `D:\Github\wt-*`:** `wt-447-clean` e `wt-466-clean` são worktrees válidos; `wt-08-dsr`, `wt-15-cve-tools`, `wt-310-extract`, `wt-368-rebase`, `wt-399-fix`, `wt-402-fix`, `wt-cadence-fix` são órfãos com checkouts completos; `wt-395-fix` (só `node_modules`+`nul`) e `wt-466-fix` (vazio) são detritos.
- **Locked:** `dem-20261124-pos4/wt-22-api-idem` e `squads/squad-00/wt-02-harness`.
- **HEADs detached:** `Birthub-360-audit-main` (`0d790443d`, prunable), `wt-466-fix`.
- **Lease ativo encontrado:** `.agents/runs/leases/squad-40-wt46.lease` — status `entregue-para-silas`, worktree `squads/squad-40/wt-46`.

## 4. Estado sujo dos worktrees (varredura completa)

Worktrees com alterações não commitadas (contagens de `status --porcelain`):

| Worktree | Branch | Dirty | Natureza |
|---|---|---|---|
| `C:/Github/wt-handoff-devin-central` | `chore/handoff-devin-central-operacao-20261121` | 1218 | deleções em massa (docs `.agents/audits/**`) — conteúdo existe no Git |
| `agente-01-waveF-ux05a` (C:) | `agente/01-waveF-ux05a-auth-morta` | 753 | deleções — cópia D: íntegra |
| `agente-02-waveF-ux09` (C:) | `agente/02-waveF-ux09-perfil` | 497 | deleções — verificado padrão idêntico |
| `C:/Github/Birthub-360` (principal) | `chore/handoff-00-despacho-…` | 76 | 2 modificados + 74 untracked (handoffs/docs) |
| `D:/Github/Birthub-360` (principal) | idem | 78 | mesmo conteúdo + `auditoria-saneamento-local-20261124/` + `leases/` |
| `handoff-devin-consolidacao` | `chore/handoff-devin-consolidacao-global-20261120` | 7 | a detalhar |
| `squads/squad-50/wt-50-dailyplan`, `squad-40/wt-46`, `dem-onda3/wt-09`, `dem-onda2/wt-00`, `squad-90/wt-96`, `squad-40/wt-42`, `squad-60/wt-60`, `squad-00/wt-04`, `squad-00/wt-02` | várias | 1–5 | provavelmente leases/relatórios de sessão |
| gemini `parallel_task_force_worktrees` | `parallel_task_force_worktrees` | 6 | a detalhar |

Demais ~85 worktrees registrados: **0 alterações**.

## 5. Conteúdo não commitado dos checkouts principais

Ambos os clones principais contêm o **mesmo** conjunto não commitado (verificado por diff de listas e hash spot-check):

- Modificados: `docs/orchestration/demands/INDEX.md`, `docs/orchestration/journal/00.md`.
- Untracked (~74): handoffs `.agents/handoffs/*.md` (continuidade ondas 6, brand system, genesis, antigravity), `release-readiness-audit-2026-11-18/`, `matriz-reconciliacao-etapa-0.md`, `DEM-20261118-001.md`, `visual-regression-report/data/*.md` (dezenas), scripts `.cjs` de checklist.
- Ignorados relevantes: `.env`, `.env.test` (gitignored — classe H), `nul` (artefato Windows), `.claude/worktrees/`.

**Preservação já executada:** patch dos 2 arquivos modificados + cópia integral dos 74 untracked → `D:\Github\_backups\saneamento-20261124\uncommitted\` (110 arquivos, 1,7 MB).

## 6. Reconciliação com auditorias anteriores

| Auditoria anterior | Contagem | Fotografia atual |
|---|---|---|
| Inventário histórico | 16 worktrees | Superado — era um recorte parcial |
| Auditoria 35 worktrees | 35 | Coerente com `git worktree list` pós-remoção de `wt-handoff-00-consolidacao` (handoff Genesis 2026-11-21) |
| Inventário 41 worktrees | 41 | Incluía provavelmente registros hoje podados/órfãos |
| PRES-005 / backups | bundles validados | Todos os bundles `pres005-20261122` e `fase-zero-20261123` passam em `git bundle verify` |
| Worktree órfã `wt-handoff-00-consolidacao` | removida 2026-11-21 | Confirmado: bundle 212 MB OK, tag `backup/genesis-20261121-wt-handoff-00-snapshot` presente |
| Central de Comando (18 itens não commitados, handoff devin 2026-11-20) | risco | **Resolvido:** `Central-de-Auditoria-e-Handoffs` está limpa (0 dirty) e 0 commits não publicados — os artefatos foram commitados e mergeados (PRs #9–#12) |

**Conclusão da reconciliação:** as ondas 1–4 + PRES-005 + Genesis cobriram a maior parte do passivo, mas **não** eliminaram: (a) 253 commits exclusivos dos dois clones, (b) ~11 worktrees órfãos com checkouts íntegros, (c) trabalho não commitado da Central de Handoff de IA e dos checkouts principais, (d) a divergência entre os clones C: e D:.

## 7. Arquivos de evidência brutos

Todos em `.agents/runs/auditoria-saneamento-local-20261124/`:
`wtlist_*`, `wtpaths_*`, `wtstatus_*.tsv`, `dphys_status.tsv`, `branches_*.txt`, `unpushed_origin_*.tsv`, `orphans.tsv`, `manifests/`, `status_*`, `stash_*` (vazios), `remotes_*`, `remoterefs_*`.
