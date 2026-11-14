# Relatório de Auditoria — Identidade Visual Birthub 360° V2
**Frente:** 01 — Auditoria de Identidade Visual · DEM-20261113-004
**Data:** 2026-11-13 · **Base:** worktree `missao-identidade-v2` (+ `missao-07-hero-n1` para N1)
**Escopo respeitado:** somente leitura fora de `identidade-visual/v2/01-auditoria/`; nenhum asset redesenhado ou alterado.

---

## 1. Sumário executivo

A identidade visual oficial da plataforma é **neon editorial**: paleta Azul `#00D4FF` / Rosa `#FF2D9B` / Dourado `#FFC107` / Íris `#8B7DFF` sobre Dark `#0D0D0D` e Light `#F4F7FB`, gradientes de assinatura, trinca tipográfica Sora/Inter/IBM Plex Mono, 29 personagens SVG e 3 logos oficiais. Essa identidade está **viva e canônica em código**: `identidade-visual/birthhub360/tokens/` → `src/styles/official-identity.css` → `main.tsx`, com `src/config/brand.ts` como espelho em TS.

O problema central não é ausência de identidade, mas **acúmulo de direções concorrentes**: pelo menos três paletas/personalidades anteriores ou paralelas ainda existem no repositório (navy/gold "Command Center", champagne "Elegance", gold/zinc do sub-app `landing/`), arquivos de estilo mortos carregam sistemas inteiros (`elegance.css`, `luxury-tokens.css` via `src/index.css` órfão), e a grafia do nome ("Birthub 360°" vs "Birth Hub 360°") é usada de forma mista até dentro dos próprios documentos mestres. A decisão de grafia permanece **PENDENTE** — ver `matriz-decisoes.md`.

## 2. O que é oficial / comprovado (evidência)

### 2.1 Cadeia canônica de tokens — ATIVA
- `src/main.tsx:11-12` importa `./styles/globals.css` e `./styles/official-identity.css`.
- `src/styles/official-identity.css:1-2` importa `identidade-visual/birthhub360/tokens/birthhub360.css` e `characters.css`.
- `identidade-visual/birthhub360/tokens/birthhub360.css` define a paleta `--palette-neon-*`, superfícies `--color-*` dark e light (com variantes AA), fontes, raios, gradientes, glows — e marca aliases `@deprecated` para os tokens legados (`--bg`, `--ink`, `--surface-2`, `--line`, `--ok`, `--critical`).
- `src/config/brand.ts` espelha a mesma identidade em TS (`BRAND.name`, `BRAND.colors`, `BRAND.logos` → `/brand/*.svg` em `public/brand/`).

### 2.2 Paleta, gradientes e tipografia — CONFIRMADOS em múltiplas fontes
- Paleta neon: `FONTE-DE-VERDADE.md` §3, `DESIGN.md` §Paleta, `docs/BrandConstitution.md` §2, `MANUAL-DE-IDENTIDADE-VISUAL.html` (`:root --neon-*`), `birthhub360.json`/`birthhub360.css`, `src/config/brand.ts`. Hex idênticos em todas.
- Gradientes: `linear-gradient(135deg,#00D4FF,#FF2D9B 50%,#FFC107)` e CTA `#FF2D9B→#00D4FF`, anel cônico `conic-gradient(#FFC107,#FF2D9B,#00D4FF,#FFC107)`, glows `0 0 24px rgba(...,0.45)` — idênticos em `birthhub360.css`, `globals.css`, `DESIGN.md`, manuais.
- Tipografia: Sora (display), Inter (interface, OpenType `cv05/cv11/ss01`, tracking `-0.012em`), IBM Plex Mono (dados) — consistente em `birthhub360.*`, `globals.css` (`@font-face` self-hosted em `public/fonts/`), manuais e `DESIGN.md`. Self-hosting elimina Google Fonts no app (TAREFA-SANEAMENTO-017).
- Light mode: `birthhub360.css` tem bloco `[data-theme="light"]` com variantes AA (`#0284C7`, `#D91B7C`, `#D97706`, `#7C3AED`, superfícies `#F4F7FB`/`#FFFFFF`) — exatamente a camada semântica que a FONTE-DE-VERDADE §3 pede para reconciliar; **já existe implementada**, é só documentar na V2.

