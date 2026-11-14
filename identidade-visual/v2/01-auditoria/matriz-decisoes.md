# Matriz de Decisões — Identidade Visual V2
**Frente:** 01 · DEM-20261113-004 · 2026-11-13

Classificação: **CONFIRMADA** (evidência definitiva em fonte normativa/código) · **PROVISÓRIA** (recomendação da auditoria, aguardando homologação) · **PENDENTE** (sem evidência definitiva — exige decisão do usuário/00).

---

## 1. Grafia do nome — "Birthub 360°" vs "Birth Hub 360°" → **PENDENTE**

### Evidências levantadas (todas as fontes encontradas)

**Fontes que usam "Birth Hub 360" (com espaço):**
| Fonte | Trechos |
|---|---|
| `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html` | Título "Manual Global de Marca: Birth Hub 360°"; 5 ocorrências, 0 "Birthub" |
| `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html` | "Birth Hub 360° — Manual Oficial de Identidade Visual 2026" |
| `identidade-visual/MANUAL-DE-IDENTIDADE-DO-PRODUTO.html` | "Birth Hub 360° — Manual de Identidade do Produto" |
| `identidade-visual/CATALOGO-DE-COMPONENTES.html` | "Birth Hub 360° — Catálogo Oficial de Componentes" |
| `identidade-visual/birthhub360/tokens/birthhub360.json` | `"name": "Birth Hub 360°"` |
| `src/config/brand.ts` | `name: 'Birth Hub 360º'`, `shortName: 'Birth Hub'` — "fonte de verdade única em código" |
| `docs/BrandConstitution.md` | "Constituição da Marca — Birth Hub 360º" |
| `docs/strategy/birth-hub-360-strategy.json` + playbook HTML | `"name": "Birth Hub 360º"` (21 ocorrências "Birth Hub 360", 0 "Birthub" no JSON) |
| `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `DESIGN-LANGUAGE.md` | "BirthHub 360" / "Birth Hub 360" |
| `identidade-visual/birthhub360/BirthHub360_{Landing,Login,Personagens}.html`, `preview-29.html` | somente "Birth Hub 360" |
| `DESIGN.md`, `PRODUCT.md` (raiz) | "Birth Hub 360°" |
| SVGs dos logos | `aria-label="Birth Hub 360"`, `<title>Birth Hub 360 — símbolo</title>` |
| Protótipo N1 (`missao-07-hero-n1/docs/landing-v2/prototype/index.html`) | "Birth Hub 360°" |
| `LandingHeroN1.css` (worktree irmão) | "BIRTH HUB 360° — HERO N1" |

**Fontes que usam "Birthub 360" (junto):**
| Fonte | Trechos |
|---|---|
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html` | `<title>Birthub 360° — Documento Mestre…`; corpo: "Birthub 360° — Sistema Operacional…" (mas `aria-label` do logo = "Birth Hub 360") |
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.10.html` (versão mais recente) | Título usa "Birth Hub 360°", mas corpo usa "Birthub 360°" em descrições de módulos (linhas ~1949, 2269, 2341, 2394) — **mistura dentro do mesmo documento** |
| `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4_CINEMATIC.html` | 10× "Birthub 360", 5× "Birth Hub 360" |
| `identidade-visual/AUDITORIA-COMPLETA-BIRTH-HUB-360.html` | 4× "Birthub 360", 9× "Birth Hub 360" |
| `src/components/layout/moduleRegistry.ts:16-17` | "módulos oficiais do Birthub 360°" |
| `src/features/design-lab/DesignLabPage.tsx` | "Birthub Command Language" / "Birthub Components V2" |
| Dados de negócio em código | `Piloto Birthub 360 Profile` (pipeline stage, `defaultPipelineStages.ts`, `CrmBoard.tsx`), `Piloto_Birthub360_Profile*` (enum `LeadStatus`), `solucaoBirthub360` (bitrixFieldMap), `resolveBirthubUserIdByEmail` |
| Infra/domínios | `birthub360.com.br`, `app.birthhub360.com.br`, `br.com.birthhub360.prospector`, GHCR `…-birthhub360`, repositório remoto `CENTRAL-DE-INTELIGENCIA-COMERCIAL-BIRTHHUB360` (argocd/charts — ver LEGACY_BRAND_CONTENT_MAP §2.1) |
| Nomes de arquivo | Todos os documentos de engenharia: `BIRTHUB360_*.md/csv/html` |
| `public/design-lab/README.md` | "repositório Birthub-360" |

### Conclusão
**PENDENTE.** Não existe fonte definitiva: os próprios Documentos Mestres V4.x (incluindo V4.10, o mais recente) misturam as duas grafias no mesmo documento; a documentação voltada à marca (brandbook, manuais, tokens, `brand.ts`, BrandConstitution) usa consistentemente "Birth Hub 360", enquanto engenharia/infra/dados usa "Birthub 360". O briefing do usuário fixa "Birthub 360°" como nome de trabalho — os documentos V2 devem usá-lo com nota de pendência, conforme FONTE-DE-VERDADE §1. **Recomendação (não decisão):** se homologado, a grafia pública deveria ser "Birth Hub 360°" (dominante em todos os artefatos voltados ao usuário) e "Birthub/BIRTHUB360" permaneceria como identificador técnico legado — mas isso exige decisão explícita do usuário.

### Sub-questão correlata — símbolo de grau → **PENDENTE**
`brand.ts`, BrandConstitution e strategy JSON usam `360º` (masculine ordinal º); documentos de marca e FONTE-DE-VERDADE usam `360°` (degree). Ocorrências mistas: `Birth Hub 360°` (maioria dos HTMLs/docs) vs `Birth Hub 360º` (`brand.ts`, BrandConstitution, strategy JSON, playbook). Não documentado em nenhuma fonte — incluir na mesma decisão de grafia.

---

## 2. Paleta Neon Oficial → **CONFIRMADA**

| Item | Valor | Fontes concordantes |
|---|---|---|
| Azul Neon | `#00D4FF` | FONTE §3, DESIGN.md, BrandConstitution §2, Manual Visual, birthhub360.css/json/ts, brand.ts, globals.css, Landing360.css, LandingHeroN1.css |
| Rosa Neon | `#FF2D9B` | idem |
| Dourado | `#FFC107` | idem |
| Íris | `#8B7DFF` | FONTE §3, DESIGN.md, Manual Produto, birthhub360 tokens (`--color-heading-iris`/`--palette-iris`) |
| Dark | `#0D0D0D` | idem (+ superfícies `#14141A`, `#1C1C24`, `#252532`) |
| Light | `#F4F7FB` | FONTE §3, birthhub360.css `--palette-bg/--color-background` light; **DESIGN.md diverge com `#F8FAFC`** → ver D6 do relatório |
| Gradientes | `135deg #00D4FF→#FF2D9B→#FFC107`; CTA `#FF2D9B→#00D4FF`; conic orbit; glows `0 0 24px rgba(...,0.45)` | idênticos em todas as fontes |
| Semânticos | success `#22C55E`, danger `#EF4444`, info `#3B82F6`, warn `#FFC107` | birthhub360.css, globals.css; **AUDITORIA-COMPLETA html diverge** (`#10B981`/`#FF3B5C`) — snapshot histórico |
| Light AA | `#0284C7`, `#D91B7C`, `#D97706`, `#7C3AED` etc. | birthhub360.css bloco light + overrides em official-identity.css:264-315 |

