# BIRTH HUB 360° — Design System Specification

> **Versão:** 2.0  
> **Status:** Ativo / Consolidado  
> **Pilar:** Intelligent Business Command Center

---

## 1. Brand DNA & Identidade

O **Birth Hub 360°** é uma plataforma proprietária de alta performance, combinando inteligência de receita, prospecção autônoma, automação multicanal e governança de dados.

### Princípios da Identidade
1. **Intelligent Business Command Center:** A interface deve transmitir autoridade, controle, visão 360° e precisão cirúrgica.
2. **Autoridade & Confiança:** Uso do Azul Marinho Profundo (`#0B132B`) como base estável e sólida.
3. **Foco Estratégico:** Uso do Antique Gold (`#D4AF37`) exclusivamente para ações de alto valor, assinaturas visuais e métricas vitais.
4. **Espaço & Clareza:** Off-white e superfícies translúcidas em camadas para eliminar ruído e manter legibilidade.
5. **Orquestração 360°:** O sistema orbital conecta quatro quadrantes: **DADOS → INTELIGÊNCIA → DECISÃO → EXECUÇÃO**.

---

## 2. Paleta de Cores (Color Tokens)

### 2.1 Cores Fundamentais da Marca
- **Navy (Midnight):** `#0B132B` (Fundo primário de comando, sidebar, cockpit)
- **Gold (Antique Gold):** `#D4AF37` (Ação primária, indicadores-chave, anéis de órbita)
- **Gold Soft (Brand-2):** `#F0D77B` (Realce secundário de gradientes)
- **Off-White (Snow):** `#F8FAFC` (Superfície clara neutra de alto contraste)
- **Pure White:** `#FFFFFF` (Superfícies elevadas, textos em fundos escuros)

### 2.2 Tokens Semânticos de Superfície e Texto
| Token | Modo Claro | Modo Escuro | Função |
| :--- | :--- | :--- | :--- |
| `--bg` | `#F8FAFC` | `#09090B` | Fundo principal da aplicação |
| `--surface` | `#FFFFFF` | `#18181B` | Superfície base para conteúdo |
| `--surface-2` | `#F1F5F9` | `#27272A` | Superfície secundária (chips, inputs preenchidos) |
| `--surface-elevated` | `#FFFFFF` | `#27272A` | Superfície elevada (cards, modais, painéis) |
| `--surface-interactive` | `#F1F5F9` | `#3F3F46` | Estados de hover e foco em controles |
| `--ink` | `#0B132B` | `#FAFAFA` | Texto primário de alto contraste |
| `--ink-2` | `#475569` | `#A1A1AA` | Texto secundário, rótulos e legendas |
| `--line` | `rgba(11,19,43,0.12)` | `rgba(255,255,255,0.10)` | Divisores e bordas estruturais |

### 2.3 Cores do Sistema Orbital e Semântica
- **Dados:** `var(--orbit-blue)` (`#1677FF`)
- **Inteligência:** `var(--iris)` (`#C53678`)
- **Decisão:** `var(--brand)` / `var(--gold)` (`#D4AF37`)
- **Execução:** `var(--ok)` (`#0F9D64`)
- **Alerta / Atenção:** `var(--warn)` (`#FFC500`)
- **Crítico / Risco:** `var(--critical)` (`#D03B3B` recalibrado para WCAG AA)

---

## 3. Tipografia (Typography System)

A tipografia do Birth Hub 360° é intencional e hierárquica:
- **Display & Headlines:** `Sora` (Geométrica, moderna, assertiva).
- **Interface & Dados:** `IBM Plex Mono` (Números tabulares, clareza técnica, precisão de dados).
- **Momentos Editoriais Especiais:** `Playfair Display` (Apenas quando expressamente requerido).

### Escala Tipográfica
| Nível | Família | Tamanho | Peso | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Sora | `clamp(2.5rem, 5vw, 4rem)` | 700 / 800 | Boas-vindas, Landing Hero |
| **H1** | Sora | `clamp(1.625rem, 3.2vw, 2.375rem)` | 700 | Título de Página |
| **H2** | Sora | `clamp(1.35rem, 2.5vw, 1.85rem)` | 600 | Títulos de Seção |
| **H3** | Sora | `clamp(1.15rem, 2vw, 1.5rem)` | 600 | Títulos de Módulos e Cards |
| **H4–H6** | Sora | `0.9rem – 1.25rem` | 600 | Subtítulos e Rótulos Médios |
| **Body** | IBM Plex Mono | `0.9375rem (15px)` | 400 | Texto de Leitura |
| **Body Small** | IBM Plex Mono | `0.8125rem (13px)` | 400 | Textos Auxiliares e Metadados |
| **Label / Caption** | IBM Plex Mono | `0.75rem (12px)` | 500 (Uppercase) | Rótulos de Campos, Badges |
| **Data / Numbers** | IBM Plex Mono | `0.875rem – 2.5rem` | 600 / 700 (Tabular) | Métricas, Moeda, KPIs |

