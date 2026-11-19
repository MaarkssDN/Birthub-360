# Especificação — Ações — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Ação
- **Propósito:** Especificar Button, IconButton, Fab, ButtonGroup/ToggleButtonGroup, links e CommandPalette.
- **Escopo:** `src/components/ui/Button.tsx`, `IconButton.tsx`, `Fab.tsx`, `ButtonGroup.tsx`, `AuroraButton.tsx`, `Magnetic.tsx`, `ClickSpark.tsx`, `CtaBanner.tsx`, `CommandPalette.tsx`.
- **Estado da informação:** CONFIRMADO — props lidas dos arquivos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** arquivos citados; `_FATOS-CANONICOS.md` §8.
- **Documentos relacionados:** `../componentes.md`, `../estados.md`, `formularios.md`, `sobreposicoes.md`.

---

## 1. Button — `src/components/ui/Button.tsx` (139 ln)

Construído com `cva` + `@radix-ui/react-slot` (`asChild`) + `Magnetic`. Estilos base (`buttonVariants`, linhas 11-73): `bh-official-control`, `text-[13px] font-semibold tracking-[-0.015em]`, `motion-safe:transition-all duration-200 ease-out`, `focus-visible:ring-2 ring-focus-ring ring-offset-2 ring-offset-surface`, `disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-ink-2`, `active:scale-[0.97]`.

### Variants (13)

| Variant | Aparência (resumo) |
|---|---|
| `default`/`primary` | gradiente `from-[#0369a1] to-[#075985]` (light) / `dark:from-[#00b4d8] to-[#0284c7]`; `text-on-brand`; `rounded-2xl`; sombras cyan (linhas 17-20) |
| `electric`/`lime` | pill `rounded-full bg-[#D4F434]` lime/chartreuse, texto `#121316` (linhas 23-25) |
| `brand` | gradiente lime `from-[#D4F434] to-[#BEE61C]`, Sora bold (linhas 28-29) — **atenção:** nome "brand" aqui renderiza lime, não o gradiente de marca |
| `secondary` | surface flutuante `border-line bg-surface/90` (linhas 32-33) |
| `tertiary` | `bg-surface border-line` (linhas 35-36) |
| `success` | `bg-emerald-600 hover:bg-emerald-500` (linhas 38-39) |
| `destructive` | gradiente rose `from-rose-600 to-rose-700` (linhas 41-42) |
| `outline` | `border-line bg-transparent` (linhas 44-45) |
| `ghost` | sem fundo, `text-ink-2` (linhas 47) |
| `link` | `text-primary underline-offset-4 hover:underline` (linhas 49) |
| `cosmic` | gradiente slate/`#14141A` com borda `brand/30` (linhas 51-52) |
| `vancouver` | `border-line bg-surface/40` (linhas 54-55) |

### Sizes (8)

`default` h-9 px-4 · `sm` h-8 px-3 text-xs rounded-xl · `lg` h-11 px-6 text-sm · `pill` h-10 px-6 rounded-full font-display bold · `pill-sm` h-8 px-4 text-xs rounded-full · `icon`/`icon-sm`/`icon-lg` h-9/8/11 quadrados rounded-full (linhas 57-66).

### Props (`ButtonProps`, linhas 75-85)

```ts
asChild?: boolean;        // renderiza via Slot (ex.: <a>)
loading?: boolean;        // spinner Loader2 + aria-busy + disabled
soundClick?: boolean;     // props declaradas; implementação de som NÃO confirmada neste arquivo (SoundFX não importado aqui — provável uso via Magnetic/handlers; NÃO VERIFICADO)
soundHover?: boolean;     // idem
sound?: string;
shine?: boolean;          // prop declarada; efeito não visível neste arquivo — NÃO VERIFICADO
magnetic?: boolean;       // envolve em <Magnetic>, exceto variant 'destructive' (linhas 129-134)
```

`defaultVariants`: `variant: 'default'`, `size: 'default'`.

## 2. IconButton — `src/components/ui/IconButton.tsx`

Props (`IconButtonProps`, linhas 36-41): `variant` ∈ `default|outline|vancouver|brand|ghost`; `size` ∈ `sm|default|md|lg` (h-8/9/10/12 quadrados); `magnetic?: boolean` (Magnetic maxDisplacement=4); `soundClick?: boolean` → `SoundFX.play('click')` (confirmado, linhas 46-52). `type="button"` fixo.

## 3. Fab — `src/components/ui/Fab.tsx`

Props (`FabProps`, linhas 6-11): `icon?`, `label?`, `glow?` (declarada, `_glow` não usada no estilo visível — **NÃO VERIFICADO**), `magnetic?`. Sempre `SoundFX.play('click')` no click (linha 16). Classes: `rounded-full bg-brand text-on-brand shadow-card hover:bg-brand-active`; com `label` → `h-12 px-5`, sem → `h-14 w-14` (linhas 25-28).

## 4. ButtonGroup / ToggleButtonGroup — `src/components/ui/ButtonGroup.tsx`

