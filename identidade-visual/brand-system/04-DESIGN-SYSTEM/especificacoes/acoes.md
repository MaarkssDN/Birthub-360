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

## 7. Componentes adjacentes de ação

`AuroraButton.tsx`, `Magnetic.tsx` (wrapper de atração — desativa em touch/reduced-motion via hooks de `lib/motion.ts`), `ClickSpark.tsx` (efeito de faísca no clique), `CtaBanner.tsx`, `PricingSection.tsx`, `FloatingNavbar.tsx` — **props NÃO VERIFICADO** nesta revisão; existem em `ui/`.

## 8. Regras

- Ação destrutiva nunca recebe `magnetic` (`Button.tsx:129-134` — "Matriz de Imutabilidade").
- `asChild` para renderizar link/elemento customizado sem perder estilo.
- Foco visível obrigatório (`focus-visible:ring-2 ring-focus-ring`).
- Alvos de toque: sizes `lg`/`pill` ≥ h-10; IconButton `lg` h-12 — WCAG 2.5.8 (24px) atendido; 44px ideal **parcial**.
