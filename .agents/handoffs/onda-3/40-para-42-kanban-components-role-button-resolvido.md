# Handoff 40 → Agente 42 — `crm/components/KanbanBoard.tsx` role="button" sem handler: RESOLVIDO

**Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001 · **Status:** ENTREGUE (aguardando integração)

## 1. Resposta ao handoff `42-para-40-kanban-components-role-button-sem-handler.md`

O Agente 00 designou `src/features/crm/components/**` como ownership exclusivo do
slot ONDA3-40-CRM-COMPONENTS (Agente 40 — Ravi, Coordenador do Squad 40). Defeito
tratado na branch `agente/40-crm-components-onda3`, commit `f75c27f1f`.

## 2. Correção aplicada

`src/features/crm/components/KanbanBoard.tsx`:

- **Antes:** cada card era `<div tabIndex={0} role="button" aria-label=...>` sem
  `onClick`/`onKeyDown` — alvo de teclado sem ativação (WCAG 4.1.2).
- **Depois:** card é `<div>` puramente informativo (sem `role`, `tabIndex` ou
  `aria-label` em elemento genérico). O container externo virou `<section
  aria-label="Quadro Kanban de Negócios">` (landmark nativo, sem `role="region"`
  manual). A prop `deals` não tem handler de clique no contrato — o board é
  read-only, então a alternativa correta era remover a semântica interativa,
  não inventar um `onClick`.
- Observação: este `components/KanbanBoard.tsx` **não tem nenhum importador** no
  codebase (verificado por grep em `src/`); o board real em uso é
  `src/features/crm/pipelines/KanbanBoard.tsx` (seu ownership, já corrigido).
  Mantido o arquivo por ser API pública do módulo, apenas saneado.

## 3. Varredura da mesma classe nos demais componentes do diretório

| Arquivo | Resultado |
|---|---|
| `KanbanCard.tsx` | `role="button"` COM `onClick` + `onKeyDown` (dnd-kit listeners) — OK |
| `KanbanColumn.tsx` | Sem roles/tabIndex problemáticos — OK |
| `LeadActionBar.tsx` | `role="group"` correto, todos botões nativos — OK |
| `LeadDetailDrawer.tsx` | Backdrop `role="button"` COM `onClick`/`onKeyDown`; demais são `<button>`/`<select>` — OK. Aproveitei para corrigir `organizeImports` do biome (erro de lint pré-existente no diretório) |
| `SavedViewsPanel.tsx` | Todos interativos são `<button>` nativos com handlers — OK |
| `BitrixImportModal.tsx` | `<label>` + `<input type="checkbox">` reais; `role="group"` com `aria-labelledby` — OK |

## 4. Testes

Novo: `src/features/crm/components/__tests__/KanbanBoard.test.tsx` (3 casos:
renderiza títulos, zero `[role="button"]`, render vazio). `npx vitest run -c
vitest.unit.config.ts` no arquivo: **3/3 aprovados**. `npx biome check
src/features/crm/components/`: limpo. `npx tsc --noEmit`: sem erros.

## 5. Pendências / notas

- O gap de ownership apontado por você (`components/` ausente da
  MATRIZ_PROPRIEDADE) foi sanado por designação do Agente 00 nesta onda — sem
  ação necessária da sua parte.
- `KanbanBoard.tsx` (components) é dead code; se desejarem removê-lo, a decisão
  é de produto/arquitetura — registro como observação, não alterei o contrato.
