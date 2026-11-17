De: Agente 02 — Produto e UX
Para: Agente 03 — Design e Acessibilidade
Onda: Backlog Onda 5 / DEM-20261116-001
Status: aberto
Prioridade: alto
Bloqueador-ref: MEL-35
Sprint destino: backlog-5

## Problema

MEL-35 pede expansão da command palette existente com ações contextuais por página. A palette global já existe e é funcional (`src/components/ui/CommandPalette.tsx`), mas hoje só tem ações rápidas estáticas + navegação + busca de empresas/decisores. O arquivo está sob `src/components/ui/**`, propriedade do Agente 03, então o Agente 02 não pode editá-lo sem handoff.

## Arquivo(s) envolvido(s)

- `src/components/ui/CommandPalette.tsx` (dono: Agente 03)
- Apoio já existente e reutilizável: `src/components/layout/tabMeta.ts` (`TAB_META`, `isNavHiddenTab`), `src/lib/paletteIntent.ts`, `src/components/layout/MainLayout.tsx` (`deriveActiveTabFromPath`).

## Evidência

- `CommandPalette.tsx` define `ResultItem.group` como `'Ações rápidas' | 'Navegar' | 'Empresas' | 'Decisores'` e monta `quickActions`/`moduleItems` sem considerar a rota ativa.
- `MainLayout.tsx` já deriva a tab ativa a partir de `useLocation()`; a palette pode receber a rota ativa via `useLocation()` diretamente ou por prop, sem criar segunda palette.
- A palette já preserva teclado, foco, Escape, setas, Enter, normalização de diacríticos e eventos `OPEN_COMMAND_PALETTE_EVENT`/`OPEN_AI_CHAT_EVENT`.

## Alteração necessária

Adicionar um grupo contextual (sugestão: `'Nesta página'`) antes de `'Navegar'`, derivado da rota ativa (`/app/*`), com ações reais e autorizadas. Exemplos mínimos viáveis:

- `/app/crm`: "Nova oportunidade" (`open-create`), "Ir para empresas", "Ir para contatos".
- `/app/companies`: "Nova empresa" (`open-create`), "Ir para contatos".
- `/app/contacts`: "Novo contato" (`open-create`), "Ir para empresas".
- `/app/activities`: "Criar nova atividade" (`open-create`).
- `/app/dashboard` ou `/app/analytics`: "Abrir relatórios", "Buscar mercado".
- `/app/settings`: "Voltar ao dashboard", "Abrir integrações".
- `/app/mesa-tratamento`, `/app/forecast`, `/app/metas`, `/app/team`, `/app/module-access`, `/app/usage`: somente ações de navegação já permitidas pelo `RequireRole`/`NAV_HIDDEN_TABS` correspondente; não oferecer ação que a rota bloqueia.

Restrições:
- Não criar palette paralela; estender `CommandPalette.tsx`.
- Respeitar `isNavHiddenTab` e os mesmos gates de `RequireRole` das rotas (não confiar em role do frontend para ações destrutivas; aqui são navegações).
- Manter `ResultItem` tipado; adicionar o novo grupo ao union.
- Preservar foco/teclado e tokens shadcn/Tailwind 4; sem cores cruas novas.
- Cobrir com teste unitário/e2e de teclado se o harness permitir.

## Teste esperado

- Abrir palette em `/app/crm` e confirmar que "Nova oportunidade" aparece no grupo contextual e navega com intent `open-create`.
- Em rota restrita (ex.: `/app/usage` para não-ADMIN), não oferecer ação que o backend/`RequireRole` negaria.
- Navegação por setas/Enter continua funcionando com o novo grupo.

## Contexto adicional

- O Agente 02 preparou o restante do backlog 5 (estados compartilhados, checklist por papel, base de i18n sem dependência, migração RHF+Zod em settings). Este handoff é o único bloqueio de propriedade para MEL-35.
