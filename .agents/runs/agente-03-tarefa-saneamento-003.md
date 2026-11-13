# Run — Agente 03 — TAREFA-SANEAMENTO-003 (BT360-DT-0017)

Onda: W5 | Branch: `agente/03-w5-design` | Worktree: `agente-03-w5-design`

## Escopo
`src/styles/globals.css` — remoção de `!important` residuais em guards de contraste
de títulos/subtítulos (9 declarações). Mantidos os 5 `!important` intencionais do bloco
`prefers-reduced-motion` (documentado no próprio CSS).

## Gates
- `npx tsc --noEmit` — PASS
- `npm run lint` (biome lint src) — sem novos problemas; `globals.css` com 0 warnings
  (8 `noImportantStyles` resolvidos)
- `vite build` — PASS
