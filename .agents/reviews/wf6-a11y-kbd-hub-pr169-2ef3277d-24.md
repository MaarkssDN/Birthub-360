# Revisão Independente — Agente 24 — PR #169 (wf6-a11y-kbd hub)

- **SHA:** `2ef3277da821e36b6fe7bd408936d40c9c911b16` (verificado no início e antes da escrita)
- **Base:** main `16dd960f` (head contém main; 0 commits atrás)
- **Veredito:** **BLOQUEADO**

## Escopo
2 arquivos: `src/features/hub/components/CommercialAgentCellPanel.tsx` (+20) e `tests/unit/features/hub/CommercialAgentCellPanel.test.tsx` (+17). Sem package/lockfile, App.tsx, schema ou workflows. Classes CSS mantidas.

## Análise de a11y
- Space: `event.preventDefault()` em `CommercialAgentCellPanel.tsx:327-329` (li) e `:615-617` (playbook). OK, sem rolagem.
- Repetição/aninhados: não há guarda para `event.repeat` nem `event.target === event.currentTarget`. O conteúdo dos itens (`:318-360` e `:607-625`) não tem inputs ou botões aninhados, e a seleção é idempotente; um `<button>` nativo também repete com Enter. Observação, não bloqueante.
- Foco visível: regras globais `:focus-visible` em `src/index.css:4` e `src/styles/elegance.css:647`. OK.
- Nome acessível: derivado do conteúdo textual (nome do agente, `p.id: p.name`). OK, mas o nome do `<li>` é verboso (todo o card).
- **Semântica de lista (bloqueante):** `role="button"` no `<li>` (`:322`) **substitui** o papel `listitem`. O `<ul>` (`:316`) passa a não ter filhos `listitem`, o que viola o ARIA (o papel `list` exige `listitem` como filho; a regra axe `list` falha). A justificativa do `biome-ignore` em `:318` e `:321` ("preserva a semântica de lista") é **factualmente incorreta**: mascara um defeito real de a11y com uma supressão de lint. Correção: manter `<li>` sem role e mover `role="button"`, `tabIndex`, `aria-pressed`, `onClick` e `onKeyDown` para um wrapper `<div>` interno (as classes podem ir para o wrapper, sem mudança visual).
- Playbook (`:607` biome-ignore useSemanticElements): justificativa fraca, pois o conteúdo são `<span>` e um `<button>` com reset de estilo serviria. Aceitável, não bloqueante.

## Sonar 41434672952 — failure
Quality Gate ERROR: `new_reliability_rating` = 3 (C) e `new_coverage` = 78,6%. O bug S9383 em `CommercialAgentCellPanel.tsx:616` é `handleOpenPlaybook(p.id)` sem `void` ou `.catch` em código novo. O risco real é baixo (a função trata o erro internamente em `:161-170`), mas a correção é trivial (`void handleOpenPlaybook(p.id)`). O Sonar não é obrigatório pela §28 nem para WF6 (o enforcement do 00 vale para WF3); registrado como achado a corrigir junto.

## CI @2ef3277d
Release 41434672863 success (application gate job 125251279640): Unit 5538 passed, 1 skipped; AI Resilience 11/11; Integration 738 passed, 2 skipped; Build e smoke success; E2E 108 passed. Visual Regression 41434672955, CodeQL 41434672902, Trivy 41434672994, Dependency Review 41434672874 e Bundle Budget 41434672867: success. Referência main: Release 41433136212 @16dd960f success.

## Bloqueadores (dono: WF6)
1. `role="button"` em `<li>` quebra a semântica de lista; a justificativa do biome-ignore é inválida (`:318`, `:321-322`). Mover para um wrapper interno.
2. Recomendado no mesmo ajuste: `void handleOpenPlaybook(p.id)` em `:616` (Sonar S9383).
