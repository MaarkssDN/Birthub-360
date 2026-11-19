# Componentes

Estado: inventário CONFIRMADO (130 `.tsx` visuais em `src/components/{ui,brand,layout,icons,charts}`, [componentes.csv](../_inventarios/componentes.csv)); **especificação detalhada apenas do `Button`** (único lido integralmente). Demais famílias: catálogo de existência, spec = NÃO VERIFICADO / backlog.

## Panorama (script, heurística por nome)

| Métrica | Valor |
|---|---|
| Componentes | 130 |
| Com framer-motion | 39 |
| Com tratamento de reduced-motion | 18 |
| Com hex hardcoded | 29 |
| Com story (`*.stories.tsx`) | 4 (Badge, Button, Card, Input) |
| Com teste adjacente em `__tests__` | 7 |

## Famílias (existência confirmada)

- **Ações:** `Button`, `IconButton`, `ButtonGroup`, `Fab`, `CopyButton`, `AuroraButton`, `Magnetic`.
- **Formulários:** `Input`, `CyberInput`, `Textarea`, `Select`, `Toggle`, `Label`.
- **Navegação:** layout `Sidebar`, `ModuleRail`, `ModuleNavPanel`, `AppTopbar`, `AppBreadcrumbs`, `MobileNav*`, ui `Pagination`, `TabNavCards`, `CommandPalette`, `FloatingNavbar`.
- **Dados:** `Table`, `VirtualTable`, `KpiCard`, `StatsGrid`, `FunnelBars`, `ChannelDonut`, `CalendarHeatmap`, `Timeline`, `bento/`.
- **Feedback/estado:** `Alert`, `Toaster`, `Skeleton`, `EmptyState`, `BlockedState`, `VisualState`, `OperationalStateContainer`, `ErrorBoundary`, `OfflineBanner`, `SyncIndicator`.
- **Sobreposições:** `Dialog`, `Modal`, `ConfirmDialog`, `Drawer`, `BottomSheet`, `DropdownMenu`, `Tooltip`, `ContextualTip`.
- **Marca/efeito:** `BrandOrb`, `OrbitRing`, `Glow`, `BorderBeam`, `HolographicCard`, `TiltCard`, `ParticleSystem`, `ClickSpark`, `Gamified3DOrb`.
- **Domínio IA:** `AiReasoningPipeline`, `AIContextPopover`, `CopilotTrigger`, `VoiceCommandWidget`, `ModuleAgentWidget`.
- **Demo/legado provável:** `StyleShowcase`, `sign-in-page.demo`, `BentoShowcase`, `PricingSection` (NÃO VERIFICADO uso).

Duplicidade suspeita: `Modal` × `Dialog` × `ConfirmDialog`; `EmptyState` × `BlockedState` × `VisualState` × `ModulePlaceholder`; `CyberInput` × `Input` (backlog P2).

## Especificação: Button (`src/components/ui/Button.tsx`)

- **Base (CONFIRMADO):** `bh-official-control inline-flex gap-2 text-[13px] font-semibold tracking-[-0.015em]`; transição `motion-safe:duration-200 ease-out`; `active:scale-[0.97]`; foco `ring-2 ring-focus-ring ring-offset-2`; desabilitado `bg-surface-subtle text-ink-2`; loading via `Loader2` (lucide); `asChild` via Radix `Slot`; efeito `Magnetic` disponível.
- **Variantes (12):** `default`/`primary` (gradiente azul, texto `on-brand`), `electric`/`lime`/`brand` (lime `#D4F434`, fonte display bold), `secondary`, `tertiary`, `success` (emerald-600), `destructive` (rose), `outline`, `ghost`, `link`, `cosmic`, `vancouver`.
- **Tamanhos:** `default h-9`, `sm h-8`, `lg h-11`, `pill h-10`, `pill-sm h-8`, `icon h-9`, `icon-sm h-8`, `icon-lg h-11`.
- **Desvios (CONFLITANTE):** hex literal (`#0369a1`, `#00b4d8`, `#D4F434`, `#121316`); `rounded-2xl` vs token 12px; `default` e `primary` duplicados; `brand/electric/lime` redundantes; CTA rosa→ciano do `DESIGN.md` não existe como variante. Alvo: [backlog](../09-PLANO-DE-EVOLUCAO/backlog-priorizado.md) B-03.
- **Regras de uso (PROPOSTO):** 1 botão `primary` por região; destrutivo sempre com `ConfirmDialog`; ícone-only exige `aria-label`; altura mínima de alvo 32px desktop, 44px mobile.
- **Aceite (PROPOSTO):** snapshot de todas as variantes×tamanhos em claro/escuro; contraste ≥4.5:1; foco visível; teste de `loading` desabilita clique.

## Componentes propostos (não existem)

Nenhum proposto nesta versão — a prioridade é consolidar duplicados existentes.
