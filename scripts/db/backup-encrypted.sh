#!/usr/bin/env bash
# scripts/db/backup-encrypted.sh — Backup criptografado do PostgreSQL (AES-256-CBC)
# DEBT-0002 / Agente 10 — Infraestrutura, Observabilidade e SRE
#
# Uso:
#   ./scripts/db/backup-encrypted.sh                  # backup real: pg_dump -> gzip -> AES-256
#   ./scripts/db/backup-encrypted.sh --verify-crypto   # self-test do pipeline criptográfico
#
# Variáveis de ambiente (backup real):
#   BACKUP_DATABASE_URL         (obrigatória) — connection string do banco alvo.
#                                Fallback: DATABASE_URL (com aviso no log).
#   BACKUP_ENCRYPTION_PASSPHRASE (obrigatória) — senha simétrica AES-256.
#                                NUNCA usar valor default; falha fechada sem ela.
#   BACKUP_DEST_DIR             destino local dos artefatos .sql.gz.enc
#                                (default: /var/backups/birthhub; BACKUP_DIR é alias legado).
#   BACKUP_RETENTION_DAYS       retenção local em dias (default: 30; 0 desativa).
#   BACKUP_SCP_TARGET           opcional — "user@host:/dir/remoto" para cópia via scp.
#                                Se definido e a cópia falhar, o script FALHA (exit != 0).
#   BACKUP_ALL_DATABASES=1      usa pg_dumpall (cluster inteiro) em vez de pg_dump.
#   BACKUP_DOCKER_CONTAINER     fallback docker quando pg_dump/pg_dumpall não existem
#                                no PATH (default: birthhub_postgres, convenção do repo).
#
# PENDENTE OPERACIONAL (decisão humana/ops — ver handoff do Agente 10):
#   Este script NÃO se auto-agenda. Em produção é necessário um cron/systemd timer
#   ou agendador externo apontando para cá, com as envs acima provisionadas via
#   secret manager. A cópia fora do host (BACKUP_SCP_TARGET ou equivalente) também
#   é configuração operacional, não embutida.
set -euo pipefail

die() {
  echo "[backup-encrypted] ERRO: $*" >&2
  exit 1
}

if [[ "${1:-}" == "--verify-crypto" ]]; then
  # Self-test não exige destino de backup gravável em /var; usa tmpdir como fallback.
  BACKUP_DIR="${BACKUP_DIR:-${TMPDIR:-/tmp}}"
  mkdir -p "$BACKUP_DIR"
  echo "[Crypto-Check] Testando cifra e decifra AES-256 simétrica..."
  TEST_PAYLOAD="BIRTHUB360_CANONICAL_TEST_PAYLOAD_$(date +%s)_$$"
  CIPHER_FILE="$BACKUP_DIR/test_crypto.enc"
  DECRYPT_FILE="$BACKUP_DIR/test_crypto.dec"
  cleanup_crypto() { rm -f "$CIPHER_FILE" "$DECRYPT_FILE" 2>/dev/null || true; }
  trap cleanup_crypto EXIT
  cleanup_crypto

  fail_crypto() {
    echo "[Crypto-Check] Falha na validação criptográfica: $1" >&2
    exit 1
  }

  command -v openssl >/dev/null 2>&1 || fail_crypto "openssl não encontrado no PATH."
  KEY="${BACKUP_VERIFY_KEY:-$(openssl rand -hex 32)}"
  [[ -n "$KEY" ]] || fail_crypto "não foi possível obter a chave de verificação."

  # Sem fallback em claro: se cifrar ou decifrar falhar, a verificação falha (exit != 0).
  printf '%s' "$TEST_PAYLOAD" | openssl enc -aes-256-cbc -pbkdf2 -pass "pass:$KEY" -out "$CIPHER_FILE" 2>/dev/null \
    || fail_crypto "cifragem com openssl falhou."
  [[ -s "$CIPHER_FILE" ]] || fail_crypto "arquivo cifrado vazio ou ausente."
  if cmp -s <(printf '%s' "$TEST_PAYLOAD") "$CIPHER_FILE"; then
    fail_crypto "arquivo cifrado idêntico ao payload em claro."
  fi

  openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$KEY" -in "$CIPHER_FILE" -out "$DECRYPT_FILE" 2>/dev/null \
    || fail_crypto "decifragem com openssl falhou."

  [[ "$(cat "$DECRYPT_FILE")" == "$TEST_PAYLOAD" ]] \
    || fail_crypto "round-trip não confere com o payload original."

  echo "[Crypto-Check] Criptografia AES-256 validada com sucesso (round-trip conferido)."
  exit 0
fi

# ---------------------------------------------------------------------------
# Backup real: pg_dump (ou pg_dumpall) -> gzip -> AES-256-CBC, tudo em pipeline
# (o dump em claro nunca toca o disco). Qualquer falha -> exit != 0.
# ---------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-/var/backups/birthhub}"
BACKUP_DEST_DIR="${BACKUP_DEST_DIR:-$BACKUP_DIR}"
mkdir -p "$BACKUP_DEST_DIR" \
  || die "não foi possível criar o diretório de destino $BACKUP_DEST_DIR."

DB_URL="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "$DB_URL" ]] || die "BACKUP_DATABASE_URL (ou DATABASE_URL) não definida. Configure a connection string do banco alvo."
if [[ -z "${BACKUP_DATABASE_URL:-}" ]]; then
  echo "[backup-encrypted] AVISO: BACKUP_DATABASE_URL ausente; usando DATABASE_URL." >&2
