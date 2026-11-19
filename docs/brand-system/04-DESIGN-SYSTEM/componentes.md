# Especificação do Catálogo de Componentes Oficiais

Estado: CONFIRMADO (código inspecionado em `src/components/ui/` e inventário em `_inventarios/componentes.csv`).  
Total: 130 componentes mapeados. Abaixo, detalhamento exaustivo das 10 famílias canônicas de interface.

---

## 1. Panorama Geral da Base de Componentes

| Métrica | Valor Verificado | Observação |
|---|---|---|
| Total de Componentes `.tsx` | 130 | Em `src/components/{ui,brand,layout,icons,charts}` |
| Uso de `framer-motion` | 39 componentes | Animações declarativas e layout transitions |
| Tratamento de `useReducedMotion` | 18 componentes | Fallbacks estáticos diretos no componente |
| Ocorrência de Hex Hardcoded | 29 componentes | Débito técnico mapeado em `cores-hex-hardcoded.csv` |
| Cobertura de Storybook (`*.stories.tsx`) | 4 componentes | `Badge`, `Button`, `Card`, `Input` |
| Cobertura de Testes Unitários Adjacentes | 7 componentes | Em pastas `__tests__` |

---

## 2. Especificações Canônicas por Família

### 2.1 Ações — Button (`src/components/ui/Button.tsx`)
- **Anatomia:** Elemento flexível interativo com suporte a `asChild` (Radix `Slot`), ícone opcional à esquerda/direita, indicador de progresso `Loader2`, e microinteração `Magnetic`.
- **Classe base:** `bh-official-control inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-semibold tracking-[-0.015em] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-ink-2 disabled:border-transparent active:scale-[0.97]`
- **Variantes (12):**
  - `default` / `primary`: Gradiente de alto contraste azul (`#0369a1` a `#075985` no claro; `#00b4d8` a `#0284c7` no escuro), sombra luminosa, borda superior translúcida.
  - `electric` / `lime` / `brand`: Fundo lime neon (`#D4F434` hover `#C5E826`), texto preto contrastante `#121316`, fonte display bold.
  - `secondary`: Superfície translúcida `bg-surface/90`, borda sutil, hover elevação sutil `scale-[1.01]`.
  - `tertiary`: Fundo neutro `bg-surface`, hover interativo.
  - `success`: Fundo esmeralda (`emerald-600`), texto branco.
  - `destructive`: Gradiente vermelho (`rose-600` a `rose-700`), texto branco.
  - `outline`: Fundo transparente, borda de linha, hover preenchimento.
  - `ghost`: Sem borda, texto secundário `text-ink-2`, hover `bg-surface-2`.
  - `link`: Texto estilizado sublinhado no hover.
  - `cosmic`: Gradiente escuro interestelar com brilho de borda e sombra ciano neon `rgba(0,212,255,0.2)`.
  - `vancouver`: Vidro sutil `bg-surface/40`, borda com acento neon no hover.
- **Tamanhos:** `default` (h-9 px-4), `sm` (h-8 px-3 text-xs), `lg` (h-11 px-6 text-sm), `pill` (h-10 px-6 rounded-full), `pill-sm` (h-8 px-4), `icon` (h-9 w-9), `icon-sm` (h-8 w-8), `icon-lg` (h-11 w-11).
- **Acessibilidade:** Requer `aria-label` obrigatório para variantes `icon*`. Foco por anel duplo acessível. Desabilitação nativa com bloqueio de eventos.

### 2.2 Estruturas & Superfícies — Card (`src/components/ui/Card.tsx`)
- **Anatomia:** Container de densidade de informação com suporte opcional a `BorderBeam`, feixe de holofote cursor (`spotlight`), e skeleton de loading integrado.
- **Variantes (17):**
  - `default`: Fundo de card padrão `bg-surface`, borda sutil `border-line`.
  - `surface`, `panel`, `elevated`: Níveis graduais de elevação e z-index perceptual.
  - `stat`, `metric`, `data`: Otimizados para KPIs, com tipografia tabular mono e espaçamento compacto.
  - `interactive`: Adiciona transição de hover, elevação e glow de borda reativo ao ponteiro.
  - `accent`, `feature`: Destaque com borda acentuada pelo tema do módulo (`--card-accent`).
  - `floating`, `bento`: Composição fluida em grids Bento.
  - `cosmic`, `glass`, `neon`, `organic`: Efeitos estilísticos com glassmorphism e iluminação perimetral.
- **Padding:** `default` (p-6), `sm` (p-4), `lg` (p-8), `none` (p-0).
- **Tokens Utilizados:** `--color-surface`, `--color-border-subtle`, `--shadow-card`, `--shadow-elevated`.

### 2.3 Formulários — Input (`src/components/ui/Input.tsx`) & Textarea (`src/components/ui/Textarea.tsx`)
- **Anatomia do Input:** Campo de texto com estilização semântica, suporte a ícones prefixo/sufixo e indicação de validação com `aria-invalid`.
- **Variantes de Input:**
  - `default`: Fundo escuro/claro contrastante, borda `border-line`, foco com anel ciano neon.
  - `filled`: Preenchimento com superfície secundária `bg-surface-2`.
  - `ghost`: Borda invisível em repouso, visível no foco.
  - `cosmic`: Borda translúcida brilhante para contextos de cockpit executivo.
  - `vancouver`: Efeito vidro fosco translúcido.
