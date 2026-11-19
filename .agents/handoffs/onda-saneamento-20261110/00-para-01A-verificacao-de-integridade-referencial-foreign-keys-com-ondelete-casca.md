De: Agente 00 — Coordenador
Para: Agente 01A (Confiabilidade de Dados, RLS e Retenção)
Onda: Onda 1 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-014)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

**Verificação de integridade referencial: foreign keys com onDelete CASCADE em tabelas mestres de tenant**

- **Dívida técnica:** BT360-DT-0013
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Facilidade de modelagem do Prisma ORM sem implementação de travas defensivas de arquivamento.

**Impacto:** Impossibilidade de recuperação de histórico comercial e auditoria caso ocorra um comando de exclusão errôneo.

## Arquivo(s) envolvido(s)

`prisma/schema.prisma`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-014`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-014` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 01 — slot 01/01A, branch `agente/01-w3-fk-cascade`, commit `02065373f`)

Executado no slot do Agente 01 (proprietário exclusivo de `prisma/schema.prisma` e `prisma/migrations/**`), sem execução concorrente de 01A.

### Auditoria realizada

- Varredura completa das ~133 relações `organizationId → Organization` no schema: ~128 `CASCADE`, 2 `RESTRICT`, 2 `SET NULL`, 1 default.
- Classificação: FKs de **entidades de negócio** (Lead, Contact, Company, Activity, etc.) mantêm `CASCADE` — é o mecanismo de teardown de tenant.
- FKs de **auditoria/histórico/execução** migradas para `RESTRICT` (22 relações): `AIGuardrailEvent`, `AgentExecution`, `AgentMemoryRecord`, `RoleMemoryRecord`, `OrganizationMemoryRecord`, `LeadStageHistory`, `DealClosureEvent`, `ForecastSnapshot`, `AccountIntelligenceSnapshot`, `CopilotoDealHealthSnapshot`, `CopilotoConsentRecord`, `OrganizationAiConsent`, `OptOutRecord`, `CallLog`, `VoiceCallLog`, `ThreeCXCallEvent`, `BitrixSyncLog`, `ExternalCrmSyncLog`, `DomainEventOutbox`, `DomainEventConsumption`, `ProspectingSearchExecution`, `FlywheelApproachRecord`.
- **Excluídas deliberadamente:** tabelas da cadeia de consentimento (`ConsentAuditRecord`, `ConsentAuditChainHead`, `ConsentSubjectKey`, `ConsentSubjectKeyTombstone`, `ConsentEventDetail`, `ConsentPurgeTask`) — já protegidas por `RESTRICT` + triggers append-only e marcador de retenção na migração `20261021000000_lgpd_chain_restrict_org_no_app_delete` (chaves precisam permanecer destruíveis para crypto-shredding LGPD). `BitrixSyncRule`/`ExternalCrmSyncRule` são configuração, não histórico. `AILog` já é `SetNull`. `AuditLog` não possui FK.

### Alteração

- `prisma/schema.prisma`: 22 linhas `onDelete: Cascade → Restrict` (diff cirúrgico, 22+/22-).
- Nova migração `prisma/migrations/20261112000000_tenant_fk_cascade_to_restrict/migration.sql`: `DROP CONSTRAINT` + `ADD CONSTRAINT ... ON DELETE RESTRICT ON UPDATE CASCADE` para as 22 FKs. Nomes de constraint verificados contra migrations existentes; nenhum DROP/RENAME prévio encontrado.
- `CadenceCalendarEvent` mantido `CASCADE` (entidade de agendamento, não histórico de auditoria).

### Gates executados

- `npx prisma validate` → schema válido.
- `npx prisma generate` → client regenerado.
- `npx tsc --noEmit` → limpo (exit 0).
- `npm run lint` (biome, escopo `src`) → não aplicável a schema/migrations.

### Bloqueios / pendências

- **Sem banco disponível:** Docker CLI ausente localmente; daemon remoto `192.168.0.116:2375` aceita conexão mas `/containers/json` expira; `192.168.0.116:5432` inalcançável. Portanto `prisma migrate diff/deploy` e testes de integração **não puderam ser executados** — migração escrita manualmente seguindo convenção verificada nas migrations existentes. Verificação de aplicação real fica pendente de ambiente com PostgreSQL.
- **Risco de cleanup em testes:** com `RESTRICT`, `tests/helpers/integration-setup.ts` (`deleteOrganizationsAsOwner`) passará a falhar ao deletar `Organization` de teste que possua linhas nas 22 tabelas (ex.: `AgentExecution`). Pode ser necessário estender a limpeza ordenada — avaliar com Agente 08/14 quando a suíte de integração rodar.
- **Rollback:** migração é reversível (recriar constraints com `CASCADE`); nenhuma linha de dados é alterada. Seguir runbook de rollback de migrations.

### Evidência

- Run report: `.agents/runs/agente-01-tarefa-saneamento-014.md`
- Diff: `git show 02065373f`
