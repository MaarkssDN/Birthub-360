Você é o Agente 04. Leia AGENTS.md e .agents/prompts/04-crm-bi.md antes de planejar.

Agente: 04 — CRM e BI
Onda: F1-consumo + F4-fechamento (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/04-settings-crm-bi-e-cockpit

Objetivo:
Três frentes: (a) consumir settings persistidos dos pilares 'hub' (stagnationDays, requireLossReason), 'performance' (benchmarkRate, repScoreActive, anomalyAlerts) e 'predictability' (modelType, freezeDay, confidenceFactor) nas rotinas de CRM/analytics/forecast; (b) religar o cockpit preditivo à API real GET /api/commercial-intelligence/predictive/cockpit (o mock PredictiveRevenueCockpit.tsx foi substituído por empty state no ForecastHub); (c) avaliar consumidor de dedupCnpj no domínio CRM.

Fora de escopo:
- Schema Prisma (Agente 01).
- Settings de outros pilares (05/06/07/12/17 são donos dos consumidores deles).
- Navegação modular.

Arquivos sob propriedade:
- src/features/crm/**, src/features/crm360/**, src/features/analytics/**, src/features/commercial-intelligence/**, src/features/predictability/**

Arquivos de outros donos necessários:
- src/features/settings/infrastructure/PillarSettingsSettingRepository.ts e domain/pillarSettings.ts — SOMENTE LEITURA para carregar settings.pilar.{hub,performance,predictability} por organizationId. NÃO editar (dono: 02). Se o repositório não for exportável para uso server-side por dependency-cruiser, documente e peça ajuste via handoff 00→02.

Suposições:
- Settings ausentes → aplicar PILLAR_DEFAULTS (comportamento atual preservado).
- Leituras de settings devem ser cacheadas por request, nunca por processo (multi-tenant).

Plano:
1. Mapear onde cada campo deve agir: stagnationDays→regra de deal parado; requireLossReason→obrigatoriedade ao perder negócio; benchmarkRate/repScore/anomalyAlerts→analytics/gamificação; modelType/freezeDay/confidenceFactor→forecastEngine/MetasHub.
2. Implementar leituras server-side com defaults honestos → verificar: teste unit por consumidor.
3. Cockpit: criar/ajustar componente que chame /api/commercial-intelligence/predictive/cockpit, tratar null/vazio honestamente; remover PredictiveRevenueCockpit.tsx mock e atualizar os 3 testes que o importam → verificar: tsc + vitest verdes.
4. Gates: npx tsc --noEmit, vitest dos domínios, npm run test:architecture se criar imports novos → verificar: verde.

Critério de sucesso final:
- PUT /api/settings/pillars/{hub,performance,predictability} altera comportamento observável; aba do cockpit mostra dados reais ou empty state honesto; zero mock residual.

Entrega:
Relatório por consumidor + evidência do cockpit + handoffs 04→08 (testes) e 04→00 (bloqueios).
