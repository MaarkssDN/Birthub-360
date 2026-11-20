# Landing Pages e Superfícies Públicas

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** inventariar as superfícies públicas de marketing (landings, login, protótipos) e as regras de proteção que as separam do produto operacional.
- **Escopo:** rotas públicas em `src/App.tsx`, `src/features/landing/`, `src/features/voice-hub/pages/LandingInnovative.*`, `landing/`, `landing-page.html`, protótipos HTML em `identidade-visual/`, candidato N1 (worktree não mergeado).
- **Estado da informação:** CONFIRMADO em 2026-11-19; N1 marcado como candidato não mergeado.
- **Fontes:** `src/App.tsx`, `src/features/landing/`, `identidade-visual/v2/01-auditoria/matriz-decisoes.md:27-28,74-76,115`, `DESIGN.md`, `_FATOS-CANONICOS.md` §9/§10/§12.
- **Relacionados:** `navegacao.md`, `responsividade.md`, `acessibilidade.md`, `05-MOTION/manual-de-animacoes.md`.

---

## 1. Regra de proteção (governança)

`DESIGN.md` linha 7: **"Landing Page e Tela de Login permanecem intocadas."** — superfícies públicas são protegidas de mudanças do design system operacional (`/app/*` modo Operate). Marketing e operacional são camadas de marca distintas.

## 2. Superfícies públicas implementadas

| Rota | Componente | Arquivos | Observação |
|---|---|---|---|
| `/`, `/welcome`, `/login` | `Landing360` (initialScreen intro/login) | `src/features/landing/pages/Landing360.tsx` (~3200 linhas), `Landing360.css`, `Landing360Impeccable.{tsx,css}`, `LandingAdaptive.css`, `LandingCinematic.css`, `LandingConversionV5.css`, `LandingRegenerationV4.css`, `components/CinematicFX.tsx`, `luxury/LuxuryLandingPage.tsx` | Landing principal + variantes CSS; `luxury/` = "6 atos" |
| `/landing-new` | `LandingInnovative` | `src/features/voice-hub/pages/LandingInnovative.tsx` + `.css` | Landing alternativa no contexto voice-hub; usa `MotionConfig`, `useScroll`/`useTransform`, `useReducedMotion` |
| `/privacy`, `/terms` | páginas legais | — | públicas |
| `/privacidade/dsr/verificar`, `/privacidade/dsr/acompanhamento` | LGPD DSR público | `src/features/lgpd/` | fluxos de titular |
| `/reset-password` | reset de senha | — | pública |
| `/book/:slug` | agendamento público | `src/features/calendar/` booking | pública |
| `/select-brand` → `/welcome`; `/hub` → `/app` | redirects | `src/App.tsx` | — |
| `*` (catch-all) | → `/welcome` | `src/App.tsx` | — |

`leadCapture.routes.ts` (`src/features/landing/routes/`) = backend de captura de lead da landing.

## 3. Motion das landings

- `Landing360.tsx` e `LandingInnovative.tsx` usam `framer-motion` **diretamente** (não via `src/lib/motion.ts` para tudo): `useReducedMotion`, `MotionConfig`, `useScroll`, `useTransform` (`LandingInnovative.tsx:4`; `Landing360.tsx:1`).
- `CinematicFX.tsx` concentra efeitos cinematográficos da landing.
- Isso é consistente com a proposta V2 **[PROPOSTO, não homologada]** de nível "Comercial" (hero/manifesto, mais cinematográfico) vs "Operacional" (`identidade-visual/v2/04-motion/motion-system.md`). Hoje: landing tem motion próprio mais rico; `/app/*` usa `pageTransitionClean` contido.

## 4. Protótipos e superfícies fora do runtime

| Superfície | Local | Status |
|---|---|---|
| Brandbook/Manuais/Catálogo oficiais | `identidade-visual/*.html` (5 arquivos: AUDITORIA-COMPLETA, BRANDBOOK-OFICIAL, CATALOGO-DE-COMPONENTES, MANUAL-DE-IDENTIDADE-DO-PRODUTO, MANUAL-DE-IDENTIDADE-VISUAL) | artefatos de referência, não servidos |
| `landing-page.html` (raiz) | navy `#0B132B`/gold `#D4AF37`, Google Fonts CDN | **identidade divergente legada** (`_FATOS-CANONICOS.md` §12) — destino pendente de decisão |
| `landing/` (sub-app) | `landing/index.html`, `dist/`, `package.json` próprio | SPA independente, paleta Cabin/`#d4af37` divergente — **NÃO servida pela rota principal**; resíduo a decidir |
| Protótipo N1 | `docs/landing-v2/prototype/index.html` + `LandingHeroN1.css`, `HeroMotion.ts`, `landing-v2.css` no worktree/branch `agente/02-03-hero-n1-missao-07` (commit `d094a8831`) | **CANDIDATO NÃO MERGEADO** — "referência criativa, não fonte automática de regras" (`matriz-decisoes.md:74-76,115`) |
| `public/tools/social-selling/` | portal HTML servido em `/tools` | resíduo de marca antiga `#FF5618` (`_FATOS-CANONICOS.md` §12) |

## 5. Marketing vs operacional — fronteira

| Dimensão | Landing/marketing | `/app/*` operacional |
|---|---|---|
| Proteção | intocável por DESIGN.md | evolui com DS |
| Motion | cinematográfico, `useScroll`/`useTransform`, FX próprios | `pageTransitionClean` 220ms, contido |
| Tipografia/identidade | mesma trinca (Sora/Inter/IBM Plex) mas composições editoriais | `.bh-*` utilities, tokens `--color-*` |
| Dados | captura de lead (`leadCapture.routes`) | APIs autenticadas |
| Auth | `/login` dentro da Landing360 (initialScreen) | `ProtectedRoute`/`RequireRole`/`RequireModuleAccess` |

## 6. Dívidas e pendências

- **N1 aguardando merge/homologação** da missão 07 (branch `agente/02-03-hero-n1-missao-07`); até lá é "referência criativa" (`matriz-conformidade-final.md:46`).
- `Landing360.tsx` concentra ~125 hex literals — maior foco de dívida de cor (`_FATOS-CANONICOS.md` §11); PR #368 (migração hex→var) **não integra** (gates vermelhos).
- Múltiplas variantes CSS de landing (`Landing360Impeccable`, `LandingAdaptive`, `LandingCinematic`, `LandingConversionV5`, `LandingRegenerationV4`) — qual é a vigente em produção **NÃO VERIFICADO** linha a linha (Landing360.tsx é o entry; as outras são temas alternativos).
- Handoffs de auditoria da landing: `.agents/handoffs/onda-landing-360-auditoria/` (bugs funcionais, form-lead fake, UX mobile/a11y, verdade no copy, sticky-bar z-index) — **status de resolução NÃO VERIFICADO** neste documento.

## 7. Regras **[PROPOSTO]**

1. Nenhuma mudança do Brand System operacional toca landing/login sem decisão humana explícita (DESIGN.md).
2. Nova landing → reutilizar tokens `--color-*`/`--font-*` e `useReducedMotion`; evitar nova stack de motion.
3. Conteúdo de marketing deve refletir capacidades reais — auditoria "verdade no copy" já existe como handoff.
4. Se N1 for homologado, promover `HeroMotion`/`LandingHeroN1.css` a referência formal do nível Comercial — hoje PROPOSTO.
</content>
</invoke>