### 2.3 Logos e personagens — CONFIRMADOS
- 3 logos oficiais em `identidade-visual/birthhub360/logos/` + espelhos `public/brand/`. Regras de uso (proteção, mínimos, proibições) em `docs/BrandConstitution.md` §4.
- 29 SVGs em `birthhub360/characters/` = 9 pilar + 20 agente, casando com `src/features/characters/characterCatalogPillars.ts` (9) e `characterCatalogAgents.ts` (20) e espelho `public/brand/characters/` (29 arquivos). Vínculo personagem↔módulo↔agente resolvido em runtime (`characterRuntime.ts`).
- `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md` cobre apenas os 9 avatares-pilar (status "PRONTO PARA HOMOLOGAÇÃO Agente 24") — os 20 agentes não têm guia equivalente encontrado.

### 2.4 Arquitetura dos 11 módulos — CONFIRMADA
- `src/components/layout/moduleRegistry.ts` é o registro canônico: P01–P08 (pilares) + M09–M11 (complementares); Hub Central fora da numeração; M10 mobile-only; M11 rota top-level. Workspace modular com sidebar rail + painel contextual — convergente com FONTE-DE-VERDADE §6.

### 2.5 Motion — PARCIALMENTE CONFIRMADO
- `src/lib/motion.ts` (Framer Motion): easings/durações/springs/variants + hooks com `useReducedMotion` e detecção de touch. Tokens CSS `--duration-*`/`--ease-*` em `globals.css:390-399` batem com o Design Language §8.
- **Lacuna:** não existe divisão formal Comercial vs Operacional (FONTE §7) — o motion atual é único, "operacional". `luxury-tokens.css` tem matriz de motion própria mas está morta (ver §3.2).

### 2.6 Landing/Login — EXISTEM e estão protegidos
- `src/features/landing/pages/Landing360.tsx` servida em `/` e `/login` (`App.tsx:98-107`); usa paleta neon com patches AA. `DESIGN.md`/`PRODUCT.md` proíbem alterá-los — a V2 é só documental, sem conflito.
- Referências visuais oficiais: `identidade-visual/birthhub360/BirthHub360_{Landing,Login,Personagens}.html` + `preview-29.html`.

## 3. Inconsistências, obsoleto e riscos

### 3.1 Grafia do nome — INCONSISTÊNCIA REAL E DOCUMENTAL
Evidências completas em `matriz-decisoes.md`. Resumo: "Birth Hub 360" domina documentos de marca voltados ao público (brandbook, manuais, `brand.ts`, BrandConstitution, strategy JSON, protótipo N1); "Birthub 360" aparece em títulos/corpo dos Documentos Mestres V4.x (até V4.10), nomes de arquivo `BIRTHUB360_*`, comentários de código, identificadores técnicos (`Piloto_Birthub360_Profile`, `birthub360.com.br`, `resolveBirthubUserIdByEmail`) e no `moduleRegistry.ts`. **Nenhuma fonte única resolve** → PENDENTE, conforme regra da FONTE-DE-VERDADE §1.

