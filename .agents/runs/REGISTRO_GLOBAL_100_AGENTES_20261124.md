# REGISTRO GLOBAL DE OPERAÇÃO CONTÍNUA — 100 AGENTES (BIRTH HUB 360)

**Missão Global:** `SQUAD00-OPERACAO-CONTINUA` a `SQUAD90-OPERACAO-CONTINUA`  
**Autoridade:** Orquestrador Humano  
**Coordenador Global:** Agente 00 — Astra  
**Repositório Canônico:** `C:\Github\Birthub-360`  
**Worktree do Coordenador:** `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-00-integracao` (`integracao/onda-3-dem20261123` @ `871d4b16d`)  
**Baseline Homologada:** `integracao/onda-2-dem20261123` @ `32d07c3750c370b63da8b720019413c9a40e0e68`  
**Data/Hora de Consolidação:** 2026-11-24 14:06 BRT  
**Postura de Release:** **NO-GO** (mantido até homologação integral e decisão humana)

---

## 0. Consolidação da Onda 3 (Rodadas 1 e 2) — 17/17 Entregas Auditadas e Integradas (`871d4b16d`)

- **Rodada 1 (Lotes 1, 2 e 3 + Ressincronização Postman):**
  - `20 — Ciro` (`23b1d31cd` → merge `ff91eb049`, parecer `APROVADO`)
  - `45 — Otto` (`8e2c0d1e0` → merge `df731231f`, parecer `APROVADO`; Rodada 2 não-autorizada `2bf6ffe31` `REPROVADA` por colisão de ownership com `41 — Cadu`)
  - `96 — Nera` (`dd8351072` → merge `63f0f1725`, parecer `APROVADO`)
  - `42 — Lívia` (`47846b442` → merge `928cf1b3e`, parecer `APROVADO`)
  - `34 — Ari` (`27924c7cf` → merge `013149429`, parecer `APROVADO`)
  - `21 — Zara` (`2ea541871` + fix `af91a3e0d` → merges `f8e4a86b0` e `c7afe10db`, parecer `APROVADO`)
  - `65 — Lena` (`b8a39713e` → merge `4cddf9eb6`, parecer `APROVADO`)
  - `99 — Vito` (`97856cb13` → merge `c3a3f33c3`, parecer `APROVADO`)
- **Rodada 2 (Levas 4A, 4B, 5A e 5B):**
  - **Leva 4A (`c7afe10db`):** `22 — Hugo` (`d82f93e42` → merge `2c9770b7a`, `APROVADO` — diagnóstico/handoffs), `97 — Rocco` (`33f6cf1e7` → merge `c6218ce97`, `APROVADO` — código + reconciliação de teste com 03), `21 — Zara` (`af91a3e0d` → merge `c7afe10db`, `APROVADO` — resync spec Postman). Gate: 28/28 testes RBAC/Auth verdes + `verify:openapi-drift` 0 deriva.
  - **Leva 4B (`49d1f38cd`):** `31 — Noa` (`8865247c7` → merge `c3626b3f8`, `APROVADO` — código `MainLayout.tsx` + handoff), `44 — Lola` (`aeb9004f4` → merge `49d1f38cd`, `APROVADO` — diagnóstico/handoffs). Gate: 6/6 testes `SkipLink.test.tsx` verdes.
  - **Leva 5A (`b54b59fee`):** `10 — Mara` (`d13f08892` → merge `9d9bfca2f`, `APROVADO` — `TimelineEvent` em `AUDITABLE_MODELS` + `buildSoftDeleteData` via DMMF), `23 — Pina` (`82a50d0c9` → merge `b54b59fee`, `APROVADO` — dedup outbound queues + remoção `idempotencyManager.ts`). Gate: 56/56 testes unitários (`prisma-interceptors` + `outboundPushDedup`) verdes.
  - **Leva 5B (`871d4b16d`):** `40 — Ravi` (`f3fc2f203` → merge `930ee7b7b`, `APROVADO` — remoção `role="button"` órfão em `crm/components/KanbanBoard.tsx`), `41 — Cadu` (`59738d5cf` → merge `732d7fd08`, `APROVADO` — `activities` data civil, `leadOwnership` anti-IDOR cross-tenant e `feed.ics` self-only), `43 — Amon` (`2fc7570d0` → merge `d737b6f62`, `APROVADO` — `tasks.routes.ts` authz e prevenção de IDOR no prospecting outbound), `09 — Silas` (`e426979a7` → merge `871d4b16d`, todos os pareceres da Onda 3 incorporados). Gate: 37/37 testes unitários verdes + `npx tsc --noEmit` exit 0.

---

## 1. Reconciliação das Ondas Anteriores (Ondas 1, 2, 3 e 4)

### 1.1 Onda 1 (`integracao/onda-1-dem20261123` @ `815a09305`) — **CONCLUÍDA E APROVADA**
- **Escopo:** Blindagem P0-07 (proteção de ativos estáticos `/tools` e `/design-lab` e Service Worker), isolamento RLS (`getTenantPrisma`), guarda de produção em seeds (B-06), timeouts de integração, estabilidade E2E/Axe (Kanban/Agenda), Dockerfile gate P0-07 e workflows de CI.
- **Agentes Integrados (8/8):** `03` (`c286185c1`), `04` (`48e9ac169`), `05` (`8151d8cda`), `13` (`283e7ec1e`), `14` (`090de3949`), `93` (`2596287dd`), `94` (`0372d169b`), `99` (`eb8e945fc` / `2963a0d90`).
- **Auditoria (Agente 09 — Silas):** 10/10 pareceres `APROVADO` incorporados em `815a09305` (parecer de integração `09-dem-20261123-integracao-onda1-815a09305.md`).
- **Regra de Continuidade:** Correções comprovadas e fechadas. Proibido reabrir ou duplicar.

### 1.2 Onda 2 (`integracao/onda-2-dem20261123` @ `32d07c375`) — **CONCLUÍDA E APROVADA**
- **Escopo:** Isolamento dinâmico de banco de teste e FKs no harness, compatibilidade PostgreSQL 16/17 (`db-owner-role`) e ordem FK em `prospecting-rls`, conservação regulatória de `AuditLog` imutável (Art. 16, I LGPD sem violar `auditlog_no_mutation`), invalidação de cache de `/sw.js` e proxy restrito no Nginx (`P0-07`), auditoria do container Docker P0-07 sem uso da TCP 2375, workflow de baselines visuais Linux com dry-run padrão e auditoria individualizada dos 11 hotspots arquiteturais e 36 waivers Trivy.
- **Agentes Integrados (7/7):** `02` (`d776c8f8f`), `04` (`0d87b8adf`), `08` (`f2011442e`), `90` (`be14797b6`), `93` (`1074ee1a2`), `94` (`f9196627d`), `99` (`54d10014a`).
- **Auditoria (Agente 09 — Silas):** 7/7 pareceres por slot `APROVADO` em `f842a5ebf` + parecer de integração combinada da baseline `32d07c375` `APROVADO` em `b02efad9e` (`09-dem-20261123-integracao-onda2-32d07c375.md`).

### 1.3 Onda 3 (`integracao/onda-3-dem20261123` @ `027f42b18`) — **ATIVA (8/8 SLOTS OCUPADOS)**
- **Baseline:** `32d07c375`.
- **Slots em Execução:**
  - Slot 1: `20 — Ciro` (`wt-20-core-backend`, `agente/20-core-backend-onda3`) — **ATIVO** (investigando `isAuditableModel`/`deleteReason` e contratos internos).
  - Slot 2: `21 — Zara` (`wt-21-api-contracts`, `agente/21-api-contracts-onda3`) — **ATIVO** (auditando schemas Zod e `openapi.yaml`).
  - Slot 3: `34 — Ari` (`wt-34-accessibility`, `agente/34-accessibility-onda3`) — **ATIVO** (implementação em progresso em `src/components/a11y/`).
  - Slot 4: `42 — Lívia` (`wt-42-crm-kanban`, `agente/42-crm-kanban-onda3`) — **ATIVO** (alterações em `deals.service.ts`, `KanbanBoard.tsx` e testes `__tests__/`).
  - Slot 5: `45 — Otto` (`wt-45-crm-agenda`, `agente/45-crm-agenda-onda3`) — **ATIVO** (alterações em `calendar.utils.ts` e `__tests__/`).
  - Slot 6: `65 — Lena` (`wt-65-voice-hub`, `agente/65-voice-hub-onda3`) — **ATIVO** (alterações em `voiceHub.api.ts`, `VoiceHubView.tsx`, `LandingInnovative.tsx`).
  - Slot 7: `96 — Nera` (`wt-96-auth`, `agente/96-auth-onda3`) — **ATIVO** (alterações em `password-hash.ts`, `session.service.ts`, testes unitários e handoff `96-para-00-session-service-morta.md`).
  - Slot 8: `09 — Silas` (`wt-09-audit-onda3`, `agente/09-audit-onda3` @ `b02efad9e`) — **ATIVO / RESERVADO** (checklist publicado em `a32fd0fe5`, parecer baseline Onda 2 emitido em `b02efad9e`, aguardando congelamento de SHAs dos Slots 1–7).

