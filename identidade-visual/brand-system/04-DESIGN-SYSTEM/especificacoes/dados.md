# Especificação — Dados — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Dados e Métricas
- **Propósito:** Especificar Table, VirtualTable, KpiCard, StatsGrid, Bento*, Badge (coolors), gráficos e grids de domínio.
- **Escopo:** `src/components/ui/{Table,VirtualTable,KpiCard,StatsGrid,DealsGrid,CompareTable,CompareBar,Badge,CalendarHeatmap,ChannelDonut,FunnelBars,Timeline,Checklist}.tsx`, `ui/bento/*`.
- **Estado da informação:** CONFIRMADO — props lidas em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** arquivos citados; `package.json` (echarts, recharts).
- **Documentos relacionados:** `../componentes.md`, `../grids-e-layouts.md`, `estados.md`, `feedback.md`.

---

## 1. Table — `ui/Table.tsx`

- `<table>` semântico dentro de wrapper rolável: `role="group"`, `aria-label` via `scrollRegionLabel` (default "Área com rolagem horizontal"), `tabIndex={0}` para scroll por teclado (WCAG 2.1.1 — comentários linhas 7-19).
- Wrapper: `relative w-full overflow-auto rounded-2xl border border-line bg-surface shadow-sm`.
- Subcomponentes exportados: `TableHeader` (`thead` com `bg-surface-2/60`), e demais (`TableBody`, `TableRow`, `TableHead`, `TableCell` — **NÃO VERIFICADO** lista completa de exports; padrão shadcn).
- Props: `TableProps extends TableHTMLAttributes` + `scrollRegionLabel?`.

## 2. VirtualTable — `ui/VirtualTable.tsx`

- Props (`VirtualTableProps<T>`, linhas 33-49): `data: T[]`, `columns: ColumnDef<T>[]`, `getRowKey`, `rowHeight?` (default 56), `height?` (default '100%'), `onRowClick?`, `emptyState?: ReactNode`, `loading?`, `skeletonRows?` (default 8), `className?`.
- `ColumnDef<T>` (linhas 21-31): `{ key, header: ReactNode, width?: number|string, align?: 'left'|'center'|'right', render(row,index), skeleton?() }`.
- Virtualização própria (não usa lib externa — **NÃO VERIFICADO** implementação interna de windowing).

## 3. KpiCard — `ui/KpiCard.tsx`

- Props (`KpiCardProps`, linhas 56-75): `icon: ComponentType<{className?}>` (obrigatório), `label?`, `title?`, `value: string|number` (obrigatório), `caption?`, `subtitle?`, `tone?: KpiTone`, `variant?`, `trend?: { value, isPositive?, text? }`, `spotlight?`, `sound?`, `onSelect?`, `active?`, `className?`.
- `KpiTone` = chaves de `KPI_TONES` — tons via tokens semânticos light+dark: `brand`, `ink`, `ok`, `gold`, etc. (`KPI_TONES`, linhas 6-52; `KpiTone` linha 54). `tone ?? variant ?? 'ink'` (linha 95).
- Comentário: "Operate Impeccable — tones via tokens semânticos" (linha 5).

## 4. StatsGrid — `ui/StatsGrid.tsx`

- Props: `{ stats?: StatItem[], ...HTMLAttributes }`.
- `StatItem` (linhas 5-13): `{ value, label, description?, trend?, highlightColor, titleColor, descColor }` — **recebe classes de cor por item** (ex.: `titleColor: 'text-[#3f6212] dark:text-[#D4F434]'`); `DEFAULT_STATS` contém 2+ itens de exemplo com hex arbitrários (`StatsGrid.tsx:19-52`) — **dívida**: API baseada em strings de classe, não em tokens.

## 5. Bento — `ui/bento/`

Exports (`bento/index.ts`): `BentoGrid`, `BentoCard`, `BentoHero`, `BentoInsight`, `BentoMetric`. Props **NÃO VERIFICADO** nesta revisão. `BentoShowcase.tsx` existe na raiz de `ui/` como vitrine.

