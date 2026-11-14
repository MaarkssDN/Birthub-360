# Tokens do Design System V2.0 (RASCUNHO, NÃO HOMOLOGADO)

Nada aqui está integrado ao app (`src/`, `globals.css`, landing e login permanecem intactos).
Fonte de verdade de cor, superfície, ink e fontes: `../../shared/core.css` (não é editado).

| Arquivo | Papel |
|---|---|
| `tokens.json` | Fonte canônica, formato W3C Design Tokens / Style-Dictionary-like. Cada token traz `$type`, `$value`, `$description` e `$extensions.birthub.status` (`confirmado`, `herdado-core`, `derivado`, `provisorio`) e `css` (nome da custom property). |
| `tokens.css` | Gerado. Faz `@import` de `core.css` e estende. Dark é o padrão (`:root`); Light por `[data-theme="light"]` em qualquer ancestral. |
| `tokens.contract.json` | `tokens` (id → valor resolvido), `cssVar` (id → custom property) e `status` (id → proveniência). Para cruzar com o Brandbook. |
| `build.mjs` | `node tokens/build.mjs` a partir de `03-design-system/`. Gera os dois arquivos acima, injeta as tabelas de `../index.html` e FALHA se algum valor herdado divergir de `core.css`. Sem dependências. |

## Regras de uso

- **Tema por escopo.** Tokens de tema (e sombras, que referenciam `--shadow-color`) são declarados dentro de `[data-theme]`, nunca só em `:root`. Um alias declarado só em `:root` congela o valor Dark e um contêiner Light dentro dele herda o valor errado.
- **`data-module` abaixo de `data-theme`.** `[data-module="p03"]` define `--module-accent` (texto/ícone, variante AA do tema), `--module-accent-fill` (superfície neon sólida), `--module-accent-tint` e `--module-accent-on`. O mapeamento módulo → acento é PROPOSTA provisória.
- **Texto sobre neon sólido** usa `--on-neon` (#0D0D0D). **Texto colorido em Light** usa `--c-*`. Títulos nunca em #FFF/#000 (`--ink`).
- **Breakpoints** não funcionam em `@media` via `var()`; use o valor literal.
- **Motion: fonte única `04-motion-system/tokens/motion.css`.** `tokens.css` o importa e não redeclara `--dur-micro/fast/base/slow` nem `--ease-standard/out/in`; `build.mjs` verifica os valores e falha se divergirem.
- **Duas escalas tipográficas.** Padrão operacional (corpo 14px, `--text-*`). Em `[data-motion="commercial"]` os mesmos `--text-*`/`--lh-*`/`--fw-*` apontam para a escala do brandbook (`--text-c-*`: display 72, H1 48, H2 36, H3 24, H4 18, corpo 16px; BB-TIPO-06/07, PROVISÓRIA). Prosa usa 16px.
- **Cores semânticas** oficiais: success #22C55E, danger #EF4444, warning #FFC107, info #3B82F6 (`identidade-visual/birthhub360/tokens/birthhub360.css`); só os textos Light (`--c-success/danger/info`) são derivados.

## Orientação futura para React (não aplicada)

### 1. Variáveis CSS como contrato

Importe `tokens.css` uma vez na raiz (depois de `core.css`) e aplique `data-theme` no `<html>` (ou em um provider que escopa uma subárvore). Componentes leem apenas `var(--token)`.

### 2. Tailwind 4 (CSS-first, `@theme`)

Em vez de duplicar valores, mapeie utilitários para as variáveis (referência por `var()` mantém o tema reativo):

```css
@import "tailwindcss";
@import "./tokens/tokens.css";

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-line: var(--line);
  --color-neon-pink: var(--neon-pink);
  --color-neon-blue: var(--neon-blue);
  --color-on-neon: var(--on-neon);
  --color-text-pink: var(--c-pink);
  --color-text-blue: var(--c-blue);
  --color-module: var(--module-accent);
  --radius-control: var(--radius-control);   /* 12px */
  --radius-card: var(--radius-card);         /* 16px */
  --radius-modal: var(--radius-modal);       /* 20px */
  --font-display: var(--font-display);
  --font-interface: var(--font-ui);
  --font-mono: var(--font-mono);
}
```

`@theme inline` é necessário para que `bg-surface` aponte para `var(--surface)` em vez de congelar o valor. Proibido `bg-[#123456]`: use os tokens.

### 3. Exemplo de componente Button (cva + tokens)

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-control border font-medium',
    'min-h-[var(--size-control-h-md)] px-4 text-sm',
    'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring-color)]',
    'active:translate-y-px disabled:cursor-not-allowed aria-busy:cursor-progress aria-busy:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-neon-pink text-on-neon border-text-pink font-semibold hover:bg-[color-mix(in_srgb,var(--neon-pink)_90%,var(--ink))] focus-visible:shadow-[var(--glow-pink)]',
        secondary: 'bg-surface-2 text-ink border-[var(--field-border)] hover:bg-[var(--surface-3)] hover:border-[var(--field-border-hover)]',
        ghost: 'bg-transparent border-transparent text-ink hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]',
        danger: 'bg-[var(--neon-danger)] text-on-neon border-[var(--c-danger)] font-semibold',
      },
      size: { sm: 'min-h-[var(--size-control-h-sm)] px-3', md: '', lg: 'min-h-[var(--size-control-h-lg)] px-6 text-base' },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(({ variant, size, loading, disabled, children, className, ...rest }, ref) => (
  <button
    ref={ref}
    className={button({ variant, size, className })}
    disabled={disabled}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading && <svg className="animate-spin size-4" aria-hidden="true" /* spinner */ />}
    {children}
  </button>
));
```

Estados obrigatórios: hover, active, `focus-visible`, disabled e loading (`aria-busy`, clique bloqueado, foco preservado). Classe de referência em `../components.css` (`.bh-btn`).

### 4. Pendências antes de integrar

- Homologação humana da paleta derivada (`--c-*` Light, status, `--field-border`), da grafia da marca e dos nomes de módulo (P07, M09, M11).
- Testar com o app real e com a suíte e2e existente; esta pasta é protótipo.
