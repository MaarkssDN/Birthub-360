# Backlog de avisos do Biome (`biome lint src`)

Levantamento do Agente WF6 em 02/11/2026 (America/Sao_Paulo), Biome 2.5.14.

- Linha de base na `main`: **645 avisos e 4 infos** (649 diagnósticos), confirmada pelo run do workflow *Code Quality (Lint)* de 02/11/2026, 04:28–04:30 America/Sao_Paulo: https://github.com/MarksNN/Birthub-360/actions/runs/41406553635
- 64 diagnósticos são mecânicos (`noUnusedImports`, `useTemplate`, `useNodejsImportProtocol`) e foram tratados nos PRs `agente/wf6-biome-*`, exceto 4 em arquivos excluídos (PR #152 e `src/features/companies/domain/Company.ts`, cujo import sem uso está documentado por um comentário de auditoria).
- Restam **585 diagnósticos não mecânicos**, listados abaixo. Eles exigem revisão humana porque podem mudar comportamento, tipos ou markup.

## Sobre o dono sugerido

> **Atenção:** o dono foi **inferido** a partir dos domínios dos agentes listados na §3 do AGENTS.md ("Produto, engenharia e operação"). A §15 ("Propriedade exclusiva de arquivos") só atribui em `src/` o `src/App.tsx`, a navegação principal e a Sidebar ao Agente 02; nenhuma outra pasta de `src/` tem dono explícito. Confirme com o Coordenador (00) antes de atribuir.

Legenda: 01 Plataforma, Segurança e Dados · 02 Produto e UX · 03 Design e Acessibilidade · 04 CRM e BI · 05 Prospecção · 06 Integrações e Bitrix · 07 IA e Automações · 09 Mobile · 12 Voz e Telefonia · 17 Cadência Multicanal · 21 Privacidade e LGPD · 00 Coordenador (sem domínio óbvio).

Regras `a11y/*`, `noImportantStyles` e `noDescendingSpecificity` envolvem markup/CSS e devem ter revisão do **03**, além do dono do domínio.

## Ordem sugerida

1. A11y reais primeiro: `noLabelWithoutControl`, `useKeyWithClickEvents`, `noStaticElementInteractions`, `useMediaCaption`.
2. Demais regras (correção, tipos, hooks e a11y restantes), por área e dono.
3. Por último: `noImportantStyles` e `noStaticOnlyClass`, para não conflitar com o PR #152 (WF1, formatação do release gate). Se algum arquivo cruzar com o #152, o #152 tem prioridade.

## Regra × área

| Ordem | Regra | Área (`src/`) | Avisos | Dono sugerido |
|---|---|---|---:|---|
| 1 | `a11y/noLabelWithoutControl` | `features/voice-hub` | 41 | 12 |
| 1 | `a11y/noLabelWithoutControl` | `features/prospecting` | 18 | 05 |
| 1 | `a11y/noLabelWithoutControl` | `features/intelligence` | 6 | 07 |
| 1 | `a11y/noLabelWithoutControl` | `features/social-selling` | 6 | 05 |
| 1 | `a11y/noLabelWithoutControl` | `features/gamification` | 1 | 02 |
| 1 | `a11y/noStaticElementInteractions` | `components` | 3 | 02 |
| 1 | `a11y/noStaticElementInteractions` | `features/auth` | 3 | 03 |
| 1 | `a11y/noStaticElementInteractions` | `features/hub` | 1 | 02 |
| 1 | `a11y/noStaticElementInteractions` | `features/integrations` | 1 | 06 |
| 1 | `a11y/noStaticElementInteractions` | `features/prospecting` | 1 | 05 |
| 1 | `a11y/noStaticElementInteractions` | `features/voice-hub` | 1 | 12 |
| 1 | `a11y/useKeyWithClickEvents` | `features/auth` | 3 | 03 |
| 1 | `a11y/useKeyWithClickEvents` | `features/hub` | 2 | 02 |
| 1 | `a11y/useKeyWithClickEvents` | `features/integrations` | 1 | 06 |
| 1 | `a11y/useMediaCaption` | `features/voice-hub` | 4 | 12 |
| 1 | `a11y/useMediaCaption` | `features/mobile` | 1 | 09 |
| 2 | `a11y/noNoninteractiveTabindex` | `features/crm` | 1 | 04 |
| 2 | `a11y/useAriaPropsSupportedByRole` | `features/voice-hub` | 1 | 12 |
| 2 | `a11y/useSemanticElements` | `features/voice-hub` | 16 | 12 |
| 2 | `a11y/useSemanticElements` | `features/prospecting` | 8 | 05 |
| 2 | `a11y/useSemanticElements` | `features/crm` | 2 | 04 |
| 2 | `a11y/useSemanticElements` | `components` | 1 | 02 |
| 2 | `a11y/useSemanticElements` | `features/auth` | 1 | 03 |
| 2 | `a11y/useSemanticElements` | `features/copilot` | 1 | 07 |
| 2 | `a11y/useSemanticElements` | `features/landing` | 1 | 03 |
| 2 | `a11y/useValidAnchor` | `features/auth` | 1 | 03 |
| 2 | `complexity/noUselessSwitchCase` | `features/intelligence` | 1 | 07 |
| 2 | `complexity/noUselessSwitchCase` | `lib` | 1 | 01 |
| 2 | `complexity/useOptionalChain` | `features/intelligence` | 3 | 07 |
| 2 | `complexity/useOptionalChain` | `features/prospecting` | 2 | 05 |
| 2 | `complexity/useOptionalChain` | `features/calendar` | 1 | 17 |
| 2 | `complexity/useOptionalChain` | `features/integrations` | 1 | 06 |
| 2 | `complexity/useOptionalChain` | `features/market-intelligence` | 1 | 07 |
| 2 | `correctness/noUnreachable` | `features/landing` | 1 | 03 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/intelligence` | 10 | 07 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/prospecting` | 10 | 05 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/social-selling` | 4 | 05 |
| 2 | `correctness/noUnusedFunctionParameters` | `components` | 1 | 02 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/ai-voice` | 1 | 12 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/cadence` | 1 | 17 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/integrations` | 1 | 06 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/roleplay` | 1 | 12 |
| 2 | `correctness/noUnusedFunctionParameters` | `features/workspace` | 1 | 02 |
| 2 | `correctness/noUnusedFunctionParameters` | `lib` | 1 | 01 |
| 2 | `correctness/noUnusedPrivateClassMembers` | `features/social-selling` | 1 | 05 |
| 2 | `correctness/noUnusedPrivateClassMembers` | `lib` | 1 | 01 |
| 2 | `correctness/noUnusedVariables` | `features/integrations` | 2 | 06 |
| 2 | `correctness/noUnusedVariables` | `features/intelligence` | 2 | 07 |
| 2 | `correctness/noUnusedVariables` | `features/market-intelligence` | 2 | 07 |
| 2 | `correctness/noUnusedVariables` | `features/predictability` | 2 | 04 |
| 2 | `correctness/noUnusedVariables` | `features/commercial-intelligence` | 1 | 07 |
| 2 | `correctness/noUnusedVariables` | `features/hub` | 1 | 02 |
| 2 | `correctness/noUnusedVariables` | `features/knowledge` | 1 | 07 |
| 2 | `correctness/noUnusedVariables` | `features/lgpd` | 1 | 21 |
| 2 | `correctness/noUnusedVariables` | `features/prospecting` | 1 | 05 |
| 2 | `correctness/noUnusedVariables` | `features/roleplay` | 1 | 12 |
| 2 | `correctness/noUnusedVariables` | `lib` | 1 | 01 |
| 2 | `correctness/noUnusedVariables` | `shared` | 1 | 01 |
| 2 | `correctness/useExhaustiveDependencies` | `features/prospecting` | 10 | 05 |
| 2 | `correctness/useExhaustiveDependencies` | `features/voice-hub` | 9 | 12 |
| 2 | `correctness/useExhaustiveDependencies` | `features/copilot` | 1 | 07 |
| 2 | `correctness/useExhaustiveDependencies` | `features/gamification` | 1 | 02 |
| 2 | `correctness/useExhaustiveDependencies` | `features/intelligence` | 1 | 07 |
| 2 | `performance/noDynamicNamespaceImportAccess` | `features/voice-hub` | 1 | 12 |
| 2 | `style/noDescendingSpecificity` | `features/landing` | 55 | 03 |
| 2 | `style/noDescendingSpecificity` | `features/auth` | 19 | 03 |
| 2 | `style/noDescendingSpecificity` | `features/voice-hub` | 2 | 12 |
| 2 | `style/noNonNullAssertion` | `lib` | 77 | 01 |
| 2 | `style/noNonNullAssertion` | `features/intelligence` | 4 | 07 |
| 2 | `style/noNonNullAssertion` | `features/prospecting` | 4 | 05 |
| 2 | `style/noNonNullAssertion` | `features/market-intelligence` | 2 | 07 |
| 2 | `style/noNonNullAssertion` | `features/voice-hub` | 2 | 12 |
| 2 | `style/noNonNullAssertion` | `features/billing` | 1 | 04 |
| 2 | `suppressions/unused` | `features/playbook` | 2 | 05 |
| 2 | `suspicious/noImplicitAnyLet` | `features/knowledge` | 2 | 07 |
| 2 | `suspicious/noImplicitAnyLet` | `features/prospecting` | 1 | 05 |
| 2 | `suspicious/noImplicitAnyLet` | `features/voice-hub` | 1 | 12 |
| 2 | `suspicious/useIterableCallbackReturn` | `features/prospecting` | 7 | 05 |
| 2 | `suspicious/useIterableCallbackReturn` | `features/voice-hub` | 7 | 12 |
| 2 | `suspicious/useIterableCallbackReturn` | `features/copilot` | 1 | 07 |
| 2 | `suspicious/useIterableCallbackReturn` | `features/intelligence` | 1 | 07 |
| 2 | `suspicious/useIterableCallbackReturn` | `features/market-intelligence` | 1 | 07 |
| 3 | `complexity/noImportantStyles` | `features/landing` | 151 | 03 |
| 3 | `complexity/noImportantStyles` | `features/auth` | 19 | 03 |
| 3 | `complexity/noImportantStyles` | `styles` | 12 | 03 |
| 3 | `complexity/noStaticOnlyClass` | `features/intelligence` | 1 | 07 |
| 3 | `complexity/noStaticOnlyClass` | `features/prospecting` | 1 | 05 |
| 3 | `complexity/noStaticOnlyClass` | `features/sales-orchestration` | 1 | 07 |
| 3 | `complexity/noStaticOnlyClass` | `features/social-selling` | 1 | 05 |
| 3 | `complexity/noStaticOnlyClass` | `shared` | 1 | 01 |

Total: 585.
