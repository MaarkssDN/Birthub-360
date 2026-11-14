# Birthub 360° — Design System V2.0 (PROPOSTA)

**Status:** PENDENTE DE HOMOLOGAÇÃO — documento de proposta da Frente 03 da
DEM-20261113-004. Não altera a plataforma real nem os tokens atuais.

**Fontes canônicas:** `../FONTE-DE-VERDADE.md` (decisões pinadas),
`../../DESIGN.md` (paleta AA, gradientes, trinca tipográfica, 30 componentes),
`docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` (especificação detalhada),
`src/styles/official-identity.css` + `identidade-visual/birthhub360/tokens/`
(tokens em produção), `src/lib/motion.ts` (motion em produção).

**Modo do produto:** Operate (command center 360°, alta densidade executiva,
WCAG 2.2 AA inegociável). Superfícies comerciais (landing/login) pertencem ao
nível **Comercial** do Motion System — ver `04-motion/`.

---

## 1. Princípios

1. **Neon com disciplina.** A paleta Neon Oficial (`#00D4FF` azul, `#FF2D9B`
   rosa, `#FFC107` dourado, `#8B7DFF` íris) é fixa: nunca neutralizar, nunca
   pastelizar. Neon aparece em marca, glow, CTAs e detalhes — superfícies de
   trabalho permanecem escuras/neutras para legibilidade operacional.
2. **Um sistema, onze módulos.** Hub Central + Workspaces Modulares +
   Assistentes Globais compartilham 100% dos tokens; a identidade contextual
   vem de UM accent token por módulo (§9), nunca de paletas paralelas.
3. **AA inegociável.** Texto nunca branco/preto puro sobre neon: usar
   `--color-on-brand`. Rampas semânticas light adaptadas (`#0284C7`, `#D91B7C`,
   `#D97706`, `#7C3AED`) conforme DESIGN.md.
4. **4 estados obrigatórios.** Todo painel/lista implementa Loading (skeleton
   no formato exato), Empty (zero-state com CTA), Error (causa + retry) e
   Stale (timestamp da última sync com dados em cache) — padronizado em
   `<OperationalStateContainer>`.
5. **Movimento com propósito.** Dois níveis (Comercial/Operacional), easings
   nomeados, `prefers-reduced-motion` obrigatório. Detalhes em `04-motion/`.

---

## 2. Tokens

Arquivos: `tokens/birthhub360-v2.json` (W3C DTCG) e
`tokens/birthhub360-v2.css` (custom properties). Nomenclatura idêntica à
canônica atual — ver `tokens/README.md` para reconciliação e adoção futura.

### 2.1 Cores

**Paleta de marca (FIXA):**

| Token | Hex | Papel |
|---|---|---|
| `--palette-neon-blue` | `#00D4FF` | marca primária, halos, CTAs frios |
| `--palette-neon-pink` | `#FF2D9B` | energia, conversão, gradientes |
| `--palette-neon-gold` | `#FFC107` | métricas, metas, avisos, elemento 360° |
| `--palette-iris` | `#8B7DFF` | IA, copiloto, agentes |
| `--palette-neon-black` | `#0D0D0D` | fundo canônico dark |
| `--palette-neon-white` | `#F8F9FF` | texto primário dark |
| `--palette-neon-card` | `#14141A` | superfície de cards dark |

**Camada semântica (rampas AA por tema):** `--color-background`,
`--color-surface`, `--color-surface-elevated`, `--color-surface-hover`,
`--color-text-primary/-secondary/-muted`, `--color-border/-subtle/-strong`,
`--color-brand-primary/-secondary/-accent`, `--color-interactive-*`,
`--color-focus`, `--color-on-brand`, `--color-success/-warning/-danger/-info/-iris`,
`--color-heading-*` (variantes derivadas da paleta para títulos).

Valores dark e light completos no CSS/JSON — copiados de
`birthhub360.json semantics.*` (fonte homologada).

### 2.2 Gradientes e glows de assinatura

- `--grad-brand`: `linear-gradient(135deg, #00D4FF→#FF2D9B→#FFC107)` — títulos/hero.
- `--grad-cta`: `linear-gradient(135deg, #FF2D9B→#00D4FF)` — fundo de CTA primário.
- `--grad-orbit`: anel cônico 360° (`conic-gradient`) — elemento orbital.
- `--grad-vancouver`, `--grad-cyan-pink`, `--grad-gold`, `--grad-glow`.
- Glows: `--glow-blue/-pink/-gold/-iris` = `0 0 24px rgba(...,0.45)`.

**Regra:** glow máximo `0.45` alpha; nunca glow em texto corrido; nunca glow
em mais de um elemento por viewport no nível Operacional.

### 2.3 Tipografia

