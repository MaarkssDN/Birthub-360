# Handoff — Adoção do SkipLink no shell autenticado

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 30 — Produto, UX, Design System e Marca (coordenador da squad; execução pelo dono de `src/components/layout/**`)
- Onda: 3
- Status: aberto
- Prioridade: alto
- Bloqueador-ref: —
- Sprint destino: Onda 3

## Problema

O app não possui mecanismo de "pular para o conteúdo" (WCAG 2.4.1 Bypass Blocks — nível A,
obrigatório em conformidade AA). Usuários de teclado e leitor de tela precisam tabular por
toda a Sidebar + AppTopbar a cada navegação de página. Auditoria confirmou ausência total:
`grep -rni "skip.to|skiplink|skip-link" src index.html` → nenhum resultado.

## Arquivo(s) envolvido(s)

- `src/components/a11y/SkipLink.tsx` (criado pelo Agente 34 — propriedade dele, pronto para uso)
- `src/components/layout/MainLayout.tsx` — `<main>` na ~L68 precisa de `id="main-content"` e `tabIndex={-1}`
- `src/components/layout/MainLayout.tsx` (ou `src/App.tsx`) — renderizar `<SkipLink />` como primeiro elemento focável do shell

## Evidência

- SkipLink implementado e testado: `src/components/a11y/__tests__/SkipLink.test.tsx` — 6 testes verdes (nome acessível, href, foco no alvo, fallback de tabindex, onClick preventDefault, alvo ausente).
- O componente é autocontido: no clique faz `scrollIntoView()` + `focus({preventScroll:true})` no alvo e grava `#main-content` no histórico. O `tabIndex={-1}` no `<main>` é o caminho recomendado (o componente também injeta o atributo como fallback, mas o correto é declarativo no JSX).
- Conflito de propriedade a resolver pelo coordenador: `.agents/MATRIZ_PROPRIEDADE.md` atribui `src/components/layout/**` ao Agente 31; `src/components/layout/AGENTS.md` local atribui ao Agente 02. Escalado ao 30 para designar o executor.

## Alteração necessária

1. Em `MainLayout.tsx`: adicionar `id="main-content"` e `tabIndex={-1}` ao `<main>` existente (~L68).
2. Renderizar `<SkipLink />` (import de `../a11y/index.js` ou caminho equivalente) como primeiro filho do container raiz do shell, antes de `<OfflineBanner />`/`<Sidebar />`, garantindo que seja o primeiro elemento na ordem de tabulação.
3. Telas fora do shell (login, landing) podem adotar o mesmo componente apontando para o `<main>`/conteúdo delas — decisão do dono de cada superfície; o componente aceita `targetId` customizado.

## Teste esperado

- Teclado: pressionar Tab na primeira tela autenticada foca o SkipLink; Enter/Space move foco para `<main>` (verificar `document.activeElement` no e2e ou teste de integração do shell).
- axe-core (`tests/e2e/accessibility.spec.ts`) sem novas violações `critical`/`serious` nas telas cobertas.
- SkipLink visível apenas quando focado (padrão `sr-only` → `not-sr-only`), com anel `focus-visible:ring-focus-ring`.

## Contexto adicional

- WCAG 2.4.1 é nível A — não há opção de "adiar para backlog" sem registrar exceção de conformidade.
- Nenhum CSS novo necessário: o componente usa utilitários Tailwind já existentes (`sr-only`, `not-sr-only`, tokens `surface-elevated`, `ink`, `focus-ring`).
- NÃO criar segundo skip link em layout aninhado — um por página.
