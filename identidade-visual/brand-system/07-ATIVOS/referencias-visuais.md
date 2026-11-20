# Referências Visuais — Birth Hub 360°

**Propósito:** catalogar as referências visuais oficiais (HTMLs, brandbooks, screenshots, goldens, protótipos) e definir como consumi-las, incluindo a ordem de precedência entre elas.

**Escopo:** HTMLs em `identidade-visual/`, protótipos de landing V2, capturas em `docs/design/screenshots/`, `docs/landing-v2/evidence/` e `public/design-lab/identidade-v2/`, goldens Playwright na pasta de trabalho `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/`, e o hero N1. Não inclui código-fonte (ver `rastreabilidade.md`).

**Estado:** auditado em 2026-11-19. Status: **oficial-vigente**, **proposta-não-homologada**, **referência**, **divergente**.

**Data:** 2026-11-19 · **Fontes:** `identidade-visual/README.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`, `_FATOS-CANONICOS.md` §1/§12/§13, listagens de `identidade-visual/`, `public/design-lab/`, `docs/landing-v2/`, `docs/design/screenshots/`, `landing/`, `src/features/landing/components/hero-n1/`.

**Documentos relacionados:** `catalogo-de-assets.md`, `rastreabilidade.md`, `../08-GUIAS-DE-IMPLEMENTACAO/designers.md`, `../08-GUIAS-DE-IMPLEMENTACAO/agentes-de-ia.md`.

---

## 1. Ordem de precedência (oficial)

Definida em `identidade-visual/README.md` para os quatro HTMLs oficiais e em `_FATOS-CANONICOS.md` §1 para o conjunto completo:

1. `identidade-visual/v2/FONTE-DE-VERDADE.md` — decisões pinadas pelo usuário em 2026-11-13 (paleta, tipografia, posicionamento, limites). **Fonte nº 1 para identidade.**
2. `identidade-visual/README.md` — ordem entre os HTMLs: **Brandbook > Manual Visual > Manual de Produto > Catálogo**.
3. `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` + `characters.{css,json,ts}` — tokens machine-readable.
4. `src/styles/official-identity.css` → `globals.css` → `src/config/brand.ts` → `DESIGN.md` → `docs/BrandConstitution.md` → `PRODUCT.md`.
5. `identidade-visual/v2/` — sistema V2 completo — **NÃO HOMOLOGADO**: tratar sempre como proposta avançada, nunca como decisão.

Resolução de conflito entre HTMLs: o documento superior na ordem prevalece; valores ausentes são complementados pelo próximo (`birthhub360.json` → `notes.precedence`).

## 2. HTMLs oficiais de identidade (raiz de `identidade-visual/`)

| Arquivo | Conteúdo | Posição na precedência | Como abrir |
|---|---|---|---|
| `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html` | Brandbook oficial | 1º entre HTMLs | `python -m http.server 8767` na raiz do repo → `/identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html` |
| `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html` | Manual Visual (cores, tipografia, componentes) | 2º | idem |
| `identidade-visual/MANUAL-DE-IDENTIDADE-DO-PRODUTO.html` | Manual de Produto (módulos, jornadas, nomes formais dos pilares) | 3º | idem |
| `identidade-visual/CATALOGO-DE-COMPONENTES.html` | Catálogo de componentes | 4º | idem |
| `identidade-visual/AUDITORIA-COMPLETA-BIRTH-HUB-360.html` | Auditoria completa | referência | idem |
| `identidade-visual/GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md` | Guia dos 29 personagens | referência canônica | leitura direta |
| `BirthHub360-DesignSystem-Bible.html` (raiz do repo) | "Bible" do design system | **divergente/desatualizada** — conteúdo anterior à paleta Neon | não usar como autoridade |

Os HTMLs consomem assets por caminhos relativos, iniciam em light mode; Landing e Login carregam fontes externas + Tailwind CDN + Lucide — exigem rede para renderização completa (`identidade-visual/README.md`). Os SVGs mestres referenciados contêm cores históricas navy/gold preservadas por determinação do usuário — **não usar as cores dos SVGs como referência de paleta**; a paleta de verdade são os tokens.

## 3. Artefatos HTML de referência (`identidade-visual/birthhub360/`)

| Arquivo | Conteúdo | Status |
|---|---|---|
| `birthhub360/BirthHub360_Landing.html` | Landing de referência | **oficial-vigente** (referência visual independente; nomenclatura comercial de capacidades) |
| `birthhub360/BirthHub360_Login.html` | Tela de login de referência | **oficial-vigente** |
| `birthhub360/BirthHub360_Personagens.html` + `preview-29.html` | Personagens e avatares oficiais | **oficial-vigente** |
| `birthhub360/tokens/birthhub360.{css,json,ts}`, `characters.{css,json,ts}` | Tokens machine-readable (ver `rastreabilidade.md`) | **oficial-vigente** |

## 4. Sistema V2 e design-lab (`identidade-visual/v2/`, `public/design-lab/identidade-v2/`)

