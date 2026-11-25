# Handoff 32 → Squad 30 — Estados de UI canônicos em `src/components/feedback/**`

- **De**: Agente 32 — Ema (Arquitetura de Informação e Estados de UI)
- **Para**: Agente 30 — Violeta (coordenadora) · cc Agente 33 — Célia (design system)
- **Data**: 2026-11-24 · DEM-20261123-001 · item S30-03 do plano squad-30
- **Branch**: `agente/32-ui-states-s30` (worktree `squads/squad-30/wt-32`, base `integracao/onda-3-dem20261123`)

## Entregue

`src/components/feedback/` (propriedade do Agente 32 conforme MATRIZ_PROPRIEDADE) agora tem o
conjunto completo de estados, todos com semântica a11y:

| Componente | Estado | A11y |
|---|---|---|
| `LoadingState` | loading (spinner ou skeleton) | `role="status"`, `aria-live="polite"`, `aria-busy` |
| `EmptyState` | empty (já existia; realinhado a tokens + `ui/Button`) | `role="status"`, `aria-live="polite"` |
| `ErrorState` | error com retry (`panel` e `compact`) | `role="alert"` (assertivo) |
| `StaleDataIndicator` | stale/dados obsoletos | `role="status"`, `aria-live="polite"` |
| `index.ts` | barrel de exports | — |

Reuso de design system: `ui/Skeleton`, `ui/Button`, tokens (`ink`, `surface`, `line`,
`danger`, `warning`) — nenhum token novo, nenhum redesenho.

## Aplicado em telas reais (settings = território squad 30)

- `features/settings/components/MemoryGovernancePanel.tsx`: 2× loading texto puro →
  `LoadingState` skeleton; 2× banner de erro sem `role`/retry → `ErrorState compact`
  com retry (`loadCandidates`/`loadRecords`); 2× empty ad-hoc → `EmptyState`.
  `ShieldAlert` ficou órfão e foi removido.
- `features/settings/components/{Lead,Company}DedupPanel.tsx`: `loadingSkeleton`
  era `<p>Carregando…</p>` → agora `LoadingState` + `ListSkeleton` (esqueleto real,
  anunciado via `role="status"`).

## Pendência para Agente 33 — Célia (fora do meu escopo)

`src/components/ui/OperationalStateContainer.tsx` (dono: `ui/**` → 33) implementa os 4
estados mas **sem semântica a11y**: branch `error` não tem `role="alert"`, `stale` não tem
`role="status"`/`aria-live`, `loading` não anuncia. Consumidores atuais:
`LeadDedupPanel`, `CompanyDedupPanel`, `SetupWizard`, `AiGatewayShowcase`.
Sugestão: adicionar roles/aria-live no container (ou migrar consumidores para
`components/feedback/**`, que já é canônico e acessível). Não editei por regra de propriedade.

## Inventário de inconsistências (para próximas ondas)

~50 ocorrências de "Carregando…" ad-hoc em `src/features/**` (texto solto, `Loader2` sem
`role="status"`), ex.: `workspace/WorkspaceHome.tsx` (parcialmente ok — já tem
`aria-live`/`aria-busy`), `playbook/*MatrixPage`, `notifications/Notifications.tsx`,
`crm360/PropostasList.tsx`. Recomendado: onda de adoção trocando por `LoadingState`/
`ErrorState`/`EmptyState` de `feedback/**` — handoffs por squad dono de cada feature.

`StaleDataIndicator` entregue e testado, mas **nenhuma tela real tinha sinal de stale**
(cache/offline) para aplicar sem inventar estado — adoção depende de quem expõe
`lastUpdated`/falha de refresh (sugestão: squads 50/59 sync Bitrix, 85 offline mobile).

## Gates executados

- `npx tsc --noEmit` → exit 0
- `npx biome lint` nos 9 arquivos do escopo → limpo
- `vitest run src/components/feedback/__tests__/feedbackStates.test.tsx` → 15/15
- `vitest run tests/unit/features/settings/Settings.profile.test.tsx` → 8/8

SHA congelado para Silas: ver `.agents/runs/squads/squad-30-run-32.md`.
Sem push (decisão do coordenador).
