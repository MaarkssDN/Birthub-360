De: 03 (design/a11y — 03C/03E)
Para: 13 (dono de src/features/characters/**; 00 decide se outro agente assume)
Onda: 1
Status: aberto
Prioridade: alto
Bloqueador-ref: A3 do plano `.agents/runs/onda-1-birthub-experience-360-plano.md`; achado 4 de `.agents/runs/14-inventario-visual-app-20261119.md`
Sprint destino: Onda 1

## Problema
O H1 "29 Personagens Oficiais" de `/app/characters` no tema claro mede 1,52:1 (cor `rgb(255,193,7)` sobre `rgb(244,247,251)`; texto grande, mínimo 3:1). Reproduzido em 2026-11-19 no HEAD e91c0ae48 (main) com medição própria de `getComputedStyle().color` vs fundo efetivo; o axe não reporta (cor indeterminada). No tema escuro o neon dourado passa.

## Arquivo(s) envolvido(s)
`src/features/characters/CharacterGalleryView.tsx` linha ~206: `style={{ color: 'var(--warn)', fontFamily: 'Sora, sans-serif' }}`.

## Evidência
Medição antes (light): H1 `rgb(255, 193, 7)`, razão 1,52, large=true, mínimo 3. `--warn` vale `#ffc107` nos DOIS temas (globals.css), portanto não é corrigível por CSS no design system: o `style` inline vence qualquer regra de folha sem `!important` (removido por 0a6015a9f) e o 03 não edita arquivo de feature de outro dono (AGENTS.md §16).

## Alteração necessária
Trocar `color: 'var(--warn)'` por `color: 'var(--title-color-gold)'` (token existente em globals.css: `#b45309` no claro = ~4,7:1 sobre `#F4F7FB`; `#ffc107` no escuro, inalterado). Opcional equivalente: remover o `style.color` e usar a classe `text-gold`/`neon-title-gold`, que já resolve para `--title-color-gold`.

## Teste esperado
`/app/characters` no tema claro: H1 com razão >= 3:1 (esperado ~4,7:1); tema escuro inalterado (#ffc107). `accessibility.spec.ts` continua verde. Baseline visual de `/app/characters` (claro) muda; o 08 deve regenerar pelo fluxo próprio.

## Contexto adicional
Os `<h3>` com `color` inline por personagem (Orbit, Nexus, ...) também ficam abaixo de 4,5:1 sobre fundo claro na medição própria (ex.: Beacon 1,25:1), mas o axe não os reporta e não fazem parte da Onda 1; avaliar com o 03 numa rodada própria (decisão de produto: cores de identidade dos personagens).
