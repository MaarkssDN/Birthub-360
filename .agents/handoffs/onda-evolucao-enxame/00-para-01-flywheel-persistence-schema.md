De: Agente 00 — Coordenador Global
Para: Agente 01 — Plataforma, Segurança e Dados
Onda: Evolução Enxame IA
Status: resolvido
Prioridade: alto
Bloqueador-ref: REMED-06
Sprint destino: Sprint 1

## Problema
O serviço `CommercialLearningFlywheelService` armazena o aprendizado contínuo de abordagens comerciais e exemplos Few-Shot em memória (`Map`), com delegates mockados para `FlywheelApproachRecord` e `FlywheelFewShotExample`. Sem persistência no PostgreSQL, o aprendizado é volátil entre restarts e o expurgo exigido pela LGPD não persiste em banco.

## Arquivo(s) envolvido(s)
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/features/intelligence/services/commercialLearningFlywheel.service.ts`

## Evidência
Comentário explícito em `commercialLearningFlywheel.service.ts`:
"Delegates estruturais dos models FlywheelApproachRecord e FlywheelFewShotExample (ainda inexistentes no schema — handoff ao Agente 01)."

## Alteração necessária
1. Adicionar os models `FlywheelApproachRecord` e `FlywheelFewShotExample` no `schema.prisma`.
2. Incluir campo obrigatório `organizationId` com política RLS multi-tenant ativa.
3. Configurar relacionamento com `Organization` e `Lead`, com onDelete: Cascade para expurgo físico do titular.
4. Gerar migration via Prisma sem quebrar o baseline.

## Teste esperado
- `npx prisma validate`
- `npm run verify:migration-drift`
- Teste de inserção e exclusão atômica em transação com RLS ativado.

## Contexto adicional
Alinhado com a recomendação da LGPD (Agente 21) de exclusão física definitiva no exercício dos direitos do titular.

## Resolução
- **Status:** **RESOLVIDO E AUDITADO**
- **Data:** 2026-11-01
- **Executor:** Agente 01 — Plataforma, Segurança e Dados

### Ações Executadas:
1. **Auditoria de Schema e Migrations:**
   - Confirmado que os models `FlywheelApproachRecord` e `FlywheelFewShotExample` foram criados e versionados nas migrations `20261020220000_lgpd_consent_audit_chain_flywheel` e `20261027180000_flywheel_persistence_enrichment`.
   - Isolamento multi-tenant garantido por `organizationId` com `FORCE ROW LEVEL SECURITY` e política `tenant_isolation`.
   - Vínculos com `Organization` e `Lead` com integridade referencial `onDelete: Cascade`, garantindo expurgo físico imediato de titular conforme LGPD (Agente 21).
2. **Correção de Drift em `updatedAt`:**
   - Identificada e corrigida divergência pontual no `npm run verify:migration-drift` onde `@default(now())` na coluna `updatedAt` constava no DDL da migration (`NOT NULL DEFAULT CURRENT_TIMESTAMP`) mas faltava no `prisma/schema.prisma`.
   - Ajustada a declaração para `@default(now()) @updatedAt @db.Timestamptz(3)` em ambos os models.
3. **Evidências de Verificação dos Gates:**
   - `npx prisma validate` -> **PASS** (schema válido).
   - `npm run verify:migration-drift` -> **PASS** (No difference detected).
   - `npx prisma generate` -> **PASS** (Prisma Client v7.10.0 gerado).
   - `npm run typecheck` (`tsc --noEmit`) -> **PASS** (0 erros).
   - `tests/unit/features/intelligence/commercialLearningFlywheel.test.ts` -> **PASS** (8/8 testes).
   - `tests/integration/onda-01/intelligenceCoreFlow.integration.test.ts` -> **PASS** (3/3 testes).
