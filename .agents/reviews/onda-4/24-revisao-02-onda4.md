# Parecer do Agente 24 — Onda 4 / Agente 02

**Missão:** DEM-20261114-003 — MEL-30 + MEL-31  
**Autor:** Agente 02 — Produto e UX  
**Auditor:** Agente 24 — Revisão Independente  
**Worktree:** `C:\Github\Birthub-360-worktrees\agente-02-onda4-ux`  
**Branch:** `agente/02-onda4-ux`  
**Revisão:** `6435021be654abacd8972e0ba6e3ef469fe74967`  
**Base declarada:** `integracao/onda-4`

## Veredito: REPROVADO

A mecânica central das rotas está correta, mas a nova rota canônica introduz uma regressão visível do shell: todas as telas `/app/settings/pillars/:pillar` passam a ser tratadas como `settings` genérico no topbar, breadcrumbs e widget de agente. Isso precisa ser corrigido antes da integração.

## O que está correto

- Rotas `settings_*` → hub canônico: 8 redirects para slugs corretos (`AppLayout.tsx:599-639`).
- `PillarSettingsHub` valida slug, `Navigate replace` para inválido, `aria-current` correto.
- `moduleRegistry` com `extraPaths` por pilar — realce do rail preservado.
- Duplicatas MEL-31 removidas corretamente (gamification, dialer→dialer/*, voice-hub coberto por voice-hub/*).
- Compatibilidade: CommandPalette, navigationBus, TAB_ROUTE_SET inalterados; bookmarks funcionam via redirect.

## Achados

### A1 — ALTA — Regressão de contexto do shell nas rotas canônicas

`MainLayout.tsx:27-28` deriva `activeTab` por `pathname.split('/')[2]` → `/app/settings/pillars/hub` vira `'settings'` (não `settings_hub`). Consequências:

1. **Topbar/H1 errado**: `TAB_META.settings.label` = "Ajustes Globais" em todas as 8 rotas de pilar.
2. **Breadcrumb errado**: `AppBreadcrumbs.tsx:45` força `hub` → "Hub de Inteligência" (regra de market-intelligence); slugs caem em fallback textual.
3. **Widget de agente errado**: `ModuleAgentWidget` agrupa `settings` em ADMINISTRAÇÃO.

**Correção esperada:** mapear `/app/settings/pillars/<slug>` → `TabType` `settings_<slug>` (ou labels equivalentes) em `MainLayout`/`tabMeta`/`AppBreadcrumbs`, idealmente com helper testável, sem importar feature de settings na camada de layout.

**Teste esperado:** unit tests para hub/market/ai — topbar label, breadcrumb final, activeTab derivado.

### A2 — MÉDIA — Propriedade de `tests/**`

`tests/unit/components/layout/AppLayout.test.tsx` alterado pelo Agente 02 (dono formal: Agente 08). Diff aditivo, sem enfraquecer asserts — **ciência do 00 registrada; não bloqueador**. Preferir `src/**/__tests__` no futuro.

### A3 — BAIXA — Query string/hash/state não preservados pelos redirects

Sem consumidor atual — não bloqueia. Documentar limitação.

### A4 — BAIXA — Cobertura indireta do hub

Faltam testes de `aria-current`, labels dos 8 links, normalização de slug inválido e `getActiveModuleId` para as novas rotas. Recomendo testes colocalizados.

## Gates

Relatório alega vitest 91/91, tsc e lint verdes; **build não evidenciado** (AGENTS locais exigem `npm run build`). Revisor não executou gates (modo read-only).

## Comandos pendentes para o orquestrador

```bash
git diff integracao/onda-4...HEAD --stat
npx vitest run -c vitest.unit.config.ts tests/unit/components/layout/AppLayout.test.tsx
npm run typecheck && npm run lint && npm run build
```

Inspeção visual de `/app/settings/pillars/{hub,market,ai}` e redirect de `/app/settings_market`.
