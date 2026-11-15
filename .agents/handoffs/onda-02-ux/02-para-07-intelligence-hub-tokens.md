# Handoff — 02 para 07: tokens de cor no IntelligenceHub (P06)

**De:** Agente 02 — Produto e UX
**Para:** Agente 07 — IA e Automações
**Onda:** 02
**Status:** aberto
**Prioridade:** normal
**Bloqueador-ref:** nenhum
**Sprint destino:** Onda 02 — Frente 04

## Problema

`src/features/intelligence/` (domínio do Agente 07) concentra o maior foco de
hex cru fora do shell: **78 ocorrências em 3 arquivos**, usando a mesma paleta
bespoke já erradicada de `CrmBoard.tsx` e do shell (`#0F2942`, `#3B5A75`,
`#94B3CD`, `#E2F1FF`, `#15171C`, `#00D4FF`, `#D4F434` etc.). No dark/light os
componentes não reagem aos tokens semânticos.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/components/IntelligenceHub.tsx`
- `src/features/intelligence/components/PredictiveScoringNbaCard.tsx`
- `src/features/intelligence/components/RobustScriptGenerator.tsx`

## Evidência

Mapeamento já validado em `CrmBoard.tsx`, `Sidebar.css` e no shell (Frente 01):

| Hex atual | Token |
|---|---|
| `#00D4FF` | `brand` / `var(--color-brand)` |
| `#FF2D9B` | `brand-2` |
| `#8B7DFF` | `iris` |
| `#F59E0B` / `#D4F434` (lime off-palette) | `warning` / `ok` conforme semântica |
| `#0F2942` / `#E2F1FF` | `text-ink` |
| `#3B5A75` / `#94B3CD` / `#5B7B98` | `text-ink-2` |
| `#15171C` / `#101216` / `#14161C` | `bg-surface` / `bg-surface-2` / `bg-surface-elevated` |

Atenção: `text-white` sobre `bg-brand` deve virar `text-on-brand` (regra do
design system). Badges com alpha em JS (`${color}55`) devem usar
`color-mix(in srgb, var(--x) 33%, transparent)` — padrão aplicado em
`CharacterDetailPanel.tsx`.

## Alteração necessária

Mesma conversão mecânica já aplicada em CrmBoard/caracteres, preservando
visual e verificando light + dark.

## Teste esperado

`npx tsc --noEmit`, `npm run lint`, testes do domínio intelligence, revisão
visual nos dois temas.

## Contexto adicional

- `ProspectingHub.tsx` (P02) está 100% tokenizado — referência de padrão.
- P06 é workspace da Frente 04; se a frente já cobrir redesign visual, este
  handoff pode ser absorvido por ela.
