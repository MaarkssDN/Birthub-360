# Inventário de Fontes — Brand System Birth Hub 360°

**Propósito:** catalogar todas as fontes de evidência auditadas para a construção do Brand System, com classificação de status, para que cada documento da biblioteca cite apenas fontes verificáveis.

**Escopo:** fontes no repositório (`C:\Github\Birthub-360`), na pasta de trabalho externa `DOCUMENTOS/IDENTIDADE-VISUAL/`, em `.agents/` e no histórico Git. Não cobre fontes fora do repositório e não verifica conteúdo de arquivos marcados como inacessíveis.

**Estado da informação:** auditado em 2026-11-19. Classificações: **oficial-vigente** (autoridade atual reconhecida), **histórica** (era válida, superada), **divergente** (viva e em uso, mas fora da identidade Neon), **proposta-não-homologada** (avançada, sem homologação humana), **inacessível** (não verificável neste ambiente).

**Data de referência:** 2026-11-19

**Fontes primárias:** `identidade-visual/brand-system/_FATOS-CANONICOS.md` (pacote de evidências verificado), `identidade-visual/v2/01-auditoria/relatorio-auditoria.md`, `identidade-visual/v2/01-auditoria/matriz-conformidade.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`, `identidade-visual/README.md`, `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`, `.agents/experience/05-roadmap.md`, `AGENTS.md`.

**Documentos relacionados:** `relatorio-forense.md` (mesma pasta), `matriz-de-evidencias.md`, `conflitos-e-decisoes.md`, `../09-PLANO-DE-EVOLUCAO/auditoria-de-inconsistencias.md`.

---

## 1. Fontes externas à pasta de trabalho (DOCUMENTOS/IDENTIDADE-VISUAL)

| Fonte | Conteúdo | Status | Observações |
|---|---|---|---|
| `DOCUMENTOS/IDENTIDADE-VISUAL/` (raiz) | ~445 arquivos: brandbook HTML, manuais, áudios, documentos mestres | **oficial-vigente** (com ressalvas) | Pacote entregue ao usuário; contém manual mestre, brandbook e manuais de produto/visual. Subpastas abaixo. |
| `…/01_BRANDBOOK/` (subpastas do pacote) | Brandbook oficial em HTML/MD | **oficial-vigente** | Topo da ordem de precedência conforme `identidade-visual/README.md`. |
| `…/02_MANUAIS/` | Manual Visual, Manual de Produto, Catálogo | **oficial-vigente** | Manual Mestre contém regras de logo, tipografia e paleta Neon. |
| `…/04_ASSETS_VISUAIS/` | SVGs logo neon animados ("Cores-Atuais"), favicons, variantes dark/light, PNGs de referência, goldens Playwright `visual.spec.ts-snapshots__*`, `hero-team.jpg`, screenshots landing | **oficial-vigente** | Versões Neon animadas dos logos; PNGs de referência são evidência visual canônica. |
| `…/05_TOKENS_E_TEMAS/` | Tokens e temas | **parcialmente inacessível** | Contém `.env` com possível segredo — PENDÊNCIA §19.12: reportar, não copiar. Verificação de conteúdo não realizada nesta auditoria. |
| Duplicatas na pasta de trabalho | Prefixos `brand__`, `logos__`, `symbol.svg`/`avatar.svg`/`favicon.svg`/`logo-horizontal-*`, `birthhub360-*.svg` raiz sem prefixo | **divergente / histórica** | Símbolo "Birthub" com 3 arcos (`#4C82F7/#9B6BF3/#D4AF37`, Bricolage Grotesque) e variantes navy/gold são resíduos; não usar como referência. |

## 2. Fontes de identidade no repositório

