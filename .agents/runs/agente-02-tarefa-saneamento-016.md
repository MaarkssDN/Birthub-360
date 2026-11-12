# Run — Agente 02 · TAREFA-SANEAMENTO-016 / BT360-DT-0016

- **Data:** 2026-11-12
- **Onda:** W4 (Domínio de produto)
- **Branch:** `agente/02-w4-app-decouple` (base `origin/integracao/onda-saneamento-20261110` @ `4b561f15b`)
- **Worktree:** `C:/Github/Birthub-360-worktrees/agente-02-w4-produto`
- **Handoff:** `00-para-02-acoplamento-excessivo-e-orquestracao-de-side-effects-em-src-app-tsx.md` → `em-andamento`

## O que foi feito

Extração cirúrgica do router acoplado em `src/App.tsx`, sem mudança funcional:

| Arquivo | Conteúdo |
|---|---|
| `src/App.tsx` | 751 → 144 linhas: providers + rotas públicas + mount de `/app/*` |
| `src/components/routing/lazyPages.tsx` (novo) | 67 declarações `lazy()` centralizadas — code-splitting explícito |
| `src/components/routing/AuthenticatedLayout.tsx` (novo) | `OnboardingGate` + `MainLayout` + ~60 rotas `/app/*` com guards e comentários de auditoria preservados |
| `src/components/routing/PageFallback.tsx` (novo) | fallback de Suspense compartilhado (`data-testid="page-fallback"` mantido) |

Suposição registrada: "router dedicado" do handoff interpretado como módulo de roteamento co-localizado em `src/components/routing/` (domínio 02), não re-arquitetura para React Router data routers — menor mudança que resolve o acoplamento.

## Verificação

- Paridade de rotas: 91 `<Route>` antes = 91 depois; `diff` dos `path="..."` **idêntico**.
- `npx tsc --noEmit`: **PASS**.
- `npx biome check --write` + recheck nos 4 arquivos: **PASS**.
- `vitest tests/unit/components/layout/`: **42/42 PASS** (baseline exigida pelo plano).
- E2E `modular-navigation.spec.ts`: **não executado** (sem Docker/infra de integração nesta sessão).

## Pendências

- Parecer Agente 24; integração pelo Agente 00.