---

## 4. Escala de Espaçamento (Spacing Scale)

Unidade base: `4px`
- `space-1`: 4px (micro-espaçamentos)
- `space-2`: 8px (gap de ícone, padding interno compacto)
- `space-3`: 12px (densidade compacta de tabela/input)
- `space-4`: 16px (espaçamento padrão de grid)
- `space-5`: 20px (padding interno de card padrão)
- `space-6`: 24px (padding generoso)
- `space-8`: 32px (respiro entre blocos e seções)
- `space-12`: 48px (margens de topo de tela/dashboard)
- `space-16`: 64px (hero sections)

---

## 5. Raio de Borda (Radius System)

- `radius-xs`: `4px` (Tags, chips compactos)
- `radius-sm`: `6px` (Pequenos controles, células interativas)
- `radius-md`: `8px` (Itens de navegação da Sidebar)
- `radius-control`: `10px` (Inputs, botões e selects padrão)
- `radius-card`: `12px` (Cards padrão, painéis)
- `radius-card-lg`: `16px` (Bento cards, modais médios)
- `radius-xl`: `20px` / `24px` (Hero cards, modais amplos)
- `radius-pill`: `9999px` (Badges de status, pílulas de navegação)

---

## 6. Sistema de Bordas & Linhas

Bordas devem cumprir papel funcional e estrutural:
- `border-subtle`: `1px solid var(--line)` (Divisores internos de listas e tabelas)
- `border-default`: `1px solid var(--line)` (Perímetro de cards e inputs)
- `border-strong`: `1px solid var(--line-strong)` (Destaques e agrupamentos)
- `border-focus`: `2px solid var(--brand)` (Anel acessível de foco interativo)
- `border-accent`: `1px solid color-mix(in srgb, var(--brand) 35%, transparent)`

---

## 7. Sistema de Sombras e Profundidade (Elevation)

- `shadow-none`: Superfícies no mesmo plano
- `shadow-subtle`: `0 1px 2px rgba(0,0,0,0.04)` (Pequena elevação)
- `shadow-card`: `0 1px 2px rgba(0,0,0,0.04), 0 10px 28px -16px rgba(0,0,0,0.22)`
- `shadow-card-hover`: `0 1px 3px rgba(0,0,0,0.06), 0 18px 40px -18px rgba(0,0,0,0.28)`
- `shadow-floating`: `0 12px 36px -8px rgba(0,0,0,0.30)` (Popovers, dropdowns)
- `shadow-modal`: `0 24px 60px -12px rgba(0,0,0,0.40)` (Diálogos e Sheets)
- `shadow-glow-brand`: `0 0 15px -3px color-mix(in srgb, var(--brand) 30%, transparent)` (Glow ativo em botões/foco, nunca estático persistente)

---

## 8. Sistema de Ícones (Icon System)

- **Biblioteca Oficial:** `Lucide React`
- **Espessura do Traço (`strokeWidth`):** `1.75` padrão
- **Tamanhos Padronizados:**
  - `icon-xs`: `12px` (badges, indicadores em linha)
  - `icon-sm`: `14px` (sub-itens, botões compactos)
  - `icon-md`: `16px` (menus, botões padrão, topbar)
  - `icon-lg`: `20px` (cabeçalhos de cards, métricas)
  - `icon-xl`: `24px` (destaques de módulo, ícones vazios)

---

## 9. Sistema de Botões (Button System)

| Variante | Aparência | Função |
| :--- | :--- | :--- |
| **Primary (Default)** | Fundo Dourado (`bg-brand-active text-on-brand`) | Ação principal da tela |
| **Secondary** | Fundo Elevado (`bg-surface-elevated border-line text-ink`) | Ações de apoio |
| **Tertiary** | Fundo Sutil (`bg-surface-subtle text-ink`) | Ações de baixa proeminência |
| **Outline** | Borda transparente/fina (`border-line text-ink`) | Filtros e cancelamentos |
| **Ghost** | Sem fundo ou borda (`text-ink-2 hover:bg-surface-interactive`) | Ações inline, fechar |
| **Destructive** | Fundo Crítico (`bg-btn-danger text-white`) | Exclusões e cancelamentos críticos |
| **Success** | Fundo Verde (`bg-ok-solid text-white`) | Conexão confirmada, aprovações |
| **Icon / Icon-only** | Quadrado `32px`, `36px` ou `40px` | Ações compactas |
| **Loading State** | `Loader2` animado + `bh-state-loading` | Previne cliques duplos e indica progresso |

---

## 10. Sistema de Formulários e Inputs

- **Altura Padronizada:** `40px` (default), `32px` (sm), `44px` (lg).
- **Sem Jitter:** Não utilizar escalas em hover/focus (`hover:scale` removido).
- **Foco:** `focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25`.
- **Placeholder:** `text-ink-2/75` (sempre legível).
- **Tipografia:** `IBM Plex Mono` para precisão em digitação de dados técnicos e valores.

