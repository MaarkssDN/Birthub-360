# Foundations e Design Tokens Canônicos

Estado: CONFIRMADO (código inspecionado em `identidade-visual/birthhub360/tokens/birthhub360.css`, `src/styles/official-identity.css` e bloco `@theme` de `src/styles/globals.css`).

---

## 1. Arquitetura de Camadas de Tokens

1. **Primitivas (`--palette-*`):** Cores brutas do espectro Neon e Neutro (`--palette-neon-blue: #00D4FF`, `--palette-neon-black: #0D0D0D`, `--palette-neon-pink: #FF2D9B`, etc.).
2. **Semânticas (`--color-*`):** Atribuição funcional por papel e contexto de modo de cor (background, surface, surface-elevated, text-primary, text-secondary, interactive-primary, success, warning, danger, info).
3. **Acentos de Módulo (`--color-heading-*` / `--bh-accent`):** Cores temáticas para os pilares e cartões operacionais (`cyan`, `blue`, `gold`, `pink`, `iris`, `success`, `danger`).
4. **Tailwind v4 `@theme`:** Utilitários de motor CSS que traduzem variáveis CSS para classes utilitárias (`bg-surface`, `text-ink`, `border-line`, `shadow-card`, etc.).
5. **Aliases Legados (`@deprecated`):** Vínculos mantidos por compatibilidade (`--bg`, `--surface`, `--ink`, `--line`), remapeados para os tokens semânticos canônicos.

---

## 2. Escala Tipográfica Fluida e Responsiva

Implementada oficialmente via `clamp()` no `@theme` de `globals.css:934-945`:

| Token | Expressão CSS | Line Height | Aplicação Recomendada |
|---|---|---|---|
| `--text-h1` | `clamp(1.625rem, 3.2vw, 2.375rem)` | `1.15` | Hero de módulos, títulos principais de cockpit |
| `--text-h2` | `clamp(1.35rem, 2.5vw, 1.85rem)` | `1.2` | Títulos de seções principais |
| `--text-h3` | `clamp(1.15rem, 2vw, 1.5rem)` | `1.25` | Cabeçalhos de cartões e Bento Grids |
| `--text-h4` | `clamp(1rem, 1.2vw + 0.5rem, 1.25rem)` | `1.3` | Subtítulos de painéis e tabelas |
| `--text-h5` | `clamp(0.9rem, 0.8vw + 0.5rem, 1.1rem)` | `1.35` | Títulos de widgets compactos |
| `--text-h6` | `clamp(0.8rem, 0.5vw + 0.5rem, 0.95rem)` | `1.4` | Kickers, labels técnicos e metadados |

### Trinca Tipográfica Canônica
- **Display / Títulos:** Sora (`--font-display`). Tracking: `--tracking-display: -0.02em`.
- **Interface Geral:** Inter (`--font-interface`). Font-features: `"cv05", "cv11", "ss01"` (toque arredondado característico). Tracking: `--tracking-rounded: -0.012em`.
- **Dados & Métricas:** IBM Plex Mono (`--font-mono`). Ativado com `tabular-nums` em KPIs e contadores monetários.

---

## 3. Geometria, Raios e Elevações

### Raios de Borda (`--radius-*`)
- `--radius-control`: `12px` (inputs, botões padrão, selects).
- `--radius-nav-item`: `12px` (links e itens da sidebar).
- `--radius-card`: `16px` (superfícies de cards, modais secundários).
- `--radius-card-lg` / `--radius-modal`: `20px` (diálogos modais, drawers).
- `--radius-pill`: `9999px` (tags, badges de status, botões de ação rápida).

### Sombras e Profundidade Perceptual (`--shadow-*`)

| Token | Modo Claro (Light) | Modo Escuro (Dark) |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.04), 0 10px 28px -16px rgba(0,0,0,0.22)` | `0 1px 2px rgba(0,0,0,0.6), 0 14px 34px -18px rgba(0,0,0,0.9)` |
| `--shadow-card-hover` | `0 1px 3px rgba(0,0,0,0.06), 0 18px 40px -18px rgba(0,0,0,0.28)` | `0 1px 3px rgba(0,0,0,0.7), 0 20px 46px -20px rgba(0,0,0,0.95)` |
| `--shadow-nav` | `12px 0 34px -28px rgba(26,21,19,0.45)` | `12px 0 38px -24px rgba(0,0,0,0.85)` |
| `--shadow-nav-active` | `0 10px 26px -14px color-mix(in srgb, var(--brand) 52%, black)` | `0 12px 30px -15px color-mix(in srgb, var(--brand) 58%, black)` |

### Efeitos de Glow e Halos de Assinatura
- `--shadow-brand-sm`: `0 4px 12px color-mix(in srgb, var(--brand) 20%, transparent)`
- `--shadow-glow-brand`: `0 0 15px -3px color-mix(in srgb, var(--brand) 20%, transparent)`
- `--shadow-glow-brand-strong`: `0 0 15px -3px color-mix(in srgb, var(--brand) 40%, transparent)`
- `--shadow-glow-accent-cyan`: Halo ciano neon para foco e estado ativo.
- `--shadow-glow-accent-violet`: Halo de inteligência IA para copiloto e agentes.

---

## 4. Keyframes Canônicos do Sistema (@theme)

- `--animate-toast-in`: `toast-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
- `--animate-float`: `float 6s ease-in-out infinite`
- `--animate-pulse-glow`: `pulse-glow 3s ease-in-out infinite`
- `--animate-gradient-xy`: `gradient-xy 15s ease infinite`
- `--animate-gradient-flow`: `gradient-flow 8s ease infinite`
- `--animate-spin-slow`: `spin 12s linear infinite`
- `--animate-shimmer`: `shimmer 2.5s infinite linear`
- `--animate-border-beam`: `border-beam calc(var(--duration, 12) * 1s) infinite linear`
- `--animate-pulse-slow`: `pulse-slow 8s ease-in-out infinite`
- `--animate-fade-in`: `fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