| Fonte | Conteúdo | Status | Observações |
|---|---|---|---|
| `identidade-visual/v2/FONTE-DE-VERDADE.md` | Decisões pinadas pelo usuário em 2026-11-13: paleta, tipografia, posicionamento, limites | **oficial-vigente** | Fonte nº 1 de precedência para identidade. |
| `identidade-visual/README.md` | Ordem de precedência dos HTMLs: Brandbook > Manual Visual > Manual Produto > Catálogo | **oficial-vigente** | Define como resolver conflitos entre os HTMLs oficiais. |
| `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` | Tokens machine-readable da marca (paleta, superfícies, semânticos) | **oficial-vigente** | Cores dark em `birthhub360.css:9-117`; light AA em `:119-186`. |
| `identidade-visual/birthhub360/tokens/characters.{css,json,ts}` | Tokens dos personagens | **oficial-vigente** | Par do conjunto de tokens. |
| `identidade-visual/birthhub360/logos/*.svg` | Logos SVG canônicos (ícone, horizontal, símbolo) + espelho `public/brand/` | **oficial-vigente com ressalva** | Contêm cores históricas navy/gold "preservadas por determinação do usuário" (README). Versões Neon animadas existem em `04_ASSETS_VISUAIS/` e `identidade-visual/v2/assets/logos/`. |
| `identidade-visual/birthhub360/characters/` + `public/brand/characters/` | 29 SVGs de personagens (25 servidos em public) | **oficial-vigente com ressalva** | Contagem oficial de "agentes" diverge (20/24–26/29) — PENDÊNCIA §19.2. |
| `identidade-visual/v2/` | Sistema V2 completo: `01-auditoria/` (relatorio-auditoria.md, matriz-conformidade.md), `02-brandbook/`, `03-design-system/`, `04-motion/`, `05-componentes/`, `06-matriz/`, `07-relatorio-00/`, `assets/`, `index.html` | **proposta-não-homologada** | Missão V2 de 2026-11-13/14; NÃO homologada — tratar como proposta avançada, nunca como decisão. |
| `identidade-visual/brand-system/` | Esta biblioteca (genesis 2026-11-19) | **em construção** | `relatorio-forense.md` já existia; demais documentos produzidos nesta onda. |

## 3. Fontes de design e produto na raiz do repo

| Fonte | Conteúdo | Status | Observações |
|---|---|---|---|
| `AGENTS.md` | Governança global de agentes (propriedade, handoffs, gates) | **oficial-vigente** | §15 define propriedade; §17 isolamento; §28 gates. |
| `DESIGN.md` | Design-schema "impeccable", escopo `/app/*` modo Operate; landing/login intocáveis; catálogo de 30 componentes | **oficial-vigente** | Coerente com paleta Neon; declara WCAG 2.2 AA. |
| `PRODUCT.md` | Propósito do produto: "Sistema Operacional de Revenue Intelligence" | **oficial-vigente** | Posicionamento diverge levemente do fixado em FONTE-DE-VERDADE §2 — registrar como variação de tagline, não conflito de marca. |
| `docs/BrandConstitution.md` | Essência, paleta, voz, regras de logo | **oficial-vigente (parcial)** | Essência "dar à inteligência uma forma em que se pode confiar"; área de proteção diverge do Manual Mestre — PENDÊNCIA §19.10. |
| `BIRTHUB360_JORNADAS_OPERACIONAIS.md` | 20 jornadas canônicas J01–J20 (v4.0.0) | **oficial-vigente** | Base de UX writing e cenários. |
| `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv` | Catálogo P01–P11 + M09–M11 | **oficial-vigente** | Arquitetura de módulos. |
| `.agents/BIRTH_HUB_DESIGN_CONSTITUTION.md` | Constituição de design do Enxame | **oficial-vigente** | Governança de design. |
| `.agents/TRANSFORMACAO-DESIGN-ENTERPRISE.md` | Programa de transformação de design | **oficial-vigente** | Contexto histórico/estratégico. |
| `.agents/GA_VISUAL_EXPERIENCE_GATE.md` | Gate de experiência visual | **oficial-vigente** | Critérios de QA visual. |
| `.claude/CLAUDE.md` | Constituição de design para Claude Code | **divergente** | Descreve paleta "Strategic Command Center" gold/iris/navy e afirma que `identidade-visual/birthhub360/` é identidade ANTERIOR — desatualizada (tokens hoje são Neon). |
| `.claude/skills/design-system/SKILL.md` | Skill de design system | **divergente** | Documenta Antique Gold/Bodoni — desatualizada. |
| `.agents/skills/birthhub-*` | Skills de marca | **divergente** | Declaram `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` como "autoridade visual máxima" — apontam para doc obsoleto (conflito de governança). |

## 4. Implementação no código-fonte