| Caminho | Conteúdo | Status |
|---|---|---|
| `identidade-visual/v2/FONTE-DE-VERDADE.md` | Decisões pinadas 2026-11-13 | **oficial-vigente** (fonte nº 1) |
| `identidade-visual/v2/index.html`, `02-brandbook/brandbook.html`, `03-design-system/` (README + tokens), `04-motion/`, `05-componentes/biblioteca.html`, `06-matriz/`, `07-relatorio-00/`, `01-auditoria/` | Pacote V2 completo | **proposta-não-homologada** |
| `public/design-lab/identidade-v2/` | Espelho servido do pacote V2: `index.html`, `01-auditoria`…`10-aceite/`, `08-referencia-n1/index.html`, `assets/`, `shared/`, `scripts-verificacao/`, `MANIFEST.sha256`, `EVIDENCIAS-FORA-DO-GIT.txt`, `LEIA-ME-REPOSITORIO.md` | **proposta-não-homologada** — 77 arquivos versionados; 71 capturas pesadas fora do git (budget de 60 MB em `public/`, `scripts/ci/check-public-budget.mjs`) |
| `identidade-visual/v2/assets/{logos,characters}/` | Logos Neon e 29 personagens V2 | **proposta-não-homologada** |

## 5. Screenshots e goldens

| Local | Conteúdo | Status |
|---|---|---|
| `C:\Users\Marcelo\Desktop\DOCUMENTOS\IDENTIDADE-VISUAL\04_ASSETS_VISUAIS\` | ~55 arquivos: PNGs de marca (`BirthHubLogo.png`, `BirthHubWordmark.png`, `BirthHubSignature.png`), screenshots (`LandingLoginSplitScreen.png`, `landing-innovative-{desktop,mobile}.png`, `style-showcase-{desktop,mobile}.png`, `overlay-command-palette.png`), goldens Playwright `visual.spec.ts-snapshots__{dashboard,crm-board,contact-form}-{light,dark}-chromium-win32.png`, `hero-team.jpg`, estados de componentes (`states__*`, `comp__*`, `theme__{A,B}.png`) | **canônico (pasta de trabalho) — fora do git**; goldens são baseline de regressão visual |
| `docs/design/screenshots/{redesign-before, redesign-after, current-redesign}/` | Capturas antes/depois do redesign | **oficial-vigente**; scripts: `scripts/design-system-capture{,-simple}.ts`, `capture-redesign-screenshots.ts` |
| `docs/landing-v2/evidence/{before,proto}/` | 8 PNGs hero desktop/mobile light/dark | **proposta-não-homologada** (landing V2) |
| `public/design-lab/identidade-v2/**/evidencias`, `captura-indice.png`, `10-aceite/captura-indice.png` | Evidências do pacote V2 | **proposta-não-homologada** |

## 6. Protótipos de landing V2 e hero N1

| Item | Caminho | Status |
|---|---|---|
| Protótipo landing V2 (docs) | `docs/landing-v2/prototype/{index.html, landing-v2.css}` + `docs/landing-v2/scripts/` | **proposta-não-homologada** |
| Landing independente | `landing/` — projeto Vite separado ("sem código, rotas ou build compartilhados com `src/`"; `landing/README.md`); tokens espelham `src/styles/globals.css` mas usa **Cabin + IBM Plex Mono** (divergente da trinca oficial) | **divergente** |
| Protótipos HTML (pasta de trabalho) | `DOCUMENTOS/IDENTIDADE-VISUAL/02_IDENTIDADE_VISUAL/BirthHub360-Landing-V2-Prototipo{,-v1}.html`, `LANDPAGE E TELA DE ACESSO BIRTHUB 360__index.html` | **proposta-não-homologada** |
| Hero N1 | `src/features/landing/components/hero-n1/` — `LandingHero.tsx`, `LandingHeroN1.css`, `HeroCommandCenter.tsx`, `HeroEditorialHeadline.tsx`, `HeroMotion.ts`, `HeroOrbit360.tsx`, `index.ts`; referência em `public/design-lab/identidade-v2/08-referencia-n1/index.html` + `scripts-verificacao/n1.cjs`; evidências em `docs/landing-v2/evidence/*hero.png`; testes em `tests/unit/features/landing/hero-n1.test.tsx` | **oficial-vigente em implementação** — rota real via `Landing360`; dono: Agente 02 (`src/features/landing/AGENTS.md`) |

## 7. Como consumir

1. **Dúvida de identidade** → comece por `v2/FONTE-DE-VERDADE.md`, depois Brandbook HTML, depois Manual Visual.
2. **Dúvida de componente** → Catálogo de Componentes HTML → `DESIGN.md` (catálogo de 30 componentes) → `src/components/ui/`.
3. **Dúvida de cor/tipografia** → tokens (`birthhub360.*`, `globals.css`) — nunca os SVGs mestres (cores históricas) nem docs navy/gold (`docs/design/BIRTHHUB-360-DESIGN-*.md` = obsoletos).
4. **Referência de tela** → goldens `04_ASSETS_VISUAIS` + `docs/design/screenshots/current-redesign` + screenshots V2 apenas como proposta.
5. **Abrir HTMLs localmente** → `python -m http.server 8767` na raiz do repo (README de `identidade-visual/`); pacote V2 servido via `public/design-lab/identidade-v2/index.html`.
