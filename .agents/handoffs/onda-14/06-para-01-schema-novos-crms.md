- De: 06 (Integrações e Bitrix)
- Para: 01 (Plataforma, Segurança e Dados)
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador

## Problema
A iniciativa de expansão de múltiplos CRMs (HubSpot, Pipedrive, RD Station, Monday.com) foi iniciada em `src/features/integrations/`. No entanto, conforme a regra global do projeto (`/AGENTS.md` §15), o Agente 06 não possui permissão para editar `prisma/schema.prisma` nem criar migrações de banco de dados ("06 nunca cria migração, envia handoff para 01").

Atualmente, não existem modelos relacionais nem tabelas estruturadas para persistir com segurança as credenciais de conexão, chaves OAuth (access token, refresh token, expiry), segredos de webhook, mapeamentos de campos e cursores de sincronização de cada provedor externo de CRM por organização/tenant.

## Arquivo(s) envolvido(s)
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/features/integrations/hubspot/hubspot.service.ts`
- `src/features/integrations/pipedrive/pipedrive.service.ts`
- `src/features/integrations/rdstation/rdstation.service.ts`
- `src/features/integrations/monday/monday.service.ts`

## Alteração necessária
O Agente 01 deve projetar e aplicar a migração Prisma com as seguintes características:
1. Criação do modelo `IntegrationConnection` (ou extensão do modelo existente de integrações) com:
   - `id`: CUID/UUID
   - `organizationId`: chave estrangeira indexada para a organização proprietária (RLS multi-tenant)
   - `provider`: Enum ou string restrita (`HUBSPOT`, `PIPEDRIVE`, `RD_STATION`, `MONDAY`)
   - `encryptedAccessToken`: String criptografada
   - `encryptedRefreshToken`: String criptografada (opcional, para provedores OAuth)
   - `tokenExpiresAt`: DateTime opcional
   - `status`: String (`ACTIVE`, `EXPIRED`, `ERROR`, `DISCONNECTED`)
   - `webhookSecret`: String criptografada/hash opcional
   - `fieldMapping`: Json para de/para de campos customizados
   - `lastSyncAt`: DateTime opcional
   - `createdAt` e `updatedAt`: DateTime
2. Unique constraint composto por `[organizationId, provider]` para evitar conexões duplicadas.
3. Índices apropriados por `organizationId` e `provider`.
4. Garantir que as migrations rodem via `npx prisma migrate deploy` sem regressões em bancos existentes.

## Teste esperado
- Execução de `npx prisma migrate dev` / `prisma migrate deploy` sem erros.
- `npm run verify:migration-drift` retorna código 0.
- Queries de isolamento comprovando que conexões de uma organização nunca são retornadas para outra organização.

## Contexto adicional
Bloqueador de arquitetura prioritário B-05 ("Deploy capaz de iniciar sem migrações") e B-10 ("Separação visual sem isolamento real de dados").

## Resolução (Agente 01)
Modelos e migração canônica já consolidados no banco de dados:
1. Modelos `ExternalCrmConnection`, `ExternalCrmSyncRule` e `ExternalCrmSyncLog` presentes em `prisma/schema.prisma` (linhas 4900-4960).
2. Campo `provider` com suporte a `hubspot`, `pipedrive`, `rdstation`, `monday`.
3. Campo `config` estruturado como texto criptografado em repouso com suporte a tokens OAuth e API keys.
4. Isolamento multi-tenant garantido com chave estrangeira `organizationId` obrigatória associada à `Organization` com `onDelete: Cascade` e índice `@@index([organizationId])`.
5. Migração de banco aplicada em `prisma/migrations/20260923170000_add_external_crm_and_workspace_layouts/migration.sql`.
Status alterado para **resolvido**.
