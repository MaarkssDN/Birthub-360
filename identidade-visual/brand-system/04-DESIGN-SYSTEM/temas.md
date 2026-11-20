# Temas — Dark / Light — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Temas (Dark/Light)
- **Propósito:** Documentar como os temas são declarados, aplicados, persistidos e os componentes de alternância.
- **Escopo:** seletores de tema, script de boot, `ThemeContext`, `ThemeSwitcher`/`ThemeToggle`, rampas AA light e PWA `theme-color`.
- **Estado da informação:** CONFIRMADO — verificado em código em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `index.html`, `src/contexts/ThemeContext.tsx`, `src/styles/globals.css`, `src/styles/official-identity.css`, `identidade-visual/birthhub360/tokens/birthhub360.css`, `src/components/ui/ThemeSwitcher.tsx`, `src/components/layout/ThemeToggle.tsx`, `vite.config` (PWA manifest).
- **Documentos relacionados:** `foundations.md`, `design-tokens.md`, `grids-e-layouts.md`.

---

## 1. Seletores de tema

Três mecanismos coexistem e são todos respondidos pelos tokens:

| Seletor | Onde responde |
|---|---|
| `[data-theme="dark"]` / `[data-theme="light"]` | `birthhub360.css:119-249`; `official-identity.css:62-107,225-234,242-315` |
| `html.dark` / `.dark` (e `html.light`, `:root.light`) | `birthhub360.css:119-121,188-190`; `globals.css:572-719` (`.dark`), `@custom-variant dark` em `globals.css:1574` |
| `html:not(.dark)` | overrides de contraste em `official-identity.css:275-315` |

O script de boot (`index.html:17-35`) e o `ThemeContext` sempre escrevem **os dois** sinais: `documentElement.dataset.theme` **e** a classe `dark`/`light` (`ThemeContext.tsx:35-42`).

## 2. Aplicação do tema

### 2.1 Boot sem flash (FOUC)

`index.html:17-35` — script inline síncrono no `<head>`, antes do bundle:

```js
var savedTheme = localStorage.getItem("birthhub360_theme");
var activeTheme = (savedTheme === "dark" || savedTheme === "light") ? savedTheme : "light";
// dark → classList.add("dark"), remove("light"), dataset.theme="dark"
// light → remove("dark"), add("light"), dataset.theme="light"
// fallback (exceção) → light
```

Default quando nada está salvo: **light**.

### 2.2 Runtime

`src/contexts/ThemeContext.tsx`:

- `ThemeProvider` lê `localStorage['birthhub360_theme']` na montagem (`getInitialTheme`, linhas 14-24; default `light`).
- `useEffect` persiste a chave e aplica `dataset.theme` + classes `light`/`dark` no `<html>` (linhas 29-43).
- API: `{ theme, toggleTheme, setThemeMode }`; hooks `useTheme()` (lança fora do provider) e `useOptionalTheme()` (linhas 60-70).
- O sub-app `src/features/prospecting/outbound/App.tsx:79-84` usa a **mesma chave** `birthhub360_theme` — compartilhar preferência entre shell e sub-app.

### 2.3 Componentes de alternância

| Componente | Arquivo | Comportamento |
|---|---|---|
| `ThemeToggle` | `src/components/layout/ThemeToggle.tsx` | Botão ícone Sol/Lua usando `useTheme()` do `ThemeContext`; usado no `AppTopbar` |
| `ThemeSwitcher` | `src/components/ui/ThemeSwitcher.tsx` | Exportado por `ui/index.ts`; **props NÃO VERIFICADO** em detalhe (arquivo existe; uso interno não confirmado nesta revisão) |

`AppTopbar.tsx` também contém controle de tema próprio via `useTheme` (import linha 8; `theme`/`toggleTheme` desestruturados) — possivelmente redundante com `ThemeToggle` (**CONFLITANTE/duplicação a registrar**: dois pontos de alternância no topbar — NÃO VERIFICADO se renderiza ambos).

## 3. PWA `theme-color`

