---
name: bitrix24-payload-validator
description: Validação e governança da integração com Bitrix24 (REST API e Webhooks). Cobre mapeamento de campos (CopilotoBitrixFieldMapping, ExternalCrmStageMapping), paginação batch (50 itens), rate limits por plano (2 a 5 req/s) e prevenção de falha silenciosa.
---

# Bitrix24 Payload Validator — Birth Hub 360

## Objetivo
Prevenir os bloqueadores prioritários **B-11** ("Sincronizações Bitrix que falham silenciosamente") e **B-12** ("Extrações Bitrix incompletas tratadas como definitivas"), alinhado aos models reais em `prisma/schema.prisma` (`BitrixConnection`, `BitrixSyncRule`, `BitrixSyncLog`, `BitrixExtractionRun`, `CopilotoBitrixFieldMapping` e `ExternalCrmStageMapping`).

## Regras de Integração

### 1. Limites de Taxa por Plano e Paginação em Lote
- O rate limit sustentável do Bitrix24 varia conforme o plano do portal:
  - **2 req/s** em planos Standard/Professional (padrão seguro);
  - **5 req/s** em planos Enterprise.
- Configure o throttling por conexão (`BitrixConnection` / `ExternalCrmConnection`).
- **Batching:** Utilize chamadas `batch` (`crm.lead.list`, `crm.deal.list`, `crm.contact.list`) para agrupar até 50 comandos por requisição HTTP.
- **Paginação:** Toda listagem retorna no máximo 50 itens por página com o cursor `start`. Nunca marque um `BitrixExtractionRun` como completo sem iterar até que `next` deixe de existir na resposta.

### 2. Mapeamento de Campos Customizados (`UF_CRM_*`)
- Campos customizados variam entre portais Bitrix24.
- Utilize os models existentes no schema (`CopilotoBitrixFieldMapping` para mapeamento de campos e `ExternalCrmStageMapping` / `ExternalEntityLink` para estágios e vínculos de entidades). Caso um novo model de mapeamento seja necessário, abra handoff para o Agente 01 (`prisma/schema.prisma`).

### 3. Webhooks de Entrada (`src/features/integrations/bitrix/bitrix.webhook.ts`)
- O lookup inicial de bootstrap por `connectionId` usa `bypassRls: true` restrito a `BitrixConnection` (allowlist em `src/lib/prisma.ts`); todo processamento subsequente roda escopado em `requestContext.run({ tenantId: connection.organizationId })`.

## Checklist de Confiabilidade
- [ ] Respostas de erro (`QUERY_LIMIT_EXCEEDED`, `error_description`) aplicam backoff e são registradas em `BitrixSyncLog` / `ExternalCrmSyncLog`?
- [ ] A extração persiste o progresso e valida o término da paginação (`next === undefined`) antes de concluir `BitrixExtractionRun`?
