# Auditoria de Inconsistências — Brand System Birth Hub 360°

**Propósito:** lista consolidada de TODAS as inconsistências encontradas entre fontes de marca, implementação e documentação — o inventário de problemas que o plano de evolução precisa resolver.

**Escopo:** inconsistências de identidade, paleta, tipografia, motion, componentes, ativos, governança documental e dívida técnica visual. Não inclui débitos funcionais de UX (esses estão em `.agents/runs/audit-2026-11-18/ux-completude.md`).

**Estado da informação:** cada item cita evidência verificável; itens dependentes de decisão humana estão marcados **PENDENTE**. Compilado de `_FATOS-CANONICOS.md` §§11–19 e das auditorias `identidade-visual/v2/01-auditoria/`.

**Data de referência:** 2026-11-19

**Fontes:** `_FATOS-CANONICOS.md`; `identidade-visual/v2/01-auditoria/relatorio-auditoria.md`; `identidade-visual/v2/01-auditoria/matriz-conformidade.md`; `identidade-visual/v2/FONTE-DE-VERDADE.md`; `.agents/experience/05-roadmap.md`.

**Documentos relacionados:** `gap-analysis.md`, `decisoes-pendentes.md`, `backlog-priorizado.md`, `../00-GOVERNANCA/conflitos-e-decisoes.md`, `../00-GOVERNANCA/matriz-de-evidencias.md`.

---

## A. Identidade e grafia

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| A1 | Três grafias vigentes: "Birth Hub 360°" / "Birthub 360°" (v2) / `360º` (`src/config/brand.ts`) | `_FATOS-CANONICOS.md` §2, §19.1 | **Alta — PENDENTE** |
| A2 | Grafia "Birthub360"/"BirthHub" juntos proibida no MANUAL-MESTRE §1.1, mas usada em identificadores de código e em `brand (1).ts` da pasta de trabalho | §12 | Média |
| A3 | Posicionamento/taglines divergentes: "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence" (FONTE §2) vs "Revenue Intelligence" (PRODUCT.md) vs "Central de Comando 360°" vs essência BrandConstitution | §2 | Média |
| A4 | Símbolo "Birthub" de 3 arcos (`#4C82F7/#9B6BF3/#D4AF37`, Bricolage Grotesque) divergente do Neon — presente em duplicatas da pasta de trabalho | §13 | Média |
| A5 | Contagem de personagens/agentes diverge: 20 / 24–26 / 29; 29 SVGs existem, runtime tem 9+20 | §2, §19.2 | Média — PENDENTE |
| A6 | Área de proteção do logo divergente: Manual Mestre (30%, 140px/24px) vs BrandConstitution (1/4 raio, 96px/32px) | §19.10 | Média — PENDENTE |

## B. Paleta e cor

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| B1 | Três paletas concorrentes em docs/código: Neon (vigente), navy/gold "Strategic Command Center" (`docs/design/*`, `landing-page.html`), laranja `#FF5618` (aposentado, resíduo em `public/tools/social-selling/`) | §12, §18 | **Alta** |
| B2 | orbit5 no componente `BirthHubLogo.tsx` (`#D4AF37→#FF3158→#FF4FA3→#7C3AED→#1677FF→#9C5A7E`, núcleo `#0B132B`) diverge do Neon; `BirthubLogo.tsx`/`Birthub360Logo.tsx` legados divergentes | §12, §19.8 | Alta — PENDENTE |
| B3 | Light canvas divergente: `#F4F7FB` (runtime/PWA) vs `#F8FAFC` (DESIGN.md/legado) | §3, §19.7 | Média — PENDENTE |
| B4 | 2039 hex literais em 150 arquivos .tsx + 1275 classes `[#…]` em 101 arquivos; overrides de texto arbitrário em `official-identity.css:264-315` só cobrem 5 hex | §11 | **Alta** |
| B5 | Contraste do CTA gradiente em light ~3:1 (abaixo do alvo AA para texto/controle) | §19.4 | Média — PENDENTE |
| B6 | Paletas de sub-apps divergentes: `landing/` (Cabin+IBM Plex Mono, zinc/`#d4af37`), `prospecting/outbound/` (escuro/lime), `voice-hub/design-system/` (tokens próprios) | §10, §12 | Alta |
| B7 | SVGs mestres `identidade-visual/birthhub360/logos/*.svg` contêm navy/gold histórico "preservado por determinação do usuário" enquanto existem versões Neon animadas em `04_ASSETS_VISUAIS/` e `v2/assets/logos/` | §13 | Média — depende de confirmação do usuário |

