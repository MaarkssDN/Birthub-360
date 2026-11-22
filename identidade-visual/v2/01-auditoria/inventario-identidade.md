# Inventário de Identidade Visual — Birthub 360° V2
**Frente:** 01 — Auditoria de Identidade Visual · DEM-20261113-004
**Data:** 2026-11-13 · **Escopo:** worktree `missao-identidade-v2` (+ referência `missao-07-hero-n1`)

Legenda de status: **OFICIAL** = fonte normativa declarada · **ATIVO** = carregado/usado pelo app · **REFERÊNCIA** = artefato de homologação visual, não integrado · **LEGADO** = direção superada, ainda presente · **MORTO** = não referenciado por nenhum entry point · **PENDENTE** = exige decisão do usuário/00.

---

## A. Documentos mestres de identidade (`identidade-visual/`)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `identidade-visual/README.md` | Índice de precedência | OFICIAL | Declara ordem: Brandbook > Manual Visual > Manual de Produto > Catálogo. Confirma que SVGs mestres contêm "cores históricas que diferem dos tokens Neon" e foram preservados por determinação do usuário. |
| `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html` | Brandbook (doc. mestre #1) | OFICIAL/REFERÊNCIA | Título "Birth Hub 360°". Sistema cromático neon + trinca tipográfica. Grafia consistente "Birth Hub 360" (5 ocorrências, 0 "Birthub"). |
| `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html` | Manual Visual (doc. mestre #2) | OFICIAL/REFERÊNCIA | Carrega fontes via Google Fonts CDN. Define `--neon-*`, gradientes, raios (12/16/20/9999), Sora/Inter/IBM Plex Mono. |
| `identidade-visual/MANUAL-DE-IDENTIDADE-DO-PRODUTO.html` | Manual de Produto (doc. mestre #3) | OFICIAL/REFERÊNCIA | Paleta neon + superfícies + "Coolors" (chili-red, vanilla, non-photo-blue, cerulean, berkeley-blue). |
| `identidade-visual/CATALOGO-DE-COMPONENTES.html` | Catálogo de componentes (doc. mestre #4) | OFICIAL/REFERÊNCIA | ~30 componentes oficiais; base dos utilitários `bh-*` em `official-identity.css`. |
| `identidade-visual/AUDITORIA-COMPLETA-BIRTH-HUB-360.html` | Auditoria visual anterior | REFERÊNCIA | Usa `--ok:#10B981` e `--danger:#FF3B5C` — **diverge dos tokens canônicos** (`#22C55E`/`#EF4444`). Tratar como snapshot histórico. |
| `identidade-visual/GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md` | Guia de personagens | OFICIAL (parcial) | Datado 07/11/2026, status "PRONTO PARA HOMOLOGAÇÃO (Agente 24)". Descreve **9 avatares-pilar**; os 29 SVGs atuais = 9 pilares + 20 agentes (`src/features/characters/characterCatalog*.ts`). Doc. cobre só a camada de pilares — cobertura parcial dos 29. |

## B. Assets de marca (`identidade-visual/birthhub360/`)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `birthhub360/logos/birthhub360-icone.svg` | Logo ícone | OFICIAL | Espelhado em `public/brand/`. |
| `birthhub360/logos/birthhub360-logo-horizontal.svg` | Logo horizontal | OFICIAL | idem. |
| `birthhub360/logos/birthhub360-simbolo.svg` | Símbolo/emblema | OFICIAL | Área de proteção e mínimos documentados em `docs/BrandConstitution.md` §4. |
| `birthhub360/characters/*.svg` (29 arquivos) | Personagens | OFICIAL | 9 pilares (orbit, nexus, aria, vanguard, oracle, core, spark, echo, sudo) + 20 agentes (axiom…aegis). Confere 1:1 com `public/brand/characters/` (29 arquivos) e com `characterCatalogPillars.ts` (9) + `characterCatalogAgents.ts` (20). |
| `birthhub360/tokens/birthhub360.css` | Tokens CSS canônicos | ATIVO/OFICIAL | Importado por `src/styles/official-identity.css` (linha 1) → carregado via `main.tsx`. Inclui variantes light AA (`#0284C7`, `#D91B7C`, `#D97706`, `#7C3AED` etc.). |
| `birthhub360/tokens/birthhub360.json` | Tokens JSON | OFICIAL | Contém nota oficial `conflicts` documentando divergências entre os 4 docs mestres (light surfaces, muted, borders, code bg). |
| `birthhub360/tokens/birthhub360.ts` | Tokens TS | OFICIAL | Espelho do JSON/CSS; tipografia Sora/Inter/IBM Plex Mono + OpenType features. |
| `birthhub360/tokens/characters.css|json|ts` | Tokens de personagens | ATIVO | Importado por `official-identity.css` (linha 2). |
| `birthhub360/BirthHub360_Landing.html` | Referência landing | REFERÊNCIA | HTML autocontido; usa CDN Tailwind/Lucide/Google Fonts; grafia "Birth Hub 360". |
| `birthhub360/BirthHub360_Login.html` | Referência login | REFERÊNCIA | idem. |
| `birthhub360/BirthHub360_Personagens.html` | Referência personagens | REFERÊNCIA | idem. |
| `birthhub360/preview-29.html` | Preview dos 29 personagens | REFERÊNCIA | Tema dark/light toggle; título "Preview 29 Personagens". |

## C. Tokens e estilos em código (`src/`)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `src/styles/globals.css` | Estilos globais + tokens legados | ATIVO | Carregado por `main.tsx:11`. `@font-face` self-hosted Sora/Inter/IBM Plex Mono (`public/fonts/`). Contém pilhas `--font-brand-*`, paleta `--neon-*`, gradientes, tokens de motion (`--duration-*`, `--ease-*`), overrides de contraste AA por tema. Comentários citam handoffs BT360-DT. |
| `src/styles/official-identity.css` | Adaptadores oficiais | ATIVO | Carregado por `main.tsx:12`. Importa tokens de `identidade-visual/birthhub360/tokens/`; mapeia `--bg/--surface/--ink/...` legados → tokens canônicos; utilitários `bh-*` do catálogo; overrides AA light. |
| `src/styles/luxury-tokens.css` | Tokens "luxury" | **MORTO** | Só referenciado por `src/index.css`, que **não é importado por nenhum entry point** (`main.tsx` importa `styles/globals.css` + `styles/official-identity.css` diretamente). Contém paleta concorrente (obsidian/gold-soft `#d4af37`, JetBrains Mono na pilha mono) e matriz de motion própria. Candidato a remoção/arquivamento. |
| `src/index.css` | Wrapper órfão | **MORTO** | Importa `globals.css` + `luxury-tokens.css`; nenhum `import './index.css'` em `src/` fora de features. Provável resíduo. |
| `src/styles/elegance.css` | "Elegance Redesign v3.0" | **MORTO/LEGADO** | Nenhum import encontrado. Paleta inteiramente divergente: dourado champagne `#C9A24C`, rosa `#F15BB5`, azul bebê `#B9DBF0`, sage `#F5F8A7A`→`#5F8A7A`, pearl `#FBF8F3`. Direção estética superada pela neon oficial. |
| `src/lib/motion.ts` | Motion system (Framer Motion) | ATIVO | 573 linhas: easings (`EASE_PREMIUM` etc.), durações espelhando tokens CSS, springs, variants (`fadeIn*`, `stagger*`, `pageTransition`, `modal*`, `drawer*`), hooks `useTilt`/`useMagnetic`/`useCursorSpotlight`/`useGlobalCursorDepth` com `useReducedMotion` + detecção touch. |
| `src/config/brand.ts` | Identidade em código | ATIVO/OFICIAL | `BRAND.name = 'Birth Hub 360º'`, tagline, paleta neon, logos `/brand/*`. Declarado "fonte de verdade única em código". |
| `src/lib/designSystem.ts`, `src/lib/paletteIntent.ts` | Auxiliares DS | ATIVO | Verificar consumidores na Frente 03. |

## D. Documentação de design (`docs/`)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `docs/BrandConstitution.md` | Constituição da marca | OFICIAL | Declara `identidade-visual/birthhub360/` + `brand.ts` como fonte de verdade; neon palette; regras de logo; registra divergência de fontes já saneada (TAREFA-SANEAMENTO-017). Cita handoff `11-para-03` sobre `--ink`/`--color-text-primary`. |
| `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` | Design Language v2.0 | PARCIALMENTE OBSOLETO | Seção de cores neon correta, mas tipografia diz **Plus Jakarta Sans / Sora / JetBrains Mono** (real: Sora/Inter/IBM Plex Mono) e "Navy foundation, gold accents" (era anterior ao neon). Motion tokens conferem com `globals.css`. |
| `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` | Design System Spec v2.0 | **OBSoleto** | Paleta Navy `#0B132B` + Antique Gold `#D4AF37`, Playfair Display, body em IBM Plex Mono — direção anterior ao rebrand neon. Candidato a revisão/substituição pela V2. |
| `docs/design/TOKEN-AUDIT.md` | Auditoria de tokens voice-hub | REFERÊNCIA | Documenta `tokens.ts` duplicado em `src/features/voice-hub/components/design-system/` com Montserrat/cores hardcoded divergentes. |
| `docs/design/MODERNIZACAO-UI-ONDA-A.md`, `ONDA-04-MATRIZ-OPEN-SOURCE.md` | Docs de ondas | REFERÊNCIA | Contexto histórico de modernização. |
| `docs/strategy/birth-hub-360-strategy.json` | Strategy JSON | PARCIALMENTE OBSOLETO | `brand.name: "Birth Hub 360º"`; generatedAt 2026-09-13; evidências marcadas CONFIRMED/HYPOTHESIS/etc. Posicionamento converge com FONTE-DE-VERDADE. |
| `docs/strategy/BIRTH_HUB_360_BRAND_PRODUCT_MARKET_PLAYBOOK.html` | Playbook HTML | PARCIALMENTE OBSOLETO | Grafia "Birth Hub 360" consistente; conteúdo estratégico válido, mas `DESIGN-playbook.md` (escopo visual do playbook) usa paleta **gold/navy/Bodoni Moda** rotulada como "tokens reais da marca" — divergente do neon canônico (provável estado anterior ao rebrand). |
| `docs/strategy/DESIGN-playbook.md` | DESIGN.md do playbook | OBSOLETO (visual) | Ver acima. |
| `docs/architecture/LEGACY_BRAND_CONTENT_MAP.md` | Mapa de resíduo de marca | REFERÊNCIA | Levantamento C0 (set/2026): marca anterior = laranja `#FF5618` + Montserrat/Space Grotesk; portais `public/tools/*` com marca antiga ainda roteados; `#FF5618` residual em e-mail/exports. |
| `docs/audits/onda-42/11-relatorio-auditoria-n1.md` | Auditoria N+1 | **NÃO RELACIONADO** | Apesar do nome, audita queries N+1 do CRM — não é o "N1 hero candidate". O N1 visual está no worktree irmão. |

## E. Landing, login e superfícies visuais do app

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `src/features/landing/pages/Landing360.tsx` + `Landing360.css` + `Landing360Impeccable.*` + `LandingCinematic.css` + `LandingAdaptive.css` + `LandingConversionV5.css` + `LandingRegenerationV4.css` | Landing/Login atuais | ATIVO — **INTOCÁVEL** | Servidos em `/` e `/login` (`App.tsx:98-107`, `initialScreen="intro"|"login"`). `Landing360.css` usa neon oficial com muitos `!important` e patches AA light; coexistem 6 arquivos CSS de iterações visuais — candidato a consolidação futura (fora do escopo V2). |
| `landing/` (sub-app Vite independente) | Landing estática separada | **DIVERGENTE** | README declara projeto independente. `src/index.css`: fontes **Cabin + IBM Plex Mono** (não Sora/Inter), paleta zinc/gold `#d4af37`/`#0b132b`. Identidade divergente da oficial — PENDENTE de destino. |
| `landing-page.html` (raiz) | HTML standalone | **LEGADO** | Paleta navy/gold `#D4AF37`, fontes Sora+IBM Plex Mono via Google Fonts CDN, título "BirthHub 360°". |
| `identidade-visual/birthhub360/BirthHub360_Landing.html`, `_Login.html` | Referências visuais | REFERÊNCIA | Já inventariados em B. |
| `public/design-lab/` + `src/features/design-lab/` | Laboratório de design | EXPERIMENTAL/ISOLADO | Rotas `/design-lab/command-language` e `/design-lab/components-v2` (`App.tsx:83,91`). `public/design-lab/README.md` documenta isolamento por iframe/escopo. `neon-tokyo-buttons/` adicional. |
| `docs/design/screenshots/`, `design-system-guide/`, `prints-design-system/`, `visual-catalog/`, `visual-regression*/` | Evidências visuais | REFERÊNCIA | Snapshots e guias gerados; insumo para Frentes 05/06. |

## F. N1 — Neon Editorial Cinematic (worktree irmão `missao-07-hero-n1`)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `src/features/landing/components/hero-n1/` (6 arquivos, ~1744 linhas) | Hero N1 React | CANDIDATO NÃO INTEGRADO | `LandingHeroN1.css` (1230 linhas) declara "NEON EDITORIAL CINEMATIC (MISSÃO 07)" com paleta oficial e Sora/Inter/Plex Mono self-hosted. Branch `agente/02-03-hero-n1-missao-07`, commit `d094a8831`, **ahead 1, não mergeado**. |
| `docs/landing-v2/prototype/index.html` + `landing-v2.css` | Protótipo Gate A | REFERÊNCIA | CSS declara paleta oficial + temas light/dark com variantes AA (`#006BA6`, `#B81466`…). Evidências before/proto em `docs/landing-v2/evidence/`. |
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4_CINEMATIC.html` | Doc. mestre cinematográfico | REFERÊNCIA | Presente em ambos os worktrees; grafia mista "Birthub 360"/"Birth Hub 360". |

## G. Documentos mestres de produto (raiz do worktree)

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html` | Doc. mestre V4 | OFICIAL (produto) | `<title>` usa "Birthub 360°"; logo SVG `aria-label` "Birth Hub 360"; corpo mistura ambas as grafias. Menciona "29 avatares". |
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.1.html` e `V4.10.html` | Versões revisadas | OFICIAL (produto) | Título "Birth Hub 360°"; corpo usa "Birthub 360°" em descrições de módulos. **V4.10 é a versão mais recente.** |
| `DESIGN.md`, `PRODUCT.md` | Contratos Impeccable | OFICIAL | `DESIGN.md` = paleta neon + gradientes + trinca + 4 estados + 30 componentes; manda landing/login intocados. `PRODUCT.md` = posicionamento "Revenue Intelligence", 8 pilares, governança. |
| `BirthHub360-DesignSystem-Bible.html` | DS Bible | REFERÊNCIA | Documento HTML de design system anterior à consolidação em `identidade-visual/`. |
| `BIRTHUB360_*.md/csv/html` (contratos, jornadas, modelo de dados, catálogo) | Engenharia de produto | OFICIAL (produto) | Grafia mista; nomes de arquivo usam prefixo `BIRTHUB360_`. |

## H. Arquitetura dos 11 módulos

| Caminho | Tipo | Status | Observações |
|---|---|---|---|
| `src/components/layout/moduleRegistry.ts` | Registro canônico | ATIVO/OFICIAL | 436 linhas; comentário: "Registro canônico dos 11 módulos oficiais do **Birthub 360°** — taxonomia do BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4: 8 Pilares (P01–P08) + 3 complementares (M09–M11)". Hub Central é centro neural fora da numeração. M10 = mobile-only; M11 = rota top-level. |
| `src/features/characters/characterCatalog*.ts` | Catálogo de personagens | ATIVO | 9 pillar + 20 agent = 29; vincula personagem↔agente↔módulo em runtime. |
| `docs/fase-02/onda-00/02-MATRIZ-GAP-11-MODULOS.md` | Matriz de módulos | REFERÊNCIA | Inventário dos 11 módulos vs. implementação. |
| `src/config/module-catalog.ts` | Catálogo de módulos (config) | ATIVO | Contém módulo `treinamento-birthhub360` com URLs de sistemas internos da marca antiga (achado LEGACY §2.3). |

---

## Síntese do inventário

- **Cadeia canônica viva:** `identidade-visual/birthhub360/tokens/birthhub360.css` → `src/styles/official-identity.css` → `main.tsx`. Tokens, paleta, gradientes e tipografia oficiais estão efetivamente carregados no app.
- **3 sistemas visuais concorrentes mortos/legados:** `elegance.css` (champagne/sage), `luxury-tokens.css`+`src/index.css` (órfãos), `landing/` sub-app (Cabin+gold) e `landing-page.html` (navy/gold).
- **Documentos de design divergentes:** `BIRTHHUB-360-DESIGN-SYSTEM.md` e `DESIGN-playbook.md` ainda descrevem a era Navy/Gold; `DESIGN-LANGUAGE.md` está parcialmente desatualizado na tipografia.
- **Cobertura do guia de personagens:** guia oficial cobre 9 avatares-pilar; catálogo real tem 29 (9+20) — guia precisa de extensão ou declaração de escopo.
