# Checklist de Qualidade — Birth Hub 360°

**Propósito:** fornecer um checklist verificável e objetivo para aceitar ou rejeitar qualquer entrega que toque a identidade visual do produto ou de materiais de marca.

**Escopo:** UI do produto (`src/`), tokens/estilos, assets de marca, materiais de marketing. Cada item é verificável por inspeção de código, comando ou evidência visual. Itens marcados **[AGENTE-RESPONSÁVEL]** indicam quem valida.

**Estado:** derivado de regras confirmadas em 2026-11-19 (`DESIGN.md`, `BrandConstitution.md`, `_FATOS-CANONICOS.md`, `AGENTS.md` §28).

**Data:** 2026-11-19 · **Fontes:** `DESIGN.md`, `docs/BrandConstitution.md`, `src/styles/{globals,official-identity}.css`, `identidade-visual/birthhub360/tokens/*`, `src/lib/motion.ts`, `.agents/GA_VISUAL_EXPERIENCE_GATE.md`, skills `.agents/skills/{accessibility,wcag-2.2-aa,...}`.

**Documentos relacionados:** `frontend.md`, `designers.md`, `agentes-de-ia.md`, `contribuicao.md`, `../07-ATIVOS/catalogo-de-assets.md`.

---

## 1. Tokens e cor

- [ ] Nenhum hex `#RRGGBB` novo em `.tsx`/`.css` (verificar: `grep -rE '#[0-9a-fA-F]{6}' <arquivos-tocados>`)
- [ ] Nenhuma classe arbitrária nova `bg-[#…]`, `text-[#…]`, `border-[#…]` etc.
- [ ] Somente tokens `--color-*` canônicos; zero uso de `--bg/--ink/--surface/--brand/--gold/--pink/--iris/--warn/--ok/--info/--critical` (deprecated) em código novo
- [ ] Cores semânticas corretas: success/warning/danger/info conforme `birthhub360.css` — cor nunca como único indicador de estado (par obrigatório: ícone/label)
- [ ] Gradientes/glows somente via `--grad-*`, `--glow-*`, `.text-gradient-*`, `.border-glow-*`, `.bg-orbit-conic`
- [ ] Overrides de contraste light (`official-identity.css:264-315`) não foram contornadas com hex local

## 2. Tipografia

- [ ] Famílias apenas Sora / Inter / IBM Plex Mono via tokens `--font-display|--font-interface|--font-mono` (ou `--font-brand-*` legados mapeados)
- [ ] Inter com `font-feature-settings` do token (`cv05/cv11/ss01`)
- [ ] Títulos nunca `#000`/`#FFF` puros; `data-accent` correto quando aplicável
- [ ] Dados tabulares/KPIs/R$ em IBM Plex Mono
- [ ] Nenhuma fonte remota/CDN; nenhuma família proibida (Bodoni, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto/Open Sans/Poppins)

## 3. Geometria e estados

- [ ] Raios via `--radius-control|card|modal|pill` (12/16/20/9999px)
- [ ] Espaçamento em múltiplos de 4px
- [ ] Foco visível: `outline: 2px solid var(--color-focus-ring)` + `outline-offset` (ou equivalente do componente)
- [ ] Targets interativos ≥44×44px
- [ ] 4 estados presentes em módulo operacional: Loading (Skeleton), Empty (EmptyState+CTA), Error (causa+retry), Stale (timestamp de sync)
- [ ] Estados de interação do componente cobertos: default/hover/active/focus/selected/disabled/loading/success/warning/error (`.bh-state-*`)

## 4. Motion e acessibilidade

- [ ] Animações via `src/lib/motion.ts` (variants/easings/springs existentes); sem `transition`/`animate` ad hoc divergente
- [ ] `prefers-reduced-motion` respeitado (hooks de `motion.ts` + media query global)
- [ ] Contraste WCAG 2.2 AA: texto ≥4.5:1, não-texto ≥3:1 — nos DOIS temas (medir, não presumir)
- [ ] `MotionConfig reducedMotion="user"` não foi removido/burlado
- [ ] Navegação por teclado funcional; foco não fica preso; ordem de tab lógica
- [ ] Sem cor como único indicador de estado/erro/sucesso

## 5. Responsividade e temas

- [ ] Verificado nos viewports 360 / 390 / 768 / 1024 / 1440 (breakpoint principal `lg`=1024px)
- [ ] Tema dark E light verificados (não só um)
- [ ] Mobile/touch: `useIsTouchDevice` desativa tilt/magnetic/spotlight; `pageTransitionClean` em fluxos mobile; BottomSheet/MobileNav quando aplicável
- [ ] Sem overflow horizontal, sem texto cortado, sem alvo <44px em touch

## 6. Assets e marca

- [ ] Logos somente `public/brand/birthhub360-*.svg` ou componentes `src/components/brand/`; sem variantes `brand__*`/`logos__*`/`symbol.svg`/`Birthub*`
- [ ] Personagens via `/brand/characters/` ou `src/features/characters/` — sem redesenho
- [ ] Grafia "Birth Hub 360°" em textos visíveis de marca; sem claims de features inexistentes
- [ ] Área de proteção do logo respeitada (regra PENDENTE §19.10 — usar a mais restritiva até decisão)

## 7. i18n, segurança e higiene

- [ ] Strings novas no padrão i18n existente (`src/i18n/index.tsx`) quando no escopo; caso contrário, pt-BR consistente com o entorno — sem mistura de idiomas
- [ ] Zero segredos, tokens, credenciais ou `.env` em código, docs, screenshots ou handoffs (ver pendência §19.12 — reportar, nunca copiar)
- [ ] Nenhum dado pessoal real de cliente em mockups/screenshots de evidência (LGPD)
- [ ] Nenhum arquivo fora da propriedade do agente foi editado; handoffs abertos quando necessário

## 8. Gates executáveis (obrigatório antes de "pronto")

- [ ] `npx tsc --noEmit` — limpo
- [ ] `npm run lint` — limpo
- [ ] Testes relevantes ao domínio executados e passando
- [ ] `npm run build` quando a mudança afetar build/rotas
- [ ] Evidência visual quando UI: screenshot/nos mesmos formatos dos goldens (`visual.spec.ts-snapshots__*`) ou descrição verificável do que foi visto
- [ ] Parecer do Agente 24 para merge/release (`AGENTS.md` §40)

## 9. Registro de não-conformidades

Qualquer item falho deve ser classificado: **bloqueador** (impede merge), **alto** (corrigir na mesma onda), **normal** (backlog com handoff). Registrar em `.agents/handoffs/` ou `.agents/reviews/` conforme o dono — nunca corrigir silenciosamente fora do escopo (P3).
