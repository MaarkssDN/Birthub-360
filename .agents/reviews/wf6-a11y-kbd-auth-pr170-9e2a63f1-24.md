# Revisão Independente — Agente 24 — PR #170 (wf6-a11y-kbd auth)

- **SHA:** `9e2a63f1fe9bd1e1017a084eb1f462ed577e3eca` (verificado no início e antes da escrita)
- **Base:** main `16dd960f` (0 commits atrás)
- **Veredito:** **BLOQUEADO**

## Escopo
1 arquivo: `src/features/auth/components/NewLoginScreen.tsx` (+27). Sem package/lockfile, App.tsx, schema ou workflows. Classe `vancouver-quick-card` mantida.

## Auth: puramente apresentacional
Os 3 cards da seção "Acesso rápido & suporte" (`NewLoginScreen.tsx:1209-1226` Ajuda, `:1241-1256` Contato e `:1289-1304` Segurança) recebem apenas `role="button"`, `tabIndex={0}` e um `onKeyDown` que chama `event.currentTarget.click()`, reutilizando os `onClick` **já existentes** (mailto: e `navigate('/privacy')`). Não há mudança em login, redirects pós-auth, tokens, sessão ou formulário. Confirmado: apresentacional.

## Análise de a11y
- Space: `preventDefault` presente. Sem inputs aninhados nos cards 1, 2 e 4 (o `<input>` em ~`:1280` pertence ao card 3, que não foi alterado). Não há guarda para `event.repeat`: segurar Enter dispara vários mailto/navegações. Menor, não bloqueante.
- Foco visível: `.birthhub-auth :focus-visible` (`NewLoginScreen.css:444`) e o global `src/index.css:4`. OK.
- Nome acessível: derivado de `<h3>` e `<p>`. OK.
- A justificativa do biome-ignore (conteúdo de bloco é inválido dentro de `<button>`) é válida para `<div>`/`<h3>` pelo modelo de conteúdo HTML.

## Teste
Não existe suíte de teste para `NewLoginScreen` (há apenas uso em `tests/e2e/helpers.ts`). O PR adiciona **comportamento novo** (ativação por teclado) sem teste. AGENTS.md §32 "Definição global de pronto" (L779: "testes cobrem caminho feliz e falha"), o fluxo de correção (L883: "adicionar ou atualizar testes") e P4 (L77-80: "UI → implementar → executar → verificar") exigem teste. Não é "não aplicável" (§40, L909): o #169 testa o mesmo padrão com Testing Library, então é viável. A ausência é **bloqueante**: um teste mínimo de render com Enter/Espaço nos 3 cards resolve.

## Sonar 41434680594 — failure
`new_coverage` = 0,0% (sem teste). Não é obrigatório para WF6 pela §28; consistente com o bloqueador acima.

## CI @9e2a63f1
Release 41434680739 success (job 125250370804): Unit 5537 passed, 1 skipped; AI Resilience 11/11; Integration 738 passed, 2 skipped; Build e smoke success; E2E 108 passed. Visual Regression 41434680775, CodeQL 41434680769, Trivy 41434680661, Dependency Review 41434680771 e Bundle Budget 41434680827: success.

## Bloqueadores (dono: WF6)
1. Falta teste unitário de ativação por teclado (Enter/Espaço) dos 3 cards (§32 L779; L883).
2. Opcional: ignorar `event.repeat`.
