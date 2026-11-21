export const BUILD_APPEND_ONLY_AUDIT_LOGS_TRIGGER_SQL = `
CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is strictly append-only: % operations are forbidden', TG_OP
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON "AuditLog";
CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_mutation();
`.trim();

export function assertAuditLogOperationAllowed(operation: 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE'): void {
  if (operation === 'UPDATE' || operation === 'DELETE') {
    throw new Error(
      `Operação "${operation}" bloqueada: a tabela audit_logs é estritamente append-only ([18 · Ayla]).`,
    );
  }
}
