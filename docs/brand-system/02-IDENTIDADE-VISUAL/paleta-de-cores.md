# Paleta de Cores

Fonte normativa: [`birthhub360.css`](../../../identidade-visual/birthhub360/tokens/birthhub360.css) (+ `.json`, `.ts`). Estado: CONFIRMADO para valores; divergências em [conflitos](../00-GOVERNANCA/conflitos-e-decisoes.md).

## Marca (escuro / claro)

| Papel | Token | Escuro | Claro | Uso |
|---|---|---|---|---|
| Ciano (primária) | `--color-brand-primary` | `#00D4FF` | `#0369A1` | ações, foco, links |
| Rosa (secundária) | `--color-brand-secondary` | `#FF2D9B` | `#D91B7C` | conversão, CTA gradiente |
| Ouro (acento) | `--color-brand-accent` | `#FFC107` | `#D97706` | metas, ARR, alertas |
| Íris | `--color-heading-iris` | `#8B7DFF` | (herdado) | IA / copiloto |

## Superfícies e texto

| Token | Escuro | Claro |
|---|---|---|
| `--color-background` | `#0D0D0D` | `#F4F7FB` (DESIGN.md diz `#F8FAFC`: C-02) |
| `--color-surface` | `#14141A` | `#FFFFFF` |
| `--color-surface-elevated` | `#1C1C24` | `#EDF2F7` |
| `--color-surface-hover` | `#252532` | `#E2E8F0` |
| `--color-text-primary` | `#F8F9FF` | `#0F172A` |
| `--color-text-secondary` | `#9EADC8` | `#64748B` → sobrescrito `#475569` (C-03) |
| `--color-text-muted` | `#A1A1B5` | `#475569` |
| `--color-border-subtle` | `rgba(0,212,255,.18)` | `rgba(11,19,43,.12)` |

## Semânticas

Sucesso `#22C55E` · Aviso `#FFC107` · Perigo `#EF4444` · Info `#3B82F6` (iguais nos dois temas nos tokens; `DESIGN.md` lista variantes claras `#16A34A/#D97706/#DC2626/#2563EB` — **CONFLITANTE**, não implementadas nos tokens lidos).

## Gradientes

`--grad-brand`, `--grad-cta`, `--grad-orbit` (cônico), `--grad-cyan-pink`, `--grad-gold`, `--grad-glow`, `--grad-vancouver (#0EA5E9→#3B82F6→#8B5CF6)`. Glows: `--glow-{blue,cyan,pink,gold}`.

## Uso real no código

622 hex distintos em `src/`. Top: `#00D4FF` 455, `#F8F9FF` 260, `#FF2D9B` 222, `#FFC107` 173, `#8B7DFF` 133 (oficiais) — porém também `#0284C7` 102, `#F59E0B` 84, `#94A3B8` 82, `#38BDF8` 55, `#D4F434` 55, `#00E5FF` 45 (fora do contrato). Detalhe: [CSV](../_inventarios/cores-hex-hardcoded.csv).

## Regras (PROPOSTO, verificáveis)

1. Componentes novos consomem `var(--color-*)`; hex literal proibido.
2. Texto ≥4.5:1 (AA); texto da marca no claro usa `--color-brand-primary` (`#0369A1`).
3. Rosa e ciano nunca como único portador de significado de erro/sucesso.
