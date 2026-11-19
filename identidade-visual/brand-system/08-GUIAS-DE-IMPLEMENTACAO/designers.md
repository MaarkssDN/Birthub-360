# Guia de Implementação — Designers — Birth Hub 360°

**Propósito:** orientar designers na produção de propostas visuais alinhadas à identidade oficial, indicando fontes de verdade, paleta/tipografia de trabalho, componentes existentes e o processo de homologação.

**Escopo:** trabalho de design (Figma, HTMLs de referência, propostas) para o produto web e materiais institucionais. Não cobre implementação em código (ver `frontend.md`) nem aprovação de marca (ver `contribuicao.md`).

**Estado:** regras derivadas de evidências verificadas em 2026-11-19.

**Data:** 2026-11-19 · **Fontes:** `identidade-visual/README.md`, `identidade-visual/v2/FONTE-DE-VERDADE.md`, `DESIGN.md`, `docs/BrandConstitution.md`, `MANUAL-DE-IDENTIDADE-*.html` (raiz de `identidade-visual/`), `CATALOGO-DE-COMPONENTES.html`, `birthhub360/tokens/*.json`, `_FATOS-CANONICOS.md`.

**Documentos relacionados:** `frontend.md`, `marketing.md`, `checklist-de-qualidade.md`, `contribuicao.md`, `../07-ATIVOS/referencias-visuais.md`, `../07-ATIVOS/catalogo-de-assets.md`, `../01-MARCA/brandbook.md`.

---

## 1. Fontes de verdade (ordem de consulta)

1. **Decisões pinadas:** `identidade-visual/v2/FONTE-DE-VERDADE.md` (2026-11-13) — paleta, tipografia, posicionamento, limites.
2. **Brandbook:** `identidade-visual/BRANDBOOK-OFICIAL-BIRTH-HUB-360.html` (precedência nº 1 entre HTMLs — `identidade-visual/README.md`).
3. **Manual Visual:** `identidade-visual/MANUAL-DE-IDENTIDADE-VISUAL.html`.
4. **Manual de Produto:** `identidade-visual/MANUAL-DE-IDENTIDADE-DO-PRODUTO.html` (nomes formais dos módulos).
5. **Catálogo de Componentes:** `identidade-visual/CATALOGO-DE-COMPONENTES.html`.
6. **Tokens machine-readable:** `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` e `characters.*` — use estes valores, não amostras visuais de SVGs (que contêm cores históricas navy/gold preservadas por determinação do usuário).
7. **Design-schema do produto:** `DESIGN.md` (escopo `/app/*`, modo Operate; landing/login intocáveis sem autorização humana).
8. **Constituição da marca:** `docs/BrandConstitution.md`.

**Nunca como fonte:** `docs/design/BIRTHHUB-360-DESIGN-*.md`, `docs/strategy/DESIGN-playbook.md`, `BirthHub360-DesignSystem-Bible.html`, `.claude/skills/design-system/SKILL.md`, `.agents/skills/birthhub-*` — todos **desatualizados** (navy/gold/Bodoni/Plus Jakarta) conforme `00-GOVERNANCA/inventario-de-fontes.md` §5.

## 2. Paleta de trabalho (Neon)

Dark canônico (`birthhub360.css:9-117`): fundo `#0D0D0D`, surface `#14141A`, elevated `#1C1C24`, hover `#252532`, code-bg `#09090D`; texto `#F8F9FF/#9EADC8/#A1A1B5`; marca `#00D4FF` (azul), `#FF2D9B` (rosa), `#FFC107` (dourado), `#8B7DFF` (íris IA); semânticos `#22C55E/#FFC107/#EF4444/#3B82F6`.

Light AA (`birthhub360.css:119-186` + overrides): canvas `#F4F7FB` (**canônico V2**; `#F8FAFC` é divergência pendente §19.7), surface `#FFFFFF`, elevated `#EDF2F7`; tintas `#0F172A/#64748B/#475569`; marca adaptada `#0369A1/#D91B7C/#D97706/#7C3AED/#DC2626`.

Gradientes de assinatura: `--grad-brand` (135°, cyan→pink→gold — títulos), `--grad-cta` (pink→cyan — CTAs), `--grad-vancouver`, `--grad-orbit` (anel cônico 360°). Glows `0 0 24px rgba(...,.45)`. Definições completas em `birthhub360.css` e `_FATOS-CANONICOS.md` §4.

