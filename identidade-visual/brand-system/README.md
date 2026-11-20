# Brand System — Birth Hub 360°

**Biblioteca oficial de marca, identidade visual, produto e experiência do Birth Hub 360°.**
**Versão:** 0.1 (GENESIS) · **Data:** 2026-11-19 · **Escopo:** documentação em `identidade-visual/brand-system/` — não altera código, tokens ou assets.

---

## O que é isto

Camada de consolidação documental produzida pela OPERAÇÃO GENESIS BRAND SYSTEM: engenharia reversa da identidade e da experiência da plataforma, com evidências rastreáveis. Ela **não substitui** as fontes canônicas — referencia e organiza.

## Fontes de verdade (ordem de precedência)

1. `identidade-visual/v2/FONTE-DE-VERDADE.md` — decisões pinadas pelo usuário (2026-11-13).
2. `identidade-visual/README.md` — Brandbook > Manual Visual > Manual Produto > Catálogo (HTMLs oficiais).
3. `identidade-visual/birthhub360/tokens/*` + `src/styles/official-identity.css` + `src/styles/globals.css` — tokens vivos.
4. `src/config/brand.ts` — espelho TS.
5. `DESIGN.md`, `PRODUCT.md`, `docs/BrandConstitution.md` — schemas de produto/design/marca.
6. `identidade-visual/v2/` — sistema V2 completo (**NÃO HOMOLOGADO** — proposta avançada).
7. Esta biblioteca (`brand-system/`) — consolidação e governança.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `00-GOVERNANCA/` | relatório forense, fontes, matriz de evidências, conflitos, versões, roadmap |
| `01-MARCA/` | identidade, posicionamento, personalidade, arquitetura, verbal, brandbook |
| `02-IDENTIDADE-VISUAL/` | identidade visual, logo, paleta, tipografia, ícones, ilustrações, imagens, aplicações |
| `03-PRODUTO/` | identidade do produto, princípios UX, IA, módulos, rotas, telas, jornadas, UX writing |
| `04-DESIGN-SYSTEM/` | DS, foundations, tokens, temas, grids, componentes, estados, especificações |
| `05-MOTION/` | manual de animações, princípios, tokens, transições, microinterações, reduced-motion |
| `06-EXPERIENCIA/` | navegação, formulários, feedback, dashboards, responsividade, acessibilidade, landing |
| `07-ATIVOS/` | catálogo de assets, licenciamento, referências visuais, rastreabilidade |
| `08-GUIAS-DE-IMPLEMENTACAO/` | frontend, designers, marketing, agentes de IA, checklist, contribuição |
| `09-PLANO-DE-EVOLUCAO/` | inconsistências, gap analysis, decisões pendentes, backlog, plano |

`_FATOS-CANONICOS.md` — pacote de evidências interno usado na redação (não é documento de consumo).

## Como ler

- **Designer novo:** `01-MARCA/brandbook.md` → `02-IDENTIDADE-VISUAL/` → `04-DESIGN-SYSTEM/`.
- **Dev frontend:** `04-DESIGN-SYSTEM/` → `05-MOTION/` → `08-GUIAS-DE-IMPLEMENTACAO/frontend.md`.
- **Produto/UX:** `03-PRODUTO/` → `06-EXPERIENCIA/`.
- **Agente de IA:** `08-GUIAS-DE-IMPLEMENTACAO/agentes-de-ia.md` primeiro.
- **Governança:** `00-GOVERNANCA/` + `09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md`.

## Estado e limitações

- Documentação baseada em evidência estática (código, tokens, docs, git). A aplicação não foi executada nesta sessão; análise visual apoia-se em HTMLs de referência, snapshots e tokens.
- Itens **[PENDENTE]** aguardam o Orquestrador Humano — nenhum documento os apresenta como oficiais.
- O sistema `identidade-visual/v2/` permanece proposta não homologada; esta biblioteca o cita como tal.
- Branch `agente/00-paleta-oficial-migracao` (PR #368) pode alterar tokens — evidências datadas de 2026-11-19.

## Relacionados

- Relatório final da missão: `RELATORIO-FINAL-GENESIS-BRAND-SYSTEM.md` (raiz desta pasta).
- Auditoria V2 anterior: `identidade-visual/v2/01-auditoria/` e `v2/07-relatorio-00/relatorio-mestre.md`.
