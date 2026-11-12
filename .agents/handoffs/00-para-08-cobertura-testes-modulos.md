# Handoff — Cobertura de testes dos módulos restantes (Onda F5)

De: 00 — Coordenador
Para: 08 (QA) + 24 (revisão)
Onda: F5
Status: aberto
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
