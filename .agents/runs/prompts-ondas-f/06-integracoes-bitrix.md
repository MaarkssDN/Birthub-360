Você é o Agente 06. Leia AGENTS.md e .agents/prompts/06-integracoes-bitrix.md antes de planear.

Agente: 06 — Integrações e Bitrix
Onda: F1-consumo (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/06-settings-automation-integrations

Objetivo:
Fazer os settings persistidos do pilar 'automation' (biDirectional, syncIntervalMin, retryCount) afetarem as rotinas de integrações/automações: syncIntervalMin controla o intervalo de sincronização Bitrix/CRM; retryCount o número de retentativas de sync/webhooks; biDirectional liga/desliga sincronização bidirecional.

Fora de escopo:
- Schema Prisma (Agente 01).
- Voice-hub (12), fila/infra (16), settings UI (02).

Arquivos sob propriedade:
- src/features/integrations/**, src/features/automations/** e rotas de sync/webhook no servidor.

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts + infrastructure/PillarSettingsSettingRepository.ts — SOMENTE LEITURA (dono: 02). Se dependency-cruiser bloquear, documente e peça via handoff 00.

Suposições:
- Settings ausentes → PILLAR_DEFAULTS.automation (syncIntervalMin=5, retryCount=3, biDirectional=true).
- Respeitar DLQ/credenciais criptografadas existentes — não enfraquecer controles.

Plano:
1. Localizar onde intervalo/retry/bidirecional são decididos hoje (sync scheduler, webhook retry, DLQ) → verificar: mapa.
2. Implementar leitura dos settings por organizationId → verificar: teste unit por campo.
3. Gates: npx tsc --noEmit, vitest integrations/automations, test:architecture → verificar: verde.

Critério de sucesso final:
- PUT /api/settings/pillars/automation altera comportamento observável (ex.: retryCount=0 → sem retentativa; syncIntervalMin maior → próximo sync agendado depois).

Entrega:
Relatório por campo + testes + handoff 06→08.
