# 00 — Relatório Forense Inicial
## OPERAÇÃO GENESIS BRAND SYSTEM — BIRTHUB 360

**Data de referência:** 2026-11-19
**Executor:** Devin AI (Diretor Global de Marca / Agente 11 — Marca e Ativos Institucionais, por propriedade de `identidade-visual/**`)
**Branch de trabalho:** `agente/00-integracao-skills` @ `e9a3b1ab2` (checkout principal `C:/Github/Birthub-360`)
**Escopo de escrita:** somente `identidade-visual/brand-system/` (propriedade do Agente 11). Nenhum código, token, asset ou documento de outro domínio foi alterado.

---

## 1. Verificação de acesso às fontes obrigatórias

| Fonte | Caminho | Status |
|---|---|---|
| A — Identidade visual | `C:\Users\Marcelo\Desktop\IDENTIDADE-VISUAL` | **INEXISTENTE** — o caminho citado no corpo do prompt não existe |
| A' — Identidade visual (alternativo, citado na seção 23) | `C:\Users\Marcelo\Desktop\DOCUMENTOS\IDENTIDADE-VISUAL` | **ACESSÍVEL** — é o diretório de trabalho da sessão; 445 arquivos em 5 subárvores (`02_IDENTIDADE_VISUAL`, `03_BRAND_KB`, `04_ASSETS_VISUAIS`, `05_TOKENS_E_TEMAS`, `TUDO`) |
| B — Repositório principal | `C:\Github\Birthub-360` | **ACESSÍVEL** — repositório extenso (CRM React/Vite/TS + Tailwind 4 + shadcn/ui + Capacitor + backend Express/Prisma) |
| C — Histórico/decisões | git log, branches, worktrees, `docs/`, `.agents/` | **ACESSÍVEL** — incluindo worktree ativo de migração de paleta |

**Decisão registrada:** a Fonte A foi auditada em `DOCUMENTOS\IDENTIDADE-VISUAL` (única pasta de identidade visual existente no Desktop do usuário). Se existir outra cópia, a auditoria da Fonte A deve ser repetida — ver `inventario-de-fontes.md`.

## 2. Fotografia forense do Git

- **Branch atual:** `agente/00-integracao-skills` (tracking `origin/agente/00-integracao-skills`)
- **HEAD:** `e9a3b1ab2` — merge de `origin/main`
- **Alterações não commitadas (de outros trabalhos, NÃO desta missão):**
  - `M src/features/crm/components/LeadDetailDrawer.tsx`
  - `?? .agents/handoffs/onda-review-20261119/`
  - `?? .agents/runs/00-decisao-achados-revisao-02-20261119.md`
  - `?? .agents/runs/correcoes-wb1/`
- **Worktrees ativos (10):** checkout principal + `birthub-360-audit-main`, `birthub-salvage`, `wt-08-deeplink`, `wt-08-dsr`, `wt-310-extract`, `wt-368-rebase`, `wt-395-fix`, `wt-402-fix`, `wt-cadence-fix`, `agente-08-handoffs`.
- **Branches relevantes a marca/design:** dezenas de `agente/NN-*`; em especial **`agente/00-paleta-oficial-migracao`** (worktree `C:/Github/wt-368-rebase`, HEAD `f39d396d8`) — migração de paleta oficial em andamento, não mergeada. Esta missão **não** a toca e registra seus efeitos como evidência histórica/parcial.

## 3. Estado documental encontrado (pré-existente)

A plataforma **já possui** uma estrutura documental de identidade robusta — esta missão **não** cria estrutura concorrente:

| Estrutura | Local | Propietário | Conteúdo |
|---|---|---|---|
| Documentos oficiais HTML | `identidade-visual/` (raiz) | Agente 11 | Brandbook, Manuais Visual/Produto, Catálogo de Componentes, tokens (`birthhub360/tokens/`), 3 logos, 29 personagens SVG |
| Sistema V2 (proposta) | `identidade-visual/v2/` | Agente 11 | Auditoria completa (2026-11-13), Brandbook HTML, DS tokens DTCG, Motion System, biblioteca de componentes, `FONTE-DE-VERDADE.md`, relatório mestre — **NÃO homologado** |
| Tokens canônicos vivos | `identidade-visual/birthhub360/tokens/birthhub360.css` + `.json` + `.ts` | Agente 11 / 03 | Paleta neon, gradientes, glows, raios, temas dark/light AA |
| Ponte normativa | `src/styles/official-identity.css` → `globals.css` | Agente 03 | Adapters de compatibilidade; alias `@deprecated` para tokens legados |
| DESIGN.md (raiz) | `DESIGN.md` | — | Design schema "impeccable": paleta, trinca tipográfica, raios, 4 estados obrigatórios, catálogo de 30 componentes |
| Constituição | `docs/BrandConstitution.md`, `.agents/BIRTH_HUB_DESIGN_CONSTITUTION.md` | docs=Agente 08 / .agents | Regras de marca, fontes de verdade, proibições de logo |
| Design docs | `docs/design/` | Agente 08 | `BIRTHHUB-360-DESIGN-SYSTEM.md` e `DESIGN-LANGUAGE.md` **parcialmente obsoletos** (era navy/gold); `TOKEN-AUDIT.md` |
| Skills de agente | `.agents/skills/birthhub-*`, `.claude/skills/design-system`, `ui-ux`, `motion-design`, etc. | — | Regras de design já codificadas para agentes de IA |
| Produto | `PRODUCT.md`, `BIRTHUB360_*` (raiz), `docs/` | vários | Posicionamento, jornadas, modelo de dados, catálogo de funcionalidades |

