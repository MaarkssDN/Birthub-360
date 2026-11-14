# Registro do Agente 03a — Design System V2.0 + Biblioteca (RASCUNHO, NÃO HOMOLOGADO)

Escopo escrito: apenas `03-design-system/` e `05-biblioteca/`. Nada em `src/`, `globals.css`, landing, login, tokens oficiais ou `shared/core.css` foi alterado. Sem commit nem push.

## Entregas

| Arquivo | Situação |
|---|---|
| `03-design-system/index.html` (+ `docs.css`, `docs.js`, `brand-name.js`) | IMPLEMENTADO, TESTADO em navegador |
| `03-design-system/components.css`, `icons.svg` | IMPLEMENTADO (49 classes `bh-*` distintas; 55 ícones autorados) |
| `03-design-system/tokens/tokens.json`, `tokens.css`, `tokens.contract.json`, `build.mjs`, `README.md` | IMPLEMENTADO, build executado |
| `05-biblioteca/index.html` (+ `lib.css`, `lib.js`) | IMPLEMENTADO, TESTADO em navegador |
| Evidências | `03-design-system/evidencias/`, `05-biblioteca/evidencias/` |

Tokens: **252** (10 confirmado, 8 oficial-existente, 27 herdado-core, 7 herdado-motion, 32 derivado, 168 provisório) após a reconciliação 2. Fichas de componente na documentação: **17** (botões, inputs, formulários, cards, modais, menus, sidebars, navigation rails, tabelas, dashboards, gráficos, estados vazios, loading, feedback, notificações, acessibilidade, temas). Seções demonstrativas na biblioteca: **17**, em Dark, Light e lado a lado (44 painéis = 22 demos x 2 temas).

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `node 03-design-system/tokens/build.mjs` | 223 tokens; core.css verificado: 33 valores idênticos (e nenhuma variável de core.css fora de tokens.json); 102 pares de contraste calculados, 1 não passa (ver restrição abaixo); 15 regiões injetadas no index.html |
| `node e2e.cjs` (Playwright/Chromium, scratchpad; resultado salvo em `05-biblioteca/evidencias/resultados-testes.json`) | **121 checagens, 120 PASS, 1 FAIL** (ver "Não resolvido") |
| `sh .claude/skills/impeccable/scripts/impeccable detect public/design-lab/identidade-v2/03-design-system public/design-lab/identidade-v2/05-biblioteca` | exit 2, 2 achados `flat-type-hierarchy` (falso positivo, ver abaixo). O detector avisa que só rodou regex em .css/.js e que é "undercount". Saída em `evidencias/impeccable-estatico.txt` |
| `impeccable detect http://localhost:8765/design-lab/identidade-v2/03-design-system/index.html` e `.../05-biblioteca/index.html` (varredura da página renderizada) | exit 2. 03: 16 achados; 05: 23 achados. Saídas em `evidencias/impeccable-url-03.txt` e `impeccable-url-05.txt` |

### Achados do impeccable: corrigidos

- `skipped-heading` (h1→h3 no DS; h2→h4 na biblioteca): corrigido (h2 e h3).
- `cramped-padding` em `.swatch-chip`: corrigido (padding).
- `line-length` (~91 caracteres): corrigido (`.lede`, `.prose` 62ch, `.provisional` 66ch).
- `low-contrast` real descoberto antes pelo meu cálculo próprio: tags `DERIVADO` e `CONFIRMADO` em Light (4,25 e 4,46) corrigidas misturando com `--ink`.
- Alvos de toque de 28 a 32px em ponteiro grosseiro: adicionada regra `pointer: coarse` com 44px.
- Overflow horizontal de 32px a 390px (grupo de botões do dashboard): corrigido.

### Achados do impeccable: justificados, NÃO corrigidos

