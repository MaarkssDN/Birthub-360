# Handoff 42 → Agente 40 — `crm/components/KanbanBoard.tsx` ainda tem `role="button"` sem handler (A11Y-002)

**Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001 · **Status:** PREPARADO — fora do ownership do Agente 42

## 1. Problema
O handoff da Onda 1 `00-para-04-kanbanboard-role-button-sem-handler.md`
(pedido para verificar/corrigir `src/features/crm/pipelines/KanbanBoard.tsx`)
reportava card de negócio com `role="button"` + `tabIndex={0}` sem handler
(WCAG 4.1.2).

**Verificação na baseline 32d07c375 (worktree wt-42-crm-kanban):**

- `src/features/crm/pipelines/KanbanBoard.tsx` (ownership do Agente 42): **LIMPO**.
  Não usa `role="button"`/`tabIndex` em cards; movimento é feito por `<button
  type="button">` reais ("Mover para X"), nativamente acessíveis por teclado
  (Enter/Espaço). Não há drag-and-drop — o padrão de botões é a alternativa
  acessível e está correto.
- `src/features/crm/components/KanbanBoard.tsx:19`: **DEFEITO PERSISTE**:
  ```tsx
  <div key={d.id} tabIndex={0} role="button" aria-label={`Negócio: ${d.title}`}>
  ```
  Sem `onClick`/`onKeyDown`. `KanbanCard.tsx:173-187` tem `role="button"` mas
  COM handler de teclado/clique — o problema é só o wrapper em `KanbanBoard.tsx`.

## 2. Por que handoff e não correção
`src/features/crm/components/**` **não consta** em `.agents/MATRIZ_PROPRIEDADE.md`
(ownership do Squad 40 cobre `index.ts`, `types.ts`, `leads/**`, `contacts/**`,
`deals/**`, `pipelines/**`, `scoring/**`, `cadences/**`, `tasks/**`, `forecast/**`,
`routing/**`, `deduplication/**`, `analytics/**` — `components/` ficou sem dono
explícito). Como Coordenador do Squad 40, favor designar o responsável
(sugestão: Agente 41 — Cadu, deals/contatos, ou Agente 32/34 para o aspecto a11y).

## 3. Solução mínima (do handoff original, ainda válida)
- Se o card deve ser clicável: adicionar `onClick` + `onKeyDown` (Enter/Espaço)
  ou trocar por elemento interativo real.
- Se não deve ser interativo: remover `role="button"` e `tabIndex`.
- Arquivo provável: apenas `src/features/crm/components/KanbanBoard.tsx` (+ teste).

## 4. Critérios de aceite
- Nenhum elemento com `role="button"`/`tabIndex` sem ativação por teclado e clique.
- axe sem violação de interativo-sem-handler na rota do CRM.

## 5. Evidências
- Leitura direta dos arquivos na baseline `32d07c375`.
- Testes do Agente 42 em `src/features/crm/pipelines/__tests__/KanbanBoard.onda3.test.tsx`
  cobrem teclado/clique no board de `pipelines/` (botões nativos).
