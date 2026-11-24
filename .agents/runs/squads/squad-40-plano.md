# PLANO DO SQUAD 40 — CRM, Pipeline e Ciclo de Receita

- Coordenador: **40 — Ravi**
- Demanda: DEM-20261123-001
- Data: 2026-11-24
- Branch: `coord/squad-40`
- Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-40/wt-coord`
- Base: `93e82c220` (`integracao/onda-3-dem20261123` — SHA congelado da Onda 3)
- Postura: NO-GO até homologação e decisão humana.

## 1. Topologia adotada

Conforme `.agents/runs/estrutura-10-coordenadores-squads-20261124.md` §2:

- Worktrees dos executores em `C:/Github/Birthub-360-worktrees/squads/squad-40/wt-<id>`.
- Branches `agente/<id>-<slug>-s40`.
- Branch de integração do squad: `integracao/squad-40` (criar no primeiro merge de executor).
- Fluxo: Especialista → Ravi (merge em `integracao/squad-40`) → SHA congelado → Silas (09) → Astra.
- Portas efêmeras: **22400–22499**.
- node_modules: junction para `C:\Github\Birthub-360\node_modules` (feito).
- Lease: `.agents/runs/leases/squad-40.lease` (commitado nesta branch).
- Proibido tocar `integracao/onda-3-dem20261123` e worktrees `dem-20261123-*` para escrita.

> Nota de desvio de setup: o SHA `93e82c220` não existe no object store do clone principal
> `D:/Github/Birthub-360` (commit local da integração Onda 3, nunca enviado ao origin).
> O worktree foi criado a partir do clone detentor do objeto
> (`dem-20261123-onda3/wt-00-integracao`), na branch própria `coord/squad-40` — mesmo
> procedimento já usado por `coord/squad-10` e `coord/squad-60`. Nenhuma escrita ocorre
> nas branches/worktrees `dem-20261123-*`.

## 2. Estado real do squad (baseline 93e82c220)

Entregas Onda 3 integradas e auditadas (pareceres Agente 09 em `.agents/reviews/`):

| ID | Agente | SHA aprovado | Escopo | Observação |
|:---:|:---|:---|:---|:---|
| 40 | Ravi | `f3fc2f203` | `src/features/crm/components/**` | KanbanBoard role=button saneado; ownership formalizada por parecer |
| 41 | Cadu | `59738d5cf` | `src/features/activities/**`, `crm/contacts/**` | Off-by-one de data, leadId cross-tenant, feed.ics authz — corrigidos |
| 42 | Lívia | `47846b442` | `crm/deals/**`, `crm/pipelines/**` | Persistência de estágio Kanban + optimistic lock + rollback UI |
| 43 | Amon | `2fc7570d0` | `src/features/prospecting/**` | Authz prospecting (IDOR tasks) corrigido; ownership regularizada |
| 44 | Lola | `aeb9004f4` | `crm/cadences/**` + `src/features/cadence/**` | Entrega diagnóstica; 2 achados de opt-out/tenant resolvidos em follow-up (`fea9d698b`) |
| 45 | Otto | `8e2c0d1e0` (R1) | `src/features/crm/tasks/**` | R2 (`2bf6ffe31`) REPROVADO por violação de ownership em `activities/**` — descartado; atividades ficaram com o 41 |

## 3. Consolidação de handoffs (executada nesta sessão)

Registro completo em `.agents/handoffs/squad-40/00-consolidacao-handoffs-onda3.md`.
Resumo do que permanece aberto e é do squad:

1. **42→44 — gatilho de cadência em mudança de estágio de Deal**: pergunta de contrato
   sem defeito provado. Decisão do coordenador: **DEFERIR** — não criar gatilho sem regra
   de negócio formal; registrar como débito de produto para backlog do 44/46. Sem ação
   de código agora.
2. **45→05/22→43 — authz de tasks em prospecting**: verificado no SHA base — guarda
   `canActOnUserTasks` presente em `tasks.routes.ts` (self ou gestor). Módulo segue
   bloqueado por `unavailableLegacyModule('outbound')` (`src/bootstrap/routes.ts:212`)
   até decisão humana de reabertura. Handoffs podem ser marcados **resolvido-condicional**.
3. **43→50 / 45→06 — hubTasks Bitrix IDOR + filtro CREATED_BY**: arquivos em
   `src/features/integrations/bitrix/**` — **fora da matriz do Squad 50**
   (`src/lib/integrations/**`) e fora do Squad 40. Escalonar ao Astra para designação
   de owner; squad-40 apoia com evidência. Handoff formal a abrir para o squad designado.
4. **99→43 — AppSec prospecting** (SSRF `ollamaUrl`, log-injection, rate-limit,
   ReDoS, substring-sanitization): ownership do 43 — entra no backlog do agente 43
   como missão de saneamento (ver §4).
5. **41→00 — ownership gaps**: `src/features/calendar/**`, `src/features/prospecting/**`
   (regularizada para 43 por parecer), `src/features/integrations/**`,
   `src/features/cadence/**` (regularizada para 44), `src/features/crm/components/**`
   (regularizada para 40). Pendentes de publicação formal na MATRIZ via Astra:
   `src/features/calendar/**` e `src/features/integrations/**` (candidatos: 45/57 e 50/51).
6. **34→40 a11y KanbanBoard stub**: resolvido pelo commit `f75c27f1f` (parecer aprovado).
7. **42→04 — máquina de estados de pipeline / campos de fechamento**: destino era o
   antigo "Agente 04"; no roster atual o domínio `crm/components/**` + `crm360/**` está
   fragmentado. Candidato natural: squad-40 (46 Sofia — forecast/metas conhece regras de
   ganho/perda) ou squad-30 para `CrmBoard.tsx` (`components/` genérico). Escalonar ao
   Astra para designação; registrar no backlog do 46.

## 4. Backlog priorizado do squad

### Onda interna squad-40 (após congelamento do SHA de integração)

| Ordem | Executor | Missão | Ownership | Prioridade | Dependências |
|:---:|:---:|:---|:---|:---:|:---|
| 1 | 46 — Sofia | `SQUAD40-46-FORECAST` — auditar `crm/forecast/**` (forecast.service.ts existe como esqueleto), validar cálculos de forecast/metas, integrar regra de ganho/perda pendente do handoff 42→04 | `src/features/crm/forecast/**` | alta | estável após 42 (já integrado) |
| 2 | 47 — Dante | `SQUAD40-47-ROUTING` — auditar `crm/routing/round-robin.ts` + `__tests__`, preservar Trilha C.2 (round-robin por score `da814442c`) | `src/features/crm/routing/**` | alta | nenhuma |
| 3 | 48 — Jade | `SQUAD40-48-DEDUP` — auditar `crm/deduplication/dedup.service.ts`, fusão segura, FKs, timeline | `src/features/crm/deduplication/**` | média | interface com 41 (contacts) e 28 (import) |
| 4 | 49 — Malu | `SQUAD40-49-BI` — `analytics/cohort.service.ts` + hotspot #4 `CommercialIntelligence.ts` (1193 linhas, vence 30/11) | `src/features/crm/analytics/**` | alta (deadline) | interface com 38 Nara (charts) |
| 5 | 43 — Amon (follow-up) | `SQUAD40-43-APPSEC` — tratar achados 99→43 (SSRF, log-injection, ReDoS, rate-limit handoff p/ 25) | `src/features/prospecting/**` | alta | handoff formal do 99 já existe |
| 6 | 41 — Cadu (follow-up) | Hotspots #5/#10: `leads.routes.ts` (1368 ln) e `LeadDetailDrawer.tsx` (1008 ln) — vencem 30/11 | `crm/leads/**`, `crm/contacts/**` | alta (deadline) | nenhuma |

### Cross-squad (handoffs formais a emitir/receber)

- **→ Astra (00)**: publicação de ownership `src/features/calendar/**` e
  `src/features/integrations/**`; designação do handler dos achados hubTasks
  (45→06/43→50); decisão sobre `unavailableLegacyModule('outbound')`.
- **→ 25 — Tália (squad 20)**: rate-limiting nas rotas auth/integrations do
  prospecting outbound (achado 99→43, item 5).
- **→ 50 — Atlas**: apoio à remediação do IDOR `hub-tasks/:id/toggle` quando o
  owner for designado.
- **→ 57 — Nico**: interface `src/lib/integrations/calendar/**` ↔ `crm/tasks`
  (handoff 45→06 parcial; `feed.ics` do 41 já entregue).
- **→ 11 — Pietro / 12 — Vera (squad 10)**: handoffs de schema pendentes da Onda 3
  (soft-delete `deletedBy`/`deleteReason`, handoffs 20→11/12 herdados).

## 5. Regras operacionais do squad

- Máximo 3 executores concorrentes (capacidade conservadora §5 da estrutura).
- Um escritor por arquivo; leases em `.agents/runs/leases/` quando houver recurso
  compartilhado (porta, banco de teste — schema/banco próprio por executor).
- Testes direcionados por missão + `npx tsc --noEmit` e lint do escopo antes de
  congelar SHA; suítes pesadas em fila.
- SHA congelado por entrega → Silas (09) → Astra promove para
  `integracao/onda-3-dem20261123` (ou sucessora).
- Handoffs do squad em `.agents/handoffs/squad-40/`; cruzados seguem o formato
  `<de>-para-<para>-<slug>.md`.
- Sem push, sem PR, sem escrita em `main`/`integracao/onda-3-dem20261123`.

## 6. Critérios de sucesso desta missão de coordenação

- [x] Worktree + branch `coord/squad-40` na base `93e82c220` verificados.
- [x] Junction `node_modules` funcional.
- [x] Lease `squad-40.lease` commitado.
- [x] Plano commitado neste arquivo.
- [x] Consolidação de handoffs executada com evidência
      (`.agents/handoffs/squad-40/00-consolidacao-handoffs-onda3.md`).
- [ ] Despacho dos executores 46/47/48/49 (próxima ação — depende de slots;
      prioridade: 46 e 47 primeiro por não terem dependências).
