# Identidade do Produto

Estado: CONFIRMADO onde citado; "experiência recomendada" = PROPOSTO. Fontes: `PRODUCT.md`, `DESIGN.md`, `moduleRegistry.ts`, `AppLayout.tsx`.

## Experiência observada (por código/documentos; sem execução visual)

- **Tese:** Sistema Operacional de Revenue Intelligence: dados + decisões automatizadas + cadências, não CRM convencional.
- **Modo:** produto autenticado em `/app/*`, "Operate": alta densidade executiva, tema claro e escuro.
- **Navegação:** rail de módulos + painel contextual (`Sidebar.tsx`, `ModuleRail`, `ModuleNavPanel`); toda tela é deep-linkável; Command Palette ⌘K; `AppBreadcrumbs`, `AppTopbar`, `MobileNav`/`MobileNavDrawer`; `PageTransition`, `NavLaunchTransition`.
- **IA como parte do fluxo:** Copiloto IA, Radar de Sinais, Riscos de Deals, caixa de ações pendentes de IA (`/app/intelligence/pending-actions`), Voice Hub, Roleplay IA.
- **Acesso por perfil:** guards `ProtectedRoute`, `RequireRole`, `RequireModuleAccess`, `RequireProductModule`, `OnboardingGate` (CONFIRMADO por existência; regras exatas NÃO VERIFICADO).
- **Estados obrigatórios:** loading, empty, error, stale (`OperationalStateContainer`) — ver [estados](../06-EXPERIENCIA/estados-acessibilidade-responsividade.md).
- **O que o torna um só produto (CONFIRMADO em código):** tokens únicos, `PageHeader`/`PageTitleCard`, acentos por módulo (`NavAccent`: gold, blue, teal, violet, iris, red, slate) e o mesmo rail.

## Regras de produto vigentes (PRODUCT.md)

Zero mock em produção; multi-tenancy com RLS; LGPD (sanitização de PII, exclusão/anonimização). Landing e Login: proibido alterar.

## Experiência recomendada (PROPOSTO)

1. Todo módulo declara os 4 estados e prova adoção por teste (hoje NÃO VERIFICADO).
2. Cor de acento por módulo só via `NavAccent` → token (não hex).
3. Uma nomenclatura: usar a de `moduleRegistry.ts` (C-08).
