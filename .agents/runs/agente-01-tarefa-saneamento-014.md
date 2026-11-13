# Run Report — Agente 01 — TAREFA-SANEAMENTO-014 / BT360-DT-0013

- **Data:** 2026-11-12
- **Branch:** `agente/01-w3-fk-cascade`
- **Commit:** `02065373f` — `fix(prisma): FKs de auditoria/histórico tenant -> RESTRICT (TAREFA-SANEAMENTO-014)`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-01A-verificacao-de-integridade-referencial-foreign-keys-com-ondelete-casca.md` (destinado a 01A; executado no slot 01 por ser proprietário exclusivo de `prisma/schema.prisma` e `prisma/migrations/**`, sem concorrência de 01A)
- **Status:** EM_ANDAMENTO — aguardando revisão formal do Agente 24

## Objetivo

Verificar integridade referencial das FKs `onDelete` no schema Prisma e corrigir CASCADE indevido em tabelas mestres de auditoria/histórico, preservando CASCADE nas entidades de negócio (mecanismo de teardown de tenant).

## Descoberta (P1)

Varredura das relações `organizationId → Organization` em `prisma/schema.prisma`:

- ~133 relações no total.
- ~128 `CASCADE`, 2 `RESTRICT`, 2 `SET NULL`, 1 default.
- A maioria dos CASCADE pertence a entidades de negócio descartáveis com o tenant — comportamento correto.
- 22 relações CASCADE pertenciam a tabelas de **execução, memória de agente, histórico comercial, consentimento de IA, logs de voz/CRM, outbox de eventos e snapshots** — exclusão em cascata tornava impossível recuperar histórico comercial/auditoria após exclusão errônea de tenant.

### Exceções deliberadas (não alteradas)

- `ConsentAuditRecord`, `ConsentAuditChainHead`: já `RESTRICT` + triggers append-only (migração `20261021000000_lgpd_chain_restrict_org_no_app_delete`).
- `ConsentSubjectKey`, `ConsentSubjectKeyTombstone`, `ConsentEventDetail`, `ConsentPurgeTask`: criptografia/chave da cadeia de consentimento — as chaves precisam permanecer destruíveis para crypto-shredding LGPD; alteração de semântica aqui foi explicitamente evitada.
- `BitrixSyncRule`, `ExternalCrmSyncRule`: configuração, não histórico.
- `AILog`: já `SetNull`. `AuditLog`: sem FK (tenantId escalar).
- `User → Organization`: já `RESTRICT`.
- `CadenceCalendarEvent`: entidade de agendamento (negócio), mantida `CASCADE`.

## Alteração cirúrgica

1. `prisma/schema.prisma` — 22 linhas `onDelete: Cascade` → `onDelete: Restrict` nas relações `organization` das tabelas listadas. Diff total: 22+/22-.
2. `prisma/migrations/20261112000000_tenant_fk_cascade_to_restrict/migration.sql` — nova migração com `DROP CONSTRAINT` + `ADD CONSTRAINT ... ON DELETE RESTRICT ON UPDATE CASCADE` para cada uma das 22 FKs.

### Tabelas alteradas (22)

`AIGuardrailEvent`, `AgentExecution`, `AgentMemoryRecord`, `RoleMemoryRecord`, `OrganizationMemoryRecord`, `LeadStageHistory`, `DealClosureEvent`, `ForecastSnapshot`, `AccountIntelligenceSnapshot`, `CopilotoDealHealthSnapshot`, `CopilotoConsentRecord`, `OrganizationAiConsent`, `OptOutRecord`, `CallLog`, `VoiceCallLog`, `ThreeCXCallEvent`, `BitrixSyncLog`, `ExternalCrmSyncLog`, `DomainEventOutbox`, `DomainEventConsumption`, `ProspectingSearchExecution`, `FlywheelApproachRecord`.

### Verificação de nomes de constraint

- Todos os nomes `<Tabela>_organizationId_fkey` confirmados nas migrations existentes.
- Nenhum `DROP CONSTRAINT`/`RENAME` prévio sobre esses nomes encontrado (script de varredura).
- `@@map` conferido: todos os nomes de tabela = nome do model.

## Gates executados

| Gate | Resultado |
|---|---|
| `npx prisma validate` | ✅ schema válido |
| `npx prisma generate` | ✅ client regenerado |
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` (biome `src`) | ➖ não aplicável (somente schema/migrations alterados) |
| `npm run test:unit` / `test:integration` | ❌ bloqueado — sem PostgreSQL acessível |
| `prisma migrate diff/deploy` | ❌ bloqueado — sem banco; SQL escrito manualmente |

## Bloqueios de infraestrutura

- Docker CLI ausente no ambiente local.
- Daemon remoto `192.168.0.116:2375`: `/info` e `/version` respondem, mas `/containers/json` expira (timeout 25s sem bytes).
- PostgreSQL `192.168.0.116:5432`: conexão TCP expira.
- Conclusão: **não foi possível validar a migração contra um banco real**. O SQL segue exatamente a convenção das migrations existentes (DROP + ADD CONSTRAINT), mas a aplicação real (`migrate deploy`) e os testes de integração permanecem pendentes de ambiente.

## Riscos / pendências para revisão

1. **Cleanup de testes de integração:** `tests/helpers/integration-setup.ts` deleta `Organization` como owner; com `RESTRICT`, a deleção falhará quando houver linhas nas 22 tabelas (ex.: `AgentExecution` criada por testes de agente). Avaliar extensão da limpeza ordenada com Agente 08/14 — **não alterado** por estar fora da propriedade do Agente 01.
2. **Semântica de teardown de tenant em produção:** a exclusão de `Organization` já é bloqueada para o role da aplicação (ver migração LGPD anterior); `RESTRICT` reforça a exigência de purge explícito/retention marker — comportamento intencional.
3. **Rollback:** reversível — recriar as constraints com `ON DELETE CASCADE`. Nenhuma linha de dados é modificada. Consultar runbook de rollback de migrations.

## Arquivos

- `prisma/schema.prisma` (modificado)
- `prisma/migrations/20261112000000_tenant_fk_cascade_to_restrict/migration.sql` (novo)
- `.agents/handoffs/onda-saneamento-20261110/00-para-01A-...-ondelete-casca.md` (status + resolução)
- `.agents/runs/agente-01-tarefa-saneamento-014.md` (este relatório)
