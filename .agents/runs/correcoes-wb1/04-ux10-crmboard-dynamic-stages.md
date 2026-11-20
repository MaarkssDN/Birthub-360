# Relatório de Execução — UX-10 / DEBT-0032 (Estágios Dinâmicos no Funil "Negócio")

```
Agente / Onda / Branch: 04 — CRM e BI / WB-1 / agente/00-integracao-skills
```

## Suposições feitas

- O contrato interno de status de negócio continua sendo o enum `LeadStatus` (`src/lib/zod.ts` e `prisma/schema.prisma`), pois o schema Prisma e as rotas `PUT /api/leads/:id` permanecem fora de escopo nesta onda.
- O endpoint existente `GET /api/crm/pipelines` retorna a lista de `CrmPipeline` da organização autenticada (com `stages: CrmPipelineStage[]` contendo `leadStatus` no formato do enum Prisma e `name` configurável pelo tenant).
- Caso `stage.name` vindo do banco ainda seja idêntico ao identificador legado de piloto (`'Piloto VTECH'`, `'Piloto Birthub 360 Profile'`, `'Piloto Logística'`, etc.), o rótulo visual deve ser sanitizado pelo mapa neutro `STAGE_DISPLAY_LABELS` (`'Piloto Técnico (PoC)'`, `'Piloto Hub 360° — Em Curso'`, `'Piloto Operacional — Em Curso'`), enquanto nomes customizados pela organização prevalecem.

## Plano executado

1. Inspeção de `src/components/CrmBoard.tsx`, `src/features/crm360/infra/PrismaCrm360Repository.ts` e testes de `CrmBoard` → verificar implementação de `getPipelines` e contratos de `KanbanColumn` → CONCLUÍDO.
2. Consumo de `GET /api/crm/pipelines` em `src/components/CrmBoard.tsx` quando `funnel === 'Negocio'`, mapeando colunas dinâmicas, rótulos customizados (`stageLabelsByStatus`), fallback imediato (`DEAL_COLUMNS` + `STAGE_DISPLAY_LABELS`) e preservação de `LeadStatus` com leads ativos → verificar ausência de rótulos legados como `'Piloto VTECH'` na UI → IMPLEMENTADO.
3. Validação com Biome Lint e Vitest nos testes unitários relacionados a `CrmBoard` → verificar 0 erros/avisos e 100% dos testes passando → TESTADO E VALIDADO.
4. Atualização do handoff `.agents/handoffs/onda-WB1/02a-para-04-funil-negocio-stages-hardcoded.md` para `resolvido` e gravação deste relatório → CONCLUÍDO.

## Arquivos alterados

1. `src/components/CrmBoard.tsx`
2. `.agents/handoffs/onda-WB1/02a-para-04-funil-negocio-stages-hardcoded.md`
3. `.agents/runs/correcoes-wb1/04-ux10-crmboard-dynamic-stages.md`

## Comandos executados

- `node ./node_modules/@biomejs/biome/bin/biome lint src/components/CrmBoard.tsx` → `Checked 1 file in 659ms. No fixes applied.` (exit code 0)
- `node ./node_modules/vitest/vitest.mjs run -c vitest.unit.config.ts tests/unit/features/crm/CrmBoard-performance.test.tsx tests/unit/components/CrmBoardToolbar.test.tsx tests/unit/hooks/useCrmBoardController.test.tsx` → `Test Files 3 passed (3), Tests 14 passed (14)` (exit code 0)

## Testes

- `tests/unit/components/CrmBoardToolbar.test.tsx` (12 testes) — TESTADO / APROVADO
- `tests/unit/hooks/useCrmBoardController.test.tsx` (1 teste) — TESTADO / APROVADO
- `tests/unit/features/crm/CrmBoard-performance.test.tsx` (1 teste) — TESTADO / APROVADO

## Evidências

- `resolveDealPipelineColumns(pipelines, activeLeads)` extrai e ordena os estágios ativos do pipeline `entity === 'Negocio'` retornado por `GET /api/crm/pipelines`, converte `stage.leadStatus` via `fromPrismaLeadStatus`, preserva rótulos customizados do tenant e aplica `STAGE_DISPLAY_LABELS` sempre que o nome no banco ainda for o literal legado de piloto.
- Os cabeçalhos das colunas (`KanbanColumn`), os anúncios acessíveis do `dnd-kit` e as opções de etapa em lote (`CrmBoardBatchBar`) utilizam `getStageLabel(status)`, impedindo que nomes de pilotos de clientes específicos (`'Piloto VTECH'`, `'Piloto Birthub 360 Profile'`, `'Piloto Logística'`) apareçam na interface.
- `resolveStatusFromOverId` e `columnKeyboardCoordinateGetter` resolvem tanto a chave `LeadStatus` quanto o rótulo exibido no droppable da coluna, garantindo funcionamento íntegro do drag-and-drop por mouse e teclado.

## Problemas fora do escopo

- `src/features/crm360/infra/defaultPipelineStages.ts` ainda semeia os nomes default no banco a partir do enum `LeadStatus`; a sanitização visual em `CrmBoard.tsx` impede que esses nomes legados vazem para a UI mesmo em tenants provisionados com o seed default.

## Handoffs abertos

- Nenhum novo handoff aberto; handoff `02a-para-04-funil-negocio-stages-hardcoded.md` atualizado para `resolvido`.

## Aprendizados reutilizáveis

- Como `KanbanColumn` usa a prop `status` simultaneamente como título renderizado (`<h3>`) e `id` do `useDroppable`, ao passar o rótulo traduzido para `KanbanColumn`, o resolvedor de drop (`resolveStatusFromOverId`) e o sensor de teclado (`columnKeyboardCoordinateGetter`) em `CrmBoard.tsx` devem aceitar tanto a chave `LeadStatus` original quanto o rótulo traduzido (`getStageLabel(col)`).

## Pendências

- Nenhuma pendência dentro do escopo da missão.

## Riscos

- Baixo risco: fallback síncrono para `DEAL_COLUMNS` + `STAGE_DISPLAY_LABELS` garante renderização imediata sem flash vazio enquanto `/api/crm/pipelines` resolve ou caso a requisição falhe.
