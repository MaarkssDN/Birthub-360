# Matriz de Evidências — Decisões-Chave do Brand System

**Propósito:** registrar, para cada decisão-chave de marca/design, a evidência encontrada, sua classificação e a fonte que a sustenta — evitando que propostas sejam lidas como decisões.

**Escopo:** identidade visual, paleta, tipografia, motion, componentes, ativos, governança e dívida técnica visual auditados até 2026-11-19.

**Estado da informação:** classificações conforme `_FATOS-CANONICOS.md` §0. Legenda: **CONFIRMADO** (evidência em código/tokens/docs vigentes) · **PARCIAL** (implementado em parte ou com ressalvas) · **DOCUMENTADO-NÃO-IMPLEMENTADO** (regra escrita sem correspondente no código) · **HISTÓRICO** (superado, preservado como registro) · **CONFLITANTE** (fontes divergentes entre si) · **PROPOSTO** (recomendação, não decisão) · **NÃO VERIFICADO** (sem evidência encontrada).

**Data de referência:** 2026-11-19

**Fontes:** `identidade-visual/brand-system/_FATOS-CANONICOS.md` §§1–18; `identidade-visual/v2/FONTE-DE-VERDADE.md`; `identidade-visual/v2/01-auditoria/relatorio-auditoria.md` e `matriz-conformidade.md`; `src/styles/globals.css`; `src/styles/official-identity.css`; `identidade-visual/birthhub360/tokens/birthhub360.css`.

**Documentos relacionados:** `inventario-de-fontes.md`, `conflitos-e-decisoes.md`, `../09-PLANO-DE-EVOLUCAO/gap-analysis.md`.

---

## Matriz