### 1.4 Onda 4 (`C:\Github\Birthub-360-worktrees\dem-20261123-onda4\`) — **PREPARADA (EM FILA DE SLOTS)**
- **Worktrees já provisionados na baseline `32d07c375` (aguardando liberação de slots da Onda 3):**
  - `44 — Lola` (`wt-44-cadences`, `agente/44-cadences-onda4`) — **PREPARADO** (aguardando handoffs 42↔44 e 45→44 + liberação de slot).
  - `51 — Bela` (`wt-51-bitrix-auth`, `agente/51-bitrix-auth-onda4`) — **PREPARADO** (aguardando liberação de slot; exclusão mútua com 52–54).
  - `56 — Luna` (`wt-56-whatsapp`, `agente/56-whatsapp-onda4`) — **PREPARADO** (aguardando liberação de slot).

---

## 2. Ocupação Atual dos Oito Slots Globais (+ Coordenador 00)

| Slot | Agente | Squad | Missão Ativa | Branch | Worktree | SHA Base | Status |
|:---:|:---|:---:|:---|:---|:---|:---:|:---:|
| **COORD** | `00 — Astra` | 00 | `SQUAD00-OPERACAO-CONTINUA` | `integracao/onda-3-dem20261123` | `dem-20261123-onda3/wt-00-integracao` | `027f42b18` | **ATIVO** |
| **Slot 1** | `20 — Ciro` | 20 | `ONDA3-20-CORE-BACKEND` | `agente/20-core-backend-onda3` | `dem-20261123-onda3/wt-20-core-backend` | `32d07c375` | **ATIVO** |
| **Slot 2** | `21 — Zara` | 21 | `ONDA3-21-API-CONTRACTS` | `agente/21-api-contracts-onda3` | `dem-20261123-onda3/wt-21-api-contracts` | `32d07c375` | **ATIVO** |
| **Slot 3** | `34 — Ari` | 30 | `ONDA3-34-ACCESSIBILITY` | `agente/34-accessibility-onda3` | `dem-20261123-onda3/wt-34-accessibility` | `32d07c375` | **ATIVO** |
| **Slot 4** | `42 — Lívia` | 40 | `ONDA3-42-CRM-KANBAN` | `agente/42-crm-kanban-onda3` | `dem-20261123-onda3/wt-42-crm-kanban` | `32d07c375` | **ATIVO** |
| **Slot 5** | `45 — Otto` | 40 | `ONDA3-45-CRM-AGENDA` | `agente/45-crm-agenda-onda3` | `dem-20261123-onda3/wt-45-crm-agenda` | `32d07c375` | **ATIVO** |
| **Slot 6** | `65 — Lena` | 60 | `ONDA3-65-VOICE-HUB` | `agente/65-voice-hub-onda3` | `dem-20261123-onda3/wt-65-voice-hub` | `32d07c375` | **ATIVO** |
| **Slot 7** | `96 — Nera` | 90 | `ONDA3-96-AUTH` | `agente/96-auth-onda3` | `dem-20261123-onda3/wt-96-auth` | `32d07c375` | **ATIVO** |
| **Slot 8** | `09 — Silas` | 00 | `ONDA3-09-AUDIT` | `agente/09-audit-onda3` | `dem-20261123-onda3/wt-09-audit-onda3` | `b02efad9e` | **ATIVO (GATE)** |

---

## 3. Inventário Único dos 100 Agentes (Squads 00 a 90)

Legenda de Estados Oficiais: `NÃO INICIADO` | `PREPARADO` | `ATIVO` | `BLOQUEADO` | `EM AUDITORIA` | `APROVADO` | `CONCLUÍDO`

### Squad 00 · Comando Global, QA, LGPD e Auditoria (Coord.: `00 — Astra`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `00` | **Astra** | `SQUAD00-OPERACAO-CONTINUA` | **ATIVO** | `integracao/onda-3-dem20261123` | `dem-20261123-onda3/wt-00-integracao` | `32d07c375` → `027f42b18` | `server.ts`, `package.json`, `.agents/ESTADO_ATUAL.md`, `.agents/runs/**` | Coordena 100 agentes; reconcilia Handoff 96→00 (`session.service.ts`) e conflito em `CHECKLIST_RESOLUCAO_ONDAS.md` | Integrar Lotes 1–3 da Onda 3 e despachar Onda 4 |
| `01` | **Ória** | `SQUAD00-01-DOD-CONTRATOS` | **PREPARADO** | `agente/01-squad00-dod-aceite` | `onda4/wt-01-dod` (planejado) | `32d07c375` → — | `.agents/templates/**` | Depende da conclusão de Onda 3 para atualizar checklist canônico e templates DoD | Auditar contratos de aceite das Ondas 3 e 4 |
| `02` | **Bento** | `ONDA2-02-HARNESS` | **CONCLUÍDO** | `agente/02-harness-onda2-dem20261123` | `dem-20261123-onda2/wt-02-harness` | `815a09305` → `d776c8f8f` | `tests/setup/**`, `jest.config.js`, `vitest.config.ts` | Parecer `09-dem-20261123-slot2-02-d776c8f8f.md` (`APROVADO`); integrado em `547cc9e1c` | `SQUAD00-02-HARNESS-DETERMINISMO` (monitorar isolamento DB Onda 4) |
| `03` | **Nina** | `ONDA1-03-UNITARIOS` | **CONCLUÍDO** | `agente/03-unitarios-dem20261123` | `dem-20261123-onda1/wt-03-unitarios` | `b96f3fd5d` → `c286185c1` | `tests/unit/**`, `tests/architecture/**` | Parecer Slot 4 Onda 1 (`APROVADO` em `58943b83e`); integrado em `815a09305` | `SQUAD00-03-ARCH-HOTSPOTS` (validar regressão unitária pós-fatiamento de hotspots) |
| `04` | **Téo** | `ONDA2-04-INTEGRACAO-PG17` | **CONCLUÍDO** | `agente/04-integracao-onda2-dem20261123` | `dem-20261123-onda2/wt-04-integracao-o2` | `815a09305` → `0d87b8adf` | `tests/integration/**` | Parecer `09-dem-20261123-slot3-04-0d87b8adf.md` (`APROVADO`); integrado em `eb57c61f5` | `SQUAD00-04-CONTRATOS-INTEGRACAO` (validar contratos Squad 20/50 na Onda 4) |
| `05` | **Luma** | `ONDA1-05-E2E-VISUAL` | **CONCLUÍDO** | `agente/05-e2e-visual-dem20261123` | `dem-20261123-onda1/wt-05-e2e-visual` | `c286185c1` → `8151d8cda` | `tests/e2e/**`, `cypress/**`, `playwright.config.ts` | Parecer Slot 5 Onda 1 (`APROVADO` em `7799e4a63`); integrado em `31b0b0c59` | `SQUAD00-05-PLAYWRIGHT-A11Y-VR` (validar entregas 34, 42, 45 e 65 pós-Onda 3) |
| `06` | **Gael** | `SQUAD00-06-REALIDADE-PII` | **PREPARADO** | `agente/06-squad00-auditoria-realidade` | `onda4/wt-06-realidade` (planejado) | `32d07c375` → — | Leitura global + `.agents/handoffs/**` | Atuação estrita de leitura; audita persistência real vs mocks e vazamento PII em logs/banco | Emitir handoffs de realidade para Squads 10, 20, 40 e 50 |
| `07` | **Íris** | `SQUAD00-07-LGPD-INVENTARIO` | **PREPARADO** | `agente/07-squad00-lgpd-governanca` | `onda4/wt-07-lgpd-doc` (planejado) | `32d07c375` → — | `docs/lgpd/**` | Reconciliar base legal Art. 16, I com `08 — Dora` (`f2011442e`) e retenção com `15 — Olavo` | Atualizar ROPA, matriz de retenção e bases legais B-13 |
| `08` | **Dora** | `ONDA2-08-LGPD-AUDITLOG` | **CONCLUÍDO** | `agente/08-lgpd-onda2-dem20261123` | `dem-20261123-onda2/wt-08-lgpd` | `815a09305` → `f2011442e` | `src/features/privacy/**`, `src/shared/services/dataSubjectErasure.service.ts` | Parecer `09-dem-20261123-slot6-08-f2011442e.md` (`APROVADO`); integrado em `a97849de6` | `SQUAD00-08-PORTABILIDADE-EXPURGO` (validar expurgo coordenado com Agente 15) |
| `09` | **Silas** | `ONDA3-09-AUDIT` | **ATIVO** | `agente/09-audit-onda3` | `dem-20261123-onda3/wt-09-audit-onda3` | `32d07c375` → `b02efad9e` | `.agents/reviews/**` | Emitiu parecer `APROVADO` da baseline `32d07c375`; monitorando 7 executores da Onda 3 | Auditar SHAs congelados de `20, 21, 34, 42, 45, 65, 96` |