**Ressalva:** `globals.css` ainda carrega `--midnight:#0B132B`, `--sunset`, `--red-violet:#8B5CF6` etc. como tokens legados de eras anteriores — não são usados como paleta oficial, mas poluem o `:root`. Anotar na V2 como débito de limpeza (não urgente).

## 3. Tipografia → **CONFIRMADA**

Sora (display, 400/600/700/800, tracking `-0.02em`) · Inter (interface, `font-feature-settings:"cv05","cv11","ss01"`, tracking `-0.012em`) · IBM Plex Mono (dados/métricas). Self-hosted em `public/fonts/` via `@font-face` em `globals.css` e `landing-v2.css`. Fontes divergentes encontradas apenas em artefatos mortos/legados: `elegance.css` (sem mudança de família, mas tokens próprios), `luxury-tokens.css` (`JetBrains Mono` na pilha), `landing/` (**Cabin**+Plex Mono), `landing-page.html` (Sora+Plex via Google Fonts), `BIRTHHUB-360-DESIGN-LANGUAGE.md`/`DESIGN-SYSTEM.md` (Plus Jakarta Sans/JetBrains Mono/Playfair — desatualizados).

## 4. Linguagem visual "Neon Editorial Cinematic" → **PROVISÓRIA**

- Conceito fixado na FONTE §5; "N1 Final Candidate é referência criativa, não fonte automática de regras".
- Evidência de implementação: `LandingHeroN1.css`/`hero-n1/*` no worktree irmão (branch `agente/02-03-hero-n1-missao-07`, commit `d094a8831`, **não mergeado**); protótipo `docs/landing-v2/prototype/` com temas light/dark e variantes AA; `Landing360.css` atual já usa neon mas em linguagem mais "dashboard com neon" do que "editorial cinematográfico".
- **Status:** linguagem existe como direção aprovada em briefing + candidato N1; faltam regras formais (o que é obrigatório vs. opcional). A V2 deve formalizar a partir do N1 + manuais, não do zero.

