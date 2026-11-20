# 09 — PLANO DE CONTINUIDADE
**Sequência priorizada por impacto → urgência → dependências.**

## Fase 0 — Preservação e decisões (hoje)

1. **Commitar** `.agents/runs/00-memoria-operacional-central-20261119.md` + este pacote (quando autorizado) — elimina R-02.
2. **Orquestrador Humano decide** (desbloqueiam tudo):
   - Docker 2375 + rotação de segredos (ação no host).
   - Escopo mobile no release.
   - Governança: roster 100-agentes definitivo? Re-endereçamento de handoffs?
   - Paleta #368: remediar ou abandonar.
   - Produto: War Room, Win/Loss, demo-data, UX-08, consentimento IA.
   - Aprovação retroativa da branch protection (D-04).

## Fase 1 — Integrar o que já está aprovado (esta semana)

3. Mergear em levas, gate a cada leva, revisão do auditor independente por PR de código:
   - #465 (advisory) → #397/#401 (AUD-1) → #447/#450–#453 (Wave E restante) → #441 → #386 → #415 → #434 → #437 → #430 → #459–#466.
4. Fechar #458-equivalente: confirmar que #454 cobre o fix de formato (provável — mesmo escopo).
5. Após merges: handoff `16→00 outbox` → `resolvido`; triagem dos 36 handoffs abertos.

## Fase 2 — Fechar P0 de release

6. Validar #435 (backup) e #440 (workers) contra DEBT-0002/0003 em staging; emitir missões para o que faltar.
7. Missão dedicada: deploy com `migrate deploy` + healthcheck (DEBT-0001).
8. Aplicar migration DSR em staging/prod (ops).
9. Renovar 13 exceções + ~30 waivers Trivy (prazo 30/11).
10. Resolver PRs stale (#361/#366/#368/#310/#372/#378) — reconciliar ou fechar.

## Fase 3 — Próxima onda de engenharia

11. `piiDetection.service.ts` anti-encoding (G-13).
12. Scanner real `ContinuousSecurityAuditService` (G-12) — 10+15.
13. Gate ownership prosa (G-18).
14. UX pequeno: UX-05a (matar auth morta), UX-05b (outbound SPA), UX-09 (perfil editável).
15. E2E orquestração sem demo (G-17).

## Fase 4 — Release gate

16. GO-LIVE checklist completo (itens do parecer 24: PRs resolvidos, exceções renovadas, decisão por módulo gated).
17. Gate de release → `RELEASE_APPROVED` ou `RELEASE_BLOCKED` documentado.

## Regras operacionais contínuas

- Nunca mergear código sem revisão independente (Silas/24) + checks verdes.
- Worktree isolado por agente; `server.ts`/`package.json`/lockfile só com aprovação do coordenador.
- Handoffs: append-only, status só com evidência.
- Consolidação incremental: incorporar novos relatórios sem perder os anteriores.
