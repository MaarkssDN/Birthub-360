# Acessibilidade

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** consolidar o estado de acessibilidade do produto frente a WCAG 2.2 AA: contraste, foco, teclado, ARIA, targets, movimento reduzido e dívida conhecida.
- **Escopo:** tokens de cor (`birthhub360.css`, `official-identity.css`, `globals.css`), componentes `src/components/ui|layout`, auditorias existentes.
- **Estado da informação:** CONFIRMADO em 2026-11-19; itens marcados **DÍVIDA** vêm de auditorias citadas.
- **Fontes:** `_FATOS-CANONICOS.md` §14, `docs/audits/prontidao-producao-20261017/08-relatorio-frontend-ux-acessibilidade-pwa.md`, `.agents/runs/audit-2026-11-18/ux-completude.md`, `DESIGN.md`, `docs/BrandConstitution.md`.
- **Relacionados:** `05-MOTION/movimento-reduzido.md`, `formularios.md`, `feedback.md`.

---

## 1. Norma

- **WCAG 2.2 AA inegociável** (DESIGN.md, BrandConstitution, skills `.agents/skills/accessibility`, `wcag-2.2-aa`, `wcag-color-contrast`, `a11y-violation-gate`, `axe-a11y`).
- Contraste: texto ≥ **4.5:1**, não-texto (ícones, bordas de controle, foco) ≥ **3:1**.
- Foco visível obrigatório; targets de toque ≥ **44×44px**.
- `prefers-reduced-motion` respeitado (ver `05-MOTION/movimento-reduzido.md` — 3 camadas de proteção).

## 2. Contraste — estado atual

- **Rampas light AA já implementadas** nos tokens: marca adaptada (`cyan #0369A1`, `pink #D91B7C`, `gold #D97706`, `iris ##7C3AED`→`#6D28D9`, danger `#DC2626`) em `birthhub360.css:119-186` + overrides `official-identity.css:62-107,264-315` (`_FATOS-CANONICOS.md` §3).
- Foco: light `#0369A1`, dark `#00D4FF`.
- **DÍVIDA:** 2039 hex literals em 150 arquivos + 1275 classes arbitrárias `[#…]` em 101 arquivos (`_FATOS-CANONICOS.md` §11) — contraste de valores hardcoded **não garantido por token**; mitigação parcial reescreve só 5 hex de texto no light.
- **DÍVIDA pendente de decisão:** contraste do CTA gradiente em light ~3:1 (pendência nº 4, `_FATOS-CANONICOS.md` §19).
- Divergência de canvas light `#F4F7FB` vs `#F8FAFC` (pendência nº 7) afeta cálculo de contraste.

## 3. Foco e teclado

- Foco visível: `outline: 2px solid var(--color-focus-ring)` + `outline-offset` (3px token / 2px em `.bh-platform-card` etc.); `focus-visible:ring-*` nos primitivos.
- Auditoria 08 (2026-10-17) afirma: modais/drawers com **focus trap** (Tab/Shift+Tab) + `Escape`; `focus-visible:ring-2 focus-visible:ring-brand`.
- `CommandPalette` ⌘K é navegável por teclado (atalho global `CommandPalette.tsx:152-155`).
- **NÃO VERIFICADO** exaustivamente: cobertura de focus trap em todos os Dialog/Drawer/custom overlays.

## 4. ARIA e semântica

- Formulários com `htmlFor`↔`id` e `aria-invalid` (`Input.tsx:49`).
- `OfflineBanner`: `role="status"` + `aria-live="polite"`; componentes de áudio/status com `aria-live` (auditoria 08 §2.2).
- `role="region"` em áreas interativas de voz/gravação (auditoria 08).
- i18n: ~60 strings pt-BR/en-US em `src/i18n/index.tsx`; resto hardcoded pt-BR — **impacto em leitores de tela não traduzidos é dívida** (parcial).

## 5. Targets e toque

- Regra 44×44px; primitivos têm `icon*` sizes — **cobertura 44px por componente NÃO VERIFICADA** item a item.
- `useIsTouchDevice` desativa efeitos de cursor em touch (performance, não a11y direta).

## 6. Movimento reduzido

Três camadas (ver `movimento-reduzido.md`): `MotionConfig reducedMotion="user"` (`App.tsx:70`), `useReducedMotion` em 30+ arquivos, media queries `!important` em `globals.css:1582-1597` + `official-identity.css:212-219` + `Sidebar.css:254`.

## 7. Estado da dívida (auditorias citadas)

`docs/audits/prontidao-producao-20261017/08-relatorio-frontend-ux-acessibilidade-pwa.md` (2026-10-17):
- Positivo: tokens, temas light/dark com contraste validado, focus trap, aria-live, reduced-motion, PWA precache 179 entradas.
- **Atenção:** o relatório descreve paleta "Slate/Navy + Indigo/Vinho" e `elegance.css` como fonte de tokens — **DESATUALIZADO** frente à paleta Neon homologada (10-11/2026). Usar como evidência de *práticas* (focus trap, aria-live), não de *tokens*.

`.agents/runs/audit-2026-11-18/ux-completude.md` (Agente 02, read-only):
- **UX-01..UX-11** — nenhuma é violação WCAG direta, mas geram estados confusos para AT: botão morto (UX-02), erro de API exibido como empty state (UX-03), score heurístico como avaliação (UX-04), KPI `null→"R$ 0"` (UX-07), settings de pilar não persistidos (UX-08), deep link inválido com toast genérico (UX-11).
- "Saudável": ~50 rotas resolvem, catch-all→/app, forms críticos com API real + error handling, feature gates em camadas, sem mocks de KPI, Kanban com rollback.

## 8. Skills de governança

`.agents/skills/` contém: `accessibility`, `birthhub-accessibility`, `wcag-2.2-aa`, `wcag-color-contrast`, `wcag-keyboard-navigation`, `a11y-violation-gate`, `axe-a11y`; `.claude/skills/accessibility`. **Atenção:** `.agents/skills/birthhub-*` apontam `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` como autoridade visual — doc **obsoleto** (era mista; `_FATOS-CANONICOS.md` §12).

## 9. Regras **[PROPOSTO]**

1. Novo componente interativo → `aria-label`/`aria-labelledby` + focus visível + target ≥44px em touch.
2. Erro de API nunca renderiza como empty state (UX-03) — estado de erro precisa `role="alert"` ou equivalente.
3. Valor numérico nulo → "—" com `aria-label` explicativo (UX-07).
4. Antes de release, rodar gate axe (`a11y-violation-gate`) nas rotas tocadas.
5. Strings novas de UI → registrar em `src/i18n/index.tsx` quando compartilhadas.

## 10. Lacunas

- Auditoria axe automatizada **recente** sobre a paleta Neon: **NÃO VERIFICADA** — a última (08) é pré-Neon.
- Cobertura de focus trap/teclado em todos os overlays: parcial.
- Contraste de gradientes (`--grad-brand`/`--grad-cta`) em light: pendente de decisão humana.
- `prefers-contrast`/`forced-colors`: sem evidência de tratamento (**NÃO VERIFICADO**).
- Dyslexia/readability: fora de escopo normativo; não encontrado.
</file_path<|open|>argument key="file_path" type="string"<|sep|>C:\Github\Birthub-360\identidade-visual\brand-system\06-EXPERIENCIA\acessibilidade.md