Trinca fixada (FONTE §4):

| Família | Token | Uso | Regras |
|---|---|---|---|
| **Sora** | `--font-display` | display, títulos H1–H6, heros, botões de ação, números comerciais | pesos 400/600/700/800; tracking `-0.02em` |
| **Inter** | `--font-interface` | interface densa: menus, tabelas, modais, formulários | `font-feature-settings: "cv05","cv11","ss01"`; tracking `-0.012em` |
| **IBM Plex Mono** | `--font-data` | dados, métricas, logs, código, KPIs | sempre `font-variant-numeric: tabular-nums` em colunas numéricas |

Escala `--text-2xs`…`--text-6xl` (11px–72px) e leading `--leading-*`
documentados nos tokens. Títulos de módulo usam `--color-heading-*`
conforme a semântica da seção; nunca gradiente em corpo de texto.

### 2.4 Espaçamento, grid, breakpoints, containers

- **Escala 4px:** `--space-1` (4px) → `--space-10` (128px). Telas operacionais
  usam predominantemente `--space-2`…`--space-6`.
- **Grid:** 12 colunas, gutter `--space-4` (16px). Cards de KPI: 3–4 por
  linha em desktop; 1–2 em mobile.
- **Breakpoints:** sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536.
- **Containers:** `--container-sm`…`--container-2xl`; conteúdo operacional
  máximo `--container-xl`, páginas editoriais `--container-2xl`.

### 2.5 Raios, sombras, bordas

- Raios: `--radius-control` 12px (inputs/controles), `--radius-card` 16px,
  `--radius-modal` 20px, `--radius-pill` 9999px, `--radius-xs` 6px,
  `--radius-sm` 8px. **Sem raio global de botão** — `radius-control` para
  retangulares, `radius-pill` só nas variantes pill oficiais.
- Sombras: `--shadow-card` (flat operacional), `--shadow-elevated` (modais/
  popovers), `--shadow-overlay`. Cards operacionais preferem **borda sutil**
  a sombra — profundidade vem de `--color-border-subtle` + elevação pontual.
- Focus: `outline: 2px solid var(--color-focus)` + `--focus-shadow` +
  `outline-offset: 3px` em inputs.

### 2.6 Motion tokens básicos

`--duration-instant/fast/normal/slow/gentle/ambient` e
`--ease-standard/enter/exit/emphasized`. Conjunto completo e variantes
Comercial/Operacional em `../04-motion/motion-tokens.*`. Em
`prefers-reduced-motion` ou `data-motion="reduced"` todas as durações = 0.

---

## 3. Arquitetura de componentes

Catálogo real (~30 componentes) mapeado de `DESIGN.md` §61 e
`BirthHub360-DesignSystem-Bible.html`. Protótipo navegável de referência:
`../05-componentes/biblioteca.html`.

### 3.1 Marca & ícones
Logo horizontal/emblema oficiais (assets preservados, não redesenhar);
ícones de pilar e brand icons 24×24 traço redondo; tamanhos
`icon-xs` 12 / `sm` 14 / `md` 16 / `lg` 20 / `xl` 24.

### 3.2 Ações (Button system)
Variantes: **Primary** (CTA neon `--grad-cta`, texto `--color-on-brand`),
**Secondary** (surface elevada + borda), **Tertiary** (sutil), **Outline**,
**Ghost**, **Destructive** (`--color-btn-danger-bg`), **Success**,
**Icon/Icon-only** (32/36/40px), **Pill** (`--radius-pill`).
Estados: hover (`brightness(1.1)` oficial — sem nova cor), active (scale
0.97), disabled (opacity + `cursor:not-allowed`), **loading** (spinner +
`aria-busy`, bloqueia clique duplo). Alturas 32/40/44px; **sem jitter**
(nunca `scale` em hover de input).

### 3.3 Formulários
`Input`/`CyberInput` (altura 40 default, `--color-input-bg`, borda
`--color-input-border`, focus ring `--color-focus`), `Textarea`, `Select`,
`Switch`, `Slider`, `DatePicker`. Placeholder `--color-text-secondary` a 75%.
Erro: borda `--color-danger` + mensagem `--color-heading-danger` + ícone —
nunca cor sozinha (WCAG 1.4.1). Sucesso: `--color-success`.

### 3.4 Navegação
- **Sidebar** (workspace): fundo elevado, item ativo = pílula
  `--module-accent-soft` + barra lateral 2px `--module-accent` + texto
  accent; inativo `--color-text-muted`, hover `--color-text-secondary`.
  Sem cartões internos.
- **Navigation rail** (rail compacto 64–72px, ícones + tooltip) para
  workspaces densos; colapsa para rail em < lg.
- **Topbar:** título da aba, `⌘K` command palette, status de sync, tema,
  notificações com contador real, avatar.