### 3.2 Sistemas visuais mortos ou divergentes no código
| Item | Evidência | Avaliação |
|---|---|---|
| `src/styles/elegance.css` | Nenhum import em `src/`/`index.html` | **Morto.** Paleta champagne/sage/pearl inteiramente divergente ("Elegance Redesign v3.0"). Candidato a remoção ou arquivamento — decisão do 00/24. |
| `src/index.css` + `src/styles/luxury-tokens.css` | `main.tsx` não importa `index.css`; `luxury-tokens.css` só é referenciado por ele | **Cadeia órfã/morta.** `luxury-tokens.css` descreve "luxury tokens FASE 0" com `--lux-font-mono: "JetBrains Mono"` (não canônico) e paleta obsidian/gold-soft paralela. |
| `landing/` (sub-app) | `landing/README.md`, `landing/src/index.css` | **Divergente e vivo como projeto separado.** Fontes Cabin+IBM Plex Mono, paleta zinc/`#d4af37`. Precisa de decisão: convergir para identidade oficial ou aposentar. |
| `landing-page.html` (raiz) | arquivo standalone | **Legado.** Navy `#0B132B`/gold `#D4AF37`, Google Fonts CDN. |
| `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` | doc | **Obsoleto.** Navy+Antique Gold+Playfair — era anterior ao neon. Deve ser marcado/superseded pela V2 para não confundir agentes. |
| `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` | doc | **Parcialmente obsoleto.** Cores neon corretas; tipografia diz Plus Jakarta Sans/JetBrains Mono (real: Sora/Inter/IBM Plex Mono); "navy foundation, gold accents" no Brand DNA. Motion §8 está correta. |
| `docs/strategy/DESIGN-playbook.md` + playbook HTML | doc | **Visual obsoleto.** Paleta gold/navy/Bodoni Moda rotulada "tokens reais da marca" — anterior ao rebrand neon. Conteúdo estratégico (posicionamento, ICP) permanece válido. |
| `public/tools/*` portais estáticos | `LEGACY_BRAND_CONTENT_MAP.md` §2.5 | Marca antiga (atlas) ainda roteada — débito já mapeado com handoffs abertos (11→00/01/03/10/15). |
| `#FF5618` residual | `LEGACY_BRAND_CONTENT_MAP.md` §2.2 (`meetingInvite.ts:127`, `executiveExport.ts:206`) | Cor da marca antiga (laranja) em e-mail/export real — handoffs abertos, fora do escopo V2. |

### 3.3 Divergências internas dos documentos oficiais (já documentadas)
`birthhub360.json → notes.conflicts` registra oficialmente divergências entre os 4 docs mestres: light surfaces (`#F4F7FB` vs `#F8FAFC`), textMuted (`#64748B`/`#475569` vs `#9EADC8`/`#A1A1B5`), hover surface, alpha de sombras/bordas, code bg, glows (.45 vs .35). A V2 deve adotar a resolução já implementada em `birthhub360.css`/`globals.css` e citá-la como canônica.

### 3.4 Personagens — cobertura parcial
- Guia mestre cobre 9 avatares-pilar; os 20 personagens-agente (`characterCatalogAgents.ts`) não têm guia dedicado encontrado. `GUIA-MESTRE` usa paths `/brand/characters/` (válido via `public/brand/characters/`).
- Contagens de "agentes" divergem entre fontes: FONTE-DE-VERDADE cita "26 agentes técnicos", `BIRTHUB360_CONTRATOS_AGENTES.md` fala em 24 agentes, catálogo tem 20 personagens-agente. Não bloqueia a V2, mas registrar.

### 3.5 N1 Final Candidate — estado
- Existe **somente** no worktree `missao-07-hero-n1`, branch `agente/02-03-hero-n1-missao-07` (commit `d094a8831`, ahead 1, não mergeado): `src/features/landing/components/hero-n1/*` + `LandingHeroN1.css` (1230 linhas, paleta oficial + Sora/Inter/Plex self-hosted) e protótipo `docs/landing-v2/prototype/`.
- No worktree atual **não há** `hero-n1/` nem `docs/landing-v2/` — a Frente 04 (motion) e a matriz do 00 devem tratar o N1 como referência externa até merge.
- `docs/audits/onda-42/11-relatorio-auditoria-n1.md` é homônimo mas trata de N+1 de queries — não confundir.

## 4. O que preservar (recomendação da auditoria)

1. **Cadeia de tokens oficial** (`identidade-visual/birthhub360/tokens/` + `official-identity.css` + `globals.css` + `brand.ts`) — é a espinha dorsal; V2 deve referenciá-la, não recriá-la.
2. **Paleta neon + gradientes + glows + raios + tipografia** — já convergentes em todas as fontes normativas; apenas formalizar a camada semântica light AA (já implementada em `birthhub360.css`).
3. **29 SVGs de personagens e 3 logos** — intocados por determinação do usuário; V2 documenta uso, não redesenha.
4. **`moduleRegistry.ts`** como taxonomia oficial dos 11 módulos.
5. **`src/lib/motion.ts`** como base do Motion System Operacional; estendê-lo conceitualmente para o nível Comercial (landing/marketing) na Frente 04.
6. **HTMLs de referência** (`BirthHub360_*.html`, `preview-29.html`) como evidência visual aprovada.
7. **`docs/BrandConstitution.md`** como documento-ponte (já declara fontes de verdade e aponta divergências).

## 5. O que evoluir (insumo para V2)

