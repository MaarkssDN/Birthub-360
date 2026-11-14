# Registro da Frente 02: Brandbook Oficial V2.0 (RASCUNHO, NÃO HOMOLOGADO)

Agente: Frente 02, sob coordenação do Agente 00. Data: 2026-11-13. Escopo de escrita: apenas `public/design-lab/identidade-v2/02-brandbook/`.

## Entrega
- `index.html` (gerado de `_src/*.part` por `_src/montar.mjs`), `brandbook.css`, `brandbook.js`, `regras.json`, `evidencias/`.
- Reprodução: `node _src/montar.mjs` (a partir de 02-brandbook/) regenera `index.html` e `regras.json`. `_src/verificar.cjs` repete a verificação em navegador. Editar só `index.html` desfaz-se na próxima montagem: edite os `.part`.
- 121 regras com ID estável (BB-ID 18, BB-LOGO 16, BB-COR 28, BB-TIPO 16, BB-LING 18, BB-PERS 11, BB-APL 14): 45 CONFIRMADAS, 76 PROVISÓRIAS. `regras.json` traz `id, regra, status, secao, origem`.

## Comandos e resultados
| Comando | Resultado |
|---|---|
| `node _src/montar.mjs` | index.html ok, 119 regras, nenhum ID duplicado, nenhuma macro sem resolver |
| `verificar.cjs` (Chromium, 1440/768/390, dark e light, 6 combinações) | 0 erros de console, 0 requisições com falha, 0 imagens quebradas (81 imgs), 0 âncoras quebradas, 0 IDs duplicados, 0 overflow horizontal (após correção), 29 personagens renderizados, contraste impresso confere com recálculo em runtime (`data-cr-check=ok`, 0 divergências) |
| Interações (Playwright) | filtro: 74 provisórias e 45 confirmadas; troca de grafia atualiza título e 9 pontos de uso; scrollspy marca "Paleta Neon" após o clique; foco visível `outline solid 2px`; `prefers-reduced-motion` reduz a animação do anel a 1e-06s; menu mobile abre com `aria-expanded=true` |
| Arquivos referenciados | nenhum ausente (checagem em disco de src/href relativos) |
| `cmp` entre logos de `assets/logos/` e os mestres | idênticos (3 de 3) |
| `impeccable detect` na pasta (HTML estático, sem CSS) | `evidencias/impeccable-detect-pasta.txt` |
| `impeccable detect` na URL renderizada | `evidencias/impeccable-detect-url.txt` |

## Impeccable: análise
Corrigido por achado real: contraste em placas (`.bd` e `.tc` agora têm fundo fixo, antes seguiam o tema Light e quebravam o texto), cartão dentro de cartão no dashboard (`pd-st`), títulos pulando nível (h3 para h5; os títulos dos protótipos viraram `div.h5`), listras repetidas na área de proteção (trocadas por cor lisa), texto abaixo de 11 px em protótipos (piso subiu para 14 px), `span.nochar` estourando a caixa, overflow do cabeçalho em 390 px (filtro de regras fica oculto abaixo de 640 px).

Achados mantidos e justificados:
- `dark-glow` (3): os três botões de halo da seção "Iluminação e glow" (BB-COR-17). Halo `0 0 24px` a 45% é o token oficial `--glow-*` e o brief pede documentar glow. É o único uso no documento.
- `low-contrast` (18): todos são células deliberadas da matriz de contraste e dos exemplos proibidos (neon sobre Light, branco sobre neon, tinta Dark sobre Light) e a legenda "Cinza médio" do fundo proibido. Existem para mostrar o número. Nenhum texto de leitura real falha.
- `cramped-padding` (29, só na varredura sem CSS): wrappers e tabelas cujas células têm padding próprio (`.tbl`, `.cm-wrap`, `section.ch`), e rótulo posicionado em `.chip`. Falso positivo provável; não revisado um a um.
- `nested-cards` (15, só na URL): quadros de protótipo (kanban, tiles do dashboard, posts) dentro do quadro de dispositivo. São mockups de produto, não cartões do documento. Reduzido (quadro sem raio), não zerado.
- `tiny-text` (27, 11,9 px) e `undersized-ui-text` (12): texto interno de protótipos em quadro estreito, escala por `cqw`. NÃO ELIMINADO: reduz com a largura do quadro; verificar em largura real.
- `line-length` (2) e `straggler` (1): advisory, não tratados.
- Não apareceram: gradient-text, kicker acima de título, side-tab, overused-font (Inter está liberada em `.impeccable/config.json`).
- A assinatura neon (cian sobre escuro, órbita com íris e ciano) é mandato C02 e do logotipo. O detector `ai-color-palette` não disparou nesta página.