| Fonte | Conteúdo | Status | Observações |
|---|---|---|---|
| `src/styles/globals.css` | Tokens `:root`/`.dark`/`@theme` Tailwind 4 — runtime real | **oficial-vigente** | ~2039 hex literais em 150 arquivos .tsx coexistem com tokens. |
| `src/styles/official-identity.css` | Importa tokens birthhub360; aliases `--bg→--color-*`; overrides light de texto arbitrário | **oficial-vigente** | `:6-61` aliases (deprecated), `:62-107,264-315` overrides. |
| `src/styles/elegance.css`, `src/styles/luxury-tokens.css`, `src/index.css` | Paletas Champagne/Sage/Pearl "Elegance v3.0", `--lux-*` JetBrains Mono | **histórica / CSS morto** | Sem import — candidatas a remoção/arquivamento (PENDÊNCIA §19.5). |
| `src/config/brand.ts` | Espelho TS: `BRAND.name`, `BRAND.colors`, `BRAND.logos` | **oficial-vigente com ressalva** | Usa `360º` (ordinal) — grafia PENDENTE §19.1. |
| `src/lib/motion.ts` + imports framer-motion | Motion operacional real (573 linhas, ~30 variants) | **oficial-vigente** | Motion comercial 2-níveis é proposta v2 não homologada. |
| `src/components/ui/` (~95 arq) | Design system próprio estilo shadcn | **oficial-vigente** | Catálogo de 30 componentes em DESIGN.md; Storybook só 3 stories. |
| `src/components/layout/moduleRegistry.ts` | Registro canônico de módulos | **oficial-vigente** | 11 módulos + Hub Central; mapeamento módulo→accent é proposta v2 (PENDÊNCIA §19.3). |
| `src/components/brand/` | BirthHubLogo, emblemas, orbit 360°, ícones de pilar | **divergente (parcial)** | `BirthHubLogo.tsx` usa paleta orbit5 divergente do Neon — PENDÊNCIA §19.8. |
| `src/features/voice-hub/components/design-system/` | Segundo mini DS (tokens.ts, ThemeContext, CommandPalette) | **divergente** | Duplicação a consolidar (Onda C do roadmap de experiência). |
| `src/features/prospecting/outbound/` | Sub-app quase standalone com design próprio escuro/lime | **divergente** | Sub-app fora do DS canônico. |
| `landing/` + `landing-page.html` (raiz) | Landing legada Cabin+IBM Plex Mono/zinc/`#d4af37`; página HTML navy `#0B132B`/gold `#D4AF37` com Google Fonts CDN | **divergente** | Destino pendente (§19.5); `Landing360.tsx` é a canônica roteada. |
| `public/tools/*`, `public/tools/social-selling/` | Portais e resíduo laranja `#FF5618` | **histórica** | Laranja aposentado em 09/2026; assets ainda servidos em `/tools`. |
| `src/features/*/routes/*.routes.ts` (~80 arq), `server.ts`, `src/bootstrap/*` | Backend modular | **oficial-vigente** | Contexto; fora do escopo visual direto. |

## 5. Documentação obsoleta ou divergente

| Fonte | Problema | Status |
|---|---|---|
| `docs/DESIGN_SYSTEM.md` | DS antigo | **histórica / obsoleta** |
| `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` | navy/gold + Bodoni | **histórica / obsoleta** |
| `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` | cores neon ok, mas tipografia errada (Plus Jakarta/JetBrains); declarada "autoridade máxima" por skills | **divergente / obsoleta** |
| `docs/strategy/DESIGN-playbook.md` + playbook HTML | gold/navy/Bodoni | **histórica / obsoleta** |
| `.agents/experience/05-roadmap.md` | Roadmap de experiência Ondas A–F | **oficial-vigente** | Complementar a este plano; Onda C já prevê convergência de tokens e destino de landings. |

## 6. Histórico Git e handoffs

| Fonte | Conteúdo | Status |
|---|---|---|
| Git log / merges | `36d097a17` (paleta Neon homologada 2026-10-11), `c3eaefd34` (BrandConstitution→tokens neon) | **histórica relevante** |
| `.agents/handoffs/onda-saneamento-*/`, `onda-ui-1`, `personagens-29-20261110`, `pre-formatacao-20261111`, `roadmap-v2-*/`, `techdebt-2026-09-29`, `onda-resgate-20261010`, `onda-turbo-20261009`, `saneamento-onda-3` | Handoffs de ondas anteriores | **histórica** — consultar antes de re-decidir temas já tratados |
| PR #368 `agente/00-paleta-oficial-migração` | Migração hex→var() em ~100 arquivos (+7768/−2238); OPEN com 5 gates vermelhos | **em aberto — decisão pendente** (§19.6) |
| Worktree `C:\Github\wt-368-rebase` | Worktree dedicado do PR #368 | **em uso** — diagnóstico de gates despachado |
| Handoff `.agents/handoffs/onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md` | Decisão do 00: #368 NÃO integra no estado atual; remediação antes de qualquer merge | **oficial-vigente** |
| Branches `integracao/onda-*`, `agente/<nn>-<slug>` | Convenção de isolamento | **oficial-vigente** (AGENTS.md §12) |

## 7. Lacunas de cobertura

- `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/.env` — conteúdo **NÃO VERIFICADO** por segurança (possível segredo; PENDÊNCIA §19.12).
- Histórico Git anterior a 09/2026 não foi auditado exaustivamente; a linha do tempo de §18 dos fatos cobre os marcos conhecidos.
- Nenhuma fonte externa (Figma, Drive, site publicado) foi auditada — **NÃO VERIFICADO** se existem ativos de marca fora do repo e da pasta de trabalho.
