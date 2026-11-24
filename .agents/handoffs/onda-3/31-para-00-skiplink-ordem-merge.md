# Handoff — Adoção do SkipLink: ordem de merge e pendência de renderização

- De: 31 — Noa (App Shell, Navegação e Layout)
- Para: 00 — Coordenador
- Cc: 34 — Ari (Acessibilidade), 30 — Produto/UX (dono formal de `src/components/layout/**`)
- Onda: 3
- Status: aberto
- Prioridade: alto
- Bloqueador-ref: handoff `34-para-30-skiplink-adocao-layout.md` (branch `agente/34-accessibility-onda3`)
- Sprint destino: Onda 3

## Problema

O Agente 34 entregou `src/components/a11y/SkipLink.tsx` na branch
`agente/34-accessibility-onda3`, ainda NÃO mergeada na baseline da Onda 3
(`32d07c375`). Nesta branch (`agente/31-app-shell-onda3`) o arquivo
`src/components/a11y/SkipLink.tsx` não existe — confirmado por `ls src/components/a11y`
(diretório ausente) e por `git show` da branch do 34.

Conforme instrução da missão (opção P3 — menor risco de conflito de merge), o Agente 31
NÃO duplicou o componente e NÃO importou um módulo inexistente (o que quebraria
`tsc --noEmit` nesta branch). Foi feita somente a parte do shell sob sua propriedade.

## O que já foi feito (branch `agente/31-app-shell-onda3`)

`src/components/layout/MainLayout.tsx` — `<main>` agora declara
`id="main-content"` e `tabIndex={-1}` (alvo declarativo do SkipLink, WCAG 2.4.1/2.4.3).
Nenhuma outra alteração necessária quando o componente chegar.

## Alteração pendente (após merge da branch do 34)

1. Renderizar `<SkipLink />` (import de `../../a11y/SkipLink.js` ou barrel
   `../a11y/index.js`, conforme o 34 exportar) como PRIMEIRO elemento focável do shell,
   antes de `<OfflineBanner />` no container raiz de `MainLayout.tsx` — ou no topo de
   `AppLayout`/`App.tsx`, decidido pelo dono da superfície. Um skip link por página;
   telas públicas (landing/login) ficam a critério de cada superfície (o componente
   aceita `targetId`).
2. O `targetId` padrão (`'main-content'`) já bate com o `id` adicionado — nenhuma
   configuração extra é necessária.

## Ordem de merge sugerida

- Preferível: merge de `agente/34-accessibility-onda3` ANTES ou JUNTO da
  `agente/31-app-shell-onda3`. Como as alterações são em arquivos disjuntos
  (`src/components/a11y/**` vs `src/components/layout/**`), não há conflito de merge
  em nenhum dos dois sentidos — a pendência é apenas funcional: sem o merge do 34,
  o skip link não existe na UI; com o merge do 34 sem a renderização no MainLayout,
  o componente fica órfão (não renderizado).
- Quem renderizar o `<SkipLink />` após o merge deve ser o dono vigente de
  `src/components/layout/**` (matriz: 31; AGENTS.md local da pasta: 02 — divergência
  já escalada pelo próprio handoff do 34 ao 30).

## Teste esperado

- Tab na primeira tela autenticada foca o SkipLink; Enter move foco para
  `document.getElementById('main-content')` (o `tabIndex={-1}` já está no lugar).
- `axe`/e2e `tests/e2e/accessibility.spec.ts` sem novas violações critical/serious.

## Contexto adicional

- O componente do 34 injeta `tabindex="-1"` como fallback no alvo, mas a declaração
  no JSX (já feita aqui) é o caminho recomendado e não depende de JS.
- `MainLayout.tsx` recebeu também `outline-none` na classe do `<main>` para que o
  foco programático do skip link não desenhe anel de foco em todo o container —
  mesmo padrão de alvos de skip link (o foco visível permanece nos próprios links).
