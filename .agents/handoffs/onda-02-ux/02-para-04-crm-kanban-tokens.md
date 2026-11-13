# Handoff — 02 para 04: tokens de cor no Kanban do CRM (P01)

**De:** Agente 02 — Produto e UX
**Para:** Agente 04 — CRM e BI
**Onda:** 02
**Status:** aberto
**Prioridade:** normal
**Bloqueador-ref:** nenhum
**Sprint destino:** Onda 02 — Frente 02/03

## Problema

Na tokenização do workspace P01 (Frente 02), `src/components/CrmBoard.tsx` foi
migrado para tokens semânticos. Os filhos `KanbanCard.tsx` e `KanbanColumn.tsx`
(`src/features/crm/components/`, domínio do Agente 04) ainda usam ~20 hex crus,
incluindo a cor **lime `#D4F434` que não existe na paleta oficial** (Azul Neon
#00D4FF, Rosa #FF2D9B, Dourado #FFC107, Íris #8B7DFF). Isso gera drift de tema:
no dark/light os cards do kanban não reagem às mudanças de token como o restante
do shell.

## Arquivo(s) envolvido(s)

- `src/features/crm/components/KanbanCard.tsx` (13 ocorrências)
- `src/features/crm/components/KanbanColumn.tsx` (7 ocorrências)

## Evidência

Mapeamento sugerido (mesmo já aplicado em `CrmBoard.tsx` e no shell):

| Hex atual | Token sugerido |
|---|---|
| `#00D4FF` | `brand` / `var(--color-brand)` |
| `#FF2D9B` | `brand-2` / `var(--color-brand-2)` |
| `#8B7DFF` | `iris` / `var(--color-iris)` |
| `#F59E0B` | `warning` / `var(--color-warning)` (match exato) |
| `#D4F434` (lime, off-palette) | `ok` / `var(--color-ok)` — indicador "live/saudável"; se a identidade quiser um acento lime, cabe decisão do Agente 03 criar token, não hex local |
| `#0F2942` / `#E2F1FF` | `text-ink` |
| `#3B5A75` / `#5B7B98` / `#305070` / `#90B0D0` | `text-ink-2` |
| `#059669` / `#34D399` / `#047857` | `text-ok` |
| `#14161C` / `#0D0F14` / `#15171C` | `bg-surface` / `bg-surface-2` / `bg-surface-elevated` |
| `#1E4E75` / `#90D2FF` | `text-ink` (headings de coluna) |
| `bg-white dark:bg-[#14161C]` | `bg-surface` |
| `from-[#00D4FF] to-[#0284c7]` (botão gradiente) | `from-brand to-sky-700` ou tokens equivalentes |

Atenção ao botão "Converter" do KanbanCard (linha ~356): `text-white` sobre
gradiente de marca — a regra do design system exige `text-on-brand` em superfícies
de marca.

## Alteração necessária

Substituir os hex por utilities/vars de token, preservando hierarquia visual e
verificando light + dark. Sem mudança de comportamento.

## Teste esperado

- `npx tsc --noEmit`, `npm run lint`, testes de `src/features/crm/__tests__`
- Revisão visual do board em ambos os temas

## Contexto adicional

- `CrmBoard.tsx` (src/components, já migrado) consome esses componentes — a
  inconsistência fica visível na mesma tela.
- `ProspectingHub.tsx` (P02) já está 100% em tokens (0 hex) — serve de referência.
