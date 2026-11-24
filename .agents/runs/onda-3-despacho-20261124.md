# ONDA 3 — Registro de Despacho (Agente 00 / Astra)

Data: 2026-11-24
Demanda: DEM-20261123-001
Baseline: `integracao/onda-2-dem20261123` @ `32d07c375`
Branch de integração: `integracao/onda-3-dem20261123`
Matriz de ownership: `.agents/runs/onda-3-matriz-ownership.md` (commit d5192c47a)

## Estado verificado antes do despacho

- Onda 1: 8/8 entregas mergeadas e aprovadas (Agente 09, 10/10 pareceres) em `integracao/onda-1-dem20261123` @ `815a09305` + parecer de integração `ef34d779f`.
- Onda 2: 7 entregas mergeadas + 7 pareceres finais do Agente 09 em `integracao/onda-2-dem20261123` @ `32d07c375`.
- Onda 3: 8 worktrees criados, branches na baseline, sem commits de executor. wt-65-voice-hub estava com checkout corrompido (deleções em massa, registro stale no clone D:); reparado via `git reset --hard` na baseline e junction de node_modules recriada. Nenhum trabalho perdido (branch sem commits próprios).
- Dois clones ativos: D:\Github\Birthub-360 (checkout principal, branch chore/handoff-00-despacho-wave-a-b-20261120, sujo com handoffs untracked) e C:\Github\Birthub-360 (administra os worktrees dem-20261123-*). Coordenador passou a operar a partir do clone C:.

## Slots despachados (subagentes Devin, background)

| Slot | Agente | Missão | Worktree | Branch | agent_id |
|------|--------|--------|----------|--------|----------|
| 1 | 20 — Ciro | ONDA3-20-CORE-BACKEND | wt-20-core-backend | agente/20-core-backend-onda3 | c474e760 |
| 2 | 21 — Zara | ONDA3-21-API-CONTRACTS | wt-21-api-contracts | agente/21-api-contracts-onda3 | 2aede78e |
| 3 | 34 — Ari | ONDA3-34-ACCESSIBILITY | wt-34-accessibility | agente/34-accessibility-onda3 | 5db9476d |
| 4 | 42 — Lívia | ONDA3-42-CRM-KANBAN | wt-42-crm-kanban | agente/42-crm-kanban-onda3 | 1d03bbc8 |
| 5 | 45 — Otto | ONDA3-45-CRM-AGENDA | wt-45-crm-agenda | agente/45-crm-agenda-onda3 | a0fa6678 |
| 6 | 65 — Lena | ONDA3-65-VOICE-HUB | wt-65-voice-hub | agente/65-voice-hub-onda3 | 65d2e81f |
| 7 | 96 — Nera | ONDA3-96-AUTH | wt-96-auth | agente/96-auth-onda3 | 97b85714 |
| 8 | 09 — Silas | ONDA3-09-AUDIT (baseline Onda 2) | wt-09-audit-onda3 | agente/09-audit-onda3 | a1e19e5c |

## Regras em vigor

- Máximo 8 especialistas; 09 é permanente enquanto houver entregas pendentes.
- Ownership exclusivo por slot; conflitos → handoff em `.agents/handoffs/onda-3/`.
- Sem push, sem PR, sem merge em main, sem migrações, sem deploy.
- Testes direcionados; suítes pesadas em fila coordenada pelo 00.
- Integração em lotes de 2–3 entregas, somente após parecer APROVADO do Agente 09.
- Plataforma permanece NO-GO até gates e autorização humana de release.
