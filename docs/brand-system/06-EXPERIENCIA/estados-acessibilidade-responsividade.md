# Estados, Acessibilidade e Responsividade

Estado: regra de estados = DOCUMENTADO (`DESIGN.md` cap. 5) + componente existente; adoção NÃO VERIFICADA. Acessibilidade/responsividade: evidências indiretas.

## Os 4 estados obrigatórios

| Estado | Componente | Regra |
|---|---|---|
| Loading | `Skeleton` | mesmo formato do conteúdo final |
| Empty | `EmptyState` | explica ausência + CTA; nunca dado inventado (PRODUCT.md "Zero Mock") |
| Error | `ErrorBoundary`, `Alert` | causa raiz legível + retry sem deslogar |
| Stale | `OperationalStateContainer`, `SyncIndicator` | mostra timestamp da última sincronização, mantém dados em cache |

Outros estados existentes: `BlockedState` (sem permissão/bloqueio), `OfflineBanner` (offline). Um mapa por módulo de qual estado está implementado: **NÃO VERIFICADO** (backlog P1, apoio Agentes 08/22).

## Acessibilidade (meta: WCAG 2.2 AA — CONFIRMADO como requisito em `DESIGN.md`)

- Foco: `outline 2px` com offset 3px e halo; `Button` usa `ring-2 ring-offset-2` (CONFIRMADO).
- Movimento: `MotionConfig reducedMotion="user"` (CONFIRMADO).
- Contraste: o claro usa `#0369A1` para texto de marca precisamente por AA; tema escuro `#00D4FF` sobre `#0D0D0D` (razão não medida aqui).
- Débito conhecido: `documentacao` do Desktop cita auditorias a11y (`03-audit-a11y-ui-*.md`) — **não lidas**. Skills `accessibility`/`axe-a11y` do projeto devem ser usadas na verificação.
- Alvos mínimos, navegação por teclado em `Sidebar`/`CommandPalette`/modais, leitura assistiva: NÃO VERIFICADO.

## Responsividade

Evidência: `MobileNav`, `MobileNavDrawer`, `BottomSheet`, `VirtualTable`, tipografia fluida com `clamp()`, empacotamento Capacitor (Android). Breakpoints reais e adaptação de tabelas: NÃO VERIFICADO.

## Dashboards/dados

Cores semânticas de dados: usar `--color-success/warning/danger/info`; ouro = metas/ARR; íris = IA. Números em `IBM Plex Mono`. Gráficos: `src/components/charts/` e `ui/ChannelDonut|FunnelBars|CalendarHeatmap` (specs NÃO VERIFICADO).
