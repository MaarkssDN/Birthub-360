# 10 — PROVENIÊNCIA E EVIDÊNCIAS
Data: 2026-11-20

## Fontes primárias verificadas nesta consolidação
| Fonte | Método | Confiança |
|---|---|---|
| `gh pr list/view/checks` (MaarkssDN/Birthub-360) | API GitHub | ALTA |
| `git log origin/main`, `git worktree list`, `git status` | git local | ALTA |
| `AGENTS.md` (worktree agente-03-ownership, versão nova) | leitura | ALTA |
| `.agents/runs/release-readiness-audit-state.json` | leitura | ALTA (mas desatualizado — ver G-38) |
| `.agents/runs/00-reconciliacao-release-readiness-20261119.md` | leitura | ALTA |
| 9 pareceres `.agents/reviews/debt00*-24.md` | commit `730fa7b63`, mergeado #446 | ALTA |
| Relatórios de 8 subagentes + 3 revisões (esta sessão) | notificações | ALTA |
| `gh run view --log-failed` (jobs 136052115293, 136051170546, etc.) | logs CI | ALTA |

## PRs verificados (estado em 20/11)
**Mergeados (débitos):** #424, #425, #427, #430, #431, #432, #435, #439, #440, #454, #465 (+ contexto: #412, #390, #395, #416, #419, #422, #433, #436, #438, #442–#449, #455, #456)
**Abertos críticos:** #466 (ownership), #434, #437, #401, #396, #397, #415, #399, #386, #403, #459, #460, #462, #463, #464, #447, #450, #451, #452, #453, #368, #367, #366, #353, #347, #402
**Fechados sem merge:** #418 (superseded #416), #457 (superseded #454)

## Divergências registradas
1. Prosa anterior dizia "#434/#390 mergeados" em massa — verificado: #390 sim; #434/#437 seguem ABERTOS (checks falhando até #465/#466).
2. state JSON dizia main local ahead 8/behind — superado: audit-main worktree agora em `5174664b2`, main local da sessão em `agente/00-integracao-skills`.
3. AGENTS.md mudou de regime durante a saga — documentos que citam "agente 24" referem-se ao LEGADO; vigente é 09 Silas.

## Lacunas de evidência
- Conteúdo exato das waves D/E, Onda 1, AUD-1: inferido de títulos de PR — relatórios forenses não recebidos (ver 07-C2).
- Histórico pré-18/11 (.agents/runs 236 arquivos): não varrido.
- Estado de checks em tempo real muda — este documento é snapshot de 20/11 ~manhã.

## Trabalho em produção nesta consolidação
- Subagente re-reconciliação release-readiness → `.agents/runs/00-reconciliacao-release-readiness-20261120.md` + state JSON (a anexar como adendo quando concluir).
- Subagente mapa equivalência agentes → `.agents/runs/00-proposta-mapa-agentes-20261120.md` (a anexar).
- Push de retrigger CI no #466: commit vazio `87b03a5ff` na branch `agente/03-fix-ownership-coverage`.
