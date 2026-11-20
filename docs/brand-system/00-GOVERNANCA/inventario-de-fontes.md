# Inventário de Fontes

Estado: CONFIRMADO (contagens por script) · Dados completos: [assets-desktop.csv](../_inventarios/assets-desktop.csv), [svgs-repo.csv](../_inventarios/svgs-repo.csv)

## Fonte A — Desktop `IDENTIDADE-VISUAL`

| Subpasta | Conteúdo observado (nomes) | Estado |
|---|---|---|
| `02_IDENTIDADE_VISUAL` | brandbook HTML (3 versões), `03_DESIGN_SYSTEM.html`, `04-UI-UX-DESIGN.html`, auditorias a11y `.md` | NÃO VERIFICADO (conteúdo não lido) |
| `03_BRAND_KB` | matrizes de rastreabilidade, estratégia ICP, serviços | NÃO VERIFICADO |
| `04_ASSETS_VISUAIS` | logos SVG (horizontal, dark/light, símbolo, ícone, favicon, avatar), `BirthHub360-Identidade-Visual-Completa.zip` | Catalogado; cópias idênticas no repo para parte dos SVGs |
| `05_TOKENS_E_TEMAS` | `design-tokens.json`, fontes `.tsx` do app, **um `.env`** | NÃO VERIFICADO; `.env` intencionalmente não lido |
| `TUDO/` | `birthhub360/`, `design-lab/`, `docs/`, `raiz/`, `v2/` (01-auditoria … 07-relatorio-00) | NÃO VERIFICADO; `v2` coincide com commit `07bfc7304` do repo (HISTÓRICO) |

Equivalência por SHA-256 com `identidade-visual/` do repo: **114/445** arquivos. Os demais são duplicatas com outro hash, artefatos de outras pastas do repo ou materiais exclusivos do Desktop (não classificados).

## Fonte B — Repositório

| Caminho | Papel | Estado |
|---|---|---|
| `identidade-visual/birthhub360/tokens/{birthhub360.css,.json,.ts}` | Tokens canônicos (276 linhas CSS) | CONFIRMADO, importado por `src/styles/official-identity.css` |
| `identidade-visual/birthhub360/logos/*.svg` | 3 logos (horizontal, símbolo, ícone) | CONFIRMADO |
| `identidade-visual/birthhub360/characters/*.svg` | 29 personagens + `characters.{css,json,ts}` | CONFIRMADO |
| `identidade-visual/birthhub360/*.html` | Landing, Login, Personagens (protótipos) | HISTÓRICO/referência |
| `DESIGN.md`, `PRODUCT.md` (raiz) | Esquema Impeccable de design e produto | CONFIRMADO; contém divergências (ver conflitos) |
| `BirthHub360-DesignSystem-Bible.html`, `design-system-guide/`, `visual-catalog/`, `prints-design-system/` | Documentação visual anterior | NÃO VERIFICADO |
| `src/styles/{globals,official-identity,luxury-tokens,elegance}.css` | CSS da aplicação | globals.css e official-identity.css lidos parcialmente |
| `src/lib/motion.ts` | Tokens/variants de motion (framer-motion) | CONFIRMADO |

## Fonte C — Histórico

`git log -- identidade-visual`: `07bfc7304` (missão mestre V2: auditoria, brandbook, DS, motion), `654e5842b` (catálogo de 29 personagens), `aac2839fd`. Demais ADRs/PRs: NÃO VERIFICADO.
