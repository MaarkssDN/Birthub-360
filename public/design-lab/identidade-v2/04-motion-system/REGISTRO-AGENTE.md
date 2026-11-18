# Registro do Agente — Frente 03b Motion System V2.0 (RASCUNHO, não homologado)

## Impeccable
Comando (raiz do repo): `sh .claude/skills/impeccable/scripts/impeccable detect public/design-lab/identidade-v2/04-motion-system`

Rodada 1: 20 anti-patterns (tiny-text/undersized-ui-text 10-11px, cramped-padding em `.stage`/`.tblwrap`,
wide-tracking .06em, skipped-heading h2→h4, marquee `.skel::after` shimmer).
Correções: fontes mínimas 12px, padding 6/12px, tracking .04em, h4→h3, shimmer horizontal trocado por pulso de opacity.
Rodada 2: 0 anti-patterns; 22 advisories `numbered-section-labels` → removidos os rótulos redundantes (a navegação já numera).
Rodada final: `0 anti-patterns found.` Advisories restantes (justificados):
- `codex-grid-background` (`.layer.l1`): grade é a camada de fundo do demo de parallax (profundidade), não decoração de página.
- `bounce-easing` em `tokens/motion.css` `--ease-spring` cubic-bezier(.34,1.56,.64,1): igual a EASE_SPRING_SOFT em src/lib/motion.ts e ao `bounceOut` de characters.json; restrito ao pulso de sucesso único.
- Nota do detector: em `.css` roda só regex; regras de página só no `.html`.

## Playwright (Chromium, file://)
- Console: 0 erros/warnings em reduce do sistema, reduzido simulado, operacional (4 contextos de screenshot incluídos).
- `reducedMotion:'reduce'`: percorridas as seções loading/órbita/neon/personagens/reduzido com sync ligado e personagem em processing: animações infinitas rodando = 0; `.ring` animation-duration 0.001s, iteration 1; transform das entradas `none`, transition 0.12s (fade) ; `--parallax-depth` 0px.
- Reduzido simulado (botão): infinitas 3 → 0 após clique. Painel "Reduzido" da seção 17: 0 loops vs 2 no painel Normal.
- Operacional: tokens medidos 80/120/160/200/200ms; varredura de transition/animation finitas em todos os elementos fora de contêineres fixos Comercial: 0 acima de 200ms (exceto o visualizador de easing, que foi movido para contêiner Comercial por ser amostra de 600ms); `getAnimations()` finitas > 200ms: 0; FLIP Hub→Workspace duração de animação 200ms; pulso neon `none`; parallax 0px.
- Comercial: pulso `ping` com iteration-count 3 (não infinito); parallax 24px, camadas transformaram com mouse (-6/-15/-28px); SVG do personagem carrega.
- Loops fora da viewport: no carregamento inicial (seções de loading fora da tela) 0 infinitas em "running" (pausadas por `.offscreen`).
- Sem overflow horizontal em 1440 e 390.
- Screenshots em `evidencias/`: motion-desktop-1440-{dark,light}.png, motion-mobile-390-{dark,light}.png, secao-personagens-dark.png (capturados em reduzido).

## Divergências
Ver seção 21 da página e `tokens/README.md`. 03-design-system/tokens estava vazio: reconciliação pendente.