| # | Decisão / tema | Classificação | Evidência principal | Observação |
|---|---|---|---|---|
| 1 | Paleta Neon oficial (dark) | **CONFIRMADO** | `identidade-visual/birthhub360/tokens/birthhub360.css:9-117`; `globals.css` `:root`/`.dark`; homologada 2026-10-11 (merge `36d097a17`) | Azul `#00D4FF`, Rosa `#FF2D9B`, Dourado `#FFC107`, Íris `#8B7DFF` sobre `#0D0D0D`. |
| 2 | Paleta light AA | **PARCIAL** | `birthhub360.css:119-186` + overrides `official-identity.css:62-107,264-315` | Rampas AA implementadas; canvas diverge (`#F4F7FB` vs `#F8FAFC`) — PENDÊNCIA §19.7. |
| 3 | Gradientes de assinatura | **CONFIRMADO** | `--grad-brand`, `--grad-cta`, `--grad-vancouver`, `--grad-orbit` em tokens/globals | 4 gradientes + glows + utilitários `.text-gradient-*`, `.btn-neon-cta` etc. |
| 4 | Trinca tipográfica (Sora/Inter/IBM Plex Mono) | **CONFIRMADO** | `@font-face` em `globals.css:12-198`; `public/fonts/` self-hosted | Proibições explícitas em MANUAL-MESTRE §3.1 e BRANDBOOK cap.04. |
| 5 | Tipografia em docs legados | **CONFLITANTE** | `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` cita Plus Jakarta/JetBrains; `.claude/skills/design-system/SKILL.md` cita Bodoni/Antique Gold | Docs apontam para autoridade errada — ver `auditoria-de-inconsistencias.md`. |
| 6 | Logos canônicos | **PARCIAL** | `identidade-visual/birthhub360/logos/*.svg` + `public/brand/` | SVGs mestres preservam navy/gold por determinação do usuário; versões Neon animadas em `04_ASSETS_VISUAIS/` e `v2/assets/logos/`. |
| 7 | `BirthHubLogo.tsx` (componente) | **CONFLITANTE** | `src/components/brand/BirthHubLogo.tsx` usa paleta orbit5 (`#D4AF37→…→#0B132B`) | Diverge do Neon — PENDÊNCIA §19.8. `BirthubLogo.tsx`/`Birthub360Logo.tsx` legados divergentes. |
| 8 | Personagens | **PARCIAL** | 29 SVGs em `identidade-visual/birthhub360/characters/` + runtime `src/features/characters/` (9 + 20) | Contagem oficial diverge (20/24–26/29) — PENDÊNCIA §19.2. |
| 9 | Motion — nível operacional | **CONFIRMADO** | `src/lib/motion.ts` (573 linhas); 114 arquivos .tsx usam framer-motion; hooks com `prefers-reduced-motion` | ~30 variants, easings/springs/durações documentados. |
| 10 | Motion — divisão Comercial/Operacional (2 níveis) | **PROPOSTO** | `identidade-visual/v2/04-motion/`; FONTE-DE-VERDADE §7 | Não homologado; hoje só existe o nível operacional. |
| 11 | Grafia oficial do nome | **CONFLITANTE** | "Birth Hub 360°" (trabalho), "Birthub 360°" (v2), `360º` em `src/config/brand.ts`, proibidos em MANUAL-MESTRE §1.1 | PENDÊNCIA §19.1 — depende de decisão humana. |
| 12 | Posicionamento | **PARCIAL** | FONTE-DE-VERDADE §2 fixado; PRODUCT.md "Revenue Intelligence"; taglines variadas (Central de Comando 360°, essência BrandConstitution) | Variações de tagline coexistem; núcleo "inteligência comercial + IA" consistente. |
| 13 | Light canvas | **CONFLITANTE** | `#F4F7FB` canônico V2 vs `#F8FAFC` legado/DESIGN.md | PENDÊNCIA §19.7. |
| 14 | Componentes UI | **PARCIAL** | `src/components/ui/` ~95 arquivos; catálogo de 30 em DESIGN.md | Storybook só 3 stories; `DesignLabPage` (`/design-lab/*`) é catálogo vivo parcial. |
| 15 | Componentes — manual completo | **DOCUMENTADO-NÃO-IMPLEMENTADO** | Nenhum manual de componentes completo homologado; v2/05-componentes é proposta | Gap — ver `gap-analysis.md`. |
| 16 | CSS morto | **CONFIRMADO** | `src/index.css`, `src/styles/elegance.css`, `src/styles/luxury-tokens.css` sem import | Destino pendente — PENDÊNCIA §19.5. |
| 17 | Sub-apps divergentes | **CONFIRMADO** | `landing/` (Cabin/Plex Mono/zinc/`#d4af37`), `landing-page.html` (navy/gold + CDN), `src/features/prospecting/outbound/` (escuro/lime), `voice-hub/design-system/` (segundo DS) | Canonização de landings prevista na Onda C do roadmap de experiência. |
| 18 | Hardcoded colors | **CONFIRMADO** | 2039 hex em 150 arquivos; 1275 classes `[#…]` em 101 arquivos; overrides parciais em `official-identity.css:264-315` | Dívida mensurada; migração em curso via PR #368. |
| 19 | PR #368 (migração hex→var) | **CONFLITANTE / em aberto** | Branch `agente/00-paleta-oficial-migração`; 5 gates vermelhos; decisão 00: não integra | Handoff `onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`; worktree `wt-368-rebase`. |
| 20 | Docs obsoletos (navy/gold/Bodoni) | **CONFIRMADO** | `docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md`, `docs/strategy/DESIGN-playbook.md` | Nenhum marcado como superseded ainda — PENDÊNCIA §19.5. |
| 21 | `.claude/CLAUDE.md` e skills desatualizadas | **CONFIRMADO** | `.claude/CLAUDE.md` descreve paleta "Strategic Command Center" e trata birthhub360/ como anterior; skills apontam para DESIGN-LANGUAGE obsoleto | Conflito de governança ativo. |
| 22 | Área de proteção do logo | **CONFLITANTE** | Manual Mestre: 30%, 140px/24px vs BrandConstitution: 1/4 raio, 96px/32px | PENDÊNCIA §19.10. |
| 23 | Mapeamento módulo→accent | **PROPOSTO** | Proposta em `v2/06-matriz/` | PENDÊNCIA §19.3. |
| 24 | Contraste CTA gradiente em light | **PARCIAL** | Gradiente `--grad-cta` existe; contraste ~3:1 em light abaixo do alvo | Ajuste proposto — PENDÊNCIA §19.4. |
| 25 | WCAG 2.2 AA | **CONFIRMADO como norma; auditoria PARCIAL** | DESIGN.md, BrandConstitution, skills; auditorias em `docs/audits/` e `.agents/runs/audit-2026-11-18/` | Auditoria WCAG completa e atual **NÃO VERIFICADO** — última evidência é de 2026-10-17/18. |
| 26 | i18n | **PARCIAL** | `src/i18n/index.tsx` ~60 strings (setup/firstSteps/common); resto hardcoded pt-BR | Microcopy de marca fora do escopo i18n. |
| 27| Sistema V2 (`identidade-visual/v2/`) | **PROPOSTO / não homologado** | Pacote completo 2026-11-13/14 | PENDÊNCIA §19.9 — homologação humana pendente. |
| 28 | Resíduos marca antiga | **CONFIRMADO** | `#FF5618` laranja (aposentado 09/2026) persiste em `public/tools/social-selling/`; símbolo "Birthub" de 3 arcos divergente | Risco de vazamento de identidade antiga em rotas públicas `/tools`. |
| 29 | `.env` em `05_TOKENS_E_TEMAS/` | **NÃO VERIFICADO** | Possível segredo na pasta de trabalho | PENDÊNCIA §19.12 — reportar ao responsável, não copiar. |
