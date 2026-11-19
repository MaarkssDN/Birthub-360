# Imagens e Fotografia — Birth Hub 360°

**Propósito:** regras para uso de imagens, fotografia e raster na marca.
**Estado:** PARCIALMENTE CONFIRMADO — existem screenshots/PNGs de referência; não há direção formal de fotografia.
**Data:** 2026-11-19 · **Fontes:** `04_ASSETS_VISUAIS/` (pasta de trabalho), `documentacao-aplicacao/imagens/` (18 screenshots), `docs/design/screenshots/`, `docs/landing-v2/evidence/`, `public/landing/`.

---

## 1. O que existe

| Tipo | Onde | Uso |
|---|---|---|
| Screenshots de produto | `documentacao-aplicacao/imagens/` (18), `docs/design/screenshots/` (~40 before/after), `docs/landing-v2/evidence/` | material comercial, apresentações, documentação |
| Goldens de teste visual | `04_ASSETS_VISUAIS/visual.spec.ts-snapshots__*` (dashboard/crm/contact-form light/dark win32) | regressão visual Playwright |
| PNGs de marca | `BirthHubLogo.png`, `BirthHubSignature.png`, `BirthHubWordmark.png` | raster do logo (preferir SVG) |
| Imagens de landing | `hero-team.jpg`, `landing-*.png`, `LandingLoginSplitScreen.png`, `Sidebar Futurista BIRTH HUB 360.png` | referências/protótipos |
| Assets de integração | `public/landing/assets/*.svg` (logos Bitrix/Google/HubSpot) | prova social na landing |

## 2. Direção de imagem [PROPOSTO — não homologada]

A linguagem "Neon Editorial Cinematic" sugere:

- **Produto real em primeiro plano** — screenshots reais do app, nunca mockups genéricos.
- **Dados como herói** — KPIs, gráficos, fluxos visíveis; a "matéria-prima" do produto é informação.
- **Fundo escuro/neutro** — coerente com dark-first; light apenas quando o contexto exigir.
- **Sem banco de imagem humano genérico** — nada de "equipe sorrindo em escritório stock".
- **Tratamento:** levemente frio, alto contraste, glow sutil — consistente com a UI.

## 3. Regras práticas

1. Preferir SVG para logo/ícones; PNG/JPG só para fotografia e screenshots.
2. Screenshots devem ser capturados do app real (não redesenhados) — `documentacao-aplicacao/imagens/` é evidência, mas pode estar desatualizada (alerta do próprio inventário).
3. Nunca aplicar a identidade sobre screenshots de terceiros ou interfaces de concorrentes.
4. Proporções: hero 16:9 ou 21:9; cards quadrados ou 4:3; mobile 9:16 para stories/status.
5. Marcas de terceiros (Bitrix, Google etc.) só com os assets oficiais em `public/landing/assets/`.

## 4. Lacunas

- **L1:** não há fotografia de marca oficial (direção de arte fotográfica) — PROPOSTO criar quando houver campanha.
- **L2:** screenshots de `documentacao-aplicacao/` datam de agosto/2026 — precisam de refresh com tokens atuais.
- **L3:** não há guideline de imagem para dark vs light em materiais impressos.

**Relacionados:** `ilustracoes.md`, `aplicacoes.md`, `../08-GUIAS-DE-IMPLEMENTACAO/marketing.md`.
