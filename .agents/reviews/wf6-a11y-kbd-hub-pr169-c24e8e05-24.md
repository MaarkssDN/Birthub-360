# Parecer 24 — PR #169 (WF6, a11y teclado, hub)

- **SHA revisado:** c24e8e0566537a1a009f7510a71d2aa298c60d96 (head confirmado via gh no início e antes da escrita)
- **Parecer anterior:** BLOQUEADO em 2ef3277d
- **Veredito: APROVADO** (atualizado em 02/11 10:15 BRT, depois da re-execução do VR; antes estava BLOQUEADO só pelo VR)

## Diff incremental 2ef3277d..c24e8e05 (2 arquivos)
- `src/features/hub/components/CommercialAgentCellPanel.tsx:318`: agora é `<li key className="flex">`, sem role. Assim a árvore expõe list > listitem > button.
- `:319-338`: role=button, tabIndex=0, aria-pressed, onClick e onKeyDown passaram para o `<div>` interno, com as mesmas classes mais `flex-1`. O nome acessível vem do conteúdo (o teste resolve `getByRole('button', { name: /Arquiteto de ICP/ })`). O foco é visível pela regra global `:focus-visible` em `src/index.css:4-7`. Em Enter/Espaço há `preventDefault()` (`:324-327`). O card não tem nenhum controle interativo dentro (só div/p/span/Badge/ícones), então não há botão dentro de botão.
- O `biome-ignore noNoninteractiveElementToInteractiveRole` saiu. O `useSemanticElements` (`:319`) agora tem uma justificativa coerente: há conteúdo de bloco dentro do card.
- `:612` e `:616`: `void handleOpenPlaybook(p.id)` (S9383).
- `tests/unit/features/hub/CommercialAgentCellPanel.test.tsx:234-240`: o teste verifica que o li não tem role, aparece em listitem e contém o button. Local: 6/6.
- Layout: li flex + div flex-1 mantém a altura do card no grid. Nenhuma tela do VR que renderiza o HubScreen falhou.

## Escopo
Só esses 2 arquivos no PR inteiro, sem package.json nem lockfile.

## CI no c24e8e05
- Release **41443584088: success**. Unit 5538 passed / 1 skipped, AI Resilience 11/11, Integration 738 passed / 2 skipped, Build, smoke /health e E2E 108 passed / 1 skipped.
- SonarCloud QG do PR 169: **OK**. new_reliability_rating=1 (A), 0 issues abertas, então o S9383 sumiu. Cobertura nova 81,3%.
- CodeQL, Trivy (gate de PR), Dependency Review, secret scan e Bundle Budget (41443584139) passaram.
- **Visual Regression 41443584143: FAIL.** `visual.spec.ts:74` Theme light › Inteligência [desktop], 250591 px (ratio 0,20), falhou nas duas tentativas. Houve ainda 2 flaky (CRM laptop, Prospecção dark tablet) e 85 passed.
  - A rota `/app/intelligence` renderiza `IntelligenceHub`, que não importa o `CommercialAgentCellPanel`. O único consumidor do painel é `HubScreen.tsx:669`.
  - O VR do head anterior (41434672955) passou.
  - Tudo indica flake sem relação com o PR, mas o check é obrigatório e está vermelho.

## Para liberar
Re-rodar o VR no mesmo SHA. Se ficar verde, vira APROVADO sem nova revisão de código.

## Biome (reivindicação do WF6)
- `biome lint src` dá 0 erros na main 6a4e7b96, no c24e8e05 e no 79f9c257. A main tem 578 warnings.
- `biome format src` dá 0 erros.
- O "1 erro" nos arquivos tocados é o `assist/source/organizeImports` em `NewLoginScreen.tsx:1:1`. Ele aparece no `biome check` e já existe igual na main. **A reivindicação procede.**
- No CommercialAgentCellPanel sobra o warning `noUnusedVariables` em `:70`, que também já existia.

## Atualização: re-execução do VR (02/11, 10:15 BRT)
- O WF6 re-rodou os jobs que falharam no run 41443584143, no mesmo SHA. A **tentativa 2** saiu **success**, no job **125291434649** (Visual Regression).
- Resultado: 87 passed e 1 flaky, que passou no retry: [mobile] dark › Administração - Module Access (`visual.spec.ts:119`), tela sem relação com o PR.
- A tela light › Inteligência [desktop], que tinha falhado na tentativa 1, passou. Isso confirma que a falha anterior era flake e não vinha do PR.
- Head reconfirmado via gh antes da escrita: c24e8e0566537a1a009f7510a71d2aa298c60d96.

**APROVADO** preso ao SHA c24e8e0566537a1a009f7510a71d2aa298c60d96. Se o head mudar, o parecer cai.
