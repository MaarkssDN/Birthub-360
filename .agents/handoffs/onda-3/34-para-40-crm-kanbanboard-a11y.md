# Handoff — 34 → 40: KanbanBoard stub com controle "button" sem ativação (a11y)

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 40 — Ravi (coordenador CRM & Receita; `src/features/crm/components/**`
  não consta nominalmente na MATRIZ — provável dono 42/41, a designar)
- Onda: 3 (ONDA3-34-ACCESSIBILITY, demanda DEM-20261123-001)
- Status: aberto
- Prioridade: baixo-médio
- Bloqueador-ref: `.agents/runs/onda-3/34-relatorio.md`
- Sprint destino: a definir pelo 00

## Problema

`src/features/crm/components/KanbanBoard.tsx` (28 linhas, aparência de stub)
renderiza cards como `<div tabIndex={0} role="button" aria-label="Negócio: …">`
**sem nenhum `onClick`/`onKeyDown`** — elemento focável que se anuncia como
botão mas não executa ação nenhuma. Violações:

- WCAG 2.1.1 Keyboard (nível A): controle que não responde a Enter/Espaço.
- WCAG 4.1.2 Name, Role, Value: role=button sem comportamento associado.
- `tabIndex={0}` em `role="region"` do container (linha 15) é aceitável por ser
  região com scroll horizontal, mas o card interior é o problema real.

Diagnósticos biome: `useSemanticElements` (L12, L19),
`noNoninteractiveTabindex` (L15, fixable).

## Arquivo(s) envolvido(s)

- `src/features/crm/components/KanbanBoard.tsx` (L9-25)
- Imports colaterais suspeitos: `import './KanbanCard.js'` /
  `import './KanbanColumn.js'` (L2-3) — side-effect imports sem uso.

## Contexto adicional

- Existe um Kanban real e mantido em `src/features/crm/pipelines/KanbanBoard.tsx`
  (dono: Agente 42). O arquivo de `components/` **não parece ter importadores**
  (grep por `KanbanBoard` fora do próprio arquivo só retorna a versão de
  `pipelines/`).
- **Ação provável**: confirmar se é código morto e remover, ou — se for usado —
  tornar o card um `<button>`/`<a>` real ou converter em elemento não-focável
  (`role="article"`/`listitem` dentro de `<ul>`), conforme a intenção.

## Alteração necessária

Decisão do dono: remoção (se morto) ou correção semântica. Não é escopo do
Agente 34 alterar `src/features/crm/**`.

## Teste esperado

- Se mantido: card acionável por teclado (Enter/Espaço) ou explicitamente não
  interativo (sem `role="button"` nem `tabIndex`).
- `npx biome lint src/features/crm/components/KanbanBoard.tsx` limpo.