- `nested-cards` (11 no DS, 20 na biblioteca): são as molduras de documentação (`.cspec-preview`, `.demo-stage`, que mostram um componente sobre `--bg` do tema), contendo o card real que está sendo demonstrado. Reduzi o raio da moldura para 6px; o detector continua marcando. Não é padrão de produto: o DS proíbe card dentro de card.
- `dark-glow` (#ff2d9b, #8b7dff, #00d4ff): assinatura neon do Birthub. Os halos são tokens `--glow-*` com deslocamento Y de 4px e usados só em foco do CTA e IA ativa; as amostras da seção "Sombra e glow" mostram o token. Decisão DS-D06 aguarda homologação.
- `low-contrast` 4,3:1 (#6B7690 sobre #0D0D0D): é `--ink-disabled`, texto de controle desabilitado (isento pelo WCAG 1.4.3).
- `monotonous-spacing` (~4px): escala de espaço de 4px é a base documentada; o achado vem das amostras de `--space-1` e de ícones/ajustes finos. Não alterado.
- `repeated-container-text` ("Salvar" 18x): matriz de estados de botão, repetição intencional.
- `straggler` (3), `em-dash-overuse` (213 e 58): advisory. Reduzi os travessões gerados nas tabelas; o texto estático ainda os tem.
- `flat-type-hierarchy` (varredura estática): falso positivo; o regex não resolve `@import` nem `var()`. A varredura da página renderizada não reporta isso. Tamanhos reais: h1 30, h2 24, h3 20, h4 18, corpo 14.

## Verificado em navegador real (Chromium via Playwright)

Desktop 1440x900 e mobile 390x844 (touch), Dark e Light.

- Modal: abre, foco inicial em "Cancelar", Tab e Shift+Tab presos em 7 voltas, Esc fecha, foco volta ao botão, confirmar fecha e dispara toast; modal do painel Light renderiza no tema Light.
- Menu: abre, seta pula item desabilitado, Home, End, typeahead, Esc fecha e devolve foco, Enter ativa item e atualiza leitura.
- Tabela: ordenação por Conta (asc e desc) e por Valor com `aria-sort` e primeira linha conferida; seleção em massa, checkbox mestre indeterminado; filtro sem resultado leva ao estado vazio; loading e erro.
- Formulário: envio vazio mostra resumo com foco e 4 erros com `aria-invalid`; e-mail inválido mostra mensagem acionável; envio válido fica `aria-busy` e termina com toast e formulário limpo.
- Abas (setas, Home/End, pula desabilitada), sidebar (colapsa para 64px, expande para 256px, troca de módulo muda `--module-accent-fill` mas o botão primário permanece rosa), dashboard nos 5 estados (normal, loading, vazio, erro, stale), gráfico por teclado e alternativa em tabela, switch, botão em loading e sucesso, toasts (máximo 3).
- Lado a lado: 22 demos duplicadas em Dark e Light, 0 ids duplicados.
- Contraste de texto (cálculo próprio sobre os estilos computados, com composição de alfa e `color(srgb)`): 0 falhas em biblioteca e DS nas 4 combinações (1440 e 390, Dark e Light); 560 e 510 textos na biblioteca, 1921 e 1891 no DS. Exclui desabilitados, `aria-hidden`, `sr-only`, elementos com opacidade menor que 1 e fundos em gradiente. Medidor ao vivo da biblioteca: 18 pares, 0 reprovados em Dark e em Light.
- Sem overflow horizontal a 390px; fontes Sora, Inter e IBM Plex Mono carregadas; âncoras e arquivos relativos resolvem (5 na biblioteca, 21 no DS); abre também por `file://`; 0 erros de console e de rede.

axe-core: NÃO EXECUTADO (não existe localmente: sem `node_modules` no repo e ausente em `/opt/node-tools`). Substituído pelo cálculo de contraste e pelos testes de teclado acima; isso não cobre as demais regras do axe.

## Não resolvido / NÃO CONCLUÍDO

- **1 falha no teste**: switches (`.bh-switch`) medem 28px de altura em ponteiro grosseiro; adicionei área de toque estendida a 44px por pseudo-elemento (`::before`), que o teste (que mede o elemento) não enxerga. Não verificado com toque real.
- Restrição de contraste conhecida: `--c-pink` Dark (#FF2D9B, da missão) mede 4,40:1 sobre `--surface-3`. Uso de texto rosa nessa superfície está proibido na documentação (DS-D11); o valor não foi alterado.
- Contraste de estados `hover`, `focus` e `active` dos botões: coberto só pelos estados forçados da matriz (incluídos na varredura acima); o `:hover` real do mouse não foi varrido separadamente.
- Não verificado: leitor de tela real, zoom 200%, dispositivo Android, Safari/Firefox, desempenho, glyphs de `font-feature-settings` ("cv05","cv11","ss01") da Inter (declarados, efeito visual não conferido).
- Cabeçalho da biblioteca quebra em duas linhas entre 1000px e 1500px (botão "Reduzir movimento"); o deslocamento do índice lateral fixo usa altura de 56px. Cosmético, não corrigido.
- Reuso: `docs.css` importa `components.css`; `lib.css` importa `docs.css`. Nenhuma dependência externa.

## Decisões e divergências para o 00 (também em `index.html#decisoes`)

- DS-D01 RECONCILIADO pelo 00 (ver seção "Reconciliação 2"): status semânticos oficiais.
- DS-D02 raio dos botões 12px (regra do projeto) versus pílula em DESIGN.md; `.bh-btn--pill` disponível.
- DS-D03 ink #E8EEFF/#0F1A2E (FONTE P-03, C04) versus #F8F9FF/#0B132B de `official-identity`/DESIGN.md.
- DS-D04 Light #F4F7FB e texto neon derivado versus #F8FAFC e acentos #0284C7/#D91B7C/#D97706 do DESIGN.md.
- DS-D05 linhas: `--line` do core e `--line-accent` (azul .22).
- DS-D06 glow com deslocamento Y 4px versus `0 0 24px` do DESIGN.md.
- DS-D07 foco e seleção em azul; CTA em rosa.
- DS-D08 nomes de módulos: confirmados pelo 00: P01, P02, P03, P04, P05, P06, P08, M10. Encontrados em fonte, não confirmados: **P07 Automação & Conectividade** (`characterCatalogPillars.ts` e Mestre V4.10), **M09 Admin (Fundação / Governança)** (Mestre V4.10 MOD-09; DECISOES_PRODUTO cita M09 sem nome), **M11 Social Selling** (Mestre V4.10 MOD-11 e DECISOES_PRODUTO). Nas fontes de código e Mestre, P06 aparece como "IA"/"Inteligência Artificial" e P08 como "Engajamento Comercial" (usei os nomes do 00).
- DS-D09 grafia "Birthub 360°" via `brand-name.js` (único ponto de troca).
- DS-D11 rosa em Dark sobre `--surface-3`.
- DS-D12 Sora em H1 a H6 (spec do projeto) versus Inter em H4 a H6 em `.claude/CLAUDE.md`.
- Proposta de acento por módulo (provisória): P01 dourado, P02 azul, P03 rosa, P04 dourado, P05 íris, P06 íris, P07 azul, P08 rosa, M09 azul, M10 rosa, M11 íris. Com 11 módulos e 4 matizes há repetição por desenho; nome, código e ícone sempre acompanham.

## Reconciliação com 04-motion-system (SUPERADA pela Reconciliação 2: nomes agora são os do motion.css)

Li `04-motion-system/tokens/motion.css` e `motion.contract.json` (existiam ao final). Alinhei os valores operacionais: `--dur-fast` 120ms, `--dur-base` 160ms, `--dur-slow` 200ms, `--ease-standard` cubic-bezier(.4,0,.2,1), e a chave de movimento reduzido para `data-reduce="true"` (a mesma do motion). Valores antigos (140/220/360ms) foram descartados.

Divergências que permanecem (não editei arquivos do outro agente):
- Nomes diferentes para o mesmo valor: meu `--dur-instant` (80ms) = motion `--dur-micro`; meu `--ease-enter` = motion `--ease-out`; meu `--ease-exit` = motion `--ease-in`.
- Mesmos nomes `--dur-fast`, `--dur-base`, `--dur-slow`, `--ease-standard` em ambos os CSS: se os dois forem carregados na mesma página, quem vier depois vence (hoje com valores idênticos). `[data-motion="operational|commercial"]` do motion não é usado por `components.css`; modal e drawer usam 200ms, o teto operacional.
- Motion define níveis Operacional e Comercial; este DS só implementa o Operacional.

## Aprendizados reutilizáveis

- Alias de token que referencia `var()` precisa ser declarado em `[data-theme]`, não só em `:root`, senão congela o tema do root em contêineres de outro tema (por isso sombras e `--focus-ring` estão nos blocos de tema).
- `getComputedStyle` devolve `color-mix()` como `color(srgb ...)`; um verificador de contraste que só entende `rgb()` lê esses fundos como preto e gera falsos positivos.
- Grid de uma coluna com `auto` cresce com o conteúdo `nowrap`; use `minmax(0, 1fr)` em contêineres de demonstração.

## Reconciliação 2 (decisão do 00, 2026-11-13)

Arquivos tocados: só `03-design-system/` e `05-biblioteca/` (`tokens.json`, `build.mjs`, `tokens.css`, `tokens.contract.json`, `components.css`, `docs.css`, `index.html`, `tokens/README.md`, `lib.js`).

### 1. Cores semânticas: DS-D01 RECONCILIADO
Fonte: `identidade-visual/birthhub360/tokens/birthhub360.css` (`--color-success #22C55E`, `--color-warning #FFC107`, `--color-danger #EF4444`, `--color-info #3B82F6`, linhas 57–60 e 88–91). Adotados: success #22C55E, danger #EF4444, warning = dourado #FFC107, info #3B82F6. O token info existe como `--neon-info`/`--c-info`; os componentes mantêm o azul neon para o tom "info" (papel C02 "azul = info/tecnologia"), para não ter dois azuis na interface. Variantes derivadas, só texto em Light: success #15803D, danger #B91C1C, info #1D4ED8 (mesmos valores do brandbook BB-COR-24) e atenção #7A5800 (= `--c-gold`). Removidos os valores provisórios #34D399, #FF9A3D e #FF5C6C.

Contraste recalculado (build, 112 pares; Dark texto/ fill com `--on-neon`): success 8,05:1 sobre surface e 8,53:1 com on-neon; danger 4,87:1 sobre surface e 5,16:1 com on-neon; info 4,99:1 e 5,28:1; warning 11,25:1 e 11,92:1. Light texto sobre surface: success 4,89, danger 6,30, info 6,53, atenção 6,35.
O build reporta 6 pares que NÃO passam 4,5:1 (restrições de uso, documentadas na seção Cores): Dark `--c-pink` sobre surface-3 4,40 (já existia); Dark `--c-danger` sobre surface-2 4,50 (4,497) e surface-3 4,03; Dark `--c-info` sobre surface-3 4,12; Light `--c-success` sobre surface-2 4,46 e surface-3 4,11. Esses valores são oficiais e não foram alterados. Regra: texto desses tons só sobre `--bg` ou `--surface`; em badges o texto é misturado com `--ink` (72% cor) e no botão de sucesso também.
Regressões que o QA pegou e corrigi: botão `danger` em hover/ativo no Light caiu para 4,39:1 (mistura de hover passou de 90% para 95%); botão em estado success no Light 4,15:1 (texto misturado com ink). Após a correção: 0 falhas de contraste de texto na varredura.
Atenção e valor agora compartilham o dourado: diferença só por ícone e texto (já obrigatório).

### 2. Escala tipográfica: DS-D13, duas escalas por nível
Conferido em `02-brandbook/index.html` (linhas BB-TIPO-06/07) e `regras.json`: BB-TIPO-06 (PROVISÓRIA) display 72/76 Sora 800, H1 48/52 700, H2 36/40 700, H3 24/30 600, H4 18/24 600, corpo 16/27 Inter 400, apoio 13/19 500, dados 14/20 Plex Mono 500; BB-TIPO-07 (PROVISÓRIA) prosa 16px mínimo, entrelinha 1,6–1,7. Implementado como `typography.scale-commercial.*` (24 tokens `--text-c-*`, `--lh-c-*`, `--fw-c-*`). A escala operacional (corpo 14px) continua o padrão. Ligação ao nível: `[data-motion="commercial"]` (mesma chave do 04-motion-system) remapeia `--text-*`/`--lh-*`/`--fw-*` para a escala do brandbook; componentes e títulos não mudam. Regra explícita em `tokens.json` (descrição do grupo `typography`), no `tokens/README.md`, em `tokens.css` (comentário do bloco) e no `index.html#tipografia` (duas tabelas, vitrine lado a lado e a regra "prosa a 16px; 14px só em UI de workspace"). O brandbook não define H5/H6: herdam a operacional. Verificado em navegador: em `data-motion="commercial"` h1/h2/h4/corpo = 48/700, 36/700, 18/600, 16/400; vitrine comercial h3 24, corpo 16 com entrelinha 27,2px; operacional h1 30, corpo 14.

### 3. Motion: nomes únicos do 04-motion-system
`tokens.css` agora faz `@import` de `04-motion-system/tokens/motion.css` e não redeclara nenhum token de motion. Renomeados: `--dur-instant` para `--dur-micro`, `--ease-enter` para `--ease-out`, `--ease-exit` para `--ease-in`; `--dur-fast/base/slow` e `--ease-standard` agora são só os do motion.css (120/160/200ms; mesma curva). `build.mjs` verifica 7 valores contra o motion.css e falha se divergirem. Atualizados `components.css`, o `index.html` (seção Motion, DS-D10 RECONCILIADO) e o README; `lib.js` não usava os nomes antigos. Nenhuma ocorrência dos nomes antigos resta (exceto a menção histórica na linha DS-D10). Verificado em navegador: `--dur-micro/fast/base/slow` = 80/120/160/200ms, `--dur-instant`, `--ease-enter` e `--ease-exit` vazios, transição real do botão = 0,12s com `cubic-bezier(.4,0,.2,1)`.

### Resultados da Reconciliação 2
- `node tokens/build.mjs`: 252 tokens; core.css 33 valores idênticos; motion.css 7 valores idênticos; 16 regiões injetadas; 112 pares, 6 não passam (acima).
- `recon-check.cjs` (novo, `03-design-system/evidencias/reconciliacao-testes.json`): 17 de 17 passam (status, textos Light, motion, nomes antigos removidos, escala comercial, vitrine, transição).
- Regressão completa (mesmo e2e de antes): 121 checagens, 120 passam, 1 falha (switch a 28px em ponteiro grosseiro, já registrada). Contraste de texto: 0 falhas nas 4 combinações em biblioteca e DS. Sem overflow a 390px, links resolvem, 0 erros de console.
- impeccable (URL): DS 16 achados e biblioteca 23, os mesmos já justificados (nested-cards, dark-glow, low-contrast de `--ink-disabled`, etc.); nenhum achado novo.
- NÃO CONCLUÍDO / NÃO VERIFICADO: a escala comercial não é aplicada às páginas do DS e da biblioteca (que seguem operacionais); só há vitrine. Screenshots em `evidencias/` não foram regenerados para toda a página após esta mudança (os testes rodaram e sobrescreveram os arquivos de captura da biblioteca e do DS; os de `dashboard-*`/`modal-*` também foram regenerados pelo e2e, não conferidos visualmente um a um). `--c-info` não é usado em nenhum componente. Mistura de 72% com `--ink` em badges é regra derivada do DS (PROVISÓRIA).
