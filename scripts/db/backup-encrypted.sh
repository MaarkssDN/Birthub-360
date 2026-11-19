#!/usr/bin/env bash
# scripts/db/backup-encrypted.sh — Backup do PostgreSQL criptografado (AES-256)
# DEBT-0002: rotina padrão agora executa pg_dump REAL + cifra AES-256.
# Antes gravava um placeholder que reportava sucesso falso.
#
# Uso:
#   ./backup-encrypted.sh                 # dump + cifra -> $BACKUP_DIR/*.dump.enc
#   ./backup-encrypted.sh --verify-crypto # somente teste de round-trip AES-256
#
# Variáveis:
#   BACKUP_DIR              destino dos backups (default: /tmp/birthhub_backups)
#   BACKUP_ENCRYPTION_KEY   chave AES-256 (obrigatória para backup real; nunca commitar)
#   DATABASE_URL            URL de conexão pg_dump (ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE)
#   BACKUP_RETENTION_DAYS   remove backups mais antigos que N dias (default: 30; 0=desativa)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/birthhub_backups}"
mkdir -p "$BACKUP_DIR"

if [[ "${1:-}" == "--verify-crypto" ]]; then
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

fail() { echo "[Backup] ERRO: $1" >&2; exit 1; }

command -v pg_dump >/dev/null 2>&1 || fail "pg_dump não encontrado no PATH."
command -v openssl >/dev/null 2>&1 || fail "openssl não encontrado no PATH."

KEY="${BACKUP_ENCRYPTION_KEY:-}"
[[ -n "$KEY" ]] || fail "BACKUP_ENCRYPTION_KEY não definida. Backup exige chave AES-256 (nunca commitar)."

if [[ -z "${DATABASE_URL:-}" && -z "${PGHOST:-}" ]]; then
  fail "Nenhuma conexão configurada: defina DATABASE_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE."
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RAW_FILE="$BACKUP_DIR/birthhub_backup_${TIMESTAMP}.dump"
BACKUP_FILE="${RAW_FILE}.enc"
MANIFEST="$BACKUP_DIR/birthhub_backup_${TIMESTAMP}.manifest.json"

cleanup() { rm -f "$RAW_FILE"; }
trap cleanup EXIT

echo "[Backup] pg_dump -> $RAW_FILE ..."
if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump "$DATABASE_URL" --format=custom --compress=6 --file="$RAW_FILE"
else
  pg_dump --format=custom --compress=6 --file="$RAW_FILE"
fi
[[ -s "$RAW_FILE" ]] || fail "pg_dump produziu arquivo vazio."

echo "[Backup] Cifrando AES-256 -> $BACKUP_FILE ..."
openssl enc -aes-256-cbc -pbkdf2 -pass "pass:$KEY" -in "$RAW_FILE" -out "$BACKUP_FILE"
[[ -s "$BACKUP_FILE" ]] || fail "arquivo cifrado vazio."

# Manifesto com integridade (hash do cifrado + tamanho) para verificação futura
SHA256="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
SIZE="$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")"
cat > "$MANIFEST" <<EOF
{
  "file": "$(basename "$BACKUP_FILE")",
  "createdAt": "$(date -Is)",
  "format": "pg_dump custom + AES-256-CBC/PBKDF2",
  "sha256": "$SHA256",
  "bytes": $SIZE,
  "retentionDays": ${BACKUP_RETENTION_DAYS:-30}
}
EOF

# Retenção: remove .dump.enc + .manifest mais antigos que N dias
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
if [[ "$RETENTION" =~ ^[0-9]+$ && "$RETENTION" -gt 0 ]]; then
  find "$BACKUP_DIR" -name 'birthhub_backup_*.dump.enc' -mtime "+$RETENTION" -delete
  find "$BACKUP_DIR" -name 'birthhub_backup_*.manifest.json' -mtime "+$RETENTION" -delete
fi

echo "[Backup] Concluído: $BACKUP_FILE (${SIZE} bytes, sha256=$SHA256)"