## 6. Badge — `ui/Badge.tsx`

- `cva`: base pill `rounded-full border px-2.5 py-0.5 text-[11px] font-medium`.
- Variants: `default|secondary|destructive|danger|outline|success|warning|info|holographic|neon|gradient` (linhas 8-22). `danger`/`destructive` idênticos (color-mix `--critical` 10%); `gradient` = `bg-brand text-on-brand`.
- Prop extra: `dot?: boolean` → bolinha `bg-current` (linhas 35-43).
- Classes utilitárias relacionadas: `.badge-coolors-{yellow,orange,pink,purple,blue}` (`globals.css:405-445`) e `.badge-coolors-{yellow,blue,pink,iris,green}` (`official-identity.css:385-444`) — **duas definições concorrentes** da mesma família (globals usa paleta coolors original; official-identity usa `--color-heading-*`). Verificar precedência: `official-identity.css` importa depois → vence.

## 7. Gráficos

- Libs: `echarts ^6.1.0`, `recharts ^3.10.1` (`package.json:167,203`).
- Não há wrapper `ui/Chart` — gráficos são implementados nas features (`features/analytics`, `features/dashboard` etc.). **NÃO VERIFICADO** inventário de wrappers por feature.
- Skeleton dedicado: `ChartSkeleton` (`ui/Skeleton.tsx:114`).

## 8. Componentes de Domínio e Métricas — Especificações Detalhadas

### 8.1 DealsGrid — `src/components/ui/DealsGrid.tsx`
- **Props e Tipos:**
  - `DealCardData`: `{ id: string, title: string, status: 'won' | 'lost' | 'open', statusLabel: string, value: number }`.
  - `DealsGridProps`: `{ deals: DealCardData[], onDealClick?: (id: string) => void, formatValue?: (val: number) => string }`.
  - Formatação monetária padrão: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - Layout responsivo em grid com cards interativos e badge de status semântico.

### 8.2 CompareTable — `src/components/ui/CompareTable.tsx`
- **Props e Tipos:**
  - `CompareTableColumn`: `{ key: string, label: string }`.
  - `CompareTableCell`: `{ value: ReactNode, tone?: 'melhor' | 'pior' | 'neutral' }`.
  - `CompareTableRow`: `{ id: string, group?: string, label: string, cells: Record<string, CompareTableCell> }`.
  - Destaque semântico de tons (`melhor` com fundo sutil verde/ok, `pior` com crítico).
  - Suporte a agrupamento de linhas por seção e scroll horizontal com acessibilidade de teclado.

### 8.3 CompareBar — `src/components/ui/CompareBar.tsx`
- **Props e Tipos:**
  - `CompareBarSeries`: `{ value: number, label: string, color?: string }`.
  - `CompareBarProps`: `{ label: string, seriesA: CompareBarSeries, seriesB: CompareBarSeries, format?: (val: number) => string }`.
  - Exporta `DeltaPill`: `{ value: number, suffix?: string, note?: string }` para exibição rápida de variação percentual.

### 8.4 CalendarHeatmap — `src/components/ui/CalendarHeatmap.tsx` (101 ln)
- **Props e Tipos:**
  - `HeatmapDay`: `{ date: string, count: number, level?: 0 | 1 | 2 | 3 | 4 }`.
  - `CalendarHeatmapProps`: `{ data: HeatmapDay[], startDate?: string, endDate?: string, onDayClick?: (day: HeatmapDay) => void }`.
  - Escala de 5 intensidades de cor (de cinza/surface a neon cyan `#00E5FF`) com tooltip de contagem diária.

