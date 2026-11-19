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

## 8. Componentes de domínio em `ui/`

| Componente | Notas |
|---|---|
| `DealsGrid.tsx` | `DealCardData { id,title,status:'won'|'lost'|'open',statusLabel,value }`; `DealCard` + `DealsGrid` (linhas 6-92+); `formatValue` default `Intl pt-BR BRL` |
| `CompareTable.tsx` | `CompareTableColumn{key,label}`, `CompareTableCell{value,tone?:'melhor'|'pior'|'neutral'}`, `CompareTableRow{id,group?,label,cells}` — `group` insere separador de seção; região rolável focável |
| `CompareBar.tsx` | `CompareBar` (`label`, `seriesA`, `seriesB`, `format`) + `DeltaPill` (`value`, `suffix='%'`, `note`) |
| `CalendarHeatmap.tsx` | heatmap de calendário — props NÃO VERIFICADO |
| `ChannelDonut.tsx`, `FunnelBars.tsx` | gráficos de domínio — props NÃO VERIFICADO |
| `Timeline.tsx`, `Checklist.tsx` | listas temporais/tarefas — props NÃO VERIFICADO |

## 9. Regras

1. Métricas monetárias/tabulares: IBM Plex Mono via `.bh-data`/`.bh-metric` ou equivalente.
2. Estados de dado (loading/empty/error/stale) via `OperationalStateContainer`/`estados.md`.
3. Tabelas largas: `Table`/`VirtualTable` já fornecem scroll region acessível; não remover `tabIndex`/`role`.
4. Cores de status sempre via tokens semânticos (`ok/warn/critical/info` + `*-active` para texto em badges soft).