- `index.html:8`: `<meta name="theme-color" content="#F4F7FB" />` — cor inicial do tema light oficial.
- Comentário no próprio arquivo: "ThemeProvider acompanha a alternância" — ou seja, espera-se que o provider atualize a meta tag em runtime (**NÃO VERIFICADO**: `ThemeContext.tsx` lido integralmente não contém escrita em `meta[name=theme-color]`; verificar se outro módulo o faz — possível lacuna).
- Manifest PWA: `theme_color #F4F7FB`, `start_url /app`, ícones `public/icons/icon-{192,512,512-maskable}.png` (`_FATOS-CANONICOS.md` §15).

## 4. Rampas AA do tema claro

Implementadas em `birthhub360.css:119-186` + overrides em `official-identity.css`:

- Superfícies: bg `#F4F7FB` (**canônico V2**; `#F8FAFC` aparece como legado/DESIGN.md — divergência registrada, pendência humana nº 7), surface `#FFFFFF`, elevated `#EDF2F7`, hover `#E2E8F0`.
- Texto: ink `#0F172A`, secondary `#64748B`, muted `#475569`.
- Marca adaptada AA: cyan `#0369A1`/`#0284C7`, pink `#D91B7C`/`#BE185D`, gold `#D97706`/`#92400E`, iris `#7C3AED`/`#6D28D9`, danger `#DC2626`/`#B91C1C` (`_FATOS-CANONICOS.md` §3).
- Foco light: `#0369A1`; dark: `#00D4FF`.

### Overrides de contraste para hex arbitrário

`official-identity.css:264-315` reescreve **somente texto** no tema claro para 5 hex hardcoded encontrados no código:

| Classe arbitrária | Light |
|---|---|
| `text-[#00D4FF]`/`[#00d4ff]`/`[#0284c7]`/`[#0284C7]` | `#0369A1` |
| `text-[#FF2D9B]`/`[#ff2d9b]` | `#BE185D` |
| `text-[#F59E0B]`/`[#f59e0b]`/`[#b45309]`/`[#B45309]` | `#92400E` |
| `text-[#8B7DFF]`/`[#8b7dff]` | `#6D28D9` |
| `text-[#EF4444]`/`[#ef4444]` | `#B91C1C` |

Especificidade crescente: `[data-theme]` → `html.light` → `html:not(.dark)` (comentário em `official-identity.css:266`). No dark, neon é mantido.

Outros overrides light: `.text-brand`→`#0369A1`, `.text-ink-2`→`#475569`, `.vancouver-gradient-text`/`.gradient-text`→`#B45309`, `.vancouver-btn-outline`→`#0369A1` (`official-identity.css:86-107`); `[data-page-accent] .bg-white`→`var(--color-surface)` (`:317-319`).

## 5. Comportamento de tokens por tema

- Todos os tokens `--color-*`/`--palette-*` têm ramos dark e light em `birthhub360.css` (`:9-117` dark base, `:119-186` light, `:188-249` dark explícito).
- Tokens de acento ativo (`--ok-active`, `--warn-active`, `--info-active`, `--critical-active`, `*-active` semânticos) são **redefinidos por tema** em `globals.css` e novamente em `official-identity.css:225-234` (dark: `--ok-active→--color-heading-success` etc.).
- `--on-brand`: dark `#041c32`/`--palette-neon-black`; light override `#f8fafc` (`official-identity.css:24,64,77-78`) — atenção: light `#f8fafc` sobre `--color-interactive-primary #0369A1` mede ~4.6:1 (passa AA, marginal — **verificar** se intencional).

## 6. Acessibilidade e movimento

- `prefers-reduced-motion` respeitado globalmente (`globals.css:1582-1598`, `official-identity.css:212-219`, `MotionConfig reducedMotion="user"` em `src/App.tsx`).
- Transições de tema **não** são animadas (troca é instantânea via classe) — **NÃO VERIFICADO** se há transição de cores proposital; não encontrada.

## 7. Pendências

1. `meta[name=theme-color]` não é atualizado em runtime por `ThemeContext` (verificar) — a meta fica `#F4F7FB` mesmo em dark.
2. `#F4F7FB` vs `#F8FAFC` como canvas light — decisão humana pendente.
3. Divergência `--color-warning`: `#FFC107` (canônico) vs `#f59e0b` (`globals.css @theme:789`) — **CONFLITANTE**, verificar precedência.
4. Possível duplicação de controle de tema no `AppTopbar` + `ThemeToggle`.
