# Token Audit — Voice-Hub vs. globals.css

**Audited:** 2026-09-30  
**Scope:** `src/features/voice-hub/components/tokens.ts` · `src/features/voice-hub/components/design-system/tokens.ts` · `src/styles/globals.css`

---

## 1. What Exists in the Voice-Hub Token Files

### File Comparison

> [!CAUTION]
> Both files are **byte-for-byte identical** (318 lines, 10,128 bytes each). There is no functional difference between them.

```
src/features/voice-hub/components/tokens.ts                (318 lines)
src/features/voice-hub/components/design-system/tokens.ts  (318 lines)  ← exact duplicate
```

### Token Categories in Both Files

| Category | Contents |
|----------|----------|
| `colors` | Light + dark palettes with hardcoded hex values AND a few `var(--brand-color)` references |
| `spacing` | xs=4px → 6xl=96px |
| `radius` | none → pill (values differ from design system) |
| `shadows` | xs → xl + glass (Tailwind-style flat values) |
| `typography` | fontFamily (Montserrat/mono), fontSize, fontWeight, lineHeight, letterSpacing |
| `transitions` | duration (fast/normal/slow/slowest) + easing |
| `zIndex` | hide(-1) → toast(1700) |
| WCAG utilities | `hexToRgb`, `relativeLuminance`, `contrastRatio`, `getAccessibleTextOnBrand`, `getAccessibleBrandForeground` |

---

## 2. Conflict Analysis with globals.css

### Color Conflicts

The voice-hub `colors` object uses **hardcoded hex values** that diverge from the CSS token system:

| Voice-hub (light) | Value | globals.css equivalent | Conflict? |
|---|---|---|---|
| `primary` | `var(--brand-color, #ff5618)` | `var(--brand)` = `#D4AF37` (Gold) | ⚠️ Different semantic — brand-color is tenant-overridable orange, --brand is the Gold constant |
| `success` | `#10b981` | `var(--ok)` = `#0F9D64` | Minor — close but not identical |
| `warning` | `#f59e0b` | `var(--warn)` = `#FFC500` | Different hue |
| `danger` | `#ef4444` | `var(--critical)` | Different (globals has calibrated AA version) |
| `surface` | `#ffffff` | `var(--surface)` (theme-aware) | ⚠️ Hardcoded breaks dark mode |
| `background` | `#f7f5f3` | `var(--bg)` | ⚠️ Hardcoded breaks dark mode |
| `textPrimary` | `#333333` | `var(--ink)` | ⚠️ Hardcoded breaks dark mode |

### Typography Conflicts

| Voice-hub | Value | globals.css | Conflict? |
|---|---|---|---|
| `fontFamily.sans` | `'Montserrat', Arial, sans-serif` | `var(--font-brand-display)` = `"Sora"` | ❌ Wrong font — Montserrat is not in the BirthHub stack |
| `fontFamily.mono` | `ui-monospace, SFMono-Regular...` | `var(--font-brand-sans)` = `"IBM Plex Mono"` | ⚠️ Falls back to system mono instead of IBM Plex Mono |

### Motion/Transition Conflicts

| Voice-hub | Value | Design language v2.0 | Conflict? |
|---|---|---|---|
| `transitions.duration.fast` | `100ms` | `--duration-instant: 100ms` | Name mismatch — "fast" in tokens = "instant" in system |
| `transitions.duration.normal` | `200ms` | `--duration-normal: 250ms` | Value mismatch — 200ms vs 250ms |
| `transitions.easing.easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | `--ease-standard` | Matches substance, different name |
| `transitions.easing.spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Banned — elastic bounce | ❌ **Banned** by design system motion rules |

### Radius Conflicts

Voice-hub radius values are off from the canonical system:

| Voice-hub | Value | Design system | Delta |
|---|---|---|---|
| `radius.xs` | `2px` | `4px` | -2px |
| `radius.sm` | `4px` | `6px` | -2px |
| `radius.md` | `6px` | `8px` | -2px |
| `radius.lg` | `8px` | `12px` (radius-card) | -4px |

### The Duplicate File Problem

There is no `index.ts` or re-export logic that would explain why two identical files exist. The most likely cause: the `design-system/` subdirectory was created to establish a design system layer inside voice-hub, but the same `tokens.ts` was copied instead of re-exported or consolidated.

---

## 3. Usage Scope Analysis

> [!NOTE]
> Voice-hub token files export JavaScript objects (not CSS custom properties). They are consumed at runtime by voice-hub components via `import { colors } from './tokens'`. They do **not** generate CSS variables or conflict at the CSS level — the conflicts are semantic and visual.

The WCAG utility functions (`hexToRgb`, `contrastRatio`, `getAccessibleTextOnBrand`, `getAccessibleBrandForeground`) are **genuinely useful** shared utilities that belong to a common location.

---

## 4. Recommendation

### Immediate Actions (Critical)

| Priority | Action |
|----------|--------|
| 🔴 Critical | **Delete** `src/features/voice-hub/components/design-system/tokens.ts` — it is an exact duplicate |
| 🔴 Critical | Move the **WCAG utility functions** to `src/lib/color-utils.ts` (shared, tested, accessible everywhere) |
| 🟡 High | Replace hardcoded hex values in `colors` with references to CSS variables where possible |
| 🟡 High | Remove `spring` easing from `transitions.easing` — banned by design motion system |
| 🟡 High | Update `fontFamily.sans` from Montserrat → Sora |
| 🟢 Low | Align `radius` values to design system scale |
| 🟢 Low | Align `transitions.duration` values to design system scale |

### Architecture Recommendation: Keep Isolated, Fix the Conflicts

The voice-hub token system is **not wrong in concept** — having feature-level token objects for programmatic use (JS-side animations, canvas rendering, dynamic styling) is legitimate. What needs fixing:

1. **De-duplicate**: One file, one source.
2. **Reference CSS variables** for colors (use `var(--brand)` not `#D4AF37`).
3. **Move utilities** to `src/lib/color-utils.ts` — these are cross-cutting concerns.
4. **Align motion values** to the design system specification.
5. **Do NOT attempt** to generate CSS from these JS tokens — the globals.css `@theme` block is the authoritative CSS token source.

### What NOT to Do

- ❌ Do not try to replace globals.css with JS-generated tokens
- ❌ Do not add a build step to sync these two systems — they serve different layers (CSS cascade vs. JS runtime)
- ❌ Do not remove the WCAG utilities without moving them first

---

## 5. Critical Changes Needed (Summary)

```
1. rm src/features/voice-hub/components/design-system/tokens.ts
2. Create src/lib/color-utils.ts with the WCAG utility functions
3. Update tokens.ts colors to reference var(--brand), var(--ok), var(--critical) etc.
4. Update tokens.ts typography.fontFamily.sans to "Sora"
5. Remove transitions.easing.spring (banned)
6. Align transitions.duration values to: instant=100ms, fast=150ms, normal=250ms
```