**Decisão de destino desta missão:** nova biblioteca em `identidade-visual/brand-system/` (propriedade do Agente 11), em Markdown, organizada conforme a seção 13 do briefing, **referenciando** — nunca duplicando — `identidade-visual/v2/`, `birthhub360/tokens/` e `docs/BrandConstitution.md`. Os HTMLs de `identidade-visual/` permanecem como artefatos visuais de referência.

## 4. Cobertura da investigação

| Fonte | Método | Cobertura |
|---|---|---|
| A' — `DOCUMENTOS/IDENTIDADE-VISUAL` | inventário recursivo (445 arquivos) + leitura dirigida dos documentos mestres, tokens JSON/CSS e SVGs de logo | Em andamento — ver `inventario-de-fontes.md` |
| B — repositório | git forense + leitura de tokens, motion, rotas, componentes, docs, skills, handoffs | Em andamento — ver `inventario-de-fontes.md` |
| C — histórico | `git log`, branches, worktrees, handoffs `.agents/` | Em andamento |

**Limitações conhecidas nesta etapa:**
1. Caminho literal da Fonte A (`Desktop\IDENTIDADE-VISUAL`) inexistente — auditado o alternativo documentado no briefing.
2. Aplicação não foi executada nesta sessão (sem dev server rodando); análise visual de telas se apoia em código, tokens, HTMLs de referência e snapshots existentes em `04_ASSETS_VISUAIS/visual.spec.ts-snapshots__*`.
3. Branch `agente/00-paleta-oficial-migracao` ativa pode alterar tokens — achados sobre `src/styles/` refletem o checkout principal nesta data.
4. Arquivos binários grandes (zips, vídeos) catalogados por nome/tamanho; conteúdo de `BIRTHUB360_COMERCIAL...zip` a verificar.

## 5. Riscos identificados

- **R1 — Estruturas concorrentes:** `identidade-visual/` já tem brandbook/manuais próprios; `brand-system/` deve atuar como camada de consolidação e governança, com links para as fontes — não como substituto editorial dos HTMLs.
- **R2 — Trabalho paralelo:** migração de paleta oficial em `wt-368-rebase` e alterações não commitadas no checkout principal. Documentação deve datar evidências e marcar o que pode mudar.
- **R3 — Grafia pendente:** "Birthub 360°" vs "Birth Hub 360°" segue PENDENTE (herdado de `v2/FONTE-DE-VERDADE.md` §1 e auditoria F01). Esta biblioteca usa **"Birth Hub 360°"** como grafia de trabalho documental e mantém o selo de pendência.
- **R4 — Documentos obsoletos vivos:** `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `DESIGN-LANGUAGE.md` (parcial), `docs/strategy/DESIGN-playbook.md`, `landing/` e `landing-page.html` carregam identidades divergentes — risco de agentes consumirem regras erradas.
- **R5 — CSS morto:** `elegance.css`, `luxury-tokens.css`, `src/index.css` órfãos com paletas concorrentes.

## 6. Metodologia

Análise estática (código, tokens, rotas, componentes) + análise documental (manuais, brandbook, constituições) + análise histórica (git, handoffs, auditorias anteriores) + análise de ativos (SVGs, PNGs, fontes). Classificação de evidências conforme a Matriz de Evidências do briefing (CONFIRMADO / PARCIAL / DOCUMENTADO-NÃO-IMPLEMENTADO / HISTÓRICO / CONFLITANTE / PROPOSTO / NÃO VERIFICADO).

**Próximo passo:** ONDA 1 — inventários rastreáveis (ver `../inventario-de-fontes.md` e documentos de `03-PRODUTO/`).
