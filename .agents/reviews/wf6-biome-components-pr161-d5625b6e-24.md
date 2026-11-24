# Parecer 24 — PR #161 (Agente WF6, Biome mecânico: components) — head `d5625b6ecf2f6d418da56f2d118da0a314096ee9`

- Autor: WF6. Auditor: Agente 24. Base: main `2d62f9fa`. Revisão: 2026-11-02 ~05:35 (UTC-3).
- **Veredito: BLOQUEADO** (vinculado exclusivamente ao SHA `d5625b6e`). O mérito não tem P1 nem P2.

## Escopo
2 files changed, 2 insertions(+), 11 deletions(-), regras noUnusedImports, useTemplate e useNodejsImportProtocol. Os arquivos não se sobrepõem aos dos PRs #151, #152, #154, #155, #156 e #157 (verificado com `git diff --name-only`). O `git merge-tree` com o #152 (`5a495b29`) fica **limpo**. Não há schema/migrations, workflows, `.github/**` nem `App.tsx`.

## Mérito
- `TechToolLogo.tsx`: `CompanyBrandIcon` vira bare import (conservador; o componente não tem efeito no load, então é import morto inofensivo, **P3**).
- `Timeline.tsx`: remove o ícone `MessageCircle` (`lucide-react`, `sideEffects: false`), o que não muda a renderização.
- **Visual Regression** (41408869102): a tentativa 1 falhou ("Theme: dark › CRM › laptop") e a **tentativa 2 passou**. A mudança só remove um ícone não renderizado, e a mesma família de falha "CRM" aparece em PRs sem relação (runs 41405426428 em `wf1-format-release-gate` e 41407448644 em `wf2-p3-followup-153`). Classifico como **flaky, sem relação com o PR**.
- Regra geral: um import local com valor removido por inteiro só pode sair quando o mesmo módulo continua importado no arquivo. Comparei os módulos importados na main e no PR, arquivo a arquivo. Os únicos módulos que deixaram de ser importados são type-only, builtins do Node ou pacotes com `"sideEffects": false` (`framer-motion` e `lucide-react`, conferido no `package.json` de cada um). **Nenhum import com efeito colateral sumiu.**
- `useTemplate`: `a + b` e `` `${a}${b}` `` só divergem quando um operando é objeto com `valueOf` diferente de `toString` (ou Symbol). Para strings, number, undefined e null o resultado é idêntico. Todos os operandos aqui são string (ou `JSON.stringify`, `.join`, `.slice` ou `x || ''`).

## Verificação local (clone `/workspace/rv154`)
- `tsc --noEmit`: 0 erros, igual à main (0).
- `biome lint src`: 643 warnings (main 645), sem erros novos.
- Testes unitários relacionados: `components/ui`: 22 arquivos, 96 passaram e 1 skipped. `vite build` ok.

## CI no head `d5625b6e`
- Frontend Bundle Budget: success (run 41408869070)
- Security - Trivy: success (run 41408869054)
- Security - CodeQL: success (run 41408869051)
- Central Birth Hub 360 Release: failure (run 41408869057)
- Security - Dependency Review: success (run 41408869064)
- SonarQube Analysis: failure (run 41408869065)
- Visual Regression Tests: success (run 41408869102)
- O Release falha em "Run Prettier check" com **4 erros herdados** da main (`AIPendingActionsInbox.tsx`, `aiPendingAction.service.ts`, `agentCapabilities.normalized.json` e `semanticCache.ts`), que são os mesmos da main (run 41406269451) e são corrigidos pelo #152. Nenhum arquivo deste PR aparece entre as falhas. Por isso Type Check, Unit, Integration, Build e E2E ficaram **skipped**.

## Decisão (AGENTS.md)
§40: "teste obrigatório não executado [...] não equivalem a aprovação; falhas pré-existentes [...] não podem ser anunciadas como gate verde". §30: "Nunca declarar um teste como aprovado se ele não foi executado." Os testes obrigatórios não rodaram na CI neste SHA, então o veredito é **BLOQUEADO**.

## O que desbloqueia
Main verde (merge do #152, e do #154 ou equivalente para o teste `commercialV3.routes.test.ts:79`), depois merge da main neste branch (sem rebase/force-push) e Release com Unit, Integration, Build e E2E verdes no novo SHA. Depois disso, emito novo parecer. Qualquer commit novo invalida este parecer.

