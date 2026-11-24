# Consolidação de Handoffs — Squad 40 (CRM, Pipeline e Ciclo de Receita)

- De: 40 — Ravi (Coordenador Squad 40)
- Para: Agentes do Squad 40 e Coordenador Global (00 — Astra)
- Onda/Demanda: DEM-20261123-001 (pós-Onda 3, topologia de squads)
- Data: 2026-11-24
- Base auditada: `93e82c220` (`integracao/onda-3-dem20261123`)
- Status: consolidado — veredicto por item abaixo

Este documento consolida todos os handoffs do Squad 40 localizados em
`.agents/handoffs/onda-3/` e revisões em `.agents/reviews/`. É o mapa oficial
de pendências do squad a partir da Onda 3.

## A. Handoffs internos do squad — veredicto

| Handoff | De → Para | Veredicto do coordenador |
|---|---|---|
| `onda-3/42-para-40-kanban-components-role-button-sem-handler.md` | 42 → 40 | **RESOLVIDO** — corrigido pelo próprio 40 (`f75c27f1f`, parecer `09-dem-20261123-slot40-f3fc2f203` APROVADO); resposta em `40-para-42-...-resolvido.md` |
| `onda-3/34-para-40-crm-kanbanboard-a11y.md` | 34 → 40 | **RESOLVIDO** — mesmo commit `f75c27f1f`; `components/KanbanBoard.tsx` saneado (sem role/tabIndex sem handler) |
| `onda-3/40-para-00-components-ownership-gap.md` | 40 → 00 | **RESOLVIDO com pendência de publicação** — parecer do 09 regularizou `src/features/crm/components/**` para o 40; falta refletir na MATRIZ_PROPRIEDADE (via Astra) |
| `onda-3/42-para-44-kanban-stage-move-vs-cadencias.md` | 42 → 44 | **DEFERIDO (decisão do coordenador)** — não há defeito nem contrato de gatilho de cadência em mudança de estágio. Criar gatilho exige regra de negócio formal (quem dispara, payload, idempotência). Registrado como débito de produto para backlog 44/46; nenhum código será escrito sem contrato aprovado |
| `onda-3/42-para-04-kanban-transicoes-sem-maquina-de-estados.md` | 42 → 04 (legado) | **ESCALADO** — no roster atual não existe "Agente 04" CRM; `CrmBoard.tsx`/`crm360/**` carecem de owner explícito. Candidato: squad-40 (46 Sofia) para a semântica de ganho/perda. Aguardando designação do Astra |
| `onda-3/45-para-04-atividades-agenda-bugs.md` | 45 → 04 (legado) | **RESOLVIDO** — ownership de `src/features/activities/**` foi para o 41; correções entregues e aprovadas no SHA `59738d5cf` (resposta em `41-para-45-atividades-bugs-resolvidos.md`) |
| `onda-3/45-para-05-prospecting-tasks-authz.md` | 45 → 05 (legado) | **RESOLVIDO-CONDICIONAL** — verificado na base `93e82c220`: `canActOnUserTasks` (self ou gestor) protege `GET /users/:userId/tasks` e o body não aceita `userId` arbitrário (`tasks.routes.ts` ~L23-130, 253-259). Resta apenas a reabertura do módulo, bloqueada por `unavailableLegacyModule('outbound')` — decisão humana pendente |
| `onda-3/22-para-43-tasks-idor-contexto.md` | 22 → 43 | **RESOLVIDO-CONDICIONAL** — mesma correção acima (ownership regularizado para 43, parecer `2fc7570d0`). Idem: módulo segue gated até decisão de reabertura |
| `onda-3/44-para-17-cadence-optout-sujeito-parcial.md` | 44 → 17 (legado) | **RESOLVIDO** — "17" não existe no roster atual; follow-up `ONDA3-44-CADENCE-FIX` (`fea9d698b`, parecer `parecer-44-cadence-fix-fea9d698b`) tratou os 2 achados sob ownership estendido do 44 (`src/features/cadence/**` regularizado por `44-para-00-ownership-cadence-fix.md`) |
| `onda-3/44-para-17-cadence-worker-sequencia-sem-tenant.md` | 44 → 17 (legado) | **RESOLVIDO** — idem |

