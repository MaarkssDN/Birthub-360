Você é o Agente 17. Leia AGENTS.md e .agents/prompts/17-cadencia-ciclo-receita.md antes de planejar.

Agente: 17 — Cadência Multicanal e Ciclo de Receita
Onda: F3b + F1-consumo (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/17-jornadas-backend-e-settings-sales

Objetivo:
Duas frentes do seu domínio: (a) implementar services/endpoints reais para Jornadas, Processos e Roteiros em sales-orchestration consumindo os models criados pelo Agente 01; (b) fazer os settings persistidos do pilar 'sales' (speedToLeadMin, requireBant, dailyTouchesLimit) afetarem de fato as rotinas de cadência/orquestração.

Fora de escopo:
- Schema Prisma/migrations (Agente 01 — aguarde o handoff dele).
- UI (Agente 02).
- Voice-hub/outbound (Agente 12).

Arquivos sob propriedade:
- src/features/sales-orchestration/**
- src/features/cadence/**
- Rotas de cadência/orquestração no servidor.

Arquivos de outros donos necessários:
- prisma/schema.prisma (somente leitura dos models do 01)
- src/features/settings/domain/pillarSettings.ts (somente leitura — chave 'settings.pilar.sales'; reusar PillarSettingsSettingRepository para leitura)

Suposições:
- Settings são lidos server-side por organizationId; defaults = PILLAR_DEFAULTS.sales quando nada persistido.
- Nenhum consumidor pode quebrar se o Setting não existir.

Plano:
1. Aguardar/consumir handoff 01→17 com os models → verificar: contract conhecido.
2. Estender SalesOrchestrationService para ler jornadas/processos/roteiros dos novos models via authReq.db (tenant/RLS), mantendo source:'real' e meta.unavailableMetrics honestos → verificar: com DB vazio retorna [] e emptySections.
3. Aplicar settings.pilar.sales: speedToLeadMin nas regras de first-touch, requireBant na qualificação, dailyTouchesLimit nos guards de cadência → verificar: teste unit por campo.
4. Gates: npx tsc --noEmit, vitest dos domínios tocados → verificar: verde.

Critério de sucesso final:
- Overview retorna jornadas/processos/roteiros reais quando houver dados; settings alterados via PUT /api/settings/pillars/sales mudam o comportamento observável (ex.: bloqueio de touch acima do limite).

Entrega:
Relatório por frente + testes executados + handoff 17→08 para cobertura e2e.
