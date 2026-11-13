# Run — Agente 03 — TAREFA-SANEAMENTO-017 (BT360-DT-0020)

Onda: W5 | Branch: `agente/03-w5-design` | Worktree: `agente-03-w5-design`

## Escopo
Self-hosting das fontes institucionais (causa raiz da instabilidade visual):

- 20 WOFF2 variáveis em `public/fonts/brand/` (Nunito, Outfit, Plus Jakarta Sans;
  subsets latin/latin-ext/cyrillic/cyrillic-ext/vietnamese; 496 KB).
- `globals.css`: `@import` Google Fonts substituído por `@font-face` locais com
  `font-display: swap` e `unicode-range` preservados; `@import "tailwindcss"` em
  posição válida.
- Precache PWA passa a incluir as fontes (240 entradas) — render offline determinístico.

## Gates
- `npx tsc --noEmit` — PASS
- `npm run lint` — sem novos problemas
- `vite build` — PASS
- Suíte `visual-regression` não executada (exige servidor + baselines de plataforma);
  espera de `document.fonts.ready` já existente nos specs torna o screenshot
  determinístico agora que não há fetch externo de fonte.
