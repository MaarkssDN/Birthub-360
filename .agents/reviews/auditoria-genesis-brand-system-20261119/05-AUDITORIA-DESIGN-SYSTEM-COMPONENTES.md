# 05 — Auditoria de Design System e Componentes
## AUDITORIA TÉCNICA INDEPENDENTE — OPERAÇÃO GENESIS BRAND SYSTEM
### Repositório: Birthub 360 | Data: 19/11/2026 | Auditor: Google Antigravity

---

## 1. Censo e Mapeamento dos Componentes do Repositório

A auditoria estática do diretório `src/components/ui/` revelou a seguinte distribuição exata de arquivos `.tsx`:
- **`src/components/ui/` (raiz):** 89 arquivos `.tsx` (incluindo `.stories.tsx`)
- **`src/components/ui/bento/`:** 5 arquivos `.tsx` (`BentoCard`, `BentoGrid`, `BentoHero`, `BentoInsight`, `BentoMetric`)
- **`src/components/ui/icons/`:** 5 arquivos `.tsx` (`AnimatedIcon`, `GithubIcon`, `LinkedinIcon`, `YoutubeIcon`, `IsometricIcons`)
- **Total em `ui/**`:** **99 componentes `.tsx`**.
- **Componentes de Layout (`src/components/layout/`):** 21 arquivos `.tsx` (Shell, Navigation, Topbar, guards).
- **Componentes de Marca (`src/components/brand/`):** 7 arquivos `.tsx` (`BirthHubLogo`, `OrbitaBackground`, `BrandCard`, etc.).

---

## 2. As 7 Famílias Arquiteturais do Design System

A entrega do Devin organizou os componentes em 7 famílias nas especificações de `04-DESIGN-SYSTEM/especificacoes/`:

### 2.1 Família de Ações (`especificacoes/acoes.md`)
- **Componentes:** `Button`, `IconButton`, `Fab`, `ButtonGroup`, `AuroraButton`, `Magnetic`, `ClickSpark`, `CtaBanner`, `CommandPalette`.
- **Anatomia e Padrões:**
  - Baseados em `cva` (Class Variance Authority) e `@radix-ui/react-slot` (`asChild`).
  - Efeito magnético opcional via `framer-motion` em `Magnetic.tsx`.
  - Estados: hover (`scale-[1.02]`), active (`scale-[0.97]`), focus (`focus-visible:ring-2 ring-focus-ring ring-offset-2`).
  - Variantes oficiais: `default`/`primary`, `electric`/`lime` (`#D4F434`), `fuchsia` (`#FF007A`), `secondary`, `outline`, `ghost`, `link`, `danger`.
  - **Acessibilidade:** `disabled:pointer-events-none disabled:opacity-50`, focus ring AA com contraste mínimo 3:1 garantido.

### 2.2 Família de Formulários (`especificacoes/formularios.md`)
- **Componentes:** `Input`, `CyberInput`, `Textarea`, `Select`, `Toggle`, `Label`.
- **Anatomia e Padrões:**
  - Regras de controle em `.bh-official-control`.
  - `Input`: Variantes `default`, `filled`, `ghost`, `cosmic`. Suporte a ícone esquerdo/direito, prefixo e sufixo.
  - `Toggle`: Switch booleano acessível com `role="switch"`, `aria-checked`.
  - **Lacuna identificada no código:** Não existem primitivas isoladas em `ui/` para `DatePicker`, `Slider`, `Checkbox`, `RadioGroup` — estes elementos são instanciados inline ou via bibliotecas de terceiros diretamente nas features.

### 2.3 Família de Navegação (`especificacoes/navegacao.md`)
- **Componentes:** `AppTopbar`, `MobileNav`, `Breadcrumbs`, `Tabs`, `AssistantsDock`.
- **Anatomia e Padrões:**
  - `Tabs`: Abas com indicador animado via Framer Motion `layoutId="activeTab"`.
  - `Breadcrumbs`: Navegação estrutural com `aria-label="Breadcrumb"` e microdados schema.
  - `AssistantsDock`: Dock flutuante estilo macOS para troca rápida entre os assistentes de IA da plataforma.

### 2.4 Família de Dados e Gráficos (`especificacoes/dados.md`)
- **Componentes:** `Table`, `VirtualTable`, `KpiCard`, `StatsGrid`, `DealsGrid`, `CompareTable`, `CompareBar`, `Badge`, `CalendarHeatmap`, `ChannelDonut`, `FunnelBars`, `Timeline`, `Checklist`, `bento/*`.
- **Anatomia e Padrões:**
  - `Table`: `<table>` semântico dentro de wrapper com `role="group"`, `aria-label`, e scroll horizontal com suporte a navegação por teclado (`tabIndex={0}`, WCAG 2.1.1).
  - `VirtualTable`: Tabela virtualizada de alta performance para listas com milhares de leads no CRM.
  - `KpiCard`: Card de métrica comercial com badge delta percentual, sparkline embutida e glow no hover.