---

### Squad 10 · Dados, Banco e Multi-Tenancy (Coord.: `10 — Mara`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `10` | **Mara** | `SQUAD10-10-COORD-DADOS` | **PREPARADO** | `agente/10-squad10-coord-dados` | `onda4/wt-10-coord-dados` | `32d07c375` → — | `src/lib/db/index.ts` | Recebe handoffs de `20 — Ciro` sobre `isAuditableModel` / `deleteReason` | Despachar `11` e `12` se houver confirmação de ajuste de schema |
| `11` | **Pietro** | `SQUAD10-11-PRISMA-SCHEMA` | **PREPARADO** | `agente/11-squad10-prisma-schema` | `onda4/wt-11-schema` | `32d07c375` → — | `prisma/schema.prisma` | Exclusão mútua com `12` e consumidores com bloqueio de schema; aguarda diagnóstico de `20` | Auditar FKs `ON DELETE RESTRICT`, índices e `deleteReason` |
| `12` | **Vera** | `SQUAD10-12-MIGRATIONS-AUDIT` | **PREPARADO** | `agente/12-squad10-migrations` | `onda4/wt-12-migrations` | `32d07c375` → — | `prisma/migrations/**` | Depende de `11 — Pietro`; zero migrações destrutivas (B-05) | Auditar ordem de migrations, rollback e checklist zero-downtime |
| `13` | **Nilo** | `ONDA1-13-RLS` | **CONCLUÍDO** | `agente/13-rls-dem20261123` | `dem-20261123-onda1/wt-13-rls` | `c286185c1` → `283e7ec1e` | `src/lib/tenant-prisma.ts`, `scripts/security/*rls-coverage.ts` | Parecer Slot 3 Onda 1 (`APROVADO` em `9fc2a2240`); integrado em `f3bcfcfca` | `SQUAD10-13-RLS-42501` (auditar falhas residuais 42501 e cobertura 100% RLS) |
| `14` | **Bia** | `ONDA1-14-FIXTURES` | **CONCLUÍDO** | `agente/14-fixtures-dem20261123` | `dem-20261123-onda1/wt-14-fixtures` | `c286185c1` → `090de3949` | `prisma/seed.ts`, `tests/fixtures/**` | Parecer Slot 2 Onda 1 (`APROVADO` em `3bdacdc5a`); integrado em `8bf280742` | `SQUAD10-14-SEEDS-DETERMINISMO` (validar factories com harness Onda 2) |
| `15` | **Olavo** | `SQUAD10-15-RETENCAO-EXPURGO` | **PREPARADO** | `agente/15-squad10-retencao` | `onda4/wt-15-retencao` | `32d07c375` → — | `src/lib/db/retention/**` | Alinhado com `08 — Dora` (`f2011442e`) quanto à imutabilidade de `AuditLog` | Auditar jobs de expurgo/arquivamento sem mutar `AuditLog` |
| `16` | **Cora** | `SQUAD10-16-SQL-PERFORMANCE` | **PREPARADO** | `agente/16-squad10-sql-perf` | `onda5/wt-16-sql-perf` | `32d07c375` → — | `src/lib/db/queries/**` | Sem bloqueadores; parceria com Squad 40 (CRM) e Squad 00 | Eliminar N+1 queries e produzir benchmarks reproduzíveis |
| `17` | **Remo** | `SQUAD10-17-CACHE-REDIS` | **PREPARADO** | `agente/17-squad10-cache-redis` | `onda5/wt-17-cache` | `32d07c375` → — | `src/lib/cache/**`, `redis.config.ts` | Sem bloqueadores; interface com `25 — Tália` e `23 — Pina` | Auditar prefixos de cache por `tenantId`, TTL e locks distribuídos |
| `18` | **Ayla** | `SQUAD10-18-DATA-LINEAGE` | **PREPARADO** | `agente/18-squad10-data-lineage` | `onda5/wt-18-lineage` | `32d07c375` → — | `src/features/audit-logs/**` | Interface com `07 — Íris`, `08 — Dora` e `20 — Ciro` | Auditar rastreabilidade, `isAuditableModel` e proveniência |
| `19` | **Bruno** | `SQUAD10-19-BACKUP-INTEGRIDADE` | **PREPARADO** | `agente/19-squad10-backups` | `onda5/wt-19-backups` | `32d07c375` → — | `scripts/backup/**`, `scripts/verify-integrity.ts` | Alinhado com `98 — Safira` (B-14) | Auditar scripts de backup/restore e integridade referencial |

---

### Squad 20 · Core Backend, APIs, Billing e Onboarding (Coord.: `20 — Ciro`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `20` | **Ciro** | `ONDA3-20-CORE-BACKEND` | **ATIVO** | `agente/20-core-backend-onda3` | `dem-20261123-onda3/wt-20-core-backend` | `32d07c375` → (em curso) | `src/api/index.ts`, `src/api/router.ts` | Slot 1 ativo; mapeia `isAuditableModel`/`deleteReason` e contratos internos | Emitir handoffs para Squad 10 e coordenar integração Squad 20 |
| `21` | **Zara** | `ONDA3-21-API-CONTRACTS` | **ATIVO** | `agente/21-api-contracts-onda3` | `dem-20261123-onda3/wt-21-api-contracts` | `32d07c375` → (em curso) | `src/api/schemas/**`, `openapi.yaml` | Slot 2 ativo; sincroniza Zod DTOs e `openapi.yaml` | Submeter commit congelado ao Agente 09 |
| `22` | **Hugo** | `SQUAD20-22-HTTP-MIDDLEWARES` | **PREPARADO** | `agente/22-squad20-http-middlewares` | `onda4/wt-22-middlewares` | `32d07c375` → — | `src/api/controllers/**`, `src/api/middlewares/**` (exceto `rate-limit.ts`) | Depende dos contratos de `20` e `21` na Onda 3; não edita `rate-limit.ts` (Agente 25) | Auditar erros 4xx/5xx, propagação de erro e auth middlewares |
| `23` | **Pina** | `SQUAD20-23-BULLMQ-WORKERS` | **PREPARADO** | `agente/23-squad20-workers` | `onda4/wt-23-workers` | `32d07c375` → — | `src/lib/queue/**` (exceto `dlq/**`), `src/workers/**` | Exclusão mútua com `24 — Ivo`; proibido editar `src/lib/queue/dlq/**` | Auditar concorrência, agendamentos e memory leaks BullMQ |
| `24` | **Ivo** | `SQUAD20-24-RESILIENCIA-DLQ` | **PREPARADO** | `agente/24-squad20-dlq-resiliencia` | `onda5/wt-24-dlq` | `32d07c375` → — | `src/lib/resilience/**`, `src/lib/queue/dlq/**` | Exclusão mútua com `23 — Pina` | Auditar backoff exponencial, DLQ, deduplicação e idempotência |
| `25` | **Tália** | `SQUAD20-25-RATE-LIMITING` | **PREPARADO** | `agente/25-squad20-rate-limit` | `onda5/wt-25-ratelimit` | `32d07c375` → — | `src/api/middlewares/rate-limit.ts` | Proprietária exclusiva de `rate-limit.ts` (isolada de `22 — Hugo`) | Auditar quotas por tenant, throttling e proteção sob carga |
| `26` | **Dália** | `SQUAD20-26-BILLING-WEBHOOKS` | **PREPARADO** | `agente/26-squad20-billing` | `onda5/wt-26-billing` | `32d07c375` → — | `src/features/billing/payments/**`, `src/features/billing/webhooks/**` | Interface com `27 — Vic` | Auditar idempotência financeira, Stripe webhooks e conciliação |
| `27` | **Vic** | `SQUAD20-27-ENTITLEMENTS` | **PREPARADO** | `agente/27-squad20-entitlements` | `onda5/wt-27-entitlements` | `32d07c375` → — | `src/features/billing/entitlements/**` | Interface com `26 — Dália` e `97 — Rocco` | Validar limites por plano, feature flags e enforcement |
| `28` | **Milo** | `SQUAD20-28-IMPORT-ONBOARDING` | **PREPARADO** | `agente/28-squad20-import` | `onda6/wt-28-import` | `32d07c375` → — | `src/features/onboarding/import/**` | Interface com `48 — Jade` (deduplicação) | Auditar parsers CSV, higienização em lote, duplicados e rollback |
| `29` | **Lia** | `SQUAD20-29-EXPORT-WEBHOOKS` | **PREPARADO** | `agente/29-squad20-export-webhooks` | `onda6/wt-29-export` | `32d07c375` → — | `src/features/webhooks/outbound/**` | Interface com `24 — Ivo` e `07 — Íris` | Validar assinatura HMAC, filas de saída, retries e proteção PII |

