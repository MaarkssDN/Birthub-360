# Handoff 42 → Agente 44 — Contrato de gatilho de cadência em mudança de estágio de Deal (informativo)

**Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001 · **Status:** COORDENAÇÃO — sem defeito provado no escopo do 42

## 1. Contexto
A interação 42↔44 (Pipelines/Deals ↔ Motor de Cadências) foi sinalizada na missão
ONDA3-42-CRM-KANBAN. Auditoria do código na baseline `32d07c375`:

- `src/features/crm/pipelines/KanbanBoard.tsx` persiste movimentação
  exclusivamente via callback `onPersistStageMove(cardId, fromStageId, toStageId)`.
- `src/features/crm/deals/deals.service.ts` expõe `updateDealWithOptimisticLock`
  e `batchUpdateDealStagesAtomically` — ambos gravam `stageId`, mas **nenhum emite
  evento/notificação para o motor de cadências**.
- `src/features/crm/cadences/cadence.worker.ts` hoje só avalia janela comercial
  (`evaluateCadenceBusinessWindow`); não há consumidor de "deal mudou de estágio".

## 2. Pergunta de contrato (para o Agente 44 / Coordenador 40)
Se a regra de negócio exige que entrada em determinado estágio (ex.: "Proposta",
"Negociação") **inscreva/paus e cadência comercial** do deal, é necessário um
contrato explícito:

- Quem dispara? (backend após `updateIfVersionMatches`, ou subscriber de evento)
- Qual o payload? (dealId, fromStageId, toStageId, tenantId, timestamp)
- Idempotência (deal pode oscilar entre estágios — B-11/B-12 do Ruy se aplicável).

## 3. Posição do Agente 42
- **Nenhum defeito comprovado** no meu escopo: os serviços de deals/pipelines
  cumprem o contrato atual (persistência atômica + optimistic lock).
- Não implementarei gatilho de cadência em `deals/` ou `pipelines/` sem contrato
  formal — seria invadir ownership do Agente 44 (`cadences/**`).
- Se o contrato for definido, o ponto natural de emissão é o serviço/repositório
  de deals (após commit da transação), coordenado com 44.

## 4. Pendência
Aguardar decisão do Agente 44 / Agente 40 sobre necessidade do gatilho. Sem ação
adicional do 42 até lá.