- `ButtonGroupItem<T extends string>`, `ButtonGroupProps<T>` (linhas 6-25); `ButtonGroup` é **genérico** sobre o valor string.
- `ToggleButtonGroupProps<T> extends ButtonGroupProps<T>`; `ToggleButtonGroup` (linhas 87-89) — implementação detalhada **NÃO VERIFICADO** (arquivo tem ~90 ln; props de item provavelmente incluem `value/label/disabled` — confirmar no fonte antes de documentar API).

## 5. Links

- `Button variant="link"` é o link estilizado oficial (`Button.tsx:49`).
- `.btn-vancouver-outline` — botão outline pill (`official-identity.css:461-472`).
- `.link-block-underline`/`.nav-link-holder` — sublinhado animado de nav (`globals.css:1717-1729`).

## 6. CommandPalette — `src/components/ui/CommandPalette.tsx` (lazy via MainLayout)

- Ação global de busca/navegação: grupos `Nesta página | Ações rápidas | Navegar | Empresas | Decisores` (linhas 30-37).
- Atalho: `Ctrl/⌘ + K` (linhas 155-163) + evento global `OPEN_COMMAND_PALETTE_EVENT = 'birthhub360:open-command-palette'` (`lib/paletteIntent.ts:2`) + `OPEN_AI_CHAT_EVENT`.
- Busca empresas/decisores via `api` (`/api` companies/contacts — PaginatedResponse); navegação para `/app/${tab}` via `TAB_META`/`MODULE_ORDER`; normalização sem diacríticos (`normalize`, linhas 43-47); trap de foco próprio (`FOCUSABLE_SELECTOR`, linhas 49-51).
- Montado uma vez no `MainLayout` (`MainLayout.tsx:81`).

## 7. Componentes Adjacentes de Ação — Especificações Detalhadas

### 7.1 AuroraButton — `src/components/ui/AuroraButton.tsx` (65 ln)
- **Propósito:** Botão de ação de alto impacto visual com efeito aurora borealis e brilho periférico difuso (glow) para CTAs de conversão.
- **Props (`AuroraButtonProps`):**
  - `size?: 'default' | 'small'` (default min-h 54px; small min-h 40px).
  - `glow?: boolean` (default `true` — ativa aura animada em blur).
  - Suporta todas as props nativas de `React.ButtonHTMLAttributes<HTMLButtonElement>`.
- **Estados e Interação:** Hover com escala suave `active:scale-[0.98]`, transição de 200ms, isolamento de stacking context (`isolate overflow-visible`).

### 7.2 Magnetic — `src/components/ui/Magnetic.tsx` (56 ln)
- **Propósito:** Wrapper de microinteração magnética que atrai levemente o elemento filho na direção do cursor do mouse.
- **Props (`MagneticProps`):**
  - `children: React.ReactElement` (elemento interativo envolvido).
  - `maxDisplacement?: number` (deslocamento máximo em pixels, default `6px`, faixa recomendada 4px a 8px).
  - `disabled?: boolean` (default `false`).
- **Acessibilidade Obrigatória:** Integra hook `useReducedMotion()`. Quando o usuário tem redução de movimento ativa ou dispositivo touch sem mouse, o componente renderiza o filho sem aplicar translação `x/y`.

### 7.3 ClickSpark — `src/components/ui/ClickSpark.tsx` (54 ln)
- **Propósito:** Gerador de partículas de faísca efêmeras disparadas nas coordenadas exatas de cliques na janela.
- **Comportamento:** Cria objeto `{ id, x, y }` em array interno e realiza garbage collection automático após `1000ms`.
- **Renderização:** Framer Motion com `AnimatePresence` para animação fluida de dispersão.

### 7.4 CtaBanner — `src/components/ui/CtaBanner.tsx` (96 ln)
- **Propósito:** Banner de chamada para ação em largura total com moldura Neon e glow radial.
- **Props (`CtaBannerProps`):**
  - `onCtaClick?: () => void` (callback de clique no botão principal).
  - `title?: React.ReactNode` (título com suporte a gradiente de texto).
  - `description?: string` (texto descritivo explicativo).
- **Estilos:** Borda semi-transparente `border-[#00D4FF]/30`, cantos arredondados generosos (`rounded-3xl sm:rounded-[36px]`), sombra profunda com tint cyan `shadow-[0_20px_60px_rgba(0,212,255,0.08)]`.

### 7.5 BugReportButton — `src/components/ui/BugReportButton.tsx` (180 ln)
- **Propósito:** Botão flutuante global para reporte instantâneo de problemas por operadores comerciais.
- **Recursos:**
  - Diálogo modal de submissão com seletor de severidade (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - Auto-captura de contexto de execução: URL corrente, viewport, user agent e últimos logs de console sem exigir digitação técnica do usuário.
  - Sem animação pulsante contínua para evitar poluição visual e respeitar a regra de "motion com propósito".

## 8. Regras

- Ação destrutiva nunca recebe `magnetic` (`Button.tsx:129-134` — "Matriz de Imutabilidade").
- `asChild` para renderizar link/elemento customizado sem perder estilo.
- Foco visível obrigatório (`focus-visible:ring-2 ring-focus-ring`).
- Alvos de toque: sizes `lg`/`pill` ≥ h-10; IconButton `lg` h-12 — WCAG 2.5.8 (24px) atendido; 44px ideal **parcial**.