## Decisões e divergências (também em #pendencias)
D-01 a D-11 estão no HTML. Destaques para o Agente 00:
1. FONTE-DE-VERDADE.md afirma que Íris #8B7DFF e Light #F4F7FB não existem nas fontes oficiais. Existem em `birthhub360.css` (`--palette-iris`, `--palette-bg`) e no Manual Visual. Já `brand.ts` define `iris` como #FF2D9B.
2. "26 agentes técnicos" só bate com o roster de engenharia (AGENTS.md §3). O enxame de IA é 24 mais Supervisor (CONTRATOS_AGENTES) ou 15 (Documento Mestre V4.1). Cifra a confirmar.
3. Wordmark horizontal falha contraste em Light (1,52 a 3,20:1): placa escura exigida.
4. Gradiente em texto e CTA em gradiente do manual legado foram rejeitados (C04 e constituição).
5. H4 a H6: Sora (Manual Visual) contra Inter (`.claude/CLAUDE.md`).

## Divergências com o Design System (03-design-system/tokens, lido em `tokens.css`)
Lido só o cabeçalho de `tokens.css` e as chaves de `tokens.json`; não houve conferência completa.
- Cores funcionais: DS `--neon-success #34D399`, `--neon-warn #FF9A3D`, `--neon-danger #FF5C6C`; brandbook usa #22C55E, Dourado (atenção) e #EF4444, com variantes Light #15803D/#B91C1C/#1D4ED8.
- Escala tipográfica: DS display-xl 48, h1 30, h2 24, corpo 14; brandbook 72/48/36/24/18, corpo 16 e apoio 13.
- Corpo: DS 14 px; brandbook 16 px (BB-TIPO-07).
Ação sugerida ao Agente 00: reconciliar na matriz de conformidade; este brandbook não foi alterado para seguir o DS.

## NÃO VERIFICADO / NÃO CONCLUÍDO
- Dispositivo real (Android/Capacitor, iOS): só Chromium headless a 390, 768 e 1440.
- Contraste de todo texto renderizado por ferramenta externa: só o detector e minha matriz.
- Screen reader e navegação completa por teclado: só foco visível no primeiro Tab.
- Tamanhos mínimos de logotipo abaixo de 32 px (BB-LOGO-11) e impressão a 12 mm: propostos, não testados.
- Cores de texto dos protótipos no tema Light foram vistas por amostra (fundos e matriz), não todas as seções.
- Contagem de arquivos "27" de grafia e "2" de schema vêm do Agente 00; não recontei.
- Associação de assistentes globais (VoiceCommandWidget, CopilotTrigger, CommandPalette) vem do README do design-lab; não conferi no código.
- Parecer do Agente 24: não solicitado nesta frente (AGENTS.md §40 exige antes de qualquer conclusão).
- Servidor `python3 -m http.server 8791` iniciado para teste continua em segundo plano; deve ser encerrado.

## Rodada 2 (pedido do Agente 00): reconciliação com o Design System
- Tipografia: duas escalas ligadas aos níveis de C08. BB-TIPO-06 e BB-TIPO-07 (Comercial e Leitura: 72/48/36/24/18, corpo 16 px), BB-TIPO-15 (Operacional e Plataforma: valores lidos de `03-design-system/tokens/tokens.json`: display-xl 48, display 36, h1 30, h2 24, h3 20, h4 18, h5 16, h6 14, corpo 14, body-sm 13, caption 12, label 13, data 14, data-lg 24) e BB-TIPO-16 (cada superfície usa uma escala só). BB-TIPO-15 e 16 são PROVISÓRIAS. Tabela da escala Operacional na seção "Escalas e pesos".
- Semânticas: nota no capítulo Paleta e BB-COR-23 declaram sucesso #22C55E, crítico #EF4444, atenção (warning) Dourado #FFC107, informativo #3B82F6, com o DS "sendo alinhado". Na leitura de `tokens.css` o DS ainda declarava #34D399, #FF9A3D e #FF5C6C (registrado em D-12).
- Montagem: `montar.mjs` ordena os IDs na faixa de cada capítulo (BB-TIPO-01 a BB-TIPO-16).
- Revalidação: `verificar.cjs` em Chromium (1440/768/390, dark e light): 0 erros de console, 0 falhas de rede, 0 imagens quebradas, 0 âncoras quebradas, 0 overflow, contraste conferido (`data-cr-check=ok`), filtro 76 provisórias e 45 confirmadas. `impeccable detect`: o `text-overflow` do `span.nochar` sumiu; restam os mesmos achados justificados acima (cramped-padding 30 na varredura sem CSS, dark-glow 3, low-contrast 18, e na URL nested-cards 15, tiny-text 27, undersized-ui-text 12, line-length 3, straggler 1).
- NÃO CONCLUÍDO: tiny-text/undersized-ui-text/nested-cards dos protótipos (seguem abertos); conferência completa do `tokens.json` além das chaves tipográficas e de status; alinhamento do DS às semânticas (é do Agente 00 e do DS); parecer do Agente 24.
