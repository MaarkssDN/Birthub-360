# 07 — Riscos Pendentes

## Altos

1. **Recorrência da reversão pré-#485.** Causa raiz não comprovada; duas worktrees no mesmo snapshot sugerem restore em lote defasado. Antes de qualquer nova operação em worktrees antigas, verificar `git status` e amostrar diffs. Worktrees >200 commits atrás são candidatas a contenção.
2. **`handoff-devin-consolidacao` — index contaminado.** Se commitado sem revisão, reverte B-01..B-14. Em quarentena até restauração aprovada.
3. **Branch local órfã `chore/handoff-00-consolidacao-global-20261120` @ `5cddf447e`.** Divergiu do remoto (histórias não relacionadas). Se alguém mergear a local por engano, trará o snapshot pré-#485 inteiro como "novidade". Realinhar ao remoto é prioritário.

## Médios

4. **Duplicação documental.** Raiz tem 24 untracked com nomes sobrepostos aos handoffs commitados; `.agents/runs/consolidacao-20261120/` recebe arquivos de duas branches. Exige dedup manual na Fase 2.
5. **`agente/08-handoffs-20261117` 211 commits atrás.** Merge direto limpo, mas a base velha pode esconder incompatibilidades semânticas (ex.: Schemathesis workflow vs CI atual, testes contra CommandPalette que mudou na main — o próprio histórico da branch mostra um fix desse tipo). Atualizar base antes de mergear.
6. **Sessão paralela ativa.** Evidência: commit de preservação de emergência criado às 21:44 durante esta operação. Coordenação de worktree único por sessão necessária para evitar novas colisões.

## Baixos / informativos

7. 21 worktrees inertes consomem disco e ruído de inventário — prune somente após aprovação e confirmação de redundância (maioria já tem conteúdo no remoto ou é AHEAD=0).
8. `pr471-resolve` e `pr486-resolve` — verificar se PRs #471/#486 já foram mergeados/fechados antes de qualquer ação.
9. Falhas técnicas históricas (41 unit, middleware erros, `/tools`, contrato tenants, crypto-backup, LGPD, Biome `LeadUseCases.ts`, CRM↔Bitrix, `rejectUnauthorized:false`, Docker/Redis/IA) — revalidar na base consolidada; não presumir que persistem.

## Investigação documental — reversão PR #485 (registro para deliberação pré-merge)

**Estado da evidência (consolidado das Fases 0–4):**
- Fato provado: duas worktrees (`handoff-devin-consolidacao`, `wt-handoff-00-consolidacao`) continham árvores revertidas ao snapshot pré-#485 (`23b84f42`), apagando localmente artefatos B-01..B-14.
- Contenção executada: worktree Devin restaurada de `src/tests/docs/prisma` ao próprio HEAD; pareceres Agente 09 restaurados; worktree anômala realinhada a `b0deaf09` (commit órfão `5cddf447e` preservado em tag).
- **Não provado:** a operação causadora. Hipóteses registradas: restore defasado durante incidente do `.git`; sessão paralela com worktree stale; sincronização entre agentes.
- **Não descartado:** recorrência — a causa raiz segue desconhecida e qualquer sessão futura pode repetir o padrão se operar sobre worktrees defasadas.

**Recomendações para deliberação antes do merge:**
1. Tratar o PR de consolidação com verificação explícita de que `src/`/`prisma/` do HEAD proposto são byte-idênticos à main (diff vazio — hoje confirmado).
2. Após merge, re-verificar nas worktrees ativas que nenhuma árvore foi revertida (checksum dos arquivos B-01..B-14).
3. Considerar regra operacional: proibido `git restore`/`checkout` de snapshots antigos sobre `src/ tests/ docs/ prisma/` sem backup — candidata a adição ao AGENTS.md §24 (higiene) mediante decisão humana.
4. O incidente reforça a necessidade do gate `verify:rls-coverage` + diff-scope em todo PR de consolidação.
