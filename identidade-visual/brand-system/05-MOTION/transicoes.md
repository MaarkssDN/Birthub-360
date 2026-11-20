# Transições — Padrões de Movimento Estrutural

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** documentar os padrões de transição estrutural (página, modal, drawer, tabela, grid) e seu estado real de uso.
- **Escopo:** `src/lib/motion.ts` + consumidores verificados.
- **Estado da informação:** CONFIRMADO em 2026-11-19. "[OCIOSO]" = variant exportada sem consumidor.
- **Fontes:** `src/lib/motion.ts`, `src/components/layout/PageTransition.tsx`, `src/components/ui/Modal.tsx`, `src/features/crm/components/LeadDetailDrawer.tsx`.
- **Relacionados:** `motion-tokens.md`, `microinteracoes.md`, `movimento-reduzido.md`, `06-EXPERIENCIA/navegacao.md`.

---

## 1. Transição de página

### `pageTransitionClean` — **EM USO** (padrão real do produto)

- Origem: `src/lib/motion.ts:433-445`.
- Enter: `opacity 0→1`, `y 10→0`, **220ms**, `EASE_PREMIUM`. Sem blur, sem scale.
- Exit: `opacity→0`, `y→-8`, **150ms**, `EASE_IN_OUT_SMOOTH`.
- Justificativa no código (linhas 429-432): "otimizada para mobile/WebView: apenas transform e opacity, sem blur pesado em runtime".
- Consumidor único e obrigatório: `src/components/layout/PageTransition.tsx` — envolve **todas as rotas `/app/*`** (todas são `React.lazy` + `Suspense` + `PageTransition`, `src/App.tsx`). Em `prefers-reduced-motion` o componente retorna `<div>` sem motion (linhas 13-16).

### `pageTransition` — **[OCIOSO]**

- Origem: `src/lib/motion.ts:140-156`.
- Versão "rica": enter 400ms com `blur(8px)→0`, `scale .99→1`, `y 18→0`; exit 250ms com `blur(6px)`.
- **Sem consumidor `.tsx`** — existe como API, não como padrão ativo. O shell usa exclusivamente `pageTransitionClean`.

## 2. Modais e diálogos

| Variant | Origem | Enter | Exit | Consumidor |
|---|---|---|---|---|
| `modalBackdropMotion` | `motion.ts:510-514` | opacity 0→1, 200ms `EASE_OUT_EXPO` | opacity→0, 150ms `EASE_IN_OUT_SMOOTH` | `Modal.tsx`, `LeadDetailDrawer.tsx` |
| `modalDialogMotion` | `motion.ts:516-530` | opacity+`scale .96→1`+`y 8→0`, 250ms `EASE_PREMIUM` | scale .97 + y 6, 160ms `EASE_IN_OUT_SMOOTH` | `Modal.tsx` |

`Modal.tsx` é o wrapper de diálogo animado do design system (`src/components/ui/Modal.tsx:4`). `Drawer.tsx` (vaul/radix) tem motion próprio via biblioteca — **não verificado** uso de `drawerSlideBottom` (exportado, sem consumidor).

## 3. Drawers

| Variant | Direção | Enter | Exit | Consumidor |
|---|---|---|---|---|
| `drawerSlideRight` | `x: '100%'→0`, opacity .8→1 | 300ms `EASE_PREMIUM` | 220ms `EASE_IN_OUT_SMOOTH` | `LeadDetailDrawer.tsx` (drawer de lead do CRM) |
| `drawerSlideBottom` | `y: '100%'→0` | 300ms / exit 220ms | — | **[OCIOSO]** — BottomSheet usa implementação própria |

## 4. Tabela e grids

| Variant | Comportamento | Consumidor |
|---|---|---|
| `tableRowEntrance` **[OCIOSO]** | `opacity 0→1`, `y 6→0`, 200ms — "entrada estanque em Y, zero reflow de largura" (`motion.ts:563-565`) | nenhum `.tsx` |
| `staggerGridContainer` **[OCIOSO]** | container com `staggerChildren` default 0.04/0.05 | nenhum |
| `gridItemEntrance` **[OCIOSO]** | `opacity`+`y 12→0`, 280ms | nenhum |
| `staggerContainer`/`staggerItem` | stagger 0.04 + item blur(4px)→0 400ms | **EM USO** — 10/8 arquivos (listagens, KPIs, cards) |

**Lacuna:** não há variant de "row exit" nem transição de reorder em tabelas; `VirtualTable`/`Table` não consomem `tableRowEntrance`. **[PROPOSTO]:** adotar `tableRowEntrance` em listagens longas quando houver justificativa de performance visual.

## 5. Tabs e accordion

- **Não existe variant `tabs`/`accordion` em `motion.ts`.**
- `TabNavCards.tsx` e navegação por abas usam estado/`AnimatePresence` pontual nos componentes (ex.: `AssistantsDock.tsx`, `GamificationWidget.tsx` usam `AnimatePresence` diretamente). Padrão real = `AnimatePresence` + `motion.div` inline com durações curtas, sem token compartilhado.
- **[PROPOSTO]:** se um padrão de accordion/tabs recorrente emergir, promover a variant em `motion.ts` em vez de duplicar inline.

## 6. Scroll reveals

`scrollRevealFadeUp`/`scrollRevealScale` (`motion.ts:489-505`) — documentados "usar com `viewport: { once: true, margin: '-40px' }`", mas **sem consumidor `.tsx`**. Landing pages implementam reveals próprios via `useScroll`/`useTransform` (`LandingInnovative.tsx:4`).

## 7. Resumo de adoção

| Padrão | Status |
|---|---|
| Page transition `/app/*` | CONFIRMADO — `pageTransitionClean` via `PageTransition.tsx` |
| Modal backdrop+dialog | CONFIRMADO — `Modal.tsx` |
| Drawer lateral (lead CRM) | CONFIRMADO — `LeadDetailDrawer.tsx` |
| Stagger de listas | CONFIRMADO — `staggerContainer`/`staggerItem` |
| Tabela row entrance | EXPORTADO-NÃO-IMPLEMENTADO |
| Drawer bottom sheet | EXPORTADO-NÃO-IMPLEMENTADO (BottomSheet próprio) |
| Page transition "rica" (blur) | EXPORTADO-NÃO-IMPLEMENTADO |
| Scroll reveal | EXPORTADO-NÃO-IMPLEMENTADO |
| Tabs/accordion | NÃO EXISTE como variant |
