- De: 01 — Plataforma, Segurança e Dados
- Para: 02 — Produto e UX
- Onda: landing-360-auditoria
- Status: aberto (aguarda aceite do 02)
- Prioridade: alta (desbloqueia o hang do E2E no Release; CSS de produção da landing)

## Problema

A sticky bar de conversão (`.b360-sticky-bar`) em `LandingConversionV5.css`
estava com `z-index: 999`. No E2E da landing (Chrome Desktop 1280×720, e
igualmente no mobile) ela cobria o botão "Fechar" do diálogo dos pilares
(`role="dialog"`, Tailwind `z-50`) e a suíte esgotava o timeout de 60s ×
retries até cancelar o application gate após 2h.

O CSS da landing é domínio do Agente 02. O 01 ajustou o mínimo necessário
no PR #237 (`agente-01/fix-e2e-hang`) para destravar o Release e pede
aceite formal desta mudança.

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/LandingConversionV5.css` (alteração)
- `src/features/landing/pages/Landing360.tsx` (consumidor — não alterado)
- `src/features/landing/pages/Landing360.css` (`.btn-floating-top`, z-index 90 — não alterado)
- `tests/unit/features/landing/Landing360.test.tsx` (teste do hide/show)

## Alteração já feita (diff resumido)

1. `.b360-sticky-bar { z-index: 999 → 40 }`.
   Motivo: o modal real dos pilares usa Tailwind `z-50` (50). O backdrop
   legado `.b360-dialog-backdrop` é 100, mas não é o que o E2E abre. 40
   fica abaixo do diálogo; subir a barra acima do "voltar ao topo" (90)
   a colocaria de novo por cima do modal (50 < 90) e reabriria o hang.
2. `body:has([role="dialog"]) .b360-sticky-bar { display: none }` —
   proteção principal: a barra some com qualquer diálogo aberto e
   reaparece ao fechar (o nó permanece no DOM; só o CSS oculta).
3. `body:has(.b360-sticky-bar) .btn-floating-top { bottom: 5.5rem }` —
   no mobile (e em qualquer viewport) a pílula do CTA e o botão 52px
   (`bottom/right: 1.75rem`) compartilham a base da tela. Com 40 < 90 o
   botão cobriria o CTA. Em vez de subir o z-index da sticky, o botão
   flutua acima da faixa da barra (~20px offset + altura + folga) e os
   dois permanecem clicáveis. `.btn-floating-top` em si não teve o
   z-index alterado (continua 90, abaixo da navbar 100).

Avaliação do 01 sobre o mobile: `z-index: 40` sozinho **não** cobre o CTA
quando o "voltar ao topo" está visível (ambos disparam em `scrollY > 400`
na intro). A correção é geométrica (offset do botão), não de empilhamento,
para não competir com o diálogo `z-50`.

## O que precisa de aceite do 02

- Confirmar que `z-index: 40` + `display: none` com `[role="dialog"]`
  aberto é o empilhamento desejado da sticky em produção.
- Confirmar o offset do "voltar ao topo" (`bottom: 5.5rem`) enquanto a
  sticky estiver visível, inclusive no mobile, para o CTA não ficar
  coberto.
- Se o 02 preferir outro arranjo (ex.: inset/max-width da pílula no
  mobile, ou esconder o botão enquanto a barra aparece), pode suceder
  este ajuste em PR próprio — desde que a sticky **não** volte a
  ficar acima de `z-50` nem deixe de ser ocultada com diálogo aberto.

## Teste esperado

- Unitário já no PR: `Landing360.test.tsx` — após rolagem a sticky
  aparece; com o diálogo do pilar "Hub comercial" aberto,
  `getComputedStyle(.b360-sticky-bar).display === 'none'`; ao fechar,
  a barra volta a ser visível.
- Visual / manual no mobile: com `scrollY > 400` na intro, o CTA
  "Agendar Demonstração Gratuita" e o "voltar ao topo" não se sobrepõem;
  com um pilar aberto, a sticky não intercepta o "Fechar".

## Contexto adicional

- PR #237, branch `agente-01/fix-e2e-hang`. Pedido do Agente 24 no
  parecer APROVADO CONDICIONADO @ 57bd3af.
- O 01 não alterou o JSX da landing (`Landing360.tsx`) nem o CSS do
  `.btn-floating-top` em `Landing360.css` — só o CSS da sticky e o
  offset condicional do botão a partir de `LandingConversionV5.css`.
