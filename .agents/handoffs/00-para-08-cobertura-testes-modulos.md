# Handoff — Cobertura de testes dos módulos restantes (Onda F5)

De: 00 — Coordenador
Para: 08 (QA) + 24 (revisão)
Onda: F5
Status: em-andamento
Prioridade: normal
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §5 item 5, §7

## Problema

Módulos sem cobertura de teste dedicada identificados no inventário:

| Módulo | Test files hoje |
|---|---|
| market-intelligence (P02) | 0 |
| mesa-tratamento (P08) | 0 (só service unit) |
| social-selling (M11) | 0 |
| signals-risks (P06) | 0 |
| sales-orchestration (P03) | 0 |
| predictability (P05) | 1 |

## Alteração necessária

1. 08: criar specs unit/integração/E2E priorizando: LGPD/social-selling
   (proibição de scraping), mesa-tratamento (triagem + SLA),
   market-intelligence (fallback de provedores, badge FONTE_PARCIAL,
   ledger de créditos — AC-MKT-001/002/003 do Documento Mestre).
2. 24: revisar conformidade dos novos testes com os critérios de aceite
   do Documento Mestre.

## Teste esperado

- `npm run test:e2e`/`test:unit`/`test:integration` verdes com as novas
  specs; matriz de cobertura atualizada.

## Fora de escopo

- Não enfraquecer asserts existentes; não criar mocks que mascarem
  integração real.

## Resolução (parcial — 2026-11-12, Agente 08)

**Diagnóstico:** a premissa do handoff (0 arquivos de teste por módulo) está desatualizada em relação a `main`. Todos os seis módulos já possuem specs dedicadas unitárias e/ou de integração:

| Módulo | Specs existentes (exemplos) |
|---|---|
| market-intelligence | `tests/unit/market-intelligence/*` (6 arquivos: accountDecisionMakers, accountEconomicGroup, accountInsights, dataQualityReport, ldrIntegrityGuard, marketSensing), `tests/unit/features/market-intelligence/server/*` (3 contract tests), `src/features/market-intelligence/**/__tests__/*` (3) |
| mesa-tratamento | `tests/unit/features/mesa-tratamento/*` (4: priority, routes, approachSuggestion, lossReasons), `src/features/mesa-tratamento/services/__tests__/mesa-triage.service.test.ts` (piso de severidade determinístico, fallback de IA) |
| social-selling | `tests/unit/social-selling/*` (2: socialSelling.service, shadowCopywriting.service — cobre consentimento LGPD opt-in, revogação/expurgo, exigência de revisão humana), `tests/unit/features/social-selling/*`, `tests/integration/features/social-selling/*` (2 fluxos E2E-ish) |
| signals-risks | `tests/unit/components/signals-risks/SignalsAndRisksHub.test.tsx`, `tests/integration/features/signals-risks/revOpsFlow.integration.test.tsx`, `tests/integration/conversation-signal-tenant-isolation.test.ts`, `tests/integration/whatsapp-signal-worker-tenant-context.test.ts` |
| sales-orchestration | `tests/unit/features/sales-orchestration/*` (2), `tests/unit/sales-orchestration/orchestration.api.unit.test.ts` |
| predictability | `tests/unit/features/predictability/predictability.api.test.ts`, `tests/unit/commercial-intelligence/predictive*.test.ts` (2), `src/features/commercial-intelligence/__tests__/predictiveForecast.unit.test.ts` |

**Priorização pedida — situação real:**
- **LGPD/social-selling:** a feature não faz scraping (gera copy a partir de amostras voluntárias do próprio vendedor); consentimento opt-in, revogação com expurgo e `requiresHumanReview` já estão cobertos por `shadowCopywriting.service.test.ts` e `socialSelling.service.test.ts`.
- **mesa-tratamento triagem:** coberta por `mesa-triage.service.test.ts` (piso de severidade P0–P3, lockdown, fallback conservador quando a IA falha). Não existe conceito de "SLA" implementado na feature (busca por `sla|responseTime` não retorna lógica) — se SLA for requisito do Documento Mestre, é gap de produto, não de teste.
- **market-intelligence AC-MKT-001/002/003:** **gaps de produto confirmados** — (a) não existe model de ledger/créditos no `prisma/schema.prisma` (só `EnrichmentLog`, que é auditoria, não saldo); AC-MKT-003 (débito atômico antes da chamada externa) não tem implementação para testar; (b) não há badge `FONTE_PARCIAL` nas respostas de market-intelligence (o termo só existe em `commercial-intelligence`, domínio diferente); (c) fallback de provedores existe parcialmente em `enrichment.service.ts` (Google Places → OpenStreetMap) mas sem marcação de fonte parcial. Escrever specs para comportamento inexistente violaria "não criar mocks que mascarem integração real" — os gaps precisam de dono de produto (05 prospecção / 01 schema) antes de QA formalizar ACs.

**Ação do 08:** aberto handoff `08-para-00-cobertura-modulos-gaps-produto.md` roteando os três gaps de produto. Status mantido `em-andamento` até o 00 decidir se os ACs do Documento Mestre são escopo atual do produto; se forem, os testes de aceite devem ser escritos junto com a implementação.
