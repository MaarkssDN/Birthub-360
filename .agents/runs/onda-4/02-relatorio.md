# Relatório — Agente 02 (Produto e UX) — Onda 4

Missão: DEM-20261114-003 — MEL-30 (hub de settings por pilar) + MEL-31 (limpeza de rotas duplicadas/deprecadas).
Branch: `agente/02-onda4-ux` · Base: `integracao/onda-4` · Worktree: `agente-02-onda4-ux`.

## Status: CONCLUÍDO

Trabalho retomado de sessão interrompida; revisto, validado e completado. Nenhuma pendência de MEL-31 restava.

## MEL-30 — Hub consolidado de settings por pilar

**Antes:** 8 rotas irmãs `/app/settings_{hub,market,sales,performance,predictability,ai,automation,engagement}` renderizavam `PillarSettingsPlaceholder` isolado — sem navegação entre pilares.

**Depois:**

- Nova rota canônica `/app/settings/pillars/:pillar` → `PillarSettingsHub`
  (`src/features/settings/components/PillarSettingsHub.tsx`), que renderiza um seletor de pilares
  (nav com `aria-current`, links deep-linkáveis) acima do `PillarSettingsPlaceholder` do pilar ativo.
- `PILLAR_SLUG_TO_NAME` adicionado em `src/features/settings/domain/pillarSettings.ts` (inverso de
  `PILLAR_NAME_TO_SLUG`) para resolver nome de exibição a partir do slug.
- Slug inválido/ausente → normaliza para `hub` via `<Navigate replace>` (nunca 404).
- `moduleRegistry.ts`: `extraPaths` de cada módulo P0–P07 recebeu `settings/pillars/<slug>` para manter
  o realce correto do módulo na rota canônica.

## MEL-31 — Rotas duplicadas/deprecadas

Diff de rotas em `src/components/layout/AppLayout.tsx`:

| Rota | Antes (HEAD) | Depois | Destino |
|---|---|---|---|
| `settings_hub` … `settings_engagement` (8 rotas) | `PillarSettingsPlaceholder` direto | `<Navigate replace>` | `/app/settings/pillars/<slug>` |
| `settings/pillars` | — (novo) | `<Navigate replace>` | `/app/settings/pillars/hub` |
| `settings/pillars/:pillar` | — (novo) | `PillarSettingsHub` | — |
| `gamification` | declarada **2×** (linhas ~479 e ~488, duplicata exata) | 1× | código morto removido |
| `dialer` | `dialer` exata → `/app/cadence` | `dialer/*` → `/app/cadence` | cobre `/app/dialer` e `/app/dialer/3cx` (splat vazio) |
| `voice-hub` | `voice-hub` exata + `voice-hub/*` | só `voice-hub/*` | redundância removida |
| `outbound` | `outbound/*` → `/app/dashboard` | inalterado | já cobria `/app/outbound` (splat vazio) |

Nenhuma rota removida sem redirect: bookmarks, Command Palette (`CommandPalette.tsx`), `navigationBus`
(voz) e deep-links `settings_*` continuam resolvendo — redirects `replace` preservam o histórico.

Verificação de duplicatas: `grep path=` em AppLayout.tsx → `uniq -d` vazio (nenhum path duplicado restante).

## Gates executados

