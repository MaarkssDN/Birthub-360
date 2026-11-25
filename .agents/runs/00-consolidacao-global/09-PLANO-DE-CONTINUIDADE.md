# 09 — PLANO DE CONTINUIDADE
Data: 2026-11-19 · Ordenado por impacto/urgência/dependências. Nada executa sem aprovação.

## Fase 0 — Destravar decisões (USUÁRIO, ~15 min)
1. **DEC-P01** UX-08: remover abas settings placeholder ou manter preview?
2. **DEC-P02** P0-0004: mobile entra no release?
3. **DEC-P03/P04**: política de consentimento IA + escopo voz/mobile.
4. **DEC-P07**: estratégia de deploy (para BG-REL-001).
5. Autorizar missões UX restantes (BG-UX-001/002/003).

## Fase 1 — Missões UX pequenas e desbloqueadas (paralelas, worktrees)
| Ordem | Missão | Agente | Depende de |
|---|---|---|---|
| 1a | UX-09 perfil editável | 02 | nada (backend pronto) |
| 1b | UX-05a remover auth morta | 01 | 08 p/ testes |
| 1c | UX-05b remover outbound SPA | 05 | 08 p/ 3 testes |
| 1d | UX-08 (após DEC-P01) | 02 | decisão |
Cada uma: gates tsc/lint → run report → 24 → merge.

## Fase 2 — P0 release (crítico)
1. BG-REL-001 deploy+migration → missão 08A/10.
2. BG-REL-002 backup/restore real → missão 10.
3. BG-REL-003 worker consumers → missão 16.

## Fase 3 — Integração de PRs (levas)
1. Leva segurança: #465 → #397 → #401/#396.
2. Leva Wave E idempotencyKey: #447→#450→#451→#452→#453 (sequencial, mesmo DomainEventMesh).
3. Leva domínio: #434 → #437 → #399.
4. Leva UX/a11y: #462/#463 → resolver #368.
5. Leva QA/governança: #400 → #403 → #459 → #466 → #464 → #415.
6. Resolver CONFLICTING: #361/#366/#368/#310 (merge, rebase ou close).
Gate a cada 2–3 merges + parecer 24 por leva.

## Fase 4 — Validação e fechamento
1. Smoke e2e: `/app/roteiros`, `?lead=` inválido, pipelineValue null/0.
2. Baselines visuais (issue #201) + coverage gate (#200).
3. Re-auditoria release readiness → novo veredito.
4. Onda E UX: canonização landing (02D) — requer DEC-P06 + superfície pública.

## Fase 5 — Governança residual
- DEC-P05: dono de `.agents/experience/**`.
- Triagem restante dos 147 handoffs.
- Consolidar ownership manifest (#466).

## Regras permanentes
- Nunca merge sem 24 APROVADO.
- Nunca declarar concluído sem evidência executada.
- Manter esta consolidação atualizada a cada novo relatório/decisão.