---

## 11. Sistema de Cards

- **Surface:** Fundo plano, sem sombra (`bg-surface border border-line`).
- **Panel:** Painel de contexto ou agrupamento (`bg-surface-elevated/90`).
- **Metric (KPI):** Destaque numérico com chip de ícone e indicador de tendência.
- **Data:** Card tabular/técnico sem elevações decorativas.
- **Feature:** Card com borda dourada suave e sutil feixe periférico (`BorderBeam`).
- **Floating:** Modais, popovers e gavetas elevadas.

---

## 12. Sistema de Tabelas

- **Cabeçalho:** Fixo (`sticky top-0`), tipografia `.bh-label text-ink-2`, fundo sutil.
- **Linhas:** Transição suave em hover (`hover:bg-surface-interactive/70`).
- **Seleção:** `data-[state=selected]:bg-brand/10` para linhas selecionadas.
- **Alinhamento Numérico:** Sempre alinhado à direita com dígitos tabulares (`tabular-nums font-mono`).

---

## 13. Navegação (Navigation & Command Center)

### Sidebar
- **Fundo:** Midnight Navy (`#0B132B`).
- **Itens Ativos:** Pílula com fundo sutil dourado (`bg-brand/10`), barra de realce lateral esquerda de `2px` (`bg-brand`), ícone e texto em `text-brand`.
- **Itens Inativos:** Ícone e texto em `text-white/45`, hover em `text-white/70`.
- **Sem poluição de cartões:** A navegação é limpa, linear e sem caixas pesadas internas.

### Topbar
- **Composição:** Título da aba ativa, busca rápida com atalho `⌘K`, relógio operacional em tempo real, alternador de tema e som, centro de notificações com contador real e avatar de usuário.

---

## 14. Sistema de Movimento (Motion System)

- **Durations:**
  - `instant`: `100ms` (clique, toggle imediato)
  - `fast`: `150ms` (hover, foco)
  - `normal`: `250ms` (transição de abas, navegação)
  - `slow`: `350ms` (modais, gavetas)
- **Easings:**
  - `ease-standard`: `cubic-bezier(0.4, 0, 0.2, 1)`
  - `ease-enter`: `cubic-bezier(0.22, 1, 0.36, 1)`
  - `ease-exit`: `cubic-bezier(0.4, 0, 1, 1)`
  - `ease-emphasized`: `cubic-bezier(0.16, 1, 0.3, 1)`
- **Acessibilidade:** Suporte completo a `prefers-reduced-motion: reduce`. Todas as rotações e transições contínuas colapsam instantaneamente.

---

## 15. Sistema Orbital (360° Concept)

- Representa a orquestração contínua do negócio.
- Construído em **SVG vetorial e CSS responsivo puro** (sem imagens rasterizadas).
- Quatro nós em eixos cardinais conectados por aros concêntricos dinâmicos:
  1. **Norte:** DADOS (`#1677FF`)
  2. **Leste:** INTELIGÊNCIA (`#C53678`)
  3. **Sul:** DECISÃO (`#D4AF37`)
  4. **Oeste:** EXECUÇÃO (`#0F9D64`)
- Núcleo central com o emblema "B" em relevo nobre.

---

## 16. Inteligência Artificial e Automação

A IA é expressa como **capacidade e precisão**, nunca como decoração espalhafatosa:
- Sem gradientes roxos arbitrários em todas as telas.
- Recomendações contextuais de ação direta.
- Sinais e níveis de confiança mensuráveis.
- Rastro de raciocínio observável e auditável.

---

## 17. Responsividade e Breakpoints

| Breakpoint | Dispositivo | Comportamento da Interface |
| :--- | :--- | :--- |
| `1440px+` | Desktop Amplo | Sidebar completa (220px), grids de 3 ou 4 colunas |
| `1280px` | Laptop | Sidebar 220px, visualização em órbita de alta escala |
| `1024px` | Tablet Landscape | Sidebar recolhida (64px icon-only), Cockpit grid |
| `768px` | Tablet Portrait | Sidebar em drawer off-canvas, métricas em 2 colunas |
| `390px` | Mobile (iOS/Android) | Header compacto, navegação em drawer, lista de destino empilhada |

---

## 18. Acessibilidade (WCAG 2.2 AA)

- **Contraste:** Todas as cores de texto e ícones respeitam o mínimo de `4.5:1` para texto normal e `3.0:1` para elementos gráficos e texto grande.
- **Foco:** Nenhum elemento interativo possui `outline: none` sem um substituto visível de anel de foco.
- **HTML Semântico:** Uso rigoroso de tags semânticas (`<nav>`, `<header>`, `<main>`, `<dialog>`, `<table>`).
- **Touch Target:** Alvos de toque com área mínima de `44x44px` em dispositivos móveis.