fi

PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE:-}"
[[ -n "$PASSPHRASE" ]] || die "BACKUP_ENCRYPTION_PASSPHRASE não definida. Backup sem criptografia é proibido."

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DOCKER_CONTAINER="${BACKUP_DOCKER_CONTAINER:-birthhub_postgres}"
ALL_DATABASES="${BACKUP_ALL_DATABASES:-0}"

command -v openssl >/dev/null 2>&1 || die "openssl não encontrado no PATH."
command -v gzip >/dev/null 2>&1 || die "gzip não encontrado no PATH."

DUMP_BIN=""
if [[ "$ALL_DATABASES" == "1" ]]; then
  DUMP_BIN="pg_dumpall"
else
  DUMP_BIN="pg_dump"
fi

run_dump() {
  # Emite o dump SQL em stdout. Falha do dump propaga via pipefail.
  if command -v "$DUMP_BIN" >/dev/null 2>&1; then
    if [[ "$ALL_DATABASES" == "1" ]]; then
      "$DUMP_BIN" "$DB_URL" --clean --if-exists
    else
      "$DUMP_BIN" "$DB_URL" --clean --if-exists --no-owner --no-privileges
    fi
  elif docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$DOCKER_CONTAINER"; then
    echo "[backup-encrypted] $DUMP_BIN não encontrado; usando container $DOCKER_CONTAINER..." >&2
    if [[ "$ALL_DATABASES" == "1" ]]; then
      docker exec "$DOCKER_CONTAINER" pg_dumpall -U "${POSTGRES_USER:-prospector}" --clean --if-exists
    else
      docker exec "$DOCKER_CONTAINER" pg_dump -U "${POSTGRES_USER:-prospector}" -d "${POSTGRES_DB:-prospectordb}" \
        --clean --if-exists --no-owner --no-privileges
    fi
  else
    die "$DUMP_BIN não encontrado no PATH e container '$DOCKER_CONTAINER' não está ativo."
  fi
}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FINAL_FILE="$BACKUP_DEST_DIR/birthhub_backup_${TIMESTAMP}.sql.gz.enc"
TMP_ENC="$(mktemp "$BACKUP_DEST_DIR/.backup_tmp.XXXXXX")"
trap 'rm -f "$TMP_ENC"' EXIT

TARGET_LABEL="${DB_URL##*@}"
[[ "$TARGET_LABEL" == "$DB_URL" ]] && TARGET_LABEL="[connection-string]"
echo "[backup-encrypted] Iniciando dump de $TARGET_LABEL -> $FINAL_FILE"
if ! run_dump | gzip -c | openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:$PASSPHRASE" -out "$TMP_ENC" 2>/dev/null; then
  die "pipeline de backup falhou (dump/gzip/openssl). Nenhum backup foi gerado."
fi

[[ -s "$TMP_ENC" ]] || die "arquivo cifrado vazio ou ausente — backup inválido."

# Verificação de integridade ponta a ponta: decifra e testa o gzip ANTES de
# declarar sucesso. Se a cifra estiver corrompida ou a chave errada, falha aqui.
if ! openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:$PASSPHRASE" -in "$TMP_ENC" 2>/dev/null | gzip -t; then
  die "verificação de integridade falhou (decifragem/gunzip). Backup NÃO é restaurável."
fi

mv "$TMP_ENC" "$FINAL_FILE"
trap - EXIT

SIZE_BYTES=$(stat -c %s "$FINAL_FILE" 2>/dev/null || stat -f %z "$FINAL_FILE")
SHA256=$(sha256sum "$FINAL_FILE" | awk '{print $1}')
[[ "$SIZE_BYTES" -gt 0 ]] || die "arquivo final vazio após move."

echo "[backup-encrypted] Backup real gerado e verificado:"
echo "  arquivo : $FINAL_FILE"
echo "  tamanho : $SIZE_BYTES bytes"
echo "  sha256  : $SHA256"

# Retenção local configurável.
if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && [[ "$RETENTION_DAYS" -gt 0 ]]; then
  PURGED=$(find "$BACKUP_DEST_DIR" -maxdepth 1 -name 'birthhub_backup_*.sql.gz.enc' -type f -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
  echo "[backup-encrypted] Retenção: ${RETENTION_DAYS}d — $PURGED arquivo(s) antigo(s) removido(s)."
fi

# Cópia remota opcional via scp. Falha aqui = falha real do backup (exit != 0).
if [[ -n "${BACKUP_SCP_TARGET:-}" ]]; then
  command -v scp >/dev/null 2>&1 || die "BACKUP_SCP_TARGET definido mas scp não encontrado no PATH."
  TARGET_DIR="${BACKUP_SCP_TARGET%/}"
  echo "[backup-encrypted] Enviando cópia remota para $TARGET_DIR ..."
  scp -q "$FINAL_FILE" "$TARGET_DIR/" || die "scp para $TARGET_DIR falhou. Backup local existe mas a cópia remota não foi confirmada."
  echo "[backup-encrypted] Cópia remota confirmada em $TARGET_DIR/$(basename "$FINAL_FILE")"
fi

echo "[backup-encrypted] Backup concluído com sucesso (verificado, criptografado, retido)."
exit 0