---

### Squad 30 · Produto, UX, Design System e Marca (Coord.: `30 — Violeta`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `30` | **Violeta** | `SQUAD30-30-COORD-UX-DESIGN` | **PREPARADO** | `agente/30-squad30-coord-ux` | `onda4/wt-30-coord-ux` | `32d07c375` → — | `src/components/index.ts` | Reconciliar Design Language v2.0/v2.1 e achados COMP-001..015 | Coordenar fatiamento dos hotspots visuais (#1, #2, #11) |
| `31` | **Noa** | `SQUAD30-31-APP-SHELL-NAV` | **PREPARADO** | `agente/31-squad30-app-shell` | `onda4/wt-31-appshell` | `32d07c375` → — | `src/App.tsx`, `src/components/layout/**` | Slot exclusivo sobre `src/App.tsx`; ninguém pode editar rotas em paralelo | Auditar navegação, sidebar, módulos órfãos e rotas |
| `32` | **Ema** | `SQUAD30-32-UI-STATES` | **PREPARADO** | `agente/32-squad30-ui-states` | `onda5/wt-32-uistates` | `32d07c375` → — | `src/components/feedback/**` | Preserva mitigação B-09 (`EmptyState.tsx`) | Revisar estados loading, empty, error, stale e skeletons |
| `33` | **Célia** | `SQUAD30-33-DESIGN-SYSTEM-HOTSPOT11` | **PREPARADO** | `agente/33-squad30-design-system` | `onda4/wt-33-design-system` | `32d07c375` → — | `src/components/ui/**`, `tailwind.config.js`, `src/styles/**` | Hotspot #11 (`PillarRegistry.tsx` — 1402 linhas, vencimento 30/11/2026) | Extrair 5 viewers restantes de `PillarRegistry.tsx` (< 600 linhas) e auditar tokens |
| `34` | **Ari** | `ONDA3-34-ACCESSIBILITY` | **ATIVO** | `agente/34-accessibility-onda3` | `dem-20261123-onda3/wt-34-accessibility` | `32d07c375` → (em curso) | `src/components/a11y/**` | Slot 3 ativo (`?? src/components/a11y/`); WCAG 2.2 AA, teclado, foco e ARIA | Concluir testes a11y, commitar e submeter ao Agente 09 |
| `35` | **Mia** | `SQUAD30-35-MOTION` | **PREPARADO** | `agente/35-squad30-motion` | `onda6/wt-35-motion` | `32d07c375` → — | `src/components/motion/**` | Respeito obrigatório a `prefers-reduced-motion` | Auditar transições Framer Motion e percepção de desempenho |
| `36` | **Léo** | `SQUAD30-36-LANDING-HOTSPOTS1-2` | **PREPARADO** | `agente/36-squad30-landing` | `onda4/wt-36-landing` | `32d07c375` → — | `src/features/landing/**` | Hotspots #1 (`Landing360.tsx` ~3400 linhas) e #2 (`Landing360Impeccable.tsx` 1021 linhas) vencem em 30/11 | Fatiar seções de `Landing360.tsx` e `Landing360Impeccable.tsx` (< 1000 linhas) |
| `37` | **Suri** | `SQUAD30-37-ONBOARDING-UX` | **PREPARADO** | `agente/37-squad30-onboarding-ux` | `onda6/wt-37-onboarding-ux` | `32d07c375` → — | `src/features/onboarding/ui/**` | Interface com `28 — Milo` | Auditar wizards de ativação, checklists e orientação contextual |
| `38` | **Nara** | `SQUAD30-38-DASHBOARDS-CHARTS` | **PREPARADO** | `agente/38-squad30-dashboards` | `onda6/wt-38-dashboards` | `32d07c375` → — | `src/features/analytics/ui/**`, `src/components/charts/**` | Interface com `49 — Malu` | Auditar gráficos, filtros, estados de dados e precisão visual |
| `39` | **Tina** | `SQUAD30-39-BRANDBOOK-DOCS` | **PREPARADO** | `agente/39-squad30-brandbook` | `onda6/wt-39-brandbook` | `32d07c375` → — | `identidade-visual/**`, `documentacao-aplicacao/**` | Alinhada com `30 — Violeta` e `33 — Célia` | Consolidar Brandbook v2.0/v2.1 e manuais homologados |

---

