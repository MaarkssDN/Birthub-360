# Handoff 42 → Agente 04 — Transições de estágio do Kanban sem máquina de estados nem validação de ganho/perda

De: Agente 42 — Lívia (Pipelines, Deals e Estágios)
Para: Agente 04 — CRM e BI (dono de `src/features/crm/components/**`, `src/components/CrmBoard.tsx`, `src/features/crm360/**`)
Onda: 3 (dem-20261123-onda3)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: a definir pelo coordenador 40/00

## Problema

A missão ONDA3-42 pedia validar "máquina de estados, transições inválidas bloqueadas,
estágio de ganho/perda tratado, campos obrigatórios". No escopo sob minha propriedade
(`src/features/crm/deals/**`, `src/features/crm/pipelines/**`) implementei o que era
possível (otimistic lock, batch atômico, rollback de UI), mas a semântica de estágios do
funil real vive fora do meu ownership:

1. **Não existe máquina de estados de pipeline.** O fluxo real é
   `CrmBoard.tsx` (Agente 04) → `PUT /api/leads/:id { status }` →
   `LeadController`/`LeadUseCases` → `PrismaLeadRepository`. Qualquer `LeadStatus`
   pode ir para qualquer outro — inclusive direto para `Negócios Ganhos` sem
   probabilidade, valor ou motivo, e para estágios de perda sem registro de motivo.
   `DealsService` (meu) também não conhece tipos de estágio (won/lost): `stageId`
   é string opaca.

2. **Campos obrigatórios de fechamento não são validados na transição.** O
   `dealClosureGate` (`src/features/crm/application/dealClosureGate.ts`) cobre parte
   do gate CYC-007, mas a transição via drag&drop do `CrmBoard` não passa por
   validação de campos do deal (valor, probabilidade, motivo de perda) antes do PUT.

3. **`src/features/crm/components/KanbanBoard.tsx:19`** ainda tem
   `<div role="button" tabIndex={0}>` sem handler — já coberto pelo handoff
   `00-para-04-kanbanboard-role-button-sem-handler.md` (Onda 1, A11Y-002);
   registrado aqui apenas como contexto, não duplicar.

4. **`src/features/crm/pipelines/KanbanBoard.tsx` (meu componente) não está montado
   em nenhuma rota/tela** — só é exercido por testes unitários. Se a intenção da
   Onda 3 era ter um board com botões de mover acessíveis por teclado em produção,
   falta alguém integrá-lo (provavelmente Agente 04/02). Confirmar se é
   intencional ou pendência.

## Arquivo(s) envolvido(s)

- `src/components/CrmBoard.tsx` (Agente 04) — `handleDragEnd` faz PUT direto de `status`.
- `src/features/crm/presentation/LeadController.ts`, `src/features/crm/application/LeadUseCases.ts` — sem validação de transição.
- `src/features/crm/routes/lead.routes.ts` — PUT `/api/leads/:id`.
- `src/features/crm/pipelines/KanbanBoard.tsx` (Agente 42) — board standalone corrigido nesta onda.

## Evidência

- `grep -rn "updateLeadStage\|stage" src/features/crm360/**` mostra que o domínio
  crm360 também trata estágio como string sem máquina de estados.
- `CrmBoard.tsx:454` — `await api.put('/api/leads/${leadId}', { status: targetStatus })`
  sem payload de contexto (motivo de perda, campos obrigatórios).
- Teste E2E `crm-kanban.spec.ts` cobre drag, não transição inválida.

## Alteração necessária

Decisão de produto/contrato necessária (escalar ao 00 se envolver contrato de API):
- Definir máquina de estados do pipeline (quais transições são válidas, estágios
  terminais won/lost, motivo obrigatório em perda).
- Se aprovado, implementar validação server-side em `LeadUseCases.updateLeadStatus`
  (ou endpoint dedicado) + UX de captura de motivo no `LeadDetailDrawer`/CrmBoard.

## Teste esperado

- Transição inválida (ex.: ganho → prospecção) rejeitada com erro claro.
- Mudança para estágio de perda exige motivo; para ganho exige valor/probabilidade.
- E2E cobrindo tentativa de transição inválida via drag&drop.

## Contexto adicional

- Minha entrega nesta onda já corrigiu, dentro do ownership, os defeitos funcionais
  do `pipelines/KanbanBoard.tsx` (persistência silenciosamente pulada, rollback que
  pisava em movimento posterior, cards órfãos invisíveis, falta de re-sync de props)
  e endureci `deals.service.ts` (patch vazio queimava `version`; lote com dealId
  duplicado gerava `OptimisticLockConflictError` enganoso). SHA `9e95e4933`.
- Não editei nada fora de `src/features/crm/deals/**` e `src/features/crm/pipelines/**`.
