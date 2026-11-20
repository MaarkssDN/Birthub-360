# Catálogo de Ativos — Birth Hub 360°

**Propósito:** inventariar todos os ativos de marca do repositório (logos, personagens, fontes, ícones, imagens, PWA/favicon) com caminho, formato, uso correto e status, para impedir consumo de variantes legadas ou divergentes.

**Escopo:** repositório `C:\Github\Birthub-360` e pasta de trabalho externa `C:\Users\Marcelo\Desktop\DOCUMENTOS\IDENTIDADE-VISUAL\`. Não cobre ativos fora dessas duas raízes (NÃO VERIFICADO se existem em Figma/Drive/site publicado).

**Estado:** auditado em 2026-11-19. Classificações: **canônico**, **legado**, **divergente**, **proposta-não-homologada**, **NÃO VERIFICADO**.

**Data:** 2026-11-19 · **Fontes:** `identidade-visual/brand-system/_FATOS-CANONICOS.md` §13, `identidade-visual/README.md`, listagens de `public/`, `identidade-visual/birthhub360/`, `identidade-visual/v2/assets/`, `src/components/{brand,icons}/`, `src/features/characters/`, `package.json`, `index.html`, `vite.config.ts`.

**Documentos relacionados:** `licenciamento.md`, `referencias-visuais.md`, `rastreabilidade.md`, `../02-IDENTIDADE-VISUAL/` (logotipo), `../01-MARCA/brandbook.md`.

---

## 1. Logos

### 1.1 Canônicos (SVG mestre + espelho público)

| Arquivo | Caminho | Formato | Uso correto | Status |
|---|---|---|---|---|
| Símbolo/emblema | `identidade-visual/birthhub360/logos/birthhub360-simbolo.svg` e espelho `public/brand/birthhub360-simbolo.svg` | SVG | Emblema completo; ≥ 96 px; assinatura institucional | **canônico com ressalva** — contém cores históricas navy/gold "preservadas por determinação do usuário" (`identidade-visual/README.md`) |
| Logo horizontal | `identidade-visual/birthhub360/logos/birthhub360-logo-horizontal.svg` e `public/brand/birthhub360-logo-horizontal.svg` | SVG | Emblema + wordmark; cabeçalhos, telas de entrada | **canônico com ressalva** — mesma ressalva de cores históricas |
| Ícone | `identidade-visual/birthhub360/logos/birthhub360-icone.svg` e `public/brand/birthhub360-icone.svg` | SVG | Redução estrutural para favicon/avatar/ícone (32–96 px); referenciado em `index.html:13` | **canônico com ressalva** — idem |

Referência programática dos três: `BRAND.logos` em `src/config/brand.ts:90-97` (`symbol`, `icon`, `horizontal` apontam para `/brand/*.svg`).

### 1.2 Variantes de cor (tema)

| Arquivo | Caminho | Uso | Status |
|---|---|---|---|
| Horizontal dark | `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/birthhub360-logo-horizontal-dark.svg`, `logo-horizontal-dark.svg` | Versão para fundos escuros | **canônico (pasta de trabalho)** — fora do git |
| Horizontal light | `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/birthhub360-logo-horizontal-light.svg`, `logo-horizontal-light.svg` | Versão para fundos claros | **canônico (pasta de trabalho)** — fora do git |
| Símbolo "Cores-Atuais" (Neon) | `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/BirthHub360-Logo-Cores-Atuais__birthhub360-simbolo.svg`, `birthhub360-simbolo.svg`, `birthhub360-icone.svg`, `birthhub360-logo-horizontal.svg` | Versões Neon animadas/atuais | **canônico (pasta de trabalho)** — fora do git; candidatas a promoção para o repo (**[PROPOSTO]**) |
| Espelhos V2 | `identidade-visual/v2/assets/logos/{birthhub360-icone,birthhub360-logo-horizontal,birthhub360-simbolo}.svg` | Versões Neon do pacote V2 | **proposta-não-homologada** |

### 1.3 Legado e divergente — NÃO usar

| Arquivo/componente | Caminho | Problema | Status |
|---|---|---|---|
| `birthhub360-*.svg` sem prefixo | `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/birthhub360-{icone,simbolo,logo-horizontal}.svg` (variantes raiz) | Paleta navy/gold histórica | **legado** |
| Símbolo "Birthub" | `04_ASSETS_VISUAIS/{symbol.svg, avatar.svg, favicon.svg, logo-horizontal-*.svg, birthhub-logo.svg, birthhub360-avatar.svg, birthhub360-favicon.svg, birthhub-logo.svg}` | 3 arcos `#4C82F7/#9B6BF3/#D4AF37` + Bricolage Grotesque — divergente do Neon | **divergente** |
| Duplicatas prefixadas | `04_ASSETS_VISUAIS/{brand__*, logos__*}*.svg` | Cópias das variantes acima para evitar colisão de nome | **divergente/legado** |
| Componentes legados | `src/components/brand/BirthHubLogo.tsx` (paleta orbit5 `#D4AF37→#FF3158→…`, núcleo `#0B132B`), `BirthubLogo.tsx`, `Birthub360Logo.tsx`, `brand (1).ts` (pasta de trabalho) | Cores fora da paleta Neon | **divergente** — pendência §19.8 dos fatos canônicos |
| `landing/` e `landing-page.html` | `landing/` (projeto independente), `landing-page.html` (raiz) | Cabin + IBM Plex Mono, zinc/`#d4af37`; página HTML navy `#0B132B`/gold `#D4AF37` com Google Fonts CDN | **divergente** |

## 2. Personagens (29 SVGs)

| Conjunto | Caminho | Conteúdo | Status |
|---|---|---|---|
| Mestres | `identidade-visual/birthhub360/characters/*.svg` | 29 SVGs: 9 avatares-pilar + 20 personagens-agente (nomes: aegis, anchor, apex, aria, axiom, beacon, cipher, core, echo, forge, harbinger, helm, ledger, meridian, nexus, oracle, orbit, pledge, relay, scope, scout, seal, spark, sudo, tempo, tracker, tribunal, vanguard, vox) | **canônico com ressalva** — mesma ressalva de cores históricas; contagem de "agentes" diverge (20/24–26/29) — PENDÊNCIA §19.2 |
| Espelho público | `public/brand/characters/*.svg` | 29 arquivos servidos em `/brand/characters/` | **canônico** |
| V2 | `identidade-visual/v2/assets/characters/*.svg` | Mesmos 29 nomes | **proposta-não-homologada** |
| Catálogos de runtime | `src/features/characters/characterCatalogPillars.ts` (300 linhas, 9 pilares), `characterCatalogAgents.ts` (632 linhas, 20 agentes), `characterCatalog.shared.ts`, `characterRuntime.ts`, `characterRuntime.routes.ts`, `CharacterGalleryView.tsx`, `CharacterDetailPanel.tsx` | Registro e execução dos personagens no app | **oficial-vigente** |
| Tokens | `identidade-visual/birthhub360/tokens/characters.{css,json,ts}` (`"version": "1.0.0"`) | Tokens machine-readable dos personagens | **canônico** |
| Documentação | `identidade-visual/GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`, `birthhub360/BirthHub360_Personagens.html`, `birthhub360/preview-29.html` | Guia e visualização dos 29 | **canônico** |

## 3. Fontes

Trinca exclusiva self-hosted — declarada em `src/styles/globals.css:1-11` (TAREFA-SANEAMENTO-017 / BT360-DT-0020: "nenhuma fonte remota").

| Família | Papel | Arquivos | Declaração | Status |
|---|---|---|---|---|
| Sora | `--font-display`/`--font-heading`: títulos H1–H6, heroes, CTAs, números de destaque; pesos 400–800, tracking `-0.02em` | `public/fonts/sora-latin.woff2`, `sora-latin-ext.woff2` + `@font-face` em `globals.css:176-198` | canônica | **canônico** |
| Inter | `--font-interface`/`--font-body`: interface, formulários, tabelas; variável 400–800; `font-feature-settings:"cv05","cv11","ss01"`, tracking `-0.012em` | `public/fonts/inter-latin.woff2`, `inter-latin-ext.woff2` + `@font-face` em `globals.css:13-38` | canônica | **canônico** |
| IBM Plex Mono | `--font-mono`/`--font-data`/`--font-kpi`/`--font-code`: dados tabulares, KPIs, R$, logs; pesos 400/500/600/700 em WOFF2 com fallback TTF | `public/fonts/ibm-plex-mono-{400,500,600,700}-{latin,latin-ext}.woff2` + `.ttf` + `@font-face` em `globals.css:40-174` | canônica | **canônico** |
| Legadas (não usar) | `public/fonts/brand/`: Nunito (normal+italic 300–900, 5 subsets ×2 estilos), Outfit (300–900), Plus Jakarta Sans (normal+italic 300–800, 4 subsets ×2 estilos) | 18 arquivos WOFF2 | removidas das pilhas em `globals.css`; comentário em `official-identity.css:40-45` | **legado — não referenciado**; remoção pendente (§19.5) |

Proibidas por regra de marca (MANUAL-MESTRE §3.1, BRANDBOOK cap.04): Bodoni Moda, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto/Open Sans/Poppins — ver `licenciamento.md` para a situação das licenças das auto-hospedadas.

## 4. Ícones

| Conjunto | Caminho/dependência | Uso | Status |
|---|---|---|---|
| Lucide | `lucide-react@^1.38.0` (`package.json:179`); importado em 393 arquivos .tsx | Ícones de UI gerais | **canônico** — licença ISC (ver `licenciamento.md`) |
| BrandIcons | `src/components/icons/{BrandIcons.tsx, BrandIconsExtended.tsx, brandIconBase.tsx, index.ts}` | Ícones de marca proprietários | **canônico** |
| PillarIcons / title-icons | `src/components/brand/{PillarIcons.tsx, title-icons/, LandingTitleIcons.tsx, CompanyBrandIcon.tsx, BrandEmblemBadge.tsx}` | Ícones por pilar/módulo e títulos | **canônico** |
| Emblemas animados | `src/components/brand/{AnimatedBirthHubEmblem.tsx, BirthHubOrbit360.tsx, BirthHubLogo.tsx}` | Emblema/orbit em runtime | **divergente (parcial)** — `BirthHubLogo.tsx` usa paleta orbit5 fora do Neon (§19.8) |

## 5. Imagens e PNGs de referência

| Arquivo | Caminho | Uso | Status |
|---|---|---|---|
| Hero team | `public/landing/assets/hero-team.jpg` | Imagem da landing canônica (`Landing360`) | **canônico**; cópia em `04_ASSETS_VISUAIS/hero-team.jpg` |
| PNGs de marca | `04_ASSETS_VISUAIS/{BirthHubLogo.png, BirthHubWordmark.png, BirthHubSignature.png}` | Referência visual de logo | **canônico (pasta de trabalho)** — fora do git |
| Screenshots de referência | `04_ASSETS_VISUAIS/{LandingLoginSplitScreen.png, landing-innovative-{desktop,mobile}.png, style-showcase-{desktop,mobile}.png, overlay-command-palette.png, landing-brand-dna-reference.png, sonar-token-preparado.jpg}` | Evidência visual canônica | **canônico (pasta de trabalho)** — fora do git |
| Goldens Playwright | `04_ASSETS_VISUAIS/visual.spec.ts-snapshots__{dashboard,crm-board,contact-form}-{light,dark}-chromium-win32.png` (5 PNGs) | Baseline visual de regressão | **canônico (pasta de trabalho)** — fora do git |
| Screenshots de redesign | `docs/design/screenshots/{redesign-before, redesign-after, current-redesign}/` + `scripts/design-system-capture*.ts`, `capture-redesign-screenshots.ts` | Evidência antes/depois do redesign | **oficial-vigente** |
| Evidências landing-v2 | `docs/landing-v2/evidence/{before,proto}/{desktop,mobile}-{light,dark}-hero.png` | Comparativo da landing V2 | **proposta-não-homologada** |
| Capturas V2 | `public/design-lab/identidade-v2/` (`captura-indice.png`, `10-aceite/captura-indice.png`, `index.html`); 71 evidências pesadas fora do git listadas em `EVIDENCIAS-FORA-DO-GIT.txt` | Pacote V2 auditado (MANIFEST.sha256) | **proposta-não-homologada** |
| Ícones de UI PNG | `04_ASSETS_VISUAIS/{IconWrench.png, CardHeader.png, ExecutiveHeader.png, PageHeader.png, ThemeProvider.png, comp__*.png, states__*.png, theme__{A,B}.png}` | Capturas de componentes para referência | **referência — fora do git** |

## 6. Favicon, PWA e meta-ícones

| Ativo | Caminho | Como é servido | Status |
|---|---|---|---|
| Favicon SVG | `public/brand/birthhub360-icone.svg` | `<link rel="icon" type="image/svg+xml">` em `index.html:13` | **canônico** |
| Apple touch icon | `public/apple-touch-icon.png` | `<link rel="apple-touch-icon">` em `index.html:14` | **canônico** |
| Favicon ICO | `public/favicon.ico` | Fallback de favicon | **canônico** |
| PWA icons | `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | Manifest PWA inline em `vite.config.ts:19-23` (`theme_color: '#F4F7FB'`, `start_url: '/app'`) via `vite-plugin-pwa@^1.3.0` | **canônico** |

## 7. Resumo de decisão de consumo

1. **Use** `public/brand/birthhub360-*.svg` (espelho de `identidade-visual/birthhub360/logos/`) e `/brand/characters/*.svg`.
2. **Prefira** tokens CSS e componentes (`src/components/brand/`, `src/components/icons/`) a SVGs soltos.
3. **Nunca use** variantes `brand__*`, `logos__*`, `symbol.svg`/`avatar.svg`/`favicon.svg`/`logo-horizontal-*` da pasta de trabalho, nem `BirthubLogo`/`Birthub360Logo`/`BirthHubLogo` (orbit5) sem missão de correção.
4. Ativos Neon animados e variantes dark/light hoje vivem **fora do git** na pasta de trabalho — promoção ao repo é **[PROPOSTO]** via handoff ao Agente 11.
