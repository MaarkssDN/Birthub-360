# 08 — MEMÓRIA OPERACIONAL (snapshot autocontido)
**Gerado em 2026-11-20 — pode ser transferido para outra sessão sem perda de contexto essencial.**

## Identidade do projeto
Birthub 360 — CRM/prospecção multi-tenant (React+Vite frontend, backend `src/features/*`, Prisma/Postgres+RLS, Bitrix24, WhatsApp, voz/3CX, IA). Governança multi-agente formal.

## Estado de release
**NO-GO** (auditoria forense 2026-11-18, revisada pelo auditor independente). P0 abertos: deploy sem migrate/healthcheck, escopo mobile (decisão humana), docker-2375 exposto.

## Governança vigente
- `AGENTS.md` em main = **100 agentes / 10 squads** (PR #455). Roster legado 00–24 **substituído**, mas handoffs e PRs em voo ainda usam a numeração antiga — **reconciliação pendente**.
- Auditoria independente: **09 Silas** (antes: 24).
- Branch protection de `main`: required checks `Visual Regression Gate` + `application gate` (alterado via API 2026-11-19, pendente aprovação retroativa).

## O que está mergeado e verificado (não re-fazer)
- SSRF IPv6: parser canônico `src/shared/security/ipv6.ts` + `embeddedIpv4FromIpv6` (#381/#413/#436).
- DSR/LGPD público completo (#381/#385/#428) — migration `20261117231500_data_subject_request_dsr` precisa ser aplicada em staging/prod.
- Outbox idempotencyKey: cadência (#444), CRM/BI (#445), integrations (#448) mergeados; restantes aprovados aguardando CI.
- Deep link pós-login (#426), baselines visuais (#419/#442), hotfix cadence (#416), brand system, governança 100 agentes.

## O que está em voo (não duplicar)
- **PRs abertos ~26, todos BLOCKED por CI**: #386, #415, #430, #434, #437, #441, #447, #450–#453, #459–#466, #347, #353, #366–#368, #396–#403, #423?, #460.
- **36 handoffs** com Status aberto/em-andamento em `.agents/handoffs/`.
- **Decisões de contrato já tomadas**: idempotencyKey `dominio:{entityId}` nunca randomUUID; palette sem open-create no-op; paleta #368 não integra.

## Pendências que exigem o humano
1. Docker 192.168.0.116:2375 sem auth + rotação de segredos devstack.
2. Escopo mobile no release (P0-0004).
3. Decisões de produto: War Room, Win/Loss, demo-data nav, UX-08, consentimento IA, escopo voz/design-lab/outbound.
4. Renovações de 13 exceções + ~30 waivers Trivy até **2026-11-30**.
5. Aprovação retroativa da branch protection alterada via API.
6. Confirmar se roster 100-agentes é definitivo e como re-endereçar handoffs legados.

## Como continuar
1. Mergear PRs aprovados em levas (ordem em `05-MAPA-DEPENDENCIAS.md`) com gate + revisão.
2. Verificar se #435/#440 fecharam DEBT-0002/0003; senão emitir missões P0.
3. Commitar `.agents/runs/00-memoria-operacional-central-20261119.md` (untracked — risco de perda).
4. Triar os 36 handoffs abertos contra o roster novo.
5. Conversão deste pacote em `.agents/runs/` quando autorizado.

## Arquivos-fonte no repositório
- `.agents/runs/audit-2026-11-18/*` — auditoria forense NO-GO
- `.agents/runs/release-readiness-audit-state.json`
- `.agents/reviews/24-revisao-release-readiness-audit-2026-11-18.md`
- `.agents/reviews/waveE-outbox-idempotency-24.md` (parecer lote Wave E)
- `.agents/handoffs/**` — 511 resolvidos / ~36 abertos
- `.agents/experience/**` — governança UX (sem dono §15 declarado)
- `.agents/runs/00-memoria-operacional-central-20261119.md` — **untracked**
