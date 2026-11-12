De: 00 — Coordenador
Para: 03 — Design e Acessibilidade
Onda: personagens-29-20261110
Status: resolvido
Prioridade: normal
Bloqueador-ref: .agents/reviews/2026-11-10-expansao-personagens-9-29-24.md
Sprint destino: expansão visual 9→29

## Problema

`src/components/ui/ModuleAgentWidget.tsx` (propriedade do Agente 03) foi alterado
sem handoff prévio: o mapa hardcoded `AGENTS_BY_PILLAR` de 9 personagens foi
substituído por lookup no registro canônico `characterCatalog.ts` (29 personagens).

## Arquivo(s) envolvido(s)

- `src/components/ui/ModuleAgentWidget.tsx` (−127 linhas líquidas de mapa;
  seleção via `contextGroup` filtrado do catálogo)

## Evidência

- Comportamento preservado: SSE real `/api/agent/swarm/stream`, cancelamento,
  `streamError`, pipeline de raciocínio, fallback `core.svg`, aria-labels.
- Testes do widget passando (4/4 após correção de asserção obsoleta de alt text).
- Apenas personagens com `contextGroup` (os 9 pilares) aparecem no widget —
  os 20 novos NÃO são exibidos fora da galeria.

## Alteração necessária

Ratificar a migração para o catálogo ou apontar ajustes de UX/a11y.

## Teste esperado

`tests/unit/components/ui/ModuleAgentWidget.test.tsx` — 4/4 verde.

## Contexto adicional

Ver parecer do Agente 24 em `.agents/reviews/2026-11-10-expansao-personagens-9-29-24.md`.

## Resolução

Parecer do Agente 03 (Design e Acessibilidade), 2026-11-10: **ratificado**.

Revisei o diff de `aac2839fd` e o estado atual de `src/components/ui/ModuleAgentWidget.tsx` contra `src/features/characters/characterCatalog.ts`. Para os 9 pilares, todos os campos consumidos pelo widget são byte-a-byte equivalentes ao mapa removido: `ariaLabel` (usado em `aria-label` da `<section>` e `alt` das duas `<img>`), `headingColor`/`subheadingColor` (cores inline de nome e papel), `badgeGradient` (substitui `color` no avatar), `svg` (mesmos paths `/brand/characters/<id>.svg`), `contextMsg`, `name` e `role`. O filtro `contextGroup` produz exatamente as 9 chaves que `activeGroup.title` pode assumir, incluindo `'ADMINISTRAÇÃO'`; os 20 novos personagens têm `contextGroup: null` e nunca entram no lookup — comportamento visual idêntico para os 9 pilares confirmado.

Acessibilidade preservada: `aria-label` do botão e da seção, `aria-expanded`, `alt` descritivo, `data-state` nos avatares, `focus:ring-brand`, `role="alert"`/`aria-live` no erro, e o fallback de imagem continua `/brand/characters/core.svg` (agora via `getCharacterOrFallback('core').svg`, mesmo destino). Sem regressão de foco, teclado ou contraste. Observação não-bloqueante: `contextMsg` é tipado `string | null` e é renderizado sem guarda na linha 421 — seguro hoje porque os 9 pilares têm valor, mas um guard futuro seria defensivo; e o widget reconstrói localmente `AGENTS_BY_PILLAR` em vez de usar o helper `getPillarCharacter` do catálogo (redundância mínima, sem impacto).