- **Tamanhos do Input:** `default` (h-9 py-2 px-3), `sm` (h-8 text-xs), `md` (h-10 text-sm), `lg` (h-12 text-base).
- **Tratamento de Erro:** `aria-invalid={error || props['aria-invalid'] || undefined}`, acionando contorno de perigo `--color-danger`.

### 2.4 Metadados & Tags — Badge (`src/components/ui/Badge.tsx`)
- **Anatomia:** Pílula compacta de identificação de estado, categoria ou entidade com suporte opcional a indicador pontual (`dot: boolean`).
- **Variantes (11):**
  - `default`: Superfície da marca com contraste primário.
  - `secondary`: Cinza sutil para metadados neutros.
  - `destructive` / `danger`: Alerta crítico, vermelho neon `#EF4444`.
  - `outline`: Contorno minimalista sem preenchimento.
  - `success`: Positivo/Sincronizado, verde neon `#22C55E`.
  - `warning`: Alerta morno/pendente, dourado `#FFC107`.
  - `info`: Informativo geral, azul `#3B82F6`.
  - `holographic`, `neon`, `gradient`: Efeitos com gradiente oficial da marca e brilho.
- **Dot Indicator:** Renderiza `<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />`.

### 2.5 Feedback Crítico — Alert (`src/components/ui/Alert.tsx`)
- **Anatomia:** Bloco de aviso proeminente com poço de ícone arredondado (`iconWell`), corpo de mensagem e botão de fechar acessível.
- **Severidades (5):** `success`, `warning`, `error`, `info`, `brand`.
- **Acessibilidade:**
  - `role="alert"` no container raiz para anúncio imediato em leitores de tela.
  - Poço de ícone com `aria-hidden="true"` (evita redundância acústica).
  - Botão de fechar com `aria-label="Fechar alerta"`.

### 2.6 Estados Operacionais — OperationalStateContainer (`src/components/ui/OperationalStateContainer.tsx`)
- **Anatomia:** Controlador de fluxo e ciclo de vida visual de telas, implementando o imperativo dos 4 estados de `DESIGN.md`.
- **Estados (`OperationalStateType`):**
  1. `loading`: Renderiza placeholders de esqueleto no layout correspondente.
  2. `empty`: Renderiza `<EmptyState>` com título, descrição explicativa e ação primária (zero mock).
  3. `error`: Apresenta diagnóstico objetivo, mensagem de falha e acionador `onRetry` sem deslogar o operador.
  4. `stale`: Exibe aviso de sincronização defasada mantendo os dados cacheados na tela com `lastUpdated` timestamp.
  5. `ready`: Renderiza os `children` da aplicação em estado operacional regular.

### 2.7 Zero-State Visual — EmptyState (`src/components/ui/EmptyState.tsx`)
- **Anatomia:** Ilustração ou ícone centralizado, título em `Sora`, texto explicativo em `Inter` e botão de chamada para ação.
- **Respeito a Movimento:** Incorpora `const reduceMotion = useReducedMotion();` desativando animações de revelação flutuantes quando ativado pelo usuário.

### 2.8 Carregamento Esquelético — Skeleton (`src/components/ui/Skeleton.tsx`)
- **Anatomia:** Camadas de representação geométrica que pulsam suavemente (`motion-safe:animate-pulse`), espelhando a anatomia exata de tabelas, cartões e KPIs antes do carregamento.
- **Estilização:** Fundo de superfície elevada `bg-surface-elevated` com cantos arredondados de acordo com o token `--radius-card` ou `--radius-control`.

### 2.9 Diálogos & Modais — Dialog (`src/components/ui/Dialog.tsx`)
- **Anatomia:** Sobreposição modal construída sobre primitivas `@radix-ui/react-dialog`.
- **Composição:** `DialogOverlay` com backdrop blur (`backdrop-blur-sm bg-overlay`), container centralizado com animações `slide-in-from-top` e `fade-in`, cabeçalho semântico e botão de fechamento com tecla `Escape` nativa.
- **Acessibilidade Aprimorada:** Atributo `aria-modal="true"`. Supressão automática de `aria-describedby` vazio quando não há subtítulo, prevenindo referências quebradas na árvore de acessibilidade.

### 2.10 Controles Booleanos — Toggle (`src/components/ui/Toggle.tsx`)
- **Anatomia:** Chave deslizante de ativação com física suave.
- **Respeito a Movimento:** Integração direta com `useReducedMotion()`, alternando estados instantaneamente sem interpolação de física elástica quando a redução de movimento estiver configurada no SO.

---

## 3. Diretrizes de Uso e Antipadronizações

1. **Proibição de Hex Avulso:** Nunca inserir classes utilitárias arbitrárias como `bg-[#121316]` ou `text-[#D4F434]` em componentes novos. Toda cor deve derivar das propriedades de variante ou de tokens `var(--color-*)`.
2. **Consistência de Raios de Borda:** Respeitar rigidamente a escala:
   - Controles, inputs e tags pequenas: `--radius-control` (12px).
   - Cartões, painéis e seções: `--radius-card` (16px).
   - Modais e janelas flutuantes: `--radius-modal` (20px).
   - Botões de ação rápida e tags em pílula: `--radius-pill` (9999px).
3. **Gerenciamento de Estados:** Nenhum módulo de produto deve gerenciar estados de tela via condicionais manuais desconexas. A casca do módulo deve ser envelopada pelo `<OperationalStateContainer>`.