- **Tabs / Stepper / Breadcrumbs** com `--radius-control` e estados
  `aria-selected` visíveis.

### 3.5 Dados & métricas
- **BentoMetric/KPI:** número em IBM Plex Mono tabular, chip de ícone,
  tendência com seta + cor semântica + label textual (não só cor).
- **Table:** header sticky, `.bh-label` em text-secondary, hover de linha
  `--color-surface-hover`, seleção `--module-accent-soft`, números
  right-aligned mono.
- **Gráficos:** neon sobre superfície escura; séries usam accent do módulo;
  gridlines `--color-border-subtle`; tooltips com `--shadow-elevated`.
- **Badges:** pill, variantes semânticas (success/warning/danger/info) +
  accent de módulo; mono para contadores.

### 3.6 Feedback & sobreposições
- **Alert:** 4 severidades com ícone + título + ação; nunca auto-dismiss <5s.
- **Dialog/Modal:** `--radius-modal`, `--shadow-overlay`, backdrop
  `--color-overlay`; foco confinado, Esc fecha, retorno de foco.
- **Drawer/Sheet:** slide lateral/direita; `drawerSlideRight`/`Bottom`.
- **Toast/Notificação:** canto superior direito, pilha máx. 3, ação undo
  quando aplicável, `role="status"`/`alert`.
- **Command palette (⌘K):** overlay + lista fuzzy, mono para hints.

### 3.7 Estados (4 obrigatórios)
Loading → skeleton no formato exato do conteúdo (`--color-skeleton-*` +
shimmer desativado em reduced-motion). Empty → ilustração vetorial/orbital
sutil + headline + CTA. Error → causa raiz legível + retry + referência.
Stale → banner "dados de HH:MM" mantendo cache visível.

### 3.8 Temas
Dark canônico (`#0D0D0D`) e Light (`#F4F7FB`) com rampas AA próprias.
Toggle global persiste preferência (`prefers-color-scheme` como default,
`data-theme` explícito vence). Nenhum componente hardcoda cor de tema.

---

## 4. Acessibilidade (WCAG 2.2 AA)

- Contraste: texto ≥4.5:1, texto grande/componentes ≥3:1. Pares validados:
  `#F8F9FF`/`#0D0D0D` (dark), `#0F172A`/`#FFFFFF` (light), accent light só
  nas rampas adaptadas.
- Foco visível sempre: `--color-focus` outline 2px + offset; nunca
  `outline:none` sem substituto.
- Teclado: toda interação alcançável; `focus-visible` distinto de `:focus`;
  skip-link no shell.
- `prefers-reduced-motion`: obrigatório; ver `../04-motion/motion-system.md`.
- Não cor sozinha: estados têm ícone + texto; badges têm label.
- `aria-busy` em loading, `role="alert"` em erros críticos, live regions em
  toasts de dados.
- Touch targets ≥24×24 (WCAG 2.2 AA) / 44px preferencial em mobile.

---

## 5. Identidade contextual por módulo

Mecanismo V2 (proposta — mapeamento **PENDENTE DE HOMOLOGAÇÃO**):

```html
<section data-module="p03" class="workspace">
  <span class="module-accent-text">Receita</span>
  <span class="module-accent-chip">Meta 92%</span>
</section>
```

O atributo injeta `--module-accent`, `--module-accent-ink`,
`--module-accent-glow`, `--module-accent-soft` — derivados **somente** da
paleta fixa e das rampas AA do tema ativo. Superfícies, texto, raios,
tipografia e motion permanecem idênticos entre módulos.

**Proposta inicial de mapeamento** (a homologar): Hub/P01 azul, P02 rosa,
P03 dourado, P04 íris, P05 verde-sucesso, P06 azul-info, P07 dourado,
P08 rosa, M09 íris, M10 azul, M11 rosa. Assistentes globais usam
`--palette-iris` como accent fixo (são IA).

**Anti-padrões proibidos:** 11 paletas, accent em fundos grandes, gradiente
brand em todo o workspace, troca de tipografia por módulo.

---

## 6. Decisões pendentes registradas

| Item | Status |
|---|---|
| Nome oficial "Birthub 360°" vs "Birth Hub 360°" | PENDENTE (FONTE §1) — docs V2 usam "Birthub 360°" |
| Mapeamento módulo→accent (`data-module`) | PENDENTE DE HOMOLOGAÇÃO |
| Adoção dos tokens V2 na plataforma | PENDENTE — fora do escopo desta missão |
| `--color-on-brand` dark = `#0D0D0D` vs `#0B132B` em light | light usa `#FFFFFF` (surface); validar contraste do grad-cta light (rosa→azul com texto branco ≥3:1 — borderline, homologar) |