### 8.5 ChannelDonut — `src/components/ui/ChannelDonut.tsx` (91 ln)
- **Props e Tipos:**
  - `ChannelDonutProps`: `{ data: Array<{ name: string, value: number, color: string }>, totalLabel?: string, centerValue?: string | number }`.
  - Gráfico donut em SVG nativo de alta performance com legenda lateral e hover interativo.

### 8.6 FunnelBars — `src/components/ui/FunnelBars.tsx` (65 ln)
- **Props e Tipos:**
  - `FunnelBarItem`: `{ stage: string, count: number, conversionRate?: number, color?: string }`.
  - Barras horizontais escalonadas proporcionalmente com taxa de conversão entre etapas sucessivas do funil.

### 8.7 Timeline — `src/components/ui/Timeline.tsx` (76 ln)
- **Props e Tipos:**
  - `TimelineItem`: `{ id: string, title: string, timestamp: string, description?: ReactNode, icon?: ReactNode, status?: 'completed' | 'current' | 'pending' }`.
  - Linha do tempo vertical com nós conectados e estados de progresso.

### 8.8 Checklist — `src/components/ui/Checklist.tsx` (47 ln)
- **Props e Tipos:**
  - `ChecklistItemData`: `{ id: string, label: string, checked: boolean, disabled?: boolean }`.
  - `ChecklistProps`: `{ items: ChecklistItemData[], onChange?: (id: string, checked: boolean) => void }`.

## 9. Componentes de IA e Raciocínio

### 9.1 AIContextPopover — `src/components/ui/AIContextPopover.tsx` (216 ln)
- **Propósito:** Popover flutuante para inspeção rápida de contexto sintetizado por agentes de IA associado a leads, empresas ou negócios.
- **Tipos e Props:**
  - `EntityType`: `'lead' | 'company' | 'deal' | 'activity'`.
  - `AIInsight`: `{ id: string, category: 'risk' | 'opportunity' | 'action', text: string, confidence: number }`.
  - `AIContextPopoverProps`: `{ entityId: string, entityType: EntityType, trigger: ReactNode, insights?: AIInsight[] }`.
  - Renderiza badge de confiança de IA (`confidence`), lista de recomendações e botão de aprovação rápida.

### 9.2 AiReasoningPipeline — `src/components/ui/AiReasoningPipeline.tsx` (134 ln)
- **Propósito:** Visualizador sequencial das 5 fases de decisão de um agente autônomo.
- **Tipos e Etapas:**
  - `AiReasoningStep`: `'CONTEXT' | 'ANALYSIS' | 'RECOMMENDATION' | 'APPROVAL' | 'EXECUTION'`.
  - `AiReasoningPipelineProps`: `{ currentStep: AiReasoningStep, stepsState?: Record<AiReasoningStep, 'waiting' | 'running' | 'done' | 'error'> }`.
  - Ícones animados de progresso e pulse glow neon no estágio ativo.

### 9.3 AiReasoningVisualizer — `src/components/ui/AiReasoningVisualizer.tsx` (72 ln)
- **Propósito:** Painel expandido de exibição de grafos de pensamento e cadeias de raciocínio (Chain-of-Thought) para auditoria e explicabilidade da IA.

### 9.4 ActionPlanSteps — `src/components/ui/ActionPlanSteps.tsx` (63 ln)
- **Propósito:** Lista estruturada de planos de ação gerados por agentes de vendas com checkboxes de execução e prazos.
- **Tipos:** `PlanStep`: `{ id: string, title: string, description?: string, owner?: string, dueDate?: string, completed: boolean }`.

## 9. Regras

1. Métricas monetárias/tabulares: IBM Plex Mono via `.bh-data`/`.bh-metric` ou equivalente.
2. Estados de dado (loading/empty/error/stale) via `OperationalStateContainer`/`estados.md`.
3. Tabelas largas: `Table`/`VirtualTable` já fornecem scroll region acessível; não remover `tabIndex`/`role`.
4. Cores de status sempre via tokens semânticos (`ok/warn/critical/info` + `*-active` para texto em badges soft).