## 5. Arquitetura Hub + 11 módulos → **CONFIRMADA**

`src/components/layout/moduleRegistry.ts` (código P01–P08, M09–M11; Hub fora da numeração; M10 mobile-only; M11 top-level). "Um único Design System com identidade contextual por módulo" — esboço existente: `bh-platform-card[data-accent]` com 8 acentos (`official-identity.css:166-196`). Detalhamento por módulo = trabalho das Frentes 02/03/05.

## 6. Motion System dois níveis → **PROVISÓRIA**

- Operacional: **CONFIRMADA** a existência (`src/lib/motion.ts` + tokens `--duration-*`/`--ease-*` em `globals.css`; `prefers-reduced-motion` respeitado em variants e CSS).
- Comercial (monumental/cinematográfico): **PROVISÓRIA** — referência = N1 (`HeroMotion.ts`, `LandingHeroN1.css`, `landing-v2.css`); não há implementação "comercial" formal no produto além da landing atual. Framer Motion confirmado como lib padrão (imports em `motion.ts` e `Landing360.tsx`).

## 7. Personagens (29 SVGs) → **CONFIRMADA (com ressalvas)**

- 29 SVGs oficiais em `birthhub360/characters/` + `public/brand/characters/` — preservados, sem redesenho.
- Mapeamento: 9 pilares (`characterCatalogPillars.ts`) + 20 agentes (`characterCatalogAgents.ts`). Vínculo runtime via `characterRuntime.ts`.
- **Ressalvas PENDENTES:**
  - `GUIA-MESTRE-PERSONAGENS` cobre só os 9 pilares e se declara "PRONTO PARA HOMOLOGAÇÃO (Agente 24)" — homologação não evidenciada no repositório.
  - Contagens divergentes: FONTE cita "26 agentes técnicos"; `BIRTHUB360_CONTRATOS_AGENTES.md` fala em 24; catálogo tem 20 personagens-agente. → decisão do 00 sobre taxonomia oficial de agentes vs. personagens.
  - FONTE §8 lista 27 nomes; os 29 SVGs incluem `oracle` e `aegis` (aegis está na lista; oracle também — reconto: lista da FONTE tem 27 nomes? Verificar: aegis, anchor, apex, aria, axiom, beacon, cipher, core, echo, forge, harbinger, helm, ledger, meridian, nexus, orbit, pledge, relay, scope, scout, seal, spark, sudo, tempo, tracker, tribunal, vanguard, vox = 28 nomes na FONTE; diretório tem 29 arquivos incluindo `oracle.svg`. **Discrepância: FONTE lista 28 nomes, existem 29 SVGs (oracle presente no catálogo pillar e no disco, ausente da lista nominal da FONTE).** → registrar para o 00.

## 8. Logo → **CONFIRMADA**

3 assets oficiais (`icone`, `horizontal`, `simbolo`) em `birthhub360/logos/` + `public/brand/`; regras de proteção/mínimos/proibições em `BrandConstitution.md` §4. Nota: BrandConstitution menciona "anel dourado" e "azul+roxo" na órbita — descrição genérica; os SVGs mestres contêm "cores históricas que diferem dos tokens Neon" (README de identidade-visual) e foram preservados por determinação do usuário → qualquer atualização cromática do logo é **PROIBIDA** nesta missão e provavelmente futura (asset sagrado).

## 9. Posicionamento → **CONFIRMADA**

Briefing (FONTE §2): "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence". PRODUCT.md: "Sistema Operacional de Revenue Intelligence" — convergente; formulação do briefing prevalece na V2 (regra já pinada). Strategy JSON tem elevator pitch compatível.

## 10. Demais decisões

| Decisão | Classe | Evidência / Nota |
|---|---|---|
| Light canvas `#F4F7FB` canônico (vs `#F8FAFC` do DESIGN.md) | PROVISÓRIA | FONTE pinou `#F4F7FB`; birthhub360.css light usa `#F4F7FB`. DESIGN.md lista `#F8FAFC` — reconciliar documentando `#F4F7FB` como fundo e `#F8FAFC` como superfície/code-bg legado. |
| Texto nunca branco/preto puro; tons `#70D6FF`/`#9EADC8` etc. | CONFIRMADA | birthhub360.css, official-identity.css overrides, BrandConstitution §2 nota "Azul Leitura #70D6FF". |
| 4 estados obrigatórios (Loading/Empty/Error/Stale) | CONFIRMADA | DESIGN.md §"4 Estados", PRODUCT.md imperativo 4. |
| 30 componentes oficiais | CONFIRMADA (parcial implementação) | DESIGN.md lista 30; CATALOGO html é a referência; utilitários `bh-*` existem em official-identity.css; componentes React individuais = escopo das Frentes 05/06. |
| Destino de arquivos mortos (`elegance.css`, `luxury-tokens.css`, `src/index.css`) | PENDENTE | Auditoria recomenda arquivar/remover; decisão de código fora do escopo V2 → 00. |
| Destino de `landing/` sub-app e `landing-page.html` | PENDENTE | Identidade divergente (Cabin/gold; navy/gold). Recomendação: convergir ou aposentar — decisão 00/02/11. |
| Marcar docs obsoletos como superseded | PROVISÓRIA | `BIRTHHUB-360-DESIGN-SYSTEM.md`, partes de `DESIGN-LANGUAGE.md`, `DESIGN-playbook.md` descrevem era navy/gold. |
| N1 como referência oficial da linguagem comercial | PROVISÓRIA | Depende de merge/homologação da missão 07; até lá, "referência criativa". |
| Guias de personagens para os 20 agentes | PROVISÓRIA | Estender `GUIA-MESTRE` ou criar camada agente — decisão 11/00. |
| `#FF5618` residual e portais `public/tools/*` marca antiga | PENDENTE (já com handoffs) | `LEGACY_BRAND_CONTENT_MAP.md` §2.2/§2.5 — fora do escopo V2, mas a V2 deve referenciar para não perpetuar a marca antiga. |
