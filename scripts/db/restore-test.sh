#!/usr/bin/env bash
# scripts/db/restore-test.sh — Ensaio de restauração a frio do PostgreSQL (DEBT-0002)
#
# Restaura o backup mais recente (ou BACKUP_FILE) em um banco TEMPORÁRIO isolado,
# executa sanity checks e grava evidência em BACKUP-RESTORE-DRILL-RESULT.json.
# NUNCA declara sucesso sem ter restaurado de fato.
#
# Variáveis de ambiente:
#   BACKUP_FILE                 caminho do artefato (.sql | .sql.gz | .sql.enc | .sql.gz.enc).
#                               Default: backup mais recente em BACKUP_DEST_DIR.
#   BACKUP_ENCRYPTION_PASSPHRASE obrigatória se o artefato for .enc.
#   DRILL_ADMIN_DATABASE_URL    connection string de manutenção para CREATE/DROP DATABASE.
#                               Fallback: DATABASE_URL. O banco-alvo NÃO é tocado.
#   DRILL_RESULT_PATH           destino do JSON de evidência
#                               (default: $BACKUP_DEST_DIR/BACKUP-RESTORE-DRILL-RESULT.json).
#   BACKUP_DEST_DIR / BACKUP_DIR diretório varrido por backups (default: /var/backups/birthhub).
#
# Exit codes: 0 = drill passou | 1 = drill falhou | 2 = pré-requisitos ausentes
# (JSON gravado com status "not_executable" + reason — nunca sucesso falso).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/birthhub}"
BACKUP_DEST_DIR="${BACKUP_DEST_DIR:-${BACKUP_DIR}}"
RESULT_PATH="${DRILL_RESULT_PATH:-$BACKUP_DEST_DIR/BACKUP-RESTORE-DRILL-RESULT.json}"
# Garante um local gravável para a evidência; fallback para ./backups (gitignored).
if ! mkdir -p "$(dirname "$RESULT_PATH")" 2>/dev/null; then
  RESULT_PATH="./backups/BACKUP-RESTORE-DRILL-RESULT.json"
fi
DRILL_DB="birthhub_restore_drill_$(date +%s)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

write_result() {
  # $1=status $2=stage $3=reason(ou "") $4=extra_json(ou "")
  local status="$1" stage="$2" reason="$3" extra="${4:-}"
  mkdir -p "$(dirname "$RESULT_PATH")" 2>/dev/null || true
  {
    printf '{\n'
    printf '  "timestamp": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  "script": "scripts/db/restore-test.sh",\n'
    printf '  "status": "%s",\n' "$status"
    printf '  "stage": "%s",\n' "$stage"
    if [[ -n "$reason" ]]; then printf '  "reason": "%s",\n' "$(json_escape "$reason")"; fi
    printf '  "backup_file": "%s",\n' "$(json_escape "${BACKUP_FILE:-}")"
    printf '  "drill_database": "%s"%s\n' "$DRILL_DB" "${extra:+,}"
    if [[ -n "$extra" ]]; then printf '%b\n' "$extra"; fi
    printf '}\n'
  } > "$RESULT_PATH" 2>/dev/null || {
    echo "[restore-test] AVISO: não foi possível gravar $RESULT_PATH" >&2
  }
}

not_executable() {
  local reason="$1"
  echo "[restore-test] NÃO EXECUTÁVEL: $reason" >&2
  write_result "not_executable" "preflight" "$reason"
  exit 2
}

fail() {
  local stage="$1" reason="$2"
  echo "[restore-test] FALHA em $stage: $reason" >&2
  write_result "failed" "$stage" "$reason"
  # Limpeza best-effort do banco de drill.
  [[ -n "${ADMIN_URL:-}" ]] && command -v psql >/dev/null 2>&1 && \
    psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$DRILL_DB\"" >/dev/null 2>&1 || true
  exit 1
}

# --- 1. Resolver artefato de backup -----------------------------------------
if [[ -n "${BACKUP_FILE:-}" ]]; then
  [[ -f "$BACKUP_FILE" ]] || not_executable "BACKUP_FILE não existe: $BACKUP_FILE"
else
  mkdir -p "$BACKUP_DEST_DIR" 2>/dev/null || true
  BACKUP_FILE="$(find "$BACKUP_DEST_DIR" -maxdepth 1 -type f \
    \( -name 'birthhub_backup_*.sql.gz.enc' -o -name 'birthhub_backup_*.sql.enc' \
       -o -name '*.sql.gz' -o -name '*.sql' \) -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -1 | cut -d' ' -f2- || true)"
  [[ -n "$BACKUP_FILE" && -f "$BACKUP_FILE" ]] \
    || not_executable "nenhum backup encontrado em $BACKUP_DEST_DIR (rode backup-encrypted.sh ou scripts/backup.sh antes)."
fi
echo "[restore-test] Artefato: $BACKUP_FILE"