## B. Handoffs cross-squad abertos

| Handoff | De → Para | Status | Ação do squad-40 |
|---|---|---|---|
| `onda-3/45-para-06-hubtasks-bitrix.md` | 45 → 06 (legado, Bitrix) | aberto | **ESCALAR** — `src/features/integrations/bitrix/hubTasks.*` está fora da matriz do Squad 50 (`src/lib/integrations/**`). IDOR em `POST /hub-tasks/:id/toggle` (sem check CREATED_BY/RESPONSIBLE_ID) + filtro `CREATED_BY` que esconde tarefas delegadas. Aguarda designação de owner pelo Astra |
| `onda-3/43-para-50-hubtasks-bitrix-authz.md` | 43 → 50 | aberto | **ESCALAR** — mesmo achado, reconfirmado pelo 43. Handoff formal para Squad 50 assim que owner for publicado |
| `onda-3/99-para-43-prospecting-ssrf-e-log-injection.md` | 99 → 43/41 | aberto | **BACKLOG INTERNO** — missão `SQUAD40-43-APPSEC` planejada (SSRF `ollamaUrl`, log-injection ~6 pts, ReDoS validators, substring-sanitization ~15 pts; rate-limit → handoff a 25 — Tália) |
| `onda-3/44-para-00-ownership-cadence-fix.md` | 44 → 00 | resolvido | Registrado: ownership `src/features/cadence/**` → 44 confirmado por parecer; pendente só publicação na MATRIZ |

## C. Pendências de ownership a escalar ao Astra (00)

1. `src/features/calendar/**` — sem dono na MATRIZ (citado por 41 e 45). Candidatos:
   45 (Otto — agenda) ou 57 (Nico — integrações de calendário).
2. `src/features/integrations/**` (hubTasks Bitrix) — sem dono na MATRIZ. Candidatos:
   50 (Atlas) ou 51 (Bela). Bloqueia remediação do IDOR.
3. `src/features/crm/components/**` — regularizado para 40 por parecer; publicar na MATRIZ.
4. `src/features/prospecting/**` — regularizado para 43 por parecer; publicar na MATRIZ
   (AGENTS.md local ainda diz "Agente 05" legado — divergência a reconciliar).
5. `src/features/cadence/**` — regularizado para 44; publicar na MATRIZ.
6. `src/features/crm360/**` e `src/components/CrmBoard.tsx` — sem owner; relevante para
   o débito "máquina de estados de pipeline" (handoff 42→04).
7. `tests/unit/**` — propriedade ambígua (03/08); o 41 já fez edições mínimas justificadas.
   Padronizar regra de "teste diretamente ligado ao escopo do executor".

## D. Itens herdados de ondas anteriores (referência)

- `.agents/handoffs/onda-40/` (2 arquivos — legado, domínio CRM/BI antigo):
  `00-para-frontend-savedsearch-promote-ui.md` (UI, squad-30) e
  `06-para-16-bitrix-extraction-purge-worker-ausente.md` (squad-50/10) — ambos
  cross-squad legados, sem ação do squad-40 além de rotear.
- `.agents/handoffs/onda-49/00-para-01-playbook-insight-schema-proposal.md` —
  proposta de schema para playbook insights → squad-10 (11 Pietro) quando o 47 Dante
  iniciar `crm/routing/**` + playbooks.
- Backlog squad-40: agentes 46 (forecast), 47 (routing/playbooks), 48 (dedup), 49 (BI)
  nunca executaram — esqueleto de services existe em `crm/{forecast,routing,deduplication,analytics}`.
  Detalhamento no plano `.agents/runs/squads/squad-40-plano.md` §4.