1. **Documentar a divisão de motion Comercial vs Operacional** — hoje só existe o operacional; o N1 (`LandingHeroN1.css`, `HeroMotion.ts`) é a referência criativa para o nível Comercial.
2. **Formalizar tokens semânticos por módulo** ("identidade contextual por módulo" da FONTE §6) — hoje `bh-platform-card[data-accent]` já tem esboço (cyan/pink/gold/iris/success/danger/blue/neutral em `official-identity.css:166-196,321-327`).
3. **Reconciliar `#F8FAFC` vs `#F4F7FB`** — FONTE pede light canônico `#F4F7FB`; `birthhub360.css` light usa `#F4F7FB` como `--color-background` mas DESIGN.md lista `#F8FAFC` como canvas. Adotar `#F4F7FB` (fonte de verdade pinada) e notar `#F8FAFC` como surface/code-bg legado.
4. **Decidir destino dos arquivos mortos** (`elegance.css`, `luxury-tokens.css`, `src/index.css`) e das superfícies divergentes (`landing/`, `landing-page.html`) — registrar como decisão pendente do 00 (não executar remoção nesta missão).
5. **Estender guia de personagens** aos 20 agentes ou declarar explicitamente o escopo "9 pilares + 20 agentes" na V2.
6. **Marcar documentos obsoletos** (`BIRTHHUB-360-DESIGN-SYSTEM.md`, partes de `DESIGN-LANGUAGE.md`, `DESIGN-playbook.md`) com banner de superseded apontando para a V2 — proposta, sujeita a aprovação.

## 6. Decisões pendentes de homologação (consolidado)

| # | Decisão | Estado |
|---|---|---|
| D1 | Grafia oficial "Birthub 360°" vs "Birth Hub 360°" | **PENDENTE** — ver matriz-decisoes.md |
| D2 | Grafia do símbolo de grau: `360°` (docs de marca) vs `360º` (brand.ts, BrandConstitution, strategy JSON) | **PENDENTE** — micro-inconsistência adicional encontrada |
| D3 | Destino de `elegance.css`, `luxury-tokens.css`, `src/index.css` (mortos) | PENDENTE (00/24) |
| D4 | Destino do sub-app `landing/` e `landing-page.html` (identidade divergente) | PENDENTE (00/02/11) |
| D5 | Status do N1 hero (merge? referência permanente?) | PENDENTE — depende de homologação da missão 07 |
| D6 | Light canvas canônico `#F4F7FB` vs `#F8FAFC` | PROVISÓRIO: adotar `#F4F7FB` (FONTE pinada) até homologação |
| D7 | Documentos de design obsoletos: marcar superseded? | PROVISÓRIO: sim, com banner |
| D8 | Contagem oficial de personagens/agentes (29 SVGs vs "26 agentes" vs 24 contratos vs 20 no catálogo) | PENDENTE (00) |
| D9 | Posicionamento: briefing "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" vs PRODUCT.md "Sistema Operacional de Revenue Intelligence" | CONFIRMADA convergência; formulação V2 = briefing (FONTE §2) |

## 7. Conformidade inicial com a FONTE-DE-VERDADE

Resumo (detalhe em `matriz-conformidade.md`):

- §1 Nome/grafia: **parcial** — "Birthub 360°" pinado como nome de trabalho, mas evidência documental é mista → PENDENTE.
- §2 Posicionamento: **conforme** — convergente com PRODUCT.md/strategy.
- §3 Paleta/gradientes/tipografia: **conforme** — implementado e documentado; falta só formalizar camada semântica light na V2.
- §4 Tipografia: **conforme**.
- §5 Linguagem visual "Neon Editorial Cinematic": **parcial** — N1 existe como candidato não integrado; landing atual usa neon mas sem a linguagem editorial cinematográfica formalizada.
- §6 Arquitetura 11 módulos: **conforme** — `moduleRegistry.ts`.
- §7 Motion dois níveis: **parcial** — operacional existe (`motion.ts` + tokens); comercial é só referência N1.
- §8 Personagens: **conforme com ressalva** — 29 SVGs oficiais preservados; guia cobre 9/29.
- §9 Logo: **conforme** — 3 assets oficiais, regras documentadas.
- §10 Limites: **conforme** — esta auditoria não alterou nada fora do diretório permitido.