# --- 2. Pré-requisitos -------------------------------------------------------
command -v psql >/dev/null 2>&1 || not_executable "psql não encontrado no PATH."
ADMIN_URL="${DRILL_ADMIN_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "$ADMIN_URL" ]] || not_executable "DRILL_ADMIN_DATABASE_URL (ou DATABASE_URL) não definida — necessário para criar/dropar o banco de drill."

case "$BACKUP_FILE" in
  *.enc) ENCRYPTED=1 ;;
  *)     ENCRYPTED=0 ;;
esac
if [[ "$ENCRYPTED" == "1" ]]; then
  [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]] \
    || not_executable "artefato criptografado exige BACKUP_ENCRYPTION_PASSPHRASE."
fi

# --- 3. Materializar SQL em claro em diretório temporário ---------------------
# Pipeline direto conforme os sufixos do artefato; o claro só existe em $WORKDIR.
PLAIN_SQL="$WORKDIR/restore.sql"
case "$BACKUP_FILE" in
  *.sql.gz.enc)
    openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$BACKUP_ENCRYPTION_PASSPHRASE" -in "$BACKUP_FILE" 2>/dev/null \
      | gzip -dc > "$PLAIN_SQL" \
      || fail "decrypt" "decifragem/descompressão falhou (chave errada ou arquivo corrompido)."
    ;;
  *.sql.enc)
    openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$BACKUP_ENCRYPTION_PASSPHRASE" -in "$BACKUP_FILE" 2>/dev/null \
      > "$PLAIN_SQL" \
      || fail "decrypt" "decifragem falhou (chave errada ou arquivo corrompido)."
    ;;
  *.sql.gz)
    gzip -dc "$BACKUP_FILE" > "$PLAIN_SQL" 2>/dev/null \
      || fail "decompress" "gunzip falhou (arquivo corrompido)."
    ;;
  *.sql)
    cp "$BACKUP_FILE" "$PLAIN_SQL"
    ;;
  *)
    not_executable "extensão de backup não reconhecida: $BACKUP_FILE"
    ;;
esac
[[ -s "$PLAIN_SQL" ]] || fail "materialize" "SQL materializado vazio."
grep -qi "PostgreSQL database dump\|PostgreSQL.*dump" "$PLAIN_SQL" \
  || fail "materialize" "artefato não contém dump PostgreSQL reconhecível."

# --- 4. Criar banco temporário ----------------------------------------------
# Deriva a URL do drill trocando o path/dbname da URL de manutenção.
BASE_URL="${ADMIN_URL%%\?*}"
QUERY=""
[[ "$ADMIN_URL" == *\?* ]] && QUERY="?${ADMIN_URL#*\?}"
DRILL_URL="${BASE_URL%/*}/$DRILL_DB$QUERY"

T0=$(date +%s)
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -q \
  -c "CREATE DATABASE \"$DRILL_DB\"" >/dev/null 2>&1 \
  || fail "create_db" "não foi possível criar o banco temporário '$DRILL_DB'."

# --- 5. Restaurar -----------------------------------------------------------
psql "$DRILL_URL" -v ON_ERROR_STOP=1 -q -f "$PLAIN_SQL" >/dev/null 2>"$WORKDIR/psql.err" \
  || { ERR=$(tail -5 "$WORKDIR/psql.err" | tr '\n' ' '); fail "restore" "psql falhou: $ERR"; }
T1=$(date +%s)
RESTORE_SECONDS=$((T1 - T0))

# --- 6. Sanity checks --------------------------------------------------------
TABLES=$(psql "$DRILL_URL" -Atc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null) \
  || fail "verify" "query de sanity check falhou no banco restaurado."
[[ "$TABLES" =~ ^[0-9]+$ && "$TABLES" -gt 0 ]] \
  || fail "verify" "banco restaurado tem 0 tabelas em 'public' — restore suspeito."

MIGRATIONS=""
if psql "$DRILL_URL" -Atc "SELECT to_regclass('public.\"_prisma_migrations\"') IS NOT NULL" 2>/dev/null | grep -q '^t$'; then
  MIGRATIONS=$(psql "$DRILL_URL" -Atc 'SELECT count(*) FROM "_prisma_migrations"' 2>/dev/null || echo "unknown")
fi

# --- 7. Drop do banco temporário ----------------------------------------------
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -q \
  -c "DROP DATABASE IF EXISTS \"$DRILL_DB\"" >/dev/null 2>&1 \
  || echo "[restore-test] AVISO: DROP DATABASE '$DRILL_DB' falhou — remover manualmente." >&2

SHA256=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
EXTRA=""
[[ -n "$MIGRATIONS" ]] && EXTRA=",\n  \"prisma_migrations_applied\": $MIGRATIONS"
write_result "passed" "complete" "" \
  "  \"sha256\": \"$SHA256\",\n  \"restore_seconds\": $RESTORE_SECONDS,\n  \"tables_in_public\": $TABLES$EXTRA"

echo "[restore-test] DRILL PASSOU: $TABLES tabelas restauradas em ${RESTORE_SECONDS}s."
echo "[restore-test] Evidência: $RESULT_PATH"
exit 0
