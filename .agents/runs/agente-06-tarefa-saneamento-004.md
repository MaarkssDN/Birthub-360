# Run — Agente 06 — TAREFA-SANEAMENTO-004 (BT360-DT-0030)

Onda: W5 | Branch: `agente/06-w5-integracoes` | Worktree: `agente-06-w5-integracoes`

## Escopo
Três painéis monolíticos de gerenciamento de integrações decompostos cirurgicamente
(JSX verbatim, comportamento preservado, zero mudança funcional):

| Arquivo | Antes | Depois | Extrações |
|---|---|---|---|
| `BitrixImportPanel.tsx` | 1251 | 771 | 6 componentes em `components/bitrixImport/` |
| `Integrations.tsx` | 1095 | 862 | `ThreeCxConnectionCard.tsx` + `integrationUi.tsx` |
| `ExternalCrmPanel.tsx` | 1078 | 841 | `externalCrm/ExternalCrmConnectModal.tsx` |

Os três arquivos ficaram abaixo do limite geral de 1000 linhas; as exceções
correspondentes foram removidas de `docs/architecture/HOTSPOT_EXCEPTIONS.md`.
`WebhookMonitor.tsx` recebeu apenas reordenação de imports (biome).

## Gates executados
- `npx tsc --noEmit` — PASS (0 erros)
- `npx biome check` nos arquivos do escopo — PASS (0 erros; warnings pré-existentes fora do escopo)
- `npx vitest run tests/unit/features/integrations/ExternalCrmPanel.test.tsx` — 13/13 PASS
- `npx vitest run tests/unit/features/integrations/components/Integrations.test.tsx` — 4/6;
  2 falhas de timeout são PRÉ-EXISTENTES (reproduzidas na base com `git stash`, sem
  relação com a refatoração)
- `npm run build` — PASS (vite build + server.cjs + verify:pwa-precache, 220 entradas)

## Observações
- Extrações feitas por fatias verbatim de linhas + rename mecânico de handlers para
  props (`onClose`, `onApply`, `selectedCount` etc.); estado permanece no componente
  pai ou no hook de domínio (`use3CXIntegration`).
- Tipos compartilhados (`BitrixDealPipeline`, `BitrixFieldOption` etc.) exportados do
  painel pai e importados com `import type` (sem ciclo em runtime).