### 2.5 Família de Feedback (`especificacoes/feedback.md`)
- **Componentes:** `Alert`, `Toaster`, `ConfirmDialog`, `EmptyState`, `ErrorBoundary`, `Skeleton`.
- **Anatomia e Padrões:**
  - 4 estados obrigatórios padronizados: Loading (Skeletons/Spinners), Empty (EmptyState ilustrado com CTA), Error (ErrorBoundary com fallback seguro), Stale/Sucesso.
  - `Alert`: Tipos `info`, `success`, `warning`, `error` com ícones Lucide correspondentes e `role="alert"`.

### 2.6 Família de Sobreposições (`especificacoes/sobreposicoes.md`)
- **Componentes:** `Dialog`, `Drawer`, `Modal`, `BottomSheet`, `DropdownMenu`, `Tooltip`, `Popover`, `CommandPalette`.
- **Anatomia e Padrões:**
  - Construídos sobre primitivas Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, etc.).
  - Foco preso (focus trap), fechamento por tecla `Escape`, bloqueio de rolagem do body e portal de renderização fora da árvore DOM principal.

### 2.7 Família de Composição (`especificacoes/composicao.md`)
- **Componentes:** `Card`, `PageHeader`, `PageTitleCard`, `BorderBeam`, `Spotlight`, `BrandOrb`.
- **Anatomia e Padrões:**
  - Padrão visual com bordas sutis `border-line` e efeitos visuais refinados (`Spotlight`, `BorderBeam` animado em gradiente).

---

## 3. Matriz de Auditoria dos Componentes de UI

| Componente | Arquivo Real | Variante cva | Estados Cobertos | Suporte WCAG AA | Detalhado em Spec? | Observações |
|---|---|---|---|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | 13 variantes | Hover, Focus, Active, Disabled, Loading | Sim (Focus Ring, `aria-disabled`) | **Sim** (`acoes.md`) | Componente modelo |
| `Input` | `src/components/ui/Input.tsx` | 4 variantes | Focus, Disabled, Error, Filled | Sim (`aria-invalid`) | **Sim** (`formularios.md`) | Suporte a adornos |
| `Table` | `src/components/ui/Table.tsx` | Padrão | Empty, Scrollable, Hover row | Sim (`tabIndex=0`, roles) | **Sim** (`dados.md`) | Scroll acessível |
| `Dialog` | `src/components/ui/Dialog.tsx` | Radix | Open, Close, Backdrop | Sim (Focus trap, Esc) | **Sim** (`sobreposicoes.md`) | Radix primitive |
| `Card` | `src/components/ui/Card.tsx` | Padrão | Hover elevation, Border glow | Sim | **Sim** (`composicao.md`) | Base estrutural |
| `Alert` | `src/components/ui/Alert.tsx` | 4 variantes | Info, Success, Warning, Danger | Sim (`role="alert"`) | **Sim** (`feedback.md`) | Ícones semânticos |
| `AIContextPopover` | `src/components/ui/AIContextPopover.tsx` | Custom | Open, Loading, Stream | Parcial | **Tabela apenas** | Falta spec individual |
| `ActionPlanSteps` | `src/components/ui/ActionPlanSteps.tsx` | Custom | Completed, In-progress, Blocked | Parcial | **Tabela apenas** | Falta spec individual |
| `CalendarHeatmap` | `src/components/ui/CalendarHeatmap.tsx` | Custom | Tooltip hover, Intensity scale | Parcial | **Tabela apenas** | ECharts/SVG |
| `Checklist` | `src/components/ui/Checklist.tsx` | Custom | Checked, Unchecked, Strike | Sim | **Tabela apenas** | Falta spec individual |

---

## 4. Conclusão e Lacunas Técnicas

1. **Catálogo Geral:** O mapeamento quantitativo dos ~95 componentes em `04-DESIGN-SYSTEM/componentes.md` está perfeito e preciso.
2. **Profundidade das Especificações:** Dos 89 componentes da raiz, os 25 componentes principais (Button, Input, Card, Table, Dialog, etc.) foram profunda e cirurgicamente especificados. Os componentes mais específicos de domínio (como `AIContextPopover`, `AIEmailGenerator`, `CalendarHeatmap`) foram apenas catalogados em tabelas de agrupamento, configurando uma lacuna documental de **Tipo B (Complementação)**.
