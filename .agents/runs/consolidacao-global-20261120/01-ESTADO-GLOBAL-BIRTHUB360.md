# 01 — ESTADO GLOBAL BIRTHUB 360
Data da verificação: 2026-11-20 · Base: origin/main + gh pr list (28 PRs abertos)

## Diagnóstico executivo
O projeto viveu em 18–20/11 uma **compressão de saneamento pós-audit forense**: o release-readiness audit de 18/11 emitiu NO-GO (4 P0 + 22 P1), e múltiplas conversas/agentes executaram correções em paralelo. Em ~36h: ~50 PRs mergeados, arquitetura de governança substituída (00–24 → 100 agentes em squads), e a fila de débitos foi substancialmente atacada — mas o veredito formal ainda não foi re-emitido.

## Marcos verificados
| Marco | Evidência |
|---|---|
| Login retorna à rota original protegida (path+query, anti open-redirect) | PR #412 mergeado `626cb6f0c` |
| batchUpdateLeads atômico (escrita única/item) | PR #390 mergeado `e0446cef0` + #395 |
| Cadence `assignedToId`→`owner` | PR #416 (main) — #418 fechado superseded |
| Sonar floating promise DsrStatusPage | PR #422 mergeado `30cdbdc28` |
| Baseline visual regenerada | PR #419; handoff fechado (run 44573014428) |
| DEBT-0001 deploy migrate+healthcheck | PR #427 mergeado (2b748ad4a) |
| DEBT-0002 backup/restore/DR real | PR #435 mergeado (b3f5709ee) |
| DEBT-0003 worker outbound consumers | PR #440 mergeado (2d595db6) |
| DEBT-0008/0009/0010 cadência | PR #439 mergeado (18d7103bc) |
| DEBT-0015/0014 IA + auditoria 0012 | PR #431 mergeado (c97d89a47) |
| DEBT-0020 import Bitrix atômico | PR #432 + format #454 mergeados |
| DEBT-0026 sonar coverage gate | PR #430 mergeado (345152168) |
| format:check main (2 episódios) | #424 e #454 mergeados |
| Arquitetura 100 agentes | PRs #455/#456 mergeados — AGENTS.md reescrito |
| Prisma advisory GHSA-7589-6FVF-X4PW | PR #465 mergeado (admin, checks falhavam por dependência circular c/ #466) |

## Em aberto (verificado 20/11)
- **PRs de débito pendentes:** #434 (CRM 0017/18/19), #437 (cold email 0011) — falhavam por audit-waivers (resolvido via #465) e ownership test (aguarda #466); checks precisam re-run.
- **~28 PRs abertos** no total (lista em 10-PROVENIENCIA): Wave E idempotency (~8), Onda 1 a11y (~5), AUD-1 segurança (~4), antigos/stale (~10).
- **46 worktrees** ativos em `C:\Github\Birthub-360-worktrees\`, `C:\Github\Birthub-360-wt\`, `wt-*`, `.gemini\antigravity\worktrees\`.

## Governança vigente
`AGENTS.md` = Arquitetura 100 Agentes (10 squads, IDs 00–99 com nomes). Auditoria independente = Agente 09 (Silas). Prompts legados em `.agents/prompts/legacy_v1/`. **Mapeamento de IDs antigos pendente de aprovação** (ver 03 e proposta `.agents/runs/00-proposta-mapa-agentes-20261120.md` quando emitida).

## Veredito de release
**NO-GO formalmente mantido** (state file de 19/11), porém **desatualizado**: 7 PRs de débito mergearam depois da reconciliação. Re-reconciliação em execução (subagente) — novo veredito pendente.