### Squad 40 · CRM, Pipeline e Ciclo de Receita (Coord.: `40 — Ravi`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `40` | **Ravi** | `SQUAD40-40-COORD-CRM` | **PREPARADO** | `agente/40-squad40-coord-crm` | `onda5/wt-40-coord-crm` | `32d07c375` → — | `src/features/crm/index.ts`, `src/features/crm/types.ts` | Consolida matriz funcional E2E do CRM após entregas 42, 45 e 44 | Validar integração do funil comercial ponta a ponta |
| `41` | **Cadu** | `SQUAD40-41-LEADS-HOTSPOTS5-10` | **PREPARADO** | `agente/41-squad40-leads-contacts` | `onda4/wt-41-leads` | `32d07c375` → — | `src/features/crm/leads/**`, `src/features/crm/contacts/**` | Hotspots #5 (`leads.routes.ts` 1368 linhas) e #10 (`LeadDetailDrawer.tsx` 1008 linhas) vencem em 30/11 | Modularizar abas de `LeadDetailDrawer.tsx` e extrair controllers de leads |
| `42` | **Lívia** | `ONDA3-42-CRM-KANBAN` | **ATIVO** | `agente/42-crm-kanban-onda3` | `dem-20261123-onda3/wt-42-crm-kanban` | `32d07c375` → (em curso) | `src/features/crm/deals/**`, `src/features/crm/pipelines/**` | Slot 4 ativo (`M deals.service.ts`, `M KanbanBoard.tsx`, `?? __tests__/`); emite handoff 42↔44 | Congelar SHA, emitir handoff para `44 — Lola` e submeter ao Agente 09 |
| `43` | **Amon** | `SQUAD40-43-SCORING-OUTBOUND` | **PREPARADO** | `agente/43-squad40-scoring` | `onda5/wt-43-scoring` | `32d07c375` → — | `src/features/crm/scoring/**` | Preservar Trilha C.1/C.2 (`da814442c`) | Auditar algoritmos de qualificação, scoring e priorização |
| `44` | **Lola** | `ONDA4-44-CADENCES` | **PREPARADO** | `agente/44-cadences-onda4` | `dem-20261123-onda4/wt-44-cadences` | `32d07c375` → — | `src/features/crm/cadences/**` | Worktree já criado; aguarda conclusão e handoffs de `42 — Lívia` e `45 — Otto` na Onda 3 | Auditar e corrigir agendamento, pausas, retries e idempotência de cadências |
| `45` | **Otto** | `ONDA3-45-CRM-AGENDA` | **ATIVO** | `agente/45-crm-agenda-onda3` | `dem-20261123-onda3/wt-45-crm-agenda` | `32d07c375` → (em curso) | `src/features/crm/tasks/**` | Slot 5 ativo (`M calendar.utils.ts`, `?? __tests__/`); emite handoff 45→44 | Congelar SHA, emitir handoff para `44 — Lola` e submeter ao Agente 09 |
| `46` | **Sofia** | `SQUAD40-46-FORECAST` | **PREPARADO** | `agente/46-squad40-forecast` | `onda6/wt-46-forecast` | `32d07c375` → — | `src/features/crm/forecast/**` | Depende da estabilização de `42 — Lívia` (deals/pipelines) | Validar cálculos de forecast, metas e coerência de indicadores |
| `47` | **Dante** | `SQUAD40-47-ROUTING-PLAYBOOKS` | **PREPARADO** | `agente/47-squad40-routing` | `onda6/wt-47-routing` | `32d07c375` → — | `src/features/crm/routing/**` | Preservar Trilha C.2 (Round-Robin por Score) | Auditar distribuição round-robin, regras e prevenção de atribuição incorreta |
| `48` | **Jade** | `SQUAD40-48-DEDUPLICACAO` | **PREPARADO** | `agente/48-squad40-dedup` | `onda6/wt-48-dedup` | `32d07c375` → — | `src/features/crm/deduplication/**` | Interface com `41 — Cadu` e `28 — Milo` | Validar fusão segura de duplicatas, preservação de timeline e FKs |
| `49` | **Malu** | `SQUAD40-49-BI-HOTSPOT4` | **PREPARADO** | `agente/49-squad40-bi-analytics` | `onda5/wt-49-bi` | `32d07c375` → — | `src/features/crm/analytics/**` | Hotspot #4 (`CommercialIntelligence.ts` 1193 linhas, vencimento 30/11) | Dividir tipos de `CommercialIntelligence.ts` e validar coortes/LTV/churn |

---

### Squad 50 · Integrações Externas e Ecossistema Bitrix24 (Coord.: `50 — Atlas`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `50` | **Atlas** | `SQUAD50-50-COORD-INTEGRACOES` | **PREPARADO** | `agente/50-squad50-coord-integracoes` | `onda4/wt-50-coord-integracoes` | `32d07c375` → — | `src/lib/integrations/index.ts` | Governa exclusão mútua dos Agentes 51–54 (Bitrix24) | Publicar matriz de prontidão dos conectores e coordenar handoffs Bitrix |
| `51` | **Bela** | `ONDA4-51-BITRIX-AUTH` | **PREPARADO** | `agente/51-bitrix-auth-onda4` | `dem-20261123-onda4/wt-51-bitrix-auth` | `32d07c375` → — | `src/lib/integrations/bitrix/auth/**` | Worktree criado na Onda 4; executa antes de 52–54 por dependência de contrato OAuth | Auditar OAuth Bitrix24, renovação de token e isolamento multi-tenant |
| `52` | **Lino** | `SQUAD50-52-BITRIX-BATCH-HOTSPOT3` | **PREPARADO** | `agente/52-squad50-bitrix-batch` | `onda5/wt-52-bitrix-batch` | `32d07c375` → — | `src/lib/integrations/bitrix/batch/**` | Hotspot #3 (`extraction.ts` ~1080 linhas, vencimento 30/11) + B-12; aguarda `51 — Bela` | Modularizar `extraction.ts` (cursor/streaming) e validar paginação batch 50 itens |
| `53` | **Vega** | `SQUAD50-53-BITRIX-WEBHOOKS` | **PREPARADO** | `agente/53-squad50-bitrix-webhooks` | `onda5/wt-53-bitrix-webhooks` | `32d07c375` → — | `src/lib/integrations/bitrix/webhooks/**` | Exclusão mútua com 51/52/54 sobre contratos compartilhados | Auditar sync bidirecional, idempotência, eventos fora de ordem e retries |
| `54` | **Rita** | `SQUAD50-54-BITRIX-MAPPING` | **PREPARADO** | `agente/54-squad50-bitrix-mapping` | `onda5/wt-54-bitrix-mapping` | `32d07c375` → — | `src/lib/integrations/bitrix/mapping/**` | Exclusão mútua com agentes de ingestão enquanto mapping estiver aberto | Validar `CopilotoBitrixFieldMapping` e `ExternalCrmStageMapping` |
| `55` | **Ícaro** | `SQUAD50-55-EMAIL-SMTP-IMAP` | **PREPARADO** | `agente/55-squad50-email` | `onda6/wt-55-email` | `32d07c375` → — | `src/lib/integrations/email/**` | Alinhado com `99 — Vito` (sanitização CRLF / `nodemailer`) | Auditar SMTP/IMAP, parsing, anexos e deduplicação de histórico |
| `56` | **Luna** | `ONDA4-56-WHATSAPP` | **PREPARADO** | `agente/56-whatsapp-onda4` | `dem-20261123-onda4/wt-56-whatsapp` | `32d07c375` → — | `src/lib/integrations/whatsapp/**` | Worktree já criado na Onda 4; independente de 51–54 | Auditar sessões Baileys/Meta API, reconexão, anti-ban e `WhatsAppMessage` |
| `57` | **Nico** | `SQUAD50-57-CALENDAR-SYNC` | **PREPARADO** | `agente/57-squad50-calendar` | `onda6/wt-57-calendar` | `32d07c375` → — | `src/lib/integrations/calendar/**` | Interface com `45 — Otto` (Agenda CRM) | Validar Google Calendar, Outlook, Meet links, TZ e deduplicação |
| `58` | **Elisa** | `SQUAD50-58-ERP-ENRICHMENT` | **PREPARADO** | `agente/58-squad50-erp` | `onda6/wt-58-erp` | `32d07c375` → — | `src/lib/integrations/erp/**` | Interface com `74 — Luca` (market intelligence CNPJ) | Auditar conectores CNPJ/Receita/ERP, rate limits e integridade |
| `59` | **Ruy** | `SQUAD50-59-SYNC-OBSERVABILITY` | **PREPARADO** | `agente/59-squad50-sync-obs` | `onda6/wt-59-sync-obs` | `32d07c375` → — | `src/lib/integrations/monitoring/**` | Preserva mitigações B-11 e B-12 | Auditar detecção de drift, falhas silenciosas e métricas de reconciliação |

---

