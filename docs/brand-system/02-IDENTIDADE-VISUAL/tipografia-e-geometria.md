# Tipografia e Geometria

Estado: CONFIRMADO nos tokens; pesos e hospedagem NÃO VERIFICADOS (não li `@font-face`).

## Famílias

| Papel | Token | Família | Uso |
|---|---|---|---|
| Display | `--font-display` / `--font-heading` | Sora | H1–H6, heros, números de destaque; tracking `--tracking-display: -0.02em` |
| Interface | `--font-interface` / `--font-body` | Inter | UI densa; `font-feature-settings: "cv05","cv11","ss01"` (`--font-features-rounded`); tracking `-0.012em` |
| Dados | `--font-mono` / `--font-data` / `--font-kpi` | IBM Plex Mono | KPIs, tabelas numéricas, logs de IA |

Comentário em `official-identity.css`: famílias remotas (Plus Jakarta Sans/Nunito/Outfit) foram removidas; pilhas self-hosted (TAREFA-SANEAMENTO-017). Pesos 400/600/700/800 vêm de `DESIGN.md` (NÃO VERIFICADO no CSS).

## Raios (CONFIRMADO)

`--radius-control 12px` · `--radius-card 16px` · `--radius-modal 20px` · `--radius-pill 9999px`. Uso de `Button` diverge (C-05).

## Sombras e foco

`--shadow-card: 0 6px 20px rgba(0,0,0,.25)`; `--shadow-elevated: 0 12px 30px rgba(0,0,0,.65)` (escuro) / `…rgba(15,23,42,.08)` (claro). Foco: `outline 2px solid var(--color-focus)`, offset `3px`, halo `0 0 0 3px rgba(0,212,255,.2)`. Hover primário: `filter: brightness(1.1)`.

## Escala tipográfica, grid, espaçamento, breakpoints

NÃO VERIFICADO — `globals.css` possui bloco `@theme` (linha 721) não lido integralmente. Pendência registrada no [backlog](../09-PLANO-DE-EVOLUCAO/backlog-priorizado.md).
