# Handoff 00 → Agente 04 — KanbanBoard: `role="button"` sem handler (A11Y-002)

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas) e aprovação do Orquestrador.

## 1. Problema e backlog
Card de negócio no kanban é focável e anunciado como botão (`role="button"`,
`tabIndex={0}`, `aria-label`) mas **não tem handler** — viola WCAG 4.1.2
(Name, Role, Value) e cria armadilha de teclado/leitor de tela.
Backlog: A11Y-002 (P1).

## 2. Evidência técnica
`src/features/crm/components/KanbanBoard.tsx:19`:
```tsx
<div key={d.id} tabIndex={0} role="button" aria-label={`Negócio: ${d.title}`}>
```
Sem `onClick`/`onKeyDown`. (Existe também `src/features/crm/pipelines/KanbanBoard.tsx`
— verificar se o mesmo padrão ocorre lá; corrigir ambos se confirmado.)

## 3. Agente responsável e ownership
**Agente 04 — CRM e BI.** `src/features/crm/**` é propriedade exclusiva do 04
(`src/features/crm/AGENTS.md`).

## 4. Causa raiz
Marcação semântica aplicada antecipadamente (intenção de tornar o card
interativo) sem implementar a interação correspondente.

## 5. Solução mínima proposta
Decisão em duas vias (escolher a mais simples que preserve o fluxo):
- **Se o card deve ser clicável** (provável — abre detalhe do negócio):
  adicionar `onClick` + `onKeyDown` (Enter/Espaço) e `cursor-pointer`, ou
  trocar por `<button type="button">`/elemento interativo real.
- **Se não deve ser interativo**: remover `role="button"` e `tabIndex`.
Preferir tornar interativo se o detalhe do negócio já for acessível por outro
caminho no board; caso contrário remover os atributos inertes.

## 6. Arquivos que poderão ser modificados
- `src/features/crm/components/KanbanBoard.tsx`
- `src/features/crm/pipelines/KanbanBoard.tsx` (se o mesmo defeito existir)
- Teste do componente, se houver.

## 7. Dependências e riscos
- Sem dependência de tokens/tema — correção isolada de semântica.
- Risco baixo; não toca lógica de dados.
- Verificar se há `onClick` em elemento pai que tornaria o botão aninhado
  problemático.

## 8. Critérios de aceite
- Todo elemento com `role="button"`/`tabIndex` responde a clique **e** teclado
  (Enter/Espaço), ou não possui esses atributos.
- axe-core sem violação de `button-name`/interativo-sem-nome no kanban.
- Foco visível ao navegar por Tab.

## 9. Testes obrigatórios
- Teste de componente/unitário cobrindo ativação por teclado e clique.
- axe na rota do CRM/kanban.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; sem migração de dados. Mudança contida em 1-2 arquivos.
