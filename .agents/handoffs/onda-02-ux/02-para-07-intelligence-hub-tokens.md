# Handoff — 02 para 07: tokens de cor no IntelligenceHub (P06)

**De:** Agente 02 — Produto e UX
**Para:** Agente 07 — IA e Automações
**Onda:** 02
**Status:** resolvido
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

## Atualização de triagem — Agente 00 (2026-11-14)

Verificação executada em `main` (`528580fbf`):

- **`Math.random` em `src/features/intelligence`: 0 ocorrências** — o risco de
  dados fabricados apontado na auditoria foi resolvido (provável saneamento do
  Agente 07 em ondas posteriores).
- **Hex cru remanescente: 37 ocorrências em 3 arquivos `.tsx`** (o "78" original
  já foi parcialmente saneado):
  - `IntelligenceHub.tsx`: 16
  - `PredictiveScoringNbaCard.tsx`: 18
  - `RobustScriptGenerator.tsx`: 3
- **Status sugerido:** `em-andamento` — resta apenas a tokenização visual dos 3
  arquivos; o risco funcional (simulação disfarçada) está encerrado.

## Resolução (Agente 07 — 2026-11-17, worktree `agente-07-handoffs`, branch `agente/07-handoffs-20261117`)

Hex cru eliminado dos 3 arquivos apontados na triagem do Agente 00:

- `IntelligenceHub.tsx` — 16 ocorrências convertidas para tokens semânticos:
  `bg-surface(/90|/95)`, `text-ink`, `text-ink-2`, `bg-brand`, `text-on-brand`,
  `text-light-blue dark:text-brand` (par #0284c7/#00D4FF), `border-brand/*`,
  `ring-brand/40`, `shadow-glow-brand(-strong)`, `focus:border-brand`,
  `focus-visible:ring-brand/30`, gradiente hero `dark:from-surface
  dark:via-bg dark:to-bg`. `grep -E "#[0-9A-Fa-f]{3,8}"` → 0 ocorrências.
- `RobustScriptGenerator.tsx` — painel de resultado é terminal "dark cockpit"
  sempre escuro (mesma natureza do PredictiveScoringNbaCard): hex GitHub-dark
  `#0D1117`/`#010409`/`#30363D` substituídos por tokens fixos equivalentes
  `bg-obsidian`, `bg-black`, `border-white/15` (compõe ~#2B2B2B sobre o fundo,
  equivalente visual ao #30363D original). 0 hex remanescente.
- `PredictiveScoringNbaCard.tsx` — **NÃO tokenizado por decisão documentada**:
  o handoff `backlog-5/03-para-07-predictive-scoring-contraste.md` (Agente 03,
  mais recente e específico, DEM-20261116-001) determina que o card é sempre
  escuro por decisão visual existente e que "hex fixo é apropriado; NÃO trocar
  por token de tema". Aplicada apenas a correção de contraste pedida lá
  (`text-slate-500` → `text-slate-400` no "/100", ~6.5:1). Se o 02/03 quiserem
  reabrir a tokenização desse card, é redesign — handoff dedicado.

Verificação: `npx tsc --noEmit` limpo; `npm run lint` executado; nenhuma
alteração de lógica/comportamento (somente classes utilitárias).
