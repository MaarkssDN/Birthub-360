# Responsividade

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** documentar breakpoints, comportamento mobile (incl. Capacitor/Android), touch vs cursor e critérios de QA por viewport.
- **Escopo:** `src/components/layout/*`, `src/components/ui/BottomSheet.tsx`, `capacitor.config.ts`, `android/`, `src/lib/motion.ts` (hooks touch), PWA config.
- **Estado da informação:** CONFIRMADO em 2026-11-19.
- **Fontes:** arquivos citados inline + `_FATOS-CANONICOS.md` §15.
- **Relacionados:** `navegacao.md`, `acessibilidade.md`, `landing-pages.md`.

---

## 1. Breakpoints

- **Breakpoint principal: `lg` = 1024px** (Tailwind default; `.claude/skills/ui-ux`, `_FATOS-CANONICOS.md` §15).
- Evidência no shell: `Sidebar.tsx:61-64` — `bh-sidebar` é `hidden lg:flex`; abaixo de `lg` não há rail/painel.
- Escala Tailwind padrão presumida (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`) — **breakpoints custom NÃO VERIFICADOS** em `globals.css`/config Tailwind.

## 2. Comportamento por faixa

| Faixa | Shell |
|---|---|
| ≥1024px (`lg`+) | `Sidebar` com `ModuleRail` + `ModuleNavPanel`, `AppTopbar` completo |
| <1024px | Sidebar oculta; `MobileNavDrawer` (hambúrguer via `AppTopbar.onOpenMobileNav`) + navegação por módulos dentro do painel |
| Mobile/touch | `useIsTouchDevice()` (`motion.ts:192-205`) desativa tilt/magnetic/spotlight/parallax; `pageTransitionClean` (sem blur) já é o padrão de todas as rotas `/app/*` |

`MobileNav.tsx` é apenas re-export de `MobileNavDrawer.tsx` (2 linhas).

## 3. Componentes mobile

- `BottomSheet.tsx` (86 linhas) — folha inferior para ações/detalhes.
- `MobileNavDrawer.tsx` — drawer de navegação.
- `Fab.tsx` — botão flutuante de ação.
- `Drawer.tsx` — base em radix/vaul.
- `Touch targets`: regra WCAG 44×44px (ver `acessibilidade.md`).

## 4. Capacitor / Android

- `capacitor.config.ts` + `android/` → **propriedade do Agente 09**; app nativo Android empacotado.
- M10 é módulo **mobile-only** (`moduleRegistry.ts` — M10 na taxonomia).
- J18 = "mobile offline-first": `OfflineBanner` + `SyncIndicator` + `offlineSyncService` (`features/mobile/`) + `useOnlineStatus`.
- `useIsTouchDevice` cobre WebView: detecta `(pointer: coarse)`, `ontouchstart`, `navigator.maxTouchPoints` (`motion.ts:196-202`).
- Permissões de áudio/vibração em `android/app/src/main/AndroidManifest.xml` (relatório de auditoria 08).

## 5. Motion responsivo

- `pageTransitionClean` foi desenhado "para mobile/WebView: apenas transform e opacity, sem blur pesado" (`motion.ts:429-432`) e é o único variant de página em uso — ou seja, **a transição já é a variante mobile**.
- `MotionConfig reducedMotion="user"` + hooks touch reduzem custo de GPU.
- `@media (prefers-reduced-motion)` global em `globals.css:1582` e `Sidebar.css:254`.

## 6. PWA

- `vite-plugin-pwa` + Workbox runtimeCaching de fontes; manifest inline com `theme_color #F4F7FB`, `start_url /app`, shortcuts CRM/Prospecção (`_FATOS-CANONICOS.md` §15).
- Auditoria 2026-10-17 validou precache de 179 entradas (14,1 MB) via `scripts/pwa/verify-precache.ts` em CI.

## 7. Viewports de QA

- GA gate / prompt 03: **1440 / 1366 / 768 / 390** px (`_FATOS-CANONICOS.md` §15).
- Auditoria de produção testou 1920×1080, 1440×900, 768×1024, 375×812 (iPhone), 360×800 (Android).
- Golden screenshots Playwright existem em `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/` (dashboard/crm/contact-form light/dark) — pasta de trabalho, não repo.

## 8. Regras **[PROPOSTO]**

1. Todo componente novo de layout deve definir comportamento em `lg` (rail+panel) e abaixo (drawer/topbar).
2. Nenhum efeito de cursor sem `useIsTouchDevice()` — performance em WebView Capacitor.
3. QA visual mínimo por viewport: 390 (mobile), 768 (tablet), 1440 (desktop).

## 9. Lacunas

- Breakpoints custom além do `lg` padrão: **NÃO VERIFICADO**.
- Comportamento de `ModuleNavPanel` em tablets (768–1023): presumo drawer, mas o ponto exato de corte é `lg` — intermediários caem no modo mobile.
- iOS/Safari não é alvo (Capacitor = Android); Safari desktop coberto pelo mesmo CSS.
