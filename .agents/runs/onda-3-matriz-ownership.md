# ONDA 3 — Matriz de Ownership e Despacho (Agente 00 / Astra)

Data: 2026-11-24
Baseline: `integracao/onda-2-dem20261123` @ `32d07c3750c370b63da8b720019413c9a40e0e68`
Branch de integração: `integracao/onda-3-dem20261123`
Worktrees root: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\`

## Estado da Onda 2 (verificado)

- 7 entregas mergeadas em `integracao/onda-2-dem20261123` (Agentes 02, 04, 08, 90, 93, 94, 99→ver nota) + pareceres finais do Agente 09 (Silas) em `f842a5ebf`.
- HEAD da Onda 2 = `32d07c375`. Nenhuma branch `agente/*-onda2-*` possui commits à frente da integração.
- Onda 3 nasce de `32d07c375`. Candidate final anterior `815a09305` (Onda 1) está contido na baseline.

## Slots globais

| Slot | Agente | Missão | Branch | Worktree | Ownership |
|------|--------|--------|--------|----------|-----------|
| 1 | 20 — Ciro | ONDA3-20-CORE-BACKEND | `agente/20-core-backend-onda3` | `wt-20-core-backend` | `src/api/index.ts`, `src/api/router.ts` |
| 2 | 21 — Zara | ONDA3-21-API-CONTRACTS | `agente/21-api-contracts-onda3` | `wt-21-api-contracts` | `src/api/schemas/**`, `openapi.yaml` |
| 3 | 34 — Ari | ONDA3-34-ACCESSIBILITY | `agente/34-accessibility-onda3` | `wt-34-accessibility` | `src/components/a11y/**` |
| 4 | 42 — Lívia | ONDA3-42-CRM-KANBAN | `agente/42-crm-kanban-onda3` | `wt-42-crm-kanban` | `src/features/crm/deals/**`, `src/features/crm/pipelines/**` |
| 5 | 45 — Otto | ONDA3-45-CRM-AGENDA | `agente/45-crm-agenda-onda3` | `wt-45-crm-agenda` | `src/features/crm/tasks/**` |
| 6 | 65 — Lena | ONDA3-65-VOICE-HUB | `agente/65-voice-hub-onda3` | `wt-65-voice-hub` | `src/features/voice-hub/**` |
| 7 | 96 — Nera | ONDA3-96-AUTH | `agente/96-auth-onda3` | `wt-96-auth` | `src/lib/auth/**` (exceto RBAC do Agente 97) |
| 8 | 09 — Silas | ONDA3-09-AUDIT | `agente/09-audit-onda3` | `wt-09-audit-onda3` | `.agents/reviews/**` |

Coordenador: Agente 00 (Devin) — worktree `wt-00-integracao`, branch `integracao/onda-3-dem20261123`.

## Regras operacionais

- Máximo 8 especialistas simultâneos. Auditor (09) é permanente enquanto houver entregas pendentes.
- Nenhum agente edita arquivo fora do ownership; problemas fora do escopo viram handoff em `.agents/handoffs/onda-3/`.
- Commits locais pequenos; sem push, sem PR, sem merge em main.
- Testes: direcionados por domínio; suites pesadas em fila coordenada pelo 00.
- Integração em lotes de 2–3 entregas aprovadas pelo Silas.
- `wt-65-voice-hub` foi reparado em 2026-11-24 (worktree add interrompido; index.lock stale removido, `git reset --hard` na baseline sem perda de trabalho).

## Handoffs conhecidos a reconciliar

- Falhas de domínio `isAuditableModel` / `deleteReason` → Agente 20 investiga e gera handoffs (provável destino: schema Prisma → Agente 11, ou domínio dono).
- Interação 42↔44 (cadências) e 45→44: handoffs formais.
- 96 não toca RBAC (Agente 97).