### Squad 60 · Voz, Telefonia e Mensageria Omnichannel (Coord.: `60 — Aurora`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `60` | **Aurora** | `SQUAD60-60-COORD-OMNICHANNEL` | **PREPARADO** | `agente/60-squad60-coord-voz` | `onda5/wt-60-coord-voz` | `32d07c375` → — | `src/features/voice-hub/index.ts` | Consolida 10 jornadas de voz/mensageria após entrega de `65 — Lena` | Emitir relatório funcional por canal (mocks vs real) |
| `61` | **Nando** | `SQUAD60-61-VOIP-HOTSPOT9` | **PREPARADO** | `agente/61-squad60-voip-sip` | `onda4/wt-61-voip` | `32d07c375` → — | `src/features/voice-hub/voip/**`, `src/features/voice-hub/sip/**` | Hotspot #9 (`workflowRuntimeService.ts` ~1480 linhas, vencimento 30/11) | Decompor motor IVR (`workflowRuntimeService.ts`) e auditar sinalização SIP/WebRTC |
| `62` | **Sol** | `SQUAD60-62-AUDIO-RECORDING` | **PREPARADO** | `agente/62-squad60-recording` | `onda6/wt-62-recording` | `32d07c375` → — | `src/features/voice-hub/recording/**` | Consulta obrigatória a `07 — Íris` (LGPD) e `98 — Safira` (segredos/storage) | Auditar captura, storage seguro, retenção e permissões de áudio |
| `63` | **Lira** | `SQUAD60-63-STT-DIARIZACAO` | **PREPARADO** | `agente/63-squad60-stt` | `onda6/wt-63-stt` | `32d07c375` → — | `src/features/voice-hub/transcription/**` | Interface com `62 — Sol` e `75 — Yara` | Validar transcrição Whisper, diarização e sanitização de logs |
| `64` | **Tito** | `SQUAD60-64-VOICE-COMMANDS-B07` | **PREPARADO** | `agente/64-squad60-commands` | `onda5/wt-64-commands` | `32d07c375` → — | `src/features/voice-hub/commands/**` | Ownership disjunto de `65 — Lena`; verifica bloqueador B-07 (`command.processor.ts`) | Auditar execução real de comandos de voz e impedir falso positivo de ação |
| `65` | **Lena** | `ONDA3-65-VOICE-HUB` | **ATIVO** | `agente/65-voice-hub-onda3` | `dem-20261123-onda3/wt-65-voice-hub` | `32d07c375` → (em curso) | `src/features/voice-hub/ui/**` (e componentes visuais Voice Hub) | Slot 6 ativo (`M voiceHub.api.ts`, `M VoiceHubView.tsx`, `M LandingInnovative.tsx`); também endereça Hotspot #6 (`design-system/index.tsx`) | Congelar SHA, submeter ao Agente 09 e desmembrar barrel Hotspot #6 |
| `66` | **Kiko** | `SQUAD60-66-UNIFIED-INBOX` | **PREPARADO** | `agente/66-squad60-inbox` | `onda6/wt-66-inbox` | `32d07c375` → — | `src/features/notifications/inbox/**` | Interface com `56 — Luna` (WhatsApp) e `55 — Ícaro` (E-mail) | Validar roteamento multicanal, atribuição e isolamento por organização |
| `67` | **Teca** | `SQUAD60-67-TEMPLATES-PII` | **PREPARADO** | `agente/67-squad60-templates` | `onda6/wt-67-templates` | `32d07c375` → — | `src/features/notifications/templates/**` | Alinhada com `07 — Íris` (LGPD PII sanitizer) | Auditar placeholders, sanitização de PII e validação de conteúdo |
| `68` | **Paco** | `SQUAD60-68-REALTIME-WS-SSE` | **PREPARADO** | `agente/68-squad60-realtime` | `onda6/wt-68-realtime` | `32d07c375` → — | `src/features/notifications/realtime/**` | Interface com `84 — Pia` (Push Mobile) | Auditar WebSockets/SSE, heartbeat, backoff, backpressure e deduplicação |
| `69` | **Eli** | `SQUAD60-69-OPT-OUT-COMPLIANCE` | **PREPARADO** | `agente/69-squad60-optout` | `onda6/wt-69-optout` | `32d07c375` → — | `src/features/notifications/opt-out/**` | Interface com `08 — Dora` (revogação de consentimento) | Validar STOP, preferências por canal e bloqueio efetivo de disparo |

---

### Squad 70 · IA, Automações e Enxame Autônomo (Coord.: `70 — Orion`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `70` | **Orion** | `SQUAD70-70-COORD-IA` | **PREPARADO** | `agente/70-squad70-coord-ia` | `onda5/wt-70-coord-ia` | `32d07c375` → — | `src/lib/ai/index.ts` | Governa separação estrita entre Agentes de Engenharia (00–99) e Agentes de Runtime | Publicar catálogo de agentes de runtime, permissões e custos |
| `71` | **Clara** | `SQUAD70-71-AGENT-RUNTIME` | **PREPARADO** | `agente/71-squad70-runtime` | `onda5/wt-71-runtime` | `32d07c375` → — | `src/lib/ai/agents/**` | Interface com `23 — Pina` (filas) e `78 — Oz` (quotas) | Auditar ciclo de vida, memória, estados e isolamento de execução |
| `72` | **Ada** | `SQUAD70-72-TOOL-CALLING-B08` | **PREPARADO** | `agente/72-squad70-tools` | `onda5/wt-72-tools` | `32d07c375` → — | `src/lib/ai/tools/**` | Verifica bloqueador B-08 (`src/lib/ai/tools/registry.ts`) | Comprovar disponibilidade real de tools, schemas, permissões e observabilidade |
| `73` | **Numa** | `SQUAD70-73-RAG-PGVECTOR` | **PREPARADO** | `agente/73-squad70-rag` | `onda6/wt-73-rag` | `32d07c375` → — | `src/lib/ai/rag/**`, `src/lib/ai/vector-db/**` | Interface com `13 — Nilo` (isolamento tenant em buscas vetoriais) | Validar ingestão, embeddings, PgVector e isolamento multi-tenant no RAG |
| `74` | **Luca** | `SQUAD70-74-COPILOTO-HOTSPOT8` | **PREPARADO** | `agente/74-squad70-copiloto` | `onda4/wt-74-copiloto` | `32d07c375` → — | `src/features/ai-copilot/**` | Hotspot #8 (`marketIntelligenceCompany.service.ts` 1016 linhas, vencimento 30/11) | Extrair helpers (> 50 linhas) do Hotspot #8 e auditar Copiloto Comercial |
| `75` | **Yara** | `SQUAD70-75-NLP-SENTIMENTO` | **PREPARADO** | `agente/75-squad70-nlp` | `onda6/wt-75-nlp` | `32d07c375` → — | `src/lib/ai/nlp/**` | Interface com `63 — Lira` (transcrições) | Auditar resumo, sentimento, extração e tratamento de falhas NLP |
| `76` | **Dex** | `SQUAD70-76-AUTOMACOES-HOTSPOT7` | **PREPARADO** | `agente/76-squad70-automacoes` | `onda4/wt-76-automacoes` | `32d07c375` → — | `src/features/automations/**` | Hotspot #7 (`intelligence.routes.ts` ~1060 linhas, vencimento 30/11) | Fatiar `intelligence.routes.ts` em sub-routers e auditar idempotência de workflows |
| `77` | **Gaia** | `SQUAD70-77-GUARDRAILS` | **PREPARADO** | `agente/77-squad70-guardrails` | `onda5/wt-77-guardrails` | `32d07c375` → — | `src/lib/ai/guardrails/**` | Interface com `99 — Vito` (AppSec) | Auditar defesa contra prompt injection externo, jailbreak e vazamento de PII |
| `78` | **Oz** | `SQUAD70-78-FINOPS-TOKENS` | **PREPARADO** | `agente/78-squad70-finops` | `onda6/wt-78-finops` | `32d07c375` → — | `src/lib/ai/finops/**` | Interface com `27 — Vic` (entitlements por plano) | Auditar orçamento de tokens, prompt caching, cotas por tenant e circuit breaker |
| `79` | **Mina** | `SQUAD70-79-EVALS` | **PREPARADO** | `agente/79-squad70-evals` | `onda6/wt-79-evals` | `32d07c375` → — | `tests/evals/**` | Consome entregas de `71` a `78` | Executar suite reproduzível de evals (qualidade, segurança e regressão) |

---