## 3. Tipografia

- **Sora** — títulos H1–H6, heroes, CTAs, números de destaque (400–800, tracking `-0.02em`).
- **Inter** — interface, menus, formulários, tabelas, corpo (400–800; features `cv05/cv11/ss01`, tracking `-0.012em`).
- **IBM Plex Mono** — dados tabulares, KPIs, R$, logs, badges técnicos.
- Proibidas: Bodoni Moda, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto/Open Sans/Poppins.
- Regra: títulos nunca `#000`/`#FFF` puros — usar variantes `data-accent` (cyan|gold|pink|iris|blue|success|danger).

## 4. Componentes e geometria existentes

- `src/components/ui/` (~95 arq): Button (15 variants × sizes pill/icon), Input, Card, Badge, Dialog, Drawer, Table, Skeleton, EmptyState, KpiCard, CommandPalette, etc. Catálogo de 30 componentes oficiais em `DESIGN.md` + `CATALOGO-DE-COMPONENTES.html`.
- Superfícies: `.bh-platform-card[data-accent]`, `.bh-card/.bh-heading/.bh-kicker`, `.bh-state-*`, `.glass-*`, `.vancouver-*`.
- Raios: control 12px / card 16px / modal 20px / pill 9999px. Espaçamento base 4px. Foco visível obrigatório (outline 2px + offset 3px). Targets ≥44px.
- Personagens: 29 SVGs canônicos (`identidade-visual/birthhub360/characters/` + `public/brand/characters/`); guia em `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`; contagem oficial de agentes PENDENTE (20/24–26/29 — §19.2).
- Motion (nível operacional implementado): easings/durações/springs em `src/lib/motion.ts`; proposta de 2 níveis (Comercial/Operacional) **não homologada**.

## 5. O que é PROPOSTO vs oficial

| Conteúdo | Status |
|---|---|
| Paleta Neon, trinca tipográfica, gradientes, raios, motion operacional, 29 personagens, rotas/módulos | **oficial-vigente** |
| `identidade-visual/v2/` inteiro (brandbook V2, DS tokens, motion system, biblioteca de componentes, referência N1, landing V2) | **proposta-não-homologada** — pode inspirar, nunca decidir |
| Motion em 2 níveis; mapeamento módulo→accent; área de proteção do logo (duas versões divergentes: Manual Mestre vs BrandConstitution — §19.10) | **pendente de decisão humana** |
| Grafia "Birth Hub 360°" vs "Birthub 360°" vs `360º` | **pendente** (§19.1) — usar "Birth Hub 360°" como grafia de trabalho |

## 6. Onde propor novidades

1. **Proposta de design** → documentar em `.agents/handoffs/onda-<n>/<autor>-para-<dono>-<slug>.md` (formato em `AGENTS.md` §18) ou na pasta de trabalho `DOCUMENTOS/IDENTIDADE-VISUAL/` para revisão.
2. **Destinatários por tipo:** tokens/estilos/componentes → **Agente 03** (`src/styles/**`, `src/components/ui/**`); identidade visual/ativos → **Agente 11** (`identidade-visual/**`); navegação/shell → **Agente 02**; motion → Agente 03 + 16 se tocar filas (não toca); decisões de marca → **Agente 00** + aprovação humana.
3. **Homologação:** toda entrega passa por parecer do **Agente 24** (revisão independente obrigatória — `AGENTS.md` §40) antes de integrar; mudanças de identidade exigem **aprovação humana explícita** (decisão do usuário, como na homologação da paleta Neon em 2026-10-11, merge `36d097a17`).
4. **Nunca** edite `identidade-visual/birthhub360/tokens/*` ou HTMLs oficiais diretamente — são artefatos de decisão; proposta de token novo segue `contribuicao.md`.

## 7. Processo de design recomendado

1. Consultar fontes de verdade (§1) e tokens JSON — anotar valores exatos.
2. Montar proposta nos 2 temas (dark + light) e nos breakpoints 360/390/768/1024/1440.
3. Cobrir os 4 estados (loading/empty/error/stale) quando for tela operacional.
4. Validar contraste AA (texto ≥4.5:1; não-texto ≥3:1) e foco visível.
5. Entregar com evidências (screenshots nos mesmos formatos dos goldens de `04_ASSETS_VISUAIS`) + handoff ao dono.
