# 10 — PROVENIÊNCIA E EVIDÊNCIAS
Data: 2026-11-19

## Fontes primárias (VERIFICADO — acesso direto nesta sessão)
- `git fetch origin` + `git log origin/main` → tip `5174664b2`; histórico de merges.
- `gh pr list --state open` → 30 PRs abertos (lista capturada nesta sessão).
- `AGENTS.md` vigente (regra always-on carregada nesta sessão).
- `.agents/runs/release-readiness-audit-state.json` → NO-GO, P0/P1, reconciliação 19/11.
- `.agents/runs/00-memoria-operacional-central-20261119.md` → v1 da consolidação.
- `ls .agents/handoffs` = 147; `ls .agents/reviews` = 350.

## Fontes secundárias (RELATADO — artefatos de sessões anteriores)
- `.agents/runs/audit-2026-11-18/*` — auditoria forense NO-GO (base factual da WB-1).
- `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` — achados UX-01…11 re-verificados.
- `.agents/reviews/24-revisao-*.md` — pareceres APROVADO/REPROVADO.
- `.agents/handoffs/onda-WB1/*` — handoffs de correção.
- `.agents/experience/*` — arquitetura/protocolo/roadmap UX.
- Histórico da conversa atual (summary estruturado fornecido pelo sistema).

## Conversas processadas
| ID | Origem | Relatório | Confiança global |
|---|---|---|---|
| C-01 | Esta sessão Devin (missão master US/UX) | completo | ALTA — artefatos commitados + verificáveis |
| C-02+ | Sessões/agentes anteriores | NÃO recebidos | MÉDIA — só artefatos indiretos |

## Nível de confiança por classe de informação
- **VERIFICADO:** estado git/main/PRs, existência de arquivos, pareceres 24 no repo, commits citados.
- **RELATADO:** conteúdo de relatórios de auditoria/reconciliação (não reexecutados), status de PRs (não auditados um a um), contagens de pendências P1.
- **DECLARADO-CHAT:** decisões do usuário nesta conversa (registradas em DEC-*), claims de "concluído" sem artefato.

## Lacunas conhecidas (a recuperar)
1. Relatórios de transferência das outras conversas — solicitados ao Orquestrador.
2. Diff exato de `5d6448811` (o que realmente entrou além do relatado).
3. Estado de merge/CI de cada um dos 30 PRs.
4. Conteúdo dos ~11 pendentes P1 detalhados (estão no relatório-fonte `00-reconciliacao-release-readiness-20261119.md`).
5. Inventário dos 20+ worktrees e branches não publicadas.
6. Significado exato do `stash@{0}` (WIP misto).

## Rastreabilidade
Todo item do backlog (`02-BACKLOG-MESTRE.md`) cita fontes. Decisões em `04-REGISTRO-DECISOES.md` têm ID, fonte, data. Divergências entre relatórios foram preservadas até evidência (ex.: visual.spec.ts skip→ativo; landing canônica).

## Integridade
Nenhum arquivo de código foi modificado. Somente documentação criada em `.agents/runs/00-consolidacao-global/` (propriedade do Agente 00).
