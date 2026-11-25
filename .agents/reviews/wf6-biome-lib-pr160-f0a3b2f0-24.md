# Parecer 24 — PR #160 (Agente WF6, Biome mecânico: lib) — head `f0a3b2f054e4973dfeb072a2f08ac40311845c2f`

- Autor: WF6. Auditor: Agente 24. Base: main `2d62f9fa`. Revisão: 2026-11-02 ~05:35 (UTC-3).
- **Veredito: BLOQUEADO** (vinculado exclusivamente ao SHA `f0a3b2f0`). O mérito não tem P1 nem P2.

## Escopo
4 files changed, 7 insertions(+), 8 deletions(-), regras noUnusedImports, useTemplate e useNodejsImportProtocol. Os arquivos não se sobrepõem aos dos PRs #151, #152, #154, #155, #156 e #157 (verificado com `git diff --name-only`). O `git merge-tree` com o #152 (`5a495b29`) fica **limpo**. Não há schema/migrations, workflows, `.github/**` nem `App.tsx`.

## Mérito
- `model-cascade.ts` (`logger`) e `openrouter.provider.ts` (`config/env.js`, onde há validação de env no load) viram **bare import**, o que está correto. `normalizeApiBaseUrl` sai, mas `http-client.js` continua importado. `redis/client.ts` perde `import type { Redis }`, que é type-only, e o comentário de cabeçalho foi preservado.
- `useTemplate` em `src/lib/ai/gateway.ts` (4 ocorrências): `(systemInstruction || "") + "\n" + prompt`. O lado esquerdo é sempre string; se `prompt` vier `undefined`, as duas formas produzem `"undefined"`, então é idêntico.
- Não há mudança de `node:`.
- Regra geral: um import local com valor removido por inteiro só pode sair quando o mesmo módulo continua importado no arquivo. Comparei os módulos importados na main e no PR, arquivo a arquivo. Os únicos módulos que deixaram de ser importados são type-only, builtins do Node ou pacotes com `"sideEffects": false` (`framer-motion` e `lucide-react`, conferido no `package.json` de cada um). **Nenhum import com efeito colateral sumiu.**
- `useTemplate`: `a + b` e `` `${a}${b}` `` só divergem quando um operando é objeto com `valueOf` diferente de `toString` (ou Symbol). Para strings, number, undefined e null o resultado é idêntico. Todos os operandos aqui são string (ou `JSON.stringify`, `.join`, `.slice` ou `x || ''`).

## Verificação local (clone `/workspace/rv154`)
- `tsc --noEmit`: 0 erros, igual à main (0).
- `biome lint src`: 637 warnings (main 645), sem erros novos.
- Testes unitários relacionados: `tests/unit/ai`, `src/lib/ai` e redis: 23 arquivos, 204/204.

## CI no head `f0a3b2f0`
- Security - Dependency Review: success (run 41408859928)
- Security - CodeQL: success (run 41408859892)
- Central Birth Hub 360 Release: failure (run 41408859893)
- Visual Regression Tests: success (run 41408859960)
- Security - Trivy: success (run 41408859895)
- Frontend Bundle Budget: success (run 41408859920)
- SonarQube Analysis: failure (run 41408859927)
- O Release falha em "Run Prettier check" com **4 erros herdados** da main (`AIPendingActionsInbox.tsx`, `aiPendingAction.service.ts`, `agentCapabilities.normalized.json` e `semanticCache.ts`), que são os mesmos da main (run 41406269451) e são corrigidos pelo #152. Nenhum arquivo deste PR aparece entre as falhas. Por isso Type Check, Unit, Integration, Build e E2E ficaram **skipped**.

## Decisão (AGENTS.md)
§40: "teste obrigatório não executado [...] não equivalem a aprovação; falhas pré-existentes [...] não podem ser anunciadas como gate verde". §30: "Nunca declarar um teste como aprovado se ele não foi executado." Os testes obrigatórios não rodaram na CI neste SHA, então o veredito é **BLOQUEADO**.

## O que desbloqueia
Main verde (merge do #152, e do #154 ou equivalente para o teste `commercialV3.routes.test.ts:79`), depois merge da main neste branch (sem rebase/force-push) e Release com Unit, Integration, Build e E2E verdes no novo SHA. Depois disso, emito novo parecer. Qualquer commit novo invalida este parecer.

