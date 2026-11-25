# Handoff 42 → Agente 04 — Investigação POS3-42-STAGE-TRANSITIONS: achados fora do ownership 42

De: Agente 42 — Lívia (Pipelines, Deals e Estágios, Squad 40)
Para: Agente 04 — CRM e BI
Onda: 4 (continuação do handoff `onda-3/42-para-04-kanban-transicoes-sem-maquina-de-estados.md`)
Status: aberto
Prioridade: alto
Bloqueador-ref: nenhum
Sprint destino: a definir pelo coordenador

## Problema

A missão POS3-42-STAGE-TRANSITIONS investigou as transições de estágio ponta a ponta.
Dentro do meu ownership (`src/features/crm/deals/**`, `src/features/crm/pipelines/**`,
`src/features/crm360/**`) corrigi 2 bugs comprovados (ver relatório da missão). Os achados
abaixo estão fora do meu ownership ou dependem de decisão de produto — não editei esses
arquivos.

## Achados que precisam do Agente 04

### 1. Movimentação cross-funnel silenciosa via `PUT /api/crm/records/:id/stage` (decisão de produto)

`PrismaCrm360Repository.updateLeadStage` grava `funnel` derivado de
`stage.pipeline.entity` em TODA movimentação. Um lead `funnel=Lead` movido para etapa de
pipeline `Negocio` vira negócio sem passar por `convertLead` (sem timeline de conversão,
sem etapa inicial do funil de negócios); e vice-versa. Não implementei bloqueio porque o
teste de integração existente `tests/integration/rbac-e2e-crm-operations.test.ts:112`
("SDR move de verdade (200)") move um lead `funnel=Lead` (LeadFactory não seta funnel)
para etapa do pipeline Negócio e espera 200 — ou seja, o comportamento está entranhado em
teste de outro dono (Agente 08). Precisa de decisão: ou se bloqueia cross-entity (e o
teste do 08 é revisto), ou se documenta que esta rota É um caminho de conversão alternativo.

Arquivo: `src/features/crm360/infra/PrismaCrm360Repository.ts` (`updateLeadStage`, ~L439-456).

### 2. Par `pipelineId`/`pipelineStageId` divergente via `PUT /api/leads/:id` (bug provável, ownership 04)

`PrismaLeadRepository.update` → `assertLeadRelationsInTenant`
(`src/features/crm/infra/PrismaLeadRepository.ts:60-97`) valida `pipelineId` e
`pipelineStageId` INDEPENDENTEMENTE contra o tenant, mas não valida que a etapa pertence
ao pipeline informado. Um payload `{ pipelineId: A, pipelineStageId: <etapa do pipeline B> }`
persiste o par inconsistente (ambos válidos no tenant), e como `syncsPipelineToStatus` fica
false, nada corrige depois. Sugestão: quando ambos vierem no payload, exigir
`stage.pipelineId === data.pipelineId`.

### 3. `findMatchingPipelineStage` sem ordenação determinística

`src/features/crm/infra/PrismaLeadRepository.ts:32-49` — `findFirst` sem `orderBy` quando
existem 2+ etapas com o mesmo `leadStatus` no mesmo pipeline (schema permite:
`@@unique([pipelineId, code])` só). A sincronia `status → pipelineStageId` do CRM-011 pode
escolher etapa arbitrária. Adicionar `orderBy: { sortOrder: 'asc' }` (ou equivalente)
resolve.

### 4. Dois caminhos de transição divergentes (contrato)

- `PUT /api/leads/:id { status }` → muda `Lead.status` (enum fixo) e sincroniza
  `pipelineStageId` via `findMatchingPipelineStage` (CrmBoard.tsx usa este).
- `PUT /api/crm/records/:id/stage { stageId }` → muda `pipelineStageId`/`pipelineId`/
  `funnel`/`probability` e sincroniza `status` a partir de `stage.leadStatus`.

Ambos escrevem `LeadStageHistory` separadamente. Não há máquina de estados em nenhum dos
dois (reconfirma o handoff da Onda 3). Decisão de produto pendente: transições válidas,
estágios terminais won/lost, motivo obrigatório em perda — ver handoff anterior.

### 5. `getBoardLeads` aceita `pipelineId` de qualquer pipeline do tenant

`PrismaCrm360Repository.getBoardLeads` (crm360, mas a decisão de UX/filtro é de produto/04):
o `pipelineId` da query não é conferido contra `entity`/`active` — pedir o board de um
pipeline de Leads com `funnel=Negocio` retorna lista vazia silenciosa. Baixa prioridade.

## O que EU corrigi nesta missão (dentro do ownership)

Em `src/features/crm360/**` (commit nesta branch):

1. **Pipeline inativo/removido rejeitado** — `updateLeadStage` agora lança 422 quando a
   etapa pertence a `CrmPipeline` com `active=false` ou `deletedAt` preenchido. Antes, um
   deal movido para etapa de pipeline desativado ficava com `pipelineId` órfão de board
   (invisível em `getBoardLeads`, que só resolve pipeline default ativo) mas seguia
   contando como negócio aberto nos KPIs do overview.
2. **Lead soft-deletado não pode ser movido** — lookup do lead em `updateLeadStage` agora
   exige `deletedAt: null` (404 via P2025→errorHandler).
3. **`expectedCloseDate` validada** — `moveCrmRecordSchema` aceita o campo opcional com
   `Date.parse`; antes uma string inválida virava `Invalid Date` truthy e estourava 500
   no Prisma em vez de 400.

## Teste esperado (para o Agente 04)

- Testes de INTEGRAÇÃO das transições de estágio (pedido explícito da missão):
  cobrir `PUT /api/crm/records/:id/stage` e `PUT /api/leads/:id {status}` para:
  transição válida, etapa de pipeline inativo (agora 422), lead deletado (404),
  data inválida (400), e o cenário cross-funnel do achado 1 assim que decidido.
- Reproduzir o par divergente `pipelineId`/`pipelineStageId` do achado 2 e confirmar o
  bug antes de corrigir (posso ajudar com a reprodução se necessário).

## Contexto adicional

- `src/features/crm/deals/deals.service.ts` (`DealsService`) e
  `src/features/crm/pipelines/KanbanBoard.tsx` seguem SEM caller de produção — só testes.
  Reafirmo o ponto 4 do handoff da Onda 3: confirmar se a integração é pendência ou se os
  módulos devem ser removidos/arquivados.
- Sem máquina de estados: qualquer estágio → qualquer estágio do mesmo tenant continua
  permitido (decisão de produto pendente, não bug corrigível unilateralmente).