| Gate | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts tests/unit/components/layout/AppLayout.test.tsx` | **91/91 passam** (inclui 4 novos casos de rota: índice pillars, pillar canônico, slug inválido, `/app/dialer/3cx`) |
| `tsc --noEmit` (node, 8GB) | **exit 0** |
| `npm run lint` (biome src) | **exit 0** — 1520 warnings pré-existentes em arquivos fora do escopo; 0 erros nos arquivos alterados |
| `npx biome lint` nos 5 arquivos tocados | limpo |

## Arquivos alterados

- `src/components/layout/AppLayout.tsx` — rotas settings_* → redirects; hub canônico; dedup gamification/dialer/voice-hub.
- `src/components/layout/moduleRegistry.ts` — `extraPaths` para realce do módulo nas rotas canônicas.
- `src/features/settings/domain/pillarSettings.ts` — `PILLAR_SLUG_TO_NAME`.
- `src/features/settings/components/PillarSettingsHub.tsx` — **novo** (hub com seletor de pilares).
- `tests/unit/components/layout/AppLayout.test.tsx` — 4 casos de rota novos + comentário MEL-30.

## Handoffs / pendências para outros agentes

- Nenhum handoff bloqueador. `PillarSettingsPlaceholder` segue sendo placeholder visual (abas
  permissões/automações/integrações sem contrato de persistência) — se a Onda 4 exigir telas reais,
  abrir demanda para 01 (contrato de settings) antes de 02 implementar.
- Aviso ao 24: diff é cirúrgico em navegação (propriedade 02); sem impacto tenancy/LGPD/schema.

---

## Correções pós-revisão (Agente 24 — REPROVADO → correção)

**Achado A1 (ALTA) — regressão no shell:** as rotas `/app/settings/pillars/<slug>` derivavam
`activeTab='settings'` em `MainLayout.tsx` (`pathname.split('/')[2]`), fazendo Topbar/H1
(`TAB_META[activeTab]`), breadcrumbs e `ModuleAgentWidget` tratarem o pilar como "Ajustes Globais".

**Correção:**
- Novo helper puro `src/components/layout/settingsPillarNav.ts` — `deriveActiveTabFromPath`,
  `resolveSettingsPillarSlug`, `SETTINGS_PILLAR_TAB`, `SETTINGS_PILLAR_LABEL`.
  Slugs duplicados de `src/features/settings/domain/pillarSettings.ts` de propósito (layout não
  importa de features — direção de dependência).
- `MainLayout.tsx`: `activeTab = activeTabProp ?? deriveActiveTabFromPath(pathname)` —
  `/app/settings/pillars/<slug>` → `settings_<slug>` (ex.: `settings_hub`, `settings_market`,
  `settings_ai`); demais rotas inalteradas. Topbar e ModuleAgentWidget passam a receber o tab
  correto automaticamente (ambos consomem o mesmo `activeTab`).
- `AppBreadcrumbs.tsx`: trilha própria `Início › Ajustes Globais › <Pilar>` para
  `/app/settings/pillars/*`; slug inválido/ausente resolve para `hub` (mesmo destino do
  `<Navigate>` do PillarSettingsHub — redirect de slug inválido preservado, achado A4).
  A regra `seg==='hub'→"Hub de Inteligência"` continua valendo apenas para
  `market-intelligence/hub` — teste dedicado garante não-colisão.

**Achado A4 (BAIXA):** labels normalizados via `SETTINGS_PILLAR_LABEL` (nomes dos pilares);
slug inválido segue redirecionando para `/hub` (comportamento do PillarSettingsHub intacto +
cobertura de teste).

**Testes novos:** `src/components/layout/__tests__/settingsPillarNav.test.tsx` (31 testes):
derivação `settings_<slug>` para os 8 slugs + casos explícitos hub/market/ai; índice e slug
inválido → `settings_hub`; não-regressão de rotas comuns; H1 do AppTopbar renderizado com
`TAB_META[tab].label` do pilar; breadcrumbs finais corretos; "Hub de Inteligência" ausente em
`/app/settings/pillars/hub` e presente em `/app/market-intelligence/hub`.

**Gates pós-correção:**

| Gate | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts src/components/layout/__tests__/settingsPillarNav.test.tsx src/components/layout/__tests__/AppBreadcrumbs.test.ts` | **34/34 passam** |
| `npx vitest run -c vitest.unit.config.ts tests/unit/components/layout/AppLayout.test.tsx` | **91/91 passam** |
| `npx tsc --noEmit` | **exit 0** |
| `npm run lint` (biome src) | **exit 0** — 0 findings nos arquivos alterados |
| `npm run build` | **exit 0** (vite + esbuild + verify:pwa-precache OK) |

**Arquivos alterados nesta correção:**
- `src/components/layout/settingsPillarNav.ts` — **novo**.
- `src/components/layout/MainLayout.tsx` — derivação de activeTab via helper.
- `src/components/layout/AppBreadcrumbs.tsx` — trilha dedicada para settings/pillars.
- `src/components/layout/__tests__/settingsPillarNav.test.tsx` — **novo**.
- `.agents/runs/onda-4/02-relatorio.md` — esta seção.
