# 01 — ESTADO GLOBAL DO BIRTHUB 360
**Verificado em:** 2026-11-20 · `origin/main` = `5174664b2`

## Veredito de release

**NO-GO** — auditoria forense `audit-2026-11-18` (11 relatórios de domínio), parecer independente do revisor registrado em `.agents/reviews/24-revisao-release-readiness-audit-2026-11-18.md` (amostragem 12/12 achados confirmados). O estado NO-GO permanece até que os P0 abaixo sejam validados em staging/produção.

## O que o produto é

CRM/prospecção multi-tenant: frontend React+TS+Vite, backend modular `src/features/*`, Prisma/Postgres com RLS, integrações Bitrix24/WhatsApp/voz(3CX)/IA. Governado por sistema multi-agente formal (AGENTS.md).

## Marcos verificados como ENTREGUES (evidência em git/GitHub)

| Entrega | Evidência |
|---|---|
| SSRF IPv6 hardening completo (parser canônico + byte-level) | PRs #381, #413, #436 mergeados |
| DSR/LGPD canal público (backend + páginas + E2E) | PRs #381, #385, #428 mergeados; `dsr-public-journey.test.ts` 5/5 |
| Outbox `idempotencyKey` — cadência, CRM/BI, integrations | PRs #444, #445, #448 mergeados |
| Deep link pós-login | `postLoginTarget` em main + PR #426 (E2E 3/3) |
| Baselines visuais Linux + fix workflow non-FF | PRs #419, #442 mergeados |
| Hotfix cadence `assignedToId`→`owner` | PR #416 mergeado |
| Brand system Genesis | merge `ddb55b4d6` |
| Governança 100 agentes | PRs #455, #456 mergeados |
| Backup/restore e workers (parcial P0) | PRs #435, #440 mergeados — **verificar cobertura real de DEBT-0002/0003** |

## Bloqueadores P0 abertos

1. **Deploy sem `migrate deploy` + healthcheck** (DEBT-0001) — `deploy-ec2.sh` confirmado sem os passos.
2. **Escopo mobile no release** (DEBT-0004) — decisão humana pendente.
3. **Docker daemon `192.168.0.116:2375` sem autenticação** + rotação de segredos devstack — ação humana no host; segredos possivelmente expostos.

## Governança — transição em curso

- **Roster legado** (00–24): todo o trabalho Waves A–E foi executado sob ele.
- **Roster novo** (100 agentes, 10 squads, nomes próprios; auditoria = **09 Silas**): mergeado via PR #455.
- **Ponto de atenção**: `.github/workflows/**` era do Agente 08; na nova matriz provavelmente do 94 Tess. `prisma/**` era do 01; agora 11 Pietro/12 Vera. Handoffs endereçados a números antigos precisam reconciliação.

## Estado do CI

- Branch protection de `main` (alterada pelo coordenador via API em 2026-11-19, **pendente de aprovação retroativa**): required checks = `Visual Regression Gate` + `Central Birth Hub 360 / application gate`.
- ~26 PRs abertos, todos `BLOCKED` por checks pendentes — fila limitada por tempo de CI (~40 min/ciclo), não por rejeições conhecidas.