## C. Tipografia

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| C1 | Trinca oficial Sora/Inter/IBM Plex Mono vs docs citando Plus Jakarta/JetBrains (`docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`), Bodoni/Playfair (`docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, playbook), Cabin (sub-app `landing/`) | §5, §12 | **Alta** |
| C2 | Fontes legadas não referenciadas Nunito/Outfit/Plus Jakarta Sans em `public/fonts/brand/` | §13 | Baixa |
| C3 | `.claude/skills/design-system/SKILL.md` documenta Antique Gold/Bodoni | §12 | Alta (governança) |

## D. Motion

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| D1 | Divisão Comercial/Operacional (2 níveis) é proposta v2 não homologada; implementação atual só tem nível operacional | §7, §19.11 | Média — PENDENTE |
| D2 | Durações CSS (`--duration-*` ~100–500ms) e tokens Framer (`instant .1s`…`slow .8s`) coexistem sem documento único de governança de motion | §7 | Baixa-Média |

## E. Componentes e design system

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| E1 | ~95 componentes em `src/components/ui/` mas catálogo oficial cobre só 30 (DESIGN.md); Storybook tem apenas 3 stories; `DesignLabPage` é catálogo vivo parcial | §8 | Média |
| E2 | Segundo mini DS em `src/features/voice-hub/components/design-system/` (tokens.ts, ThemeContext, CommandPalette, ErrorBoundary, useReducedMotion) | §8, §12 | Média |
| E3 | `docs/design/TOKEN-AUDIT.md` registra hex residuais de voice-hub a convergir (shim de re-export já eliminou duplicação de arquivo — Onda C roadmap experiência) | `.agents/experience/05-roadmap.md` §Onda C | Média |
| E4 | Nenhum manual de componentes completo homologado; `v2/05-componentes/` é proposta | §8 | Média |
| E5 | Sub-app `prospecting/outbound/` quase standalone com `main/css/server` próprios | §10 | Média |

## F. CSS morto e código órfão

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| F1 | `src/index.css`, `src/styles/elegance.css` (paleta champagne/sage/pearl "Elegance v3.0"), `src/styles/luxury-tokens.css` (`--lux-*`, JetBrains Mono) sem import | §12, §19.5 | Média |
| F2 | Tokens `--bg/--ink/...` marcados `@deprecated` em `birthhub360.css:101-116` mas aliases vivos em `official-identity.css:6-61` | §3 | Baixa |

## G. Documentação obsoleta e ponteiros de autoridade

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| G1 | `docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`, `docs/strategy/DESIGN-playbook.md` (+HTML) — navy/gold/Bodoni, nenhum marcado superseded | §12, §19.5 | **Alta** |
| G2 | `.agents/skills/birthhub-*` declaram DESIGN-LANGUAGE como "autoridade visual máxima" — apontam para doc obsoleto | §12 | **Alta** |
| G3 | `.claude/CLAUDE.md` descreve paleta "Strategic Command Center" gold/iris/navy e afirma que `identidade-visual/birthhub360/` é a identidade ANTERIOR — invertido: tokens hoje são Neon | §12 | **Alta** |
| G4 | Docs apontando para autoridades erradas continuam ativos — cada sessão de agente pode regenerar inconsistência | §12, C14 conflitos | Alta |

## H. Governança e processo

| # | Inconsistência | Evidência | Severidade |
|---|---|---|---|
| H1 | PR #368 OPEN com 5 gates vermelhos; decisão 00 de não integrar; worktree `wt-368-rebase` em diagnóstico | §11, handoff `00-para-03-paleta-pr368-gates-vermelhos.md` | **Alta — em aberto** |
| H2 | `.env` com possível segredo em `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/` — não verificado | §19.12 | **Alta (segurança)** |
| H3 | `identidade-visual/v2/` completo não homologado — tratado como proposta, mas já é citado como referência por documentos de trabalho | §1, §19.9 | Média |
| H4 | i18n mínimo (~60 strings); restante da UI hardcoded pt-BR — microcopy de marca sem governança de tradução | §14 | Baixa |
| H5 | Nenhuma auditoria WCAG completa e atual — última evidência 2026-10-17/18; débitos de UX mapeados em `.agents/runs/audit-2026-11-18/` (DEBT-0024/0032/0033/0059/0060/0065) | §14 | Média |
| H6 | 11 snapshots divergentes de `visual.spec.ts` (DEBT-0041/#201) e drift de `tests/AGENTS.md` §6 — regressão visual não verificável com baseline honesto | `.agents/experience/05-roadmap.md` §Onda F | Média |

## Resumo quantitativo

- **3 paletas** concorrentes em circulação (Neon vigente + navy/gold + laranja residual/orbit5).
- **2+ DS** de componentes (ui/ canônico + voice-hub mini DS + ad hoc em features).
- **4+ docs** de design obsoletos/divergentes ativos sem marcação.
- **3 fontes** de autoridade visual apontadas por skills (só uma correta).
- **~3300** ocorrências de cor hardcoded (hex + classes arbitrárias).
- **12 pendências** de decisão humana registradas em `_FATOS-CANONICOS.md` §19 (detalhadas em `decisoes-pendentes.md`).
- **1 item de segurança** não verificado (`.env` — reportar ao 15).
