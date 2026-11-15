-- Migration: 20261114160000_auditlog_append_only_immutability
-- Demanda: DEM-20261114-003 (follow-up Onda 2, Agente 01) — MEL-10
-- Classificação (runbook docs/security/runbooks/MIGRATION_ROLLBACK.md): ADITIVA —
-- somente CREATE FUNCTION + CREATE TRIGGER. Nenhuma linha existente é lida,
-- alterada ou removida; INSERTs futuros em "AuditLog" não são afetados.
--
-- Contexto: a entrega original do MEL-10 (commit 113f52196) só adicionou valores ao
-- union type `AuditAction` e endureceu AuditService.log para relançar erro dentro de
-- transação — mas "AuditLog" continuava uma tabela comum: qualquer UPDATE/DELETE/
-- TRUNCATE (bug, SQL injection, sessão admin, job de retenção mal escrito) apagava ou
-- reescrevia a trilha de auditoria sem deixar rastro. O modelo de dados e a RLS
-- (FORCE ROW LEVEL SECURITY, tenant_isolation_policy) já existiam; faltava a
-- imutabilidade no banco.
--
-- Decisão: trigger BEFORE UPDATE OR DELETE + BEFORE TRUNCATE, no mesmo padrão de
-- `consent_audit_immutable()` (migration 20261020220000_lgpd_consent_audit_chain_flywheel).
-- O trigger dispara para QUALQUER papel — inclusive o dono (prospector_migrator) e
-- superusuários — então não depende de GRANT/REVOKE nem do bootstrap de papéis
-- (scripts/db/create-app-role.sql), que re-concede DML completo em toda tabela não
-- listada em `birthub.restricted_no_delete_tables` a cada re-execução. Um REVOKE de
-- privilégio seria desfeito pelo próximo bootstrap; o trigger é a proteção real.
--
-- Consequência operacional assumida: NÃO existe hoje nenhum caminho de código que
-- atualize ou delete linhas de AuditLog (verificado por grep em src/ e scripts/ —
-- AuditService.log só faz INSERT; interceptors só criam). Retenção/expurgo futuro de
-- AuditLog (decisão ainda aberta com 21/01A — ver schema.prisma ~L5841) NÃO poderá
-- ser um DELETE simples: exigirá uma migration que derrube estes triggers
-- deliberadamente, o que é exatamente o comportamento desejado para um log de
-- auditoria (a destruição da trilha deve ser um ato explícito e auditável).

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog é append-only (% bloqueado)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;

CREATE TRIGGER auditlog_no_mutation
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE TRIGGER auditlog_no_truncate
BEFORE TRUNCATE ON "AuditLog"
FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();

-- ROLLBACK (manual, se necessário — migration aditiva; remover a proteção é decisão
-- explícita de governança, não operação rotineira):
-- DROP TRIGGER IF EXISTS auditlog_no_mutation ON "AuditLog";
-- DROP TRIGGER IF EXISTS auditlog_no_truncate ON "AuditLog";
-- DROP FUNCTION IF EXISTS audit_log_immutable();
-- Em ambiente com `prisma migrate` gerenciado: `prisma migrate resolve --rolled-back
-- 20261114160000_auditlog_append_only_immutability` após aplicar o SQL acima
-- manualmente (ver docs/security/runbooks/MIGRATION_ROLLBACK.md, Passo 1).
