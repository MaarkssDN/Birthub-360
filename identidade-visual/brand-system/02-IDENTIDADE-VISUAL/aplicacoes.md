# Aplicações da Identidade Visual

**Propósito:** onde e como a identidade se aplica — digital, produto, marketing, impressos.
**Estado:** CONFIRMADO para as superfícies existentes; PROPOSTO para as não cobertas.
**Data:** 2026-11-19 · **Fontes:** `DESIGN.md`, `PRODUCT.md`, `identidade-visual/birthhub360/*.html`, `vite.config.ts` (PWA), `documentacao-aplicacao/`.

---

## 1. Superfícies digitais

| Superfície | Rota/app | Identidade | Regras |
|---|---|---|---|
| Landing principal | `/`, `/welcome` | Neon editorial, hero cinematográfico | intocável; `Landing360.tsx` |
| Login | `/login` | mesma família, split-screen | intocável |
| Landing alternativa | `/landing-new` | `LandingInnovative` (voice-hub) | módulo do produto |
| App autenticado | `/app/*` | modo Operate, `DESIGN.md` autoridade | dark/light, densidade |
| Páginas legais | `/privacy`, `/terms` | neutras, legíveis | `src/pages/` |
| LGPD público | `/privacidade/dsr/*` | neutra, clara | fluxos do titular |
| Agendamento público | `/book/:slug` | neutra | `PublicBookingPage` |
| Design lab | `/design-lab/*` | catálogo vivo de componentes | interno |
| Personagens | `/app/characters` | vitrine dos 29 SVGs | catálogo |

## 2. Mobile (Capacitor Android)

- App Android via Capacitor (`android/`, `capacitor.config.ts` — Agente 09).
- PWA: manifest inline (`theme_color #F4F7FB`, `start_url /app`, shortcuts CRM/Prospecção), ícones `public/icons/icon-{192,512,512-maskable}.png`.
- Comportamento mobile: BottomSheet/MobileNav, `pageTransitionClean`, touch desativa tilt/magnetic/spotlight, M10 mobile-only.
- Offline-first com SQLite (decisão de produto J18).

## 3. Materiais de marketing

- `documentacao-aplicacao/`: briefing, roteiros, 18 imagens, vídeo de apresentação.
- Playbooks: `03_BRAND_KB/BIRTH_HUB_360_BRAND_PRODUCT_MARKET_PLAYBOOK.html`, `BIRTH_HUB_DESIGN_CONSTITUTION.md`, `DESIGN-playbook.md` (visual obsoleto — usar só estratégia).
- Proposta comercial: `crm360` propostas + rotas públicas de proposta.

## 4. Impressos e documentos

- `src/components/pdf/PDFExport.tsx` — exportação PDF do produto; PROPOSTO auditar paleta/tipografia nos templates.
- Apresentações: usar paleta + gradientes de assinatura + Sora/Inter/Plex Mono (não Bodoni/Playfair de versões antigas).

## 5. E-mail e notificações

- Templates devem consumir `BRAND.colors` (`src/config/brand.ts`) — resíduo `#FF5618` corrigido em `meetingInvite.ts`/`executiveExport.ts`.
- Notificações in-app: Toaster/Alert com tokens.

## 6. HTMLs de referência (não são produção)

`identidade-visual/birthhub360/{BirthHub360_Landing,BirthHub360_Login,BirthHub360_Personagens,preview-29}.html` + manuais/brandbook — protótipos visuais aprovados, servidos localmente via `python -m http.server`. Documentam a identidade; não substituem as telas React.

## 7. O que NÃO fazer por superfície

- **Landing/Login:** não alterar (regra expressa DESIGN.md/PRODUCT.md).
- **App:** nunca hardcode cor; sempre tokens + variantes de componente.
- **E-mail/PDF:** nunca cor da marca antiga (`#FF5618`) nem navy/gold.
- **Sub-apps divergentes** (`landing/`, `prospecting/outbound/`): não replicar seu visual no app principal até decisão de convergência.

**Relacionados:** `identidade-visual.md`, `logotipo.md`, `../03-PRODUTO/inventario-de-rotas.md`, `../06-EXPERIENCIA/landing-pages.md`.