### Squad 80 · Mobile & Experiência Multiplataforma (Coord.: `80 — Navi`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `80` | **Navi** | `SQUAD80-80-COORD-MOBILE` | **PREPARADO** | `agente/80-squad80-coord-mobile` | `onda5/wt-80-coord-mobile` | `32d07c375` → — | `src/mobile/index.ts` | Registra matriz de executabilidade Windows vs Android vs iOS (bloqueio real macOS/Xcode) | Consolidar matriz de compatibilidade multiplataforma |
| `81` | **Enzo** | `SQUAD80-81-CAPACITOR-CORE` | **PREPARADO** | `agente/81-squad80-capacitor` | `onda5/wt-81-capacitor` | `32d07c375` → — | `capacitor.config.ts`, `src/mobile/plugins/**` | Precedência sobre `82 — Davi` e `83 — Ceci` | Auditar bridges nativas, plugins e permissões em `capacitor.config.ts` |
| `82` | **Davi** | `SQUAD80-82-ANDROID-PIPELINE` | **PREPARADO** | `agente/82-squad80-android` | `onda6/wt-82-android` | `32d07c375` → — | `android/**` | Pode rodar em paralelo com `83 — Ceci` após `81 — Enzo` | Auditar Gradle, manifests, permissões e build Android local |
| `83` | **Ceci** | `SQUAD80-83-IOS-CONFIG-AUDIT` | **BLOQUEADO** (Parcial: Build Nativo) / **PREPARADO** (Auditoria Estática) | `agente/83-squad80-ios` | `onda6/wt-83-ios` | `32d07c375` → — | `ios/**` | **BLOQUEIO REAL DE AMBIENTE:** Host Windows sem macOS/Xcode; proibida invenção de resultado de build iOS | Auditar estaticamente configurações Xcode/Info.plist/plugins e registrar bloqueio de build nativo |
| `84` | **Pia** | `SQUAD80-84-PUSH-DEEPLINKS` | **PREPARADO** | `agente/84-squad80-push-deeplinks` | `onda6/wt-84-push` | `32d07c375` → — | `src/mobile/push/**`, `src/mobile/deeplinks/**` | Preserva AppLink canônico (PR #475); interface com `68 — Paco` | Validar deep links, universal links, FCM/APNS mocks e fallback |
| `85` | **Bóris** | `SQUAD80-85-OFFLINE-FIRST` | **PREPARADO** | `agente/85-squad80-offline` | `onda5/wt-85-offline` | `32d07c375` → — | `src/mobile/offline/**` | Preserva outbox mobile (Wave E PR #451) | Auditar IndexedDB/RxDB, fila offline, resolução de conflitos e reconexão |
| `86` | **Alana** | `SQUAD80-86-MOBILE-UI` | **PREPARADO** | `agente/86-squad80-mobile-ui` | `onda6/wt-86-mobile-ui` | `32d07c375` → — | `src/mobile/ui/**` | Interface com `33 — Célia` e `34 — Ari` | Auditar gestos, tap targets, viewports pequenos e navegação mobile |
| `87` | **Tomás** | `SQUAD80-87-NATIVE-AUDIO` | **PREPARADO** | `agente/87-squad80-native-audio` | `onda6/wt-87-native-audio` | `32d07c375` → — | `src/mobile/native-audio/**` | Interface com `62 — Sol` e `65 — Lena` | Auditar permissões de microfone, contatos e bridge de voz mobile |
| `88` | **Sasha** | `SQUAD80-88-MOBILE-SECURITY` | **PREPARADO** | `agente/88-squad80-mobile-sec` | `onda5/wt-88-mobile-sec` | `32d07c375` → — | `src/mobile/security/**` | Interface com `96 — Nera` e `08 — Dora` | Auditar Keychain/Keystore, biometria e limpeza segura no logout |
| `89` | **Zico** | `SQUAD80-89-MOBILE-TELEMETRY` | **PREPARADO** | `agente/89-squad80-telemetry` | `onda6/wt-89-telemetry` | `32d07c375` → — | `src/mobile/telemetry/**` | Interface com `95 — Íon` e `07 — Íris` (sem PII em crash logs) | Auditar startup, memória, FPS e sanitização de telemetria Sentry Mobile |

---

### Squad 90 · Infraestrutura, SRE e Segurança Aplicada (Coord.: `90 — Hélio`)
| ID | Agente | Missão Atual | Status Real | Branch | Worktree | SHA Inicial → Final | Ownership Exclusivo | Dependências / Handoffs / Auditoria | Próxima Missão |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|:---|:---|
| `90` | **Hélio** | `ONDA2-90-NGINX-P007` | **CONCLUÍDO** | `agente/90-nginx-p007-onda2-dem20261123` | `dem-20261123-onda2/wt-90-nginx-p007` | `815a09305` → `be14797b6` | `infrastructure/README.md`, `nginx/birthhub360.conf` (slot Onda 2) | Parecer `09-dem-20261123-slot4-90-be14797b6.md` (`APROVADO`); integrado em `1f34c4010` | `SQUAD90-90-MATRIZ-PRONTIDAO` (consolidar prontidão versionada vs implantada) |
| `91` | **Terra** | `SQUAD90-91-IAC-AWS` | **PREPARADO** | `agente/91-squad90-iac-aws` | `onda5/wt-91-iac` | `32d07c375` → — | `infrastructure/terraform/**`, `infrastructure/aws/**` | Sem alterações em produção; auditoria estática de IaC | Auditar Terraform/AWS, IAM least-privilege, drift e configurações seguras |
| `92` | **Kora** | `SQUAD90-92-K8S-HELM` | **PREPARADO** | `agente/92-squad90-k8s-helm` | `onda5/wt-92-k8s` | `32d07c375` → — | `charts/**`, `infrastructure/k8s/**` | Interface com `93 — Max` e `98 — Safira` | Auditar Helm charts, probes readiness/liveness, resource limits e secrets |
| `93` | **Max** | `ONDA2-93-DOCKER-P007` | **CONCLUÍDO** | `agente/93-docker-onda2-dem20261123` | `dem-20261123-onda2/wt-93-docker-o2` | `815a09305` → `1074ee1a2` | `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**` | Parecer `09-dem-20261123-slot7-93-1074ee1a2.md` (`APROVADO`); integrado em `0e5d17665` (e `2596287dd` na Onda 1) | `SQUAD90-93-COMPOSE-REGRESSAO` (reconciliar handoff `e62fdd238` de compose local sem TCP 2375) |
| `94` | **Tess** | `ONDA2-94-CI-VISUAL-BASELINES` | **CONCLUÍDO** | `agente/94-ci-onda2-dem20261123` | `dem-20261123-onda2/wt-94-ci-o2` | `815a09305` → `f9196627d` | `.github/workflows/**`, `scripts/deploy/**` | Parecer `09-dem-20261123-slot5-94-f9196627d.md` (`APROVADO`); integrado em `ba22add47` (e `0372d169b` na Onda 1) | `SQUAD90-94-RELEASE-GATES-CI` (validar pipeline completo de homologação) |
| `95` | **Íon** | `SQUAD90-95-OBSERVABILIDADE` | **PREPARADO** | `agente/95-squad90-observabilidade` | `onda5/wt-95-observabilidade` | `32d07c375` → — | `infrastructure/observability/**` | Interface com `23 — Pina` (workers) e `59 — Ruy` (sync) | Auditar métricas Prometheus, alertas, OpenTelemetry e logs sem PII |
| `96` | **Nera** | `ONDA3-96-AUTH` | **ATIVO** | `agente/96-auth-onda3` | `dem-20261123-onda3/wt-96-auth` | `32d07c375` → (em curso) | `src/lib/auth/**` (exceto `src/lib/auth/rbac/**`) | Slot 7 ativo (`M password-hash.ts`, `M session.service.ts`, testes + handoff `96-para-00-session-service-morta.md`) | Congelar SHA, submeter ao Agente 09 e aguardar deliberação do 00 sobre `session.service.ts` |
| `97` | **Rocco** | `SQUAD90-97-RBAC-ENFORCER` | **PREPARADO** | `agente/97-squad90-rbac` | `onda4/wt-97-rbac` | `32d07c375` → — | `src/lib/auth/rbac/**` | Isolado de `96 — Nera`; preserva B-01/B-02 (`enforcer.ts`) | Auditar cobertura RBAC fail-closed em todas as rotas administrativas e de tenant |
| `98` | **Safira** | `SQUAD90-98-SECRETS-VAULT` | **PREPARADO** | `agente/98-squad90-secrets` | `onda5/wt-98-secrets` | `32d07c375` → — | `infrastructure/secrets/**` | Preserva B-04 (`vault.ts`); proibida rotação real de segredos sem aprovação humana | Auditar cofre de segredos, prevenção de vazamento de env e plano de rotação |
| `99` | **Vito** | `ONDA2-99-APPSEC-HOTSPOTS-TRIVY` | **CONCLUÍDO** | `agente/99-appsec-onda2-dem20261123` | `dem-20261123-onda2/wt-99-appsec` | `815a09305` → `54d10014a` | `scripts/security/**` (exceto RLS do 13), `.semgrep.yml`, `.trivyignore.yaml` | Parecer `09-dem-20261123-slot1-99-54d10014a.md` (`APROVADO`); integrado em `32d07c375` | `SQUAD90-99-PODA-TRIVY-GRUPO-C` (remover waivers Grupo C saneados e validar bump Grupo A) |

---

## 4. Matriz de Dependências Inter-Squads e Regras de Exclusão Mútua

```
[Squad 10: Dados/Schema (11, 12, 13, 15)]
       │
       ├──► [Squad 20: Core Backend & Contratos (20, 21, 22, 23, 24)]
       │           │
       │           ├──► [Squad 40: CRM & Receita (41, 42, 44, 45, 49)]
       │           ├──► [Squad 50: Integrações & Bitrix24 (51 ──► 52 ──► 53 ──► 54, 56)]
       │           ├──► [Squad 60: Voz & Omnichannel (61, 64, 65, 66, 68, 69)]
       │           └──► [Squad 70: IA, Tools & Automações (71, 72, 74, 76, 77)]
       │
       ├──► [Squad 30: Produto, UX, A11Y & Design System (31, 33, 34, 36)]
       │           └──► [Squad 80: Mobile & Offline-First (81 ──► 82 // 83, 85, 88)]
       │
       └──► [Squad 90: Infra, Auth, RBAC & AppSec (90, 93, 94, 96, 97, 98, 99)]
                   │
                   └──► [Squad 00: QA, LGPD, Realidade & Gate Final (01..08 ──► 09 Silas ──► 00 Astra)]
```

### Regras Estritas de Exclusão Mútua (AGENTS.md §14 e Prompts Squads 00–90)
1. **Schema & Migrações:** `11 — Pietro` (`prisma/schema.prisma`) e `12 — Vera` (`prisma/migrations/**`) nunca executam em paralelo entre si nem com agentes que dependam de alteração bloqueadora de schema.
2. **Filas vs. DLQ:** `23 — Pina` (`src/lib/queue/**`, `src/workers/**`) e `24 — Ivo` (`src/lib/resilience/**`, `src/lib/queue/dlq/**`) possuem exclusão mútua; `23` está proibido de tocar `src/lib/queue/dlq/**`.
3. **Middlewares vs. Rate Limit:** `25 — Tália` detém propriedade exclusiva sobre `src/api/middlewares/rate-limit.ts`; `22 — Hugo` está proibido de editar este arquivo.
4. **App Shell & Rotas:** `31 — Noa` (`src/App.tsx`, `src/components/layout/**`) possui slot exclusivo para alterações de rotas/navegação central.
5. **CRM Kanban/Agenda vs. Cadências:** `42 — Lívia` e `45 — Otto` (ativos na Onda 3) concluem seus commits e handoffs (`42↔44` e `45→44`) antes da ativação do slot de `44 — Lola` (preparada na Onda 4).
6. **Cadeia Bitrix24:** `51 — Bela` (Auth), `52 — Lino` (Batch), `53 — Vega` (Webhooks) e `54 — Rita` (Mapping) nunca executam simultaneamente sobre contratos compartilhados. Sequência obrigatória: `51 → 54 → 52 → 53`.
7. **Voice Hub UI vs. Comandos:** `65 — Lena` (`src/features/voice-hub/ui/**`) e `64 — Tito` (`src/features/voice-hub/commands/**`) não podem realizar edição cruzada.
8. **Auth vs. RBAC:** `96 — Nera` (`src/lib/auth/**`) está proibida de modificar `src/lib/auth/rbac/**`, de propriedade exclusiva de `97 — Rocco`.
9. **Auditoria Independente:** `09 — Silas` nunca audita nem aprova a própria entrega e ocupa slot reservado permanente na fila global.

---

## 5. Bloqueadores Prioritários, Prazos Críticos e Decisões Humanas Pendentes

### 5.1 Prazos Críticos de Segurança e Arquitetura (Vencimento em 29/11 e 30/11/2026)
1. **11 Exceções de Hotspots Arquiteturais (`docs/architecture/HOTSPOT_EXCEPTIONS.md` — Vencimento: 29–30/11/2026):**
   - Auditados individualmente por `99 — Vito` (`54d10014a`, parecer `APROVADO`).
   - **Proibida renovação automática.** Se não fatiados até 30/11, `npm run check:hotspots` quebrará o CI (`exit 1`).
   - **Plano de Despacho Imediato (Ondas 3, 4 e 5):**
     - Hotspot #6 (`src/features/voice-hub/components/design-system/index.tsx`): atribuído a `65 — Lena` (Slot 6 Onda 3 / follow-up).
     - Hotspots #1 e #2 (`Landing360.tsx` e `Landing360Impeccable.tsx`): atribuídos a `36 — Léo` (Onda 4).
     - Hotspot #11 (`PillarRegistry.tsx`): atribuído a `33 — Célia` (Onda 4).
     - Hotspots #5 e #10 (`leads.routes.ts` e `LeadDetailDrawer.tsx`): atribuídos a `41 — Cadu` (Onda 4).
     - Hotspot #3 (`extraction.ts`): atribuído a `52 — Lino` (Onda 5, após `51 — Bela`).
     - Hotspot #4 (`CommercialIntelligence.ts`): atribuído a `49 — Malu` (Onda 5).
     - Hotspot #7 (`intelligence.routes.ts`): atribuído a `76 — Dex` (Onda 4).
     - Hotspot #8 (`marketIntelligenceCompany.service.ts`): atribuído a `74 — Luca` (Onda 4).
     - Hotspot #9 (`workflowRuntimeService.ts`): atribuído a `61 — Nando` (Onda 4).

2. **36 Waivers Trivy (`.trivyignore.yaml` — Vencimento: 30/11/2026):**
   - Auditados e desmembrados por `99 — Vito` em `54d10014a`:
     - **Grupo A (Produção Real — Ação Crítica):** `better-auth`, `dompurify`, `nodemailer` → manter mitigação em camadas e testar bump não-disruptivo de `dompurify` (`>=3.2.0`) e `nodemailer` na Squad 90.
     - **Grupo B (Build/CLI/Testes — Risco Nulo em Runtime):** `deepmerge-ts`, `effect` (Prisma CLI), `picomatch`, `brace-expansion`, `@vitest/mocker` → manter escopo restrito a dev/build.
     - **Grupo C (Obsoletos/Saneados no `package-lock.json`):** `source-map-js`, `undici`, `re2js` → podar do `.trivyignore.yaml` na próxima missão de `99 — Vito`.

### 5.2 Handoffs Técnicos e Dívidas Estruturais em Reconciliação
1. **Handoff `96-para-00-session-service-morta.md` (Agente 96 — Nera → Agente 00 — Astra):**
   - `src/lib/auth/session.service.ts` (RTR em memória criado para B-03) não é consumido pelo runtime real (que utiliza Better Auth persistido em PostgreSQL em `src/lib/auth.ts` + `src/bootstrap/auth.ts`).
   - **Deliberação do Coordenador 00:** Adotar a **Opção 3 (Documentação explícita de contrato de referência / reserva de auditoria B-03 + limpeza de vazamento de Map em testes)** durante a Onda 3 para não quebrar a rastreabilidade do gate B-03, submetendo ao Orquestrador Humano a decisão final entre Opção 1 (remoção definitiva) ou Opção 2 (persistência Prisma).
2. **Investigações `isAuditableModel` / `deleteReason` (Agente 20 — Ciro):**
   - Em andamento no Slot 1 da Onda 3 (`wt-20-core-backend`). Caso exija alteração em `prisma/schema.prisma`, abrirá handoff formal para `10 — Mara` e `11 — Pietro`.
3. **Marcadores de conflito legados em `.agents/audits/technical-debt/2026-11-19/CHECKLIST_RESOLUCAO_ONDAS.md` (linhas 92 e 96):**
   - Apontados pelo Agente 09 no parecer `b02efad9e` como herdados da baseline pré-Onda 1. Agendado para saneamento pelo Agente 00/01 na consolidação da Onda 3.
4. **Bloqueio Real de Ambiente Mobile iOS (`83 — Ceci`):**
   - Host operacional Windows (`C:\Github\Birthub-360`) não dispõe de macOS/Xcode. Classificado como **BLOQUEIO REAL** (Protocolo §3): `83 — Ceci` executa auditoria estática completa de `ios/**`, proibida qualquer simulação ou invenção de build iOS aprovado.
5. **Divergência entre Clones `D:\Birthub-360` e `C:\Github\Birthub-360`:**
   - Conforme registrado no despacho da Onda 3 (`027f42b18`), o repositório autoritativo que governa todas as worktrees das Ondas 1 a 4 é `C:\Github\Birthub-360` (e `C:\Github\Birthub-360-worktrees\dem-20261123-*`). O clone `D:\Birthub-360` possui deleções locais no working tree e não deve ser utilizado para despacho ou merge.
