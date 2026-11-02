# Parecer 24 — PR #159 (Agente WF6, Biome mecânico: intelligence) — head `599720a56ffa05623155e04198ba230d1ade4c06`

- Autor: WF6. Auditor: Agente 24. Base: main `2d62f9fa`. Revisão: 2026-11-02 ~05:35 (UTC-3).
- **Veredito: BLOQUEADO** (vinculado exclusivamente ao SHA `599720a5`). O mérito não tem P1 nem P2.

## Escopo
16 files changed, 133 insertions(+), 36 deletions(-), regras noUnusedImports, useTemplate e useNodejsImportProtocol. Os arquivos não se sobrepõem aos dos PRs #151, #152, #154, #155, #156 e #157 (verificado com `git diff --name-only`). O `git merge-tree` com o #152 (`5a495b29`) fica **limpo**. Não há schema/migrations, workflows, `.github/**` nem `App.tsx`.

## Mérito
- **Bare imports** (`logger` em 5 serviços, `prisma` em `learningHeatmap.service.ts`): conservadores, mantêm o carregamento. Ok.
- Os imports removidos são ícones `lucide-react`, subcomponentes de `Card`, `fadeInUp`, `searchLeadsTool`, `UntrustedContentGuard` e `AutonomyLevel`, e o módulo continua importado em cada caso. Também sai o `React` default em `GroqTelemetryPanel.tsx` e `SwarmObservability.tsx`, coberto pelo `jsx: react-jsx` (`tsconfig.json:14`); o tsc está limpo.
- `useTemplate`: `commercialContextBuilder.service.ts` (concatenação de literal com `JSON.stringify`) e `universalOfficeDocsTool.ts` (`.join` e `.slice`). Todos os operandos são string.
- `docs/quality/biome-warnings-backlog.md`: só documentação.
- Regra geral: um import local com valor removido por inteiro só pode sair quando o mesmo módulo continua importado no arquivo. Comparei os módulos importados na main e no PR, arquivo a arquivo. Os únicos módulos que deixaram de ser importados são type-only, builtins do Node ou pacotes com `"sideEffects": false` (`framer-motion` e `lucide-react`, conferido no `package.json` de cada um). **Nenhum import com efeito colateral sumiu.**
- `useTemplate`: `a + b` e `` `${a}${b}` `` só divergem quando um operando é objeto com `valueOf` diferente de `toString` (ou Symbol). Para strings, number, undefined e null o resultado é idêntico. Todos os operandos aqui são string (ou `JSON.stringify`, `.join`, `.slice` ou `x || ''`).

## Verificação local (clone `/workspace/rv154`)
- `tsc --noEmit`: 0 erros, igual à main (0).
- `biome lint src`: 626 warnings (main 645), sem erros novos.
- Testes unitários relacionados: `intelligence`: 150 arquivos, 1180/1181. A única falha é `commercialV3.routes.test.ts` (`expected 400 to be 200`), **herdada da main** e corrigida pelo #154; este PR não toca commercial-v3.

## CI no head `599720a5`
- Security - CodeQL: success (run 41408847199)
- Central Birth Hub 360 Release: failure (run 41408847172)
- Visual Regression Tests: success (run 41408847301)
- Security - Dependency Review: success (run 41408847253)
- Security - Trivy: success (run 41408847210)
- Frontend Bundle Budget: success (run 41408847224)
- SonarQube Analysis: failure (run 41408847288)
- O Release falha em "Run Prettier check" com **4 erros herdados** da main (`AIPendingActionsInbox.tsx`, `aiPendingAction.service.ts`, `agentCapabilities.normalized.json` e `semanticCache.ts`), que são os mesmos da main (run 41406269451) e são corrigidos pelo #152. Nenhum arquivo deste PR aparece entre as falhas. Por isso Type Check, Unit, Integration, Build e E2E ficaram **skipped**.

## Decisão (AGENTS.md)
§40: "teste obrigatório não executado [...] não equivalem a aprovação; falhas pré-existentes [...] não podem ser anunciadas como gate verde". §30: "Nunca declarar um teste como aprovado se ele não foi executado." Os testes obrigatórios não rodaram na CI neste SHA, então o veredito é **BLOQUEADO**.

## O que desbloqueia
Main verde (merge do #152, e do #154 ou equivalente para o teste `commercialV3.routes.test.ts:79`), depois merge da main neste branch (sem rebase/force-push) e Release com Unit, Integration, Build e E2E verdes no novo SHA. Depois disso, emito novo parecer. Qualquer commit novo invalida este parecer.

