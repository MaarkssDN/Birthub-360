# Design System — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Design System — Visão Geral
- **Propósito:** Documentar a arquitetura, as fontes de verdade e o fluxo de tokens do Design System do Birth Hub 360°.
- **Escopo:** `identidade-visual/brand-system/04-DESIGN-SYSTEM/` — camada de tokens, foundations e componentes (`src/components/ui/`, `src/components/layout/`).
- **Estado da informação:** CONFIRMADO — verificado em código em 2026-11-19, salvo marcações explícitas `[PROPOSTO]`/`NÃO VERIFICADO`.
- **Data de referência:** 2026-11-19
- **Fontes:** `_FATOS-CANONICOS.md`, `identidade-visual/birthhub360/tokens/birthhub360.css`, `identidade-visual/birthhub360/tokens/characters.css`, `src/styles/globals.css`, `src/styles/official-identity.css`, `src/main.tsx`, `package.json`, `DESIGN.md` (raiz).
- **Documentos relacionados:** `foundations.md`, `design-tokens.md`, `temas.md`, `grids-e-layouts.md`, `componentes.md`, `estados.md`, `especificacoes/*.md`.

---

## 1. O que é

O Design System do Birth Hub 360° é **próprio** — estilo shadcn, mas não é o shadcn/ui de biblioteca. Evidências:

- Componentes em `src/components/ui/` (~95 arquivos `.tsx` na raiz da pasta, além de `bento/`, `icons/`, `__tests__/`) montados com `class-variance-authority` (cva) + `cn()` (`src/lib/utils.js`).
- Única dependência Radix direta em primitives é `@radix-ui/react-slot` (`package.json:133`, usado em `Button.tsx:4`).
- `Dialog`/`Drawer` usam `@radix-ui/react-dialog` (`src/components/ui/Dialog.tsx:1`, `src/components/ui/Drawer.tsx:1`); `BottomSheet` usa `vaul` (`src/components/ui/BottomSheet.tsx:13`).
- Catálogo de 30 componentes oficiais em `DESIGN.md` (seção "Catálogo de Componentes Oficiais").
- Storybook existe apenas para 3 componentes (`Badge.stories.tsx`, `Button.stories.tsx`, `Card.stories.tsx`, `Input.stories.tsx` em `src/components/ui/`); o catálogo vivo é a rota `/design-lab/*` (`src/App.tsx:95-111`, `src/features/design-lab/DesignLabPage.tsx`).

## 2. Stack

| Camada | Tecnologia | Evidência |
|---|---|---|
| CSS framework | Tailwind CSS 4 (CSS-first, `@theme` inline) | `tailwindcss ^4.1.14`, `@tailwindcss/vite ^4.3.5` (`package.json:139-140,361`); `@theme` em `src/styles/globals.css:721` |
| Tokens canônicos | CSS custom properties + JSON/TS machine-readable | `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` |
| Primitivos React | cva + forwardRef + lucide-react | `src/components/ui/Button.tsx`, `Badge.tsx`, `Card.tsx` etc. |
| Motion | Framer Motion 13 + CSS `@theme` keyframes | `framer-motion ^13.1.1` (`package.json:174`); `src/lib/motion.ts` |
| Ícones | `lucide-react` (393 arquivos .tsx importam) | `_FATOS-CANONICOS.md` §13 |
| Gráficos | `echarts` + `recharts` | `package.json:167,203` |

## 3. Fontes de verdade (ordem de precedência para identidade)

1. `identidade-visual/v2/FONTE-DE-VERDADE.md` — decisões pinadas em 2026-11-13.
2. `identidade-visual/README.md` — precedência dos manuais.
3. `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` + `characters.*` — tokens machine-readable oficiais.
4. `src/styles/official-identity.css` — importa os tokens acima (linhas 1-2) e define adapters de compatibilidade.
5. `src/styles/globals.css` — tokens `:root`/`.dark`/`@theme` Tailwind 4 (runtime real).
6. `src/config/brand.ts` — espelho TS da marca.
7. `DESIGN.md` (raiz) — design-schema impeccable, escopo `/app/*` modo Operate.
8. `docs/BrandConstitution.md`, `PRODUCT.md`.

## 4. Como os tokens fluem

```
identidade-visual/birthhub360/tokens/birthhub360.css  (canônico: :root dark, [data-theme="light"], [data-theme="dark"], .bh-card[data-accent])
        │  importado por
        ▼
src/styles/official-identity.css  (linhas 1-2: import birthhub360.css + characters.css;
        │                           linhas 6-61: adapters legados --bg/--ink/--brand → --color-*;
        │                           linhas 62-107: overrides light AA; linhas 264-315: reescrita de
        │                           hex arbitrários no tema claro; linhas 321-486: utilitários oficiais)
        ▼
src/styles/globals.css  (linhas 200-400 :root/:dark runtime; linhas 721-1000 @theme Tailwind 4;
        │                  linhas 1330-1990: classes bh-*, vancouver-*, glass-*, keyframes)
        ▼
src/main.tsx:11-12  →  import './styles/globals.css'; import './styles/official-identity.css';
        ▼
Componentes Tailwind/React em src/components/ui/ e src/components/layout/
```

