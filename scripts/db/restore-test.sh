#!/usr/bin/env bash
# scripts/db/restore-test.sh — Ensaio de restauração a frio do PostgreSQL
# DEBT-0002: antes imprimia sucesso sem restaurar nada. Agora executa restore
# REAL em banco temporário e grava BACKUP-RESTORE-DRILL-RESULT.json datado.
#
# Uso:
#   ./restore-test.sh <arquivo.dump.enc>
#
# Variáveis:
#   BACKUP_ENCRYPTION_KEY   chave AES-256 do backup (obrigatória)
#   RESTORE_DATABASE_URL    URL de um banco TEMPORÁRIO vazio (obrigatória;
#                           ex.: postgresql://user:pass@host:5432/birthhub_restore_test)
#   DRILL_RESULT_DIR        destino do JSON de evidência (default: ./audit-evidence)
#
# O script FALHA (exit 1) se faltar qualquer pré-requisito — nunca reporta
# sucesso sem restore real.
set -euo pipefail

BACKUP_FILE="${1:-}"
[[ -n "$BACKUP_FILE" && -f "$BACKUP_FILE" ]] || { echo "[Restore-Test] ERRO: informe um arquivo .dump.enc existente." >&2; exit 1; }

KEY="${BACKUP_ENCRYPTION_KEY:-}"
[[ -n "$KEY" ]] || { echo "[Restore-Test] ERRO: BACKUP_ENCRYPTION_KEY não definida." >&2; exit 1; }

TARGET_URL="${RESTORE_DATABASE_URL:-}"
[[ -n "$TARGET_URL" ]] || { echo "[Restore-Test] ERRO: RESTORE_DATABASE_URL não definida (banco temporário vazio)." >&2; exit 1; }

command -v openssl >/dev/null 2>&1 || { echo "[Restore-Test] ERRO: openssl ausente." >&2; exit 1; }
command -v pg_restore >/dev/null 2>&1 || { echo "[Restore-Test] ERRO: pg_restore ausente." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "[Restore-Test] ERRO: psql ausente." >&2; exit 1; }

RESULT_DIR="${DRILL_RESULT_DIR:-./audit-evidence}"
mkdir -p "$RESULT_DIR"
TS="$(date +%Y%m%d_%H%M%S)"
RESULT_JSON="$RESULT_DIR/BACKUP-RESTORE-DRILL-RESULT-${TS}.json"
RAW_FILE="$(mktemp -t birthhub_restore.XXXXXX.dump)"

START_EPOCH=$(date +%s)
STATUS="FAIL"
ERROR_MSG=""

cleanup() { rm -f "$RAW_FILE"; }
trap cleanup EXIT

echo "[Restore-Test] Decifrando $BACKUP_FILE ..."
if ! openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$KEY" -in "$BACKUP_FILE" -out "$RAW_FILE" 2>/dev/null; then
  ERROR_MSG="falha na decifragem AES-256 (chave incorreta ou arquivo corrompido)"
else
  echo "[Restore-Test] Restaurando em banco temporário ..."
  if pg_restore --dbname="$TARGET_URL" --no-owner --no-privileges --exit-on-error "$RAW_FILE"; then
    # Sanity check: banco temporário deve ter tabelas
    TABLES=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
    if [[ "$TABLES" =~ ^[0-9]+$ && "$TABLES" -gt 0 ]]; then
      STATUS="PASS"
      echo "[Restore-Test] Restore OK — $TABLES tabelas em public."
    else
      ERROR_MSG="restore concluído mas banco temporário sem tabelas (count=$TABLES)"
    fi
  else
    ERROR_MSG="pg_restore falhou"
  fi
fi

END_EPOCH=$(date +%s)
DURATION=$((END_EPOCH - START_EPOCH))

cat > "$RESULT_JSON" <<EOF
{
  "drill": "cold-restore",
  "timestamp": "$(date -Is)",
  "backupFile": "$BACKUP_FILE",
  "target": "RESTORE_DATABASE_URL (temporário)",
  "status": "$STATUS",
  "durationSeconds": $DURATION,
  "error": $( [[ -n "$ERROR_MSG" ]] && printf '"%s"' "$ERROR_MSG" || printf 'null' ),
  "evidence": "restore real executado via pg_restore + sanity check information_schema"
}
EOF

echo "[Restore-Test] Evidência: $RESULT_JSON"
if [[ "$STATUS" != "PASS" ]]; then
  echo "[Restore-Test] FALHOU: $ERROR_MSG" >&2
  exit 1
fi
echo "[Restore-Test] Restauração a frio validada com sucesso."
