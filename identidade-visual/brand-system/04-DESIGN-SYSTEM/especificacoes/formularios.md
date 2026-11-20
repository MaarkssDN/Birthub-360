# Especificação — Formulários — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Formulário
- **Propósito:** Especificar Input, CyberInput, Textarea, Select, Toggle (switch), Label e as convenções de validação/acessibilidade.
- **Escopo:** `src/components/ui/{Input,CyberInput,Textarea,Select,Toggle,Label}.tsx`; `official-identity.css` (regras `.bh-official-control`).
- **Estado da informação:** CONFIRMADO — props lidas em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** arquivos citados; `package.json` (react-hook-form, zod).
- **Documentos relacionados:** `../componentes.md`, `../estados.md`, `acoes.md`, `dados.md`.

---

## 1. Inventário

| Componente | Arquivo | Base |
|---|---|---|
| `Input` | `ui/Input.tsx` | `<input>` nativo + cva |
| `CyberInput` | `ui/CyberInput.tsx` | `<input>` com variantes visuais/neon |
| `Textarea` | `ui/Textarea.tsx` | `<textarea>` + cva |
| `Select` | `ui/Select.tsx` | `<select>` nativo + cva (não é combobox) |
| `Toggle` | `ui/Toggle.tsx` | switch booleano controlado |
| `Label` | `ui/Label.tsx` | label estilizado |

**Ausentes como primitives em `ui/`:** `Switch` nomeado, `Slider`, `DatePicker`, `Checkbox`, `RadioGroup`, wrapper `Form` — **NÃO EXISTEM**; date/slider/checkbox são implementados inline nas features (**NÃO VERIFICADO** cada caso).

## 2. Input — `ui/Input.tsx`

- Props: `InputHTMLAttributes` (sem `size`) + `inputSize?: 'default'|'sm'|'md'|'lg'` + `variant?: 'default'|'filled'|'ghost'|'cosmic'|'vancouver'` + `error?: boolean` (`Input.tsx:14-33`).
- Base: `bh-official-control`, `rounded-control` (12px), `border-line bg-surface text-ink`, `hover:border-line-strong`, `focus-visible:ring-2 ring-focus-ring`, `disabled:bg-surface-subtle opacity-60`.
- `error` → `border-danger focus-visible:ring-danger` **e** `aria-invalid={true}` (`Input.tsx:47-52`) — invalidação exposta a AT.
- Tamanhos: default `h-10 px-4 text-sm`; sm `h-8`; md `h-9`; lg `h-11 px-4 text-base`.

## 3. CyberInput — `ui/CyberInput.tsx`

- Props (`CyberInputProps`, linhas 17-22): `variant?: 'neon'|'glass'|'metallic'|'cosmic'` (default `neon`); `size?: 'sm'|'md'|'lg'` (default `md`); `glowColor?: 'cyan'|'purple'|'gold'|'green'` (default `cyan`); `soundFeedback?: boolean` (default `true`); demais `InputHTMLAttributes` sem `size`.
- Implementação própria (não usa `inputVariants`): estado `isFocused`, `lastKeyTimeRef` para som por tecla; respeita `useReducedMotion` (linhas 24-38). Detalhes visuais por variante em `variantStyles` — **NÃO VERIFICADO** integralmente.

## 4. Textarea — `ui/Textarea.tsx`

- Props: `TextareaHTMLAttributes` + `variant?: 'default'|'filled'|'ghost'|'holographic'`.
- Base: `bh-official-control min-h-[80px] rounded-control`; focus ring na base (WCAG 2.4.7 — comentário linhas 5-8); `disabled` idem Input.

## 5. Select — `ui/Select.tsx`

- `<select>` nativo estilizado (não combobox/listbox custom). Props: `SelectHTMLAttributes` (sem `size`) + `variant?: 'default'|'filled'|'ghost'|'cosmic'` + `size?: 'default'|'sm'|'md'|'lg'`.
- Focus ring na base para todas as variantes (comentário WCAG 2.4.7).

## 6. Toggle — `ui/Toggle.tsx`

- Props (`ToggleProps`, linhas 6-15): `checked: boolean`, `onChange(checked)`, `disabled?`, `label?`, `description?`, `className?`, `id?`, `'aria-label'?`.
- Switch controlado com `useReducedMotion` (linha 27); gera `id` a partir do label quando ausente.
- É o equivalente a "Switch" do DS — **não existe componente chamado `Switch`**.

## 7. Label — `ui/Label.tsx`

Componente de label estilizado (detalhes de props **NÃO VERIFICADO** — arquivo existe; tipicamente `LabelHTMLAttributes`).

## 8. Validação e estado inválido

- Libs disponíveis: `react-hook-form ^7.88.0`, `zod ^4.6.7` (`package.json:201,221`); `@hookform/resolvers` **NÃO VERIFICADO** no package.json (não listado nas linhas lidas — confirmar).
- Convenção de invalidação:
  - Prop `error` no `Input` → `aria-invalid` + estilo danger.
  - CSS global: `.bh-official-control[aria-invalid="true"] { border-color: var(--color-danger) }` (`official-identity.css:205-207`) — cobre Input/CyberInput/Textarea/Select/Toggle quando a classe base está presente.
- Mensagens de erro por campo: **NÃO VERIFICADO** padrão único (provavelmente `text-critical`/`text-danger` inline nas features).

## 9. Autofill

`.bh-official-control:-webkit-autofill` (`official-identity.css:208-211`): `-webkit-text-fill-color: var(--color-text-primary)` + `box-shadow: 0 0 0 1000px var(--color-surface) inset` — evita fundo amarelo do browser e mantém contraste do tema.

## 10. Regras

1. Todo campo interativo usa `bh-official-control` (via componentes) → foco/estado inválido/autofill consistentes.
2. `aria-invalid` deve acompanhar `error` — já automático no `Input`.
3. Labels: usar `Label` associado por `htmlFor`/`id` (**NÃO VERIFICADO** uso universal).
4. Borda de controle ≥3:1 via `--border-input`/`--line-strong` (`globals.css:246-251`) — inputs já herdam.
5. Não criar novo primitive de formulário sem coordenar com Agente 03 (propriedade `src/components/ui/**`).