**Ordem de importação confirmada:** `globals.css` antes de `official-identity.css` (`src/main.tsx:11-12`). `official-identity.css` importa `birthhub360.css` e `characters.css` (linhas 1-2), portanto os tokens canônicos `--color-*` chegam ao `:root` antes dos adapters.

**Camadas de especificidade observadas:**

- `globals.css` define tokens legados `--bg`, `--ink`, `--brand`, `--surface-*` em `:root` (linhas 236-300) e `.dark` (linhas 572-719) — **valores iniciais de fallback que são sobrescritos em runtime** pelos adapters de `official-identity.css:6-61` (ex.: `--bg: var(--color-background)`).
- `globals.css @theme` (linhas 721+) gera utilitários Tailwind (`bg-surface`, `text-ink`, `border-line`, `ring-focus-ring`, `text-h1`…`text-h6`, `animate-*`) a partir desses mesmos tokens — ou seja, as classes utilitárias **já reagem a tema** porque apontam para variáveis que `official-identity.css` sobrescreve.
- Comentários extensos em `globals.css` documentam calibrações WCAG por token (ex.: `--critical`, `--ok-active`, `--info-active`, `--border-input`, `--focus-ring`) — são evidência de conformidade AA, não código morto.

**Dívida conhecida (CONFIRMADO):**

- 2.039 hex literais em 150 arquivos `.tsx` (~26%) e 1.275 classes arbitrárias `[#…]` em 101 arquivos (`_FATOS-CANONICOS.md` §11).
- Mitigação parcial: `official-identity.css:264-315` reescreve `text-[#00D4FF|#FF2D9B|#F59E0B|#8B7DFF|#EF4444]` no tema claro (só texto, só esses 5 hex).
- PR #368 (`agente/00-paleta-oficial-migracao`, migração hex→var() em ~100 arquivos) está OPEN com 5 gates vermelhos e **não integra**; handoff `onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`.

## 5. Versionamento

- Não há versionamento semântico de pacote para o DS (não é publicado como lib). A "versão" do DS é o commit do repositório.
- Documentos de governança versionados: `docs/BrandConstitution.md`, `BIRTHUB360_JORNADAS_OPERACIONAIS.md` v4.0.0, manuais em `identidade-visual/`.
- `identidade-visual/v2/` contém um sistema V2 completo **NÃO HOMOLOGADO** — tratar como proposta avançada, não como fonte de verdade (`_FATOS-CANONICOS.md` §1).
- Mudanças de tokens canônicos exigem atualização coordenada de: `birthhub360.css`/`birthhub360.json`/`birthhub360.ts`, `characters.*` (quando aplicável), `src/config/brand.ts` e `DESIGN.md`.

## 6. Regras de uso [CONFIRMADO via código e tokens]

1. **Cor:** usar tokens `--color-*`/`--palette-*` e utilitários Tailwind derivados; nunca hex novo em componente (`AGENTS.md` de `src/styles/` proíbe "valores mágicos repetidos quando token existir").
2. **Nomenclatura legada:** tokens `--bg`, `--ink`, `--surface`, `--brand`, `--line`, `--ok`, `--critical` etc. existem como **aliases deprecated** em `birthhub360.css:101-116` e como adapters em `official-identity.css:6-61`. Regra documentada nos fatos canônicos: **usar `--color-*` canônicos** em código novo.
3. **Foco:** `outline: 2px solid` + `outline-offset: 3px` (`--color-focus-ring`, `--focus-offset` em `birthhub360.css:87,99`); utilitário `.bh-official-control:focus-visible` em `official-identity.css:200-204`.
4. **Estados interativos:** classes `.bh-state-*` e props `loading`, `soundClick`, `soundHover`, `magnetic`, `shine` nos componentes (ver `estados.md` e `especificacoes/`).
5. **Títulos:** nunca `#000`/`#FFF` puros; usar `bh-heading`/`data-accent` com acentos `cyan|blue|gold|pink|iris|success|danger` (`birthhub360.css:252-276`).

## 7. Divergências e CSS concorrente (CONFIRMADO)

- `src/features/voice-hub/components/design-system/` — segundo mini DS (tokens.ts, ThemeContext, CommandPalette, ErrorBoundary, useReducedMotion).
- `src/features/prospecting/outbound/` — sub-app com design próprio escuro/lime.
- CSS mortos sem import: `src/index.css`, `src/styles/elegance.css`, `src/styles/luxury-tokens.css`.
- Docs obsoletos com paleta navy/gold/Bodoni: `docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md`, `docs/strategy/DESIGN-playbook.md`.
- `.claude/skills/design-system/SKILL.md` parcialmente desatualizada; `.claude/CLAUDE.md` descreve paleta "Strategic Command Center" — **desatualizada**.
