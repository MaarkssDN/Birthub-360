# Tipografia — Birth Hub 360°

**Propósito:** especificação da trinca tipográfica oficial, escalas e regras.
**Estado:** CONFIRMADO — self-hosted em produção; proibições documentadas.
**Data:** 2026-11-19 · **Fontes:** `globals.css:12-198` (@font-face), `birthhub360.css:18-29`, `MANUAL-MESTRE` §3, `DESIGN.md`, `FONTE-DE-VERDADE` §4.

---

## 1. A trinca oficial

| Papel | Família | Token | Uso |
|---|---|---|---|
| Display | **Sora** | `--font-display` / `--font-heading` | H1–H6, heroes, CTAs, números de destaque comercial |
| Interface | **Inter** | `--font-interface` / `--font-body` | menus, tabelas, modais, formulários, corpo |
| Dados | **IBM Plex Mono** | `--font-mono` / `--font-data` / `--font-kpi` / `--font-code` | KPIs, R$, contadores, logs, badges técnicos, código |

Aliases: `--font-sans` = Inter; `--font-brand-sans/display/mono` (adapters em official-identity.css:43-45).

## 2. Especificações

- **Sora:** variável 100–800, self-hosted WOFF2 em `public/fonts/`; títulos tracking `-0.02em` (`--tracking-display`).
- **Inter:** variável 400–800 latin+latin-ext; **obrigatório** `font-feature-settings: "cv05","cv11","ss01"` (toque arredondado) e tracking `-0.012em` (`--tracking-rounded`, `--font-features-rounded`) — aplicado no `body` (official-identity.css:122-125).
- **IBM Plex Mono:** 400/500/600/700 + itálico, WOFF2+TTF; algarismos tabulares para dados.

## 3. Escala

Tokens `--text-h1..h6` no `@theme` do globals.css (~721-1071) geram utilities `text-h1`…`text-h6` com `clamp()` responsivo. Escala editorial no MANUAL-MESTRE §3.3: Hero 56px Sora 800 → KPI 36px Plex Mono (faixas; a escala exata está nos tokens — NÃO VERIFICADO valor a valor, consultar globals.css).

## 4. Regras

1. **Nunca** `#000`/`#FFF` puros em títulos — usar `bh-heading`/`data-accent` (cor via `--color-heading-*`).
2. Títulos e CTAs → Sora; corpo/interface → Inter; dados → Plex Mono.
3. Números de receita e KPIs → sempre Plex Mono (alinhamento tabular).
4. Tracking: display `-0.02em`, interface `-0.012em`, mono padrão.
5. Proibições explícitas (MANUAL-MESTRE §3.1, BRANDBOOK cap.04): Bodoni Moda, Playfair Display, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto, Open Sans, Poppins.
6. Fontes 100% self-hosted — sem Google Fonts no app (TAREFA-SANEAMENTO-017). `public/fonts/brand/` contém Nunito/Outfit/Plus Jakarta Sans **legadas não referenciadas** — candidatas a limpeza.

## 5. Divergências documentais

- `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` e `docs/BrandConstitution.md` citam Plus Jakarta Sans/JetBrains Mono — **divergência legada**; Sora/Inter/Plex Mono é a verdade (confirmado por tokens + @font-face + FONTE-DE-VERDADE).
- `.claude/skills/design-system/SKILL.md` menciona Bodoni Moda — **desatualizado**.
- `BirthubLogo.tsx`/`Birthub360Logo.tsx` (pasta de trabalho) usam Fivo Sans/Montserrat — legados divergentes.
- SVGs `logo-horizontal-*.svg` "Birthub" usam Bricolage Grotesque — divergentes.

## 6. Hierarquia visual de texto

- **H1–H3:** Sora, `bh-heading`/`data-accent` para cor de acento.
- **H4–H6:** Sora ou Inter 600/700 conforme densidade.
- **Body:** Inter, `--color-text-primary`/`secondary`/`muted`.
- **Kicker/label:** Inter 600 uppercase ou `.bh-kicker` com accent.
- **Dados/KPI:** IBM Plex Mono.
- **Code:** IBM Plex Mono sobre `--palette-code-bg`.

**Relacionados:** `paleta-de-cores.md`, `../04-DESIGN-SYSTEM/foundations.md`, `../03-PRODUTO/ux-writing.md`.
