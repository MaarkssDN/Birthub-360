#!/bin/bash
set -euo pipefail

# Carrega variáveis do .env se existir
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/prospectordb_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating backup at $FILENAME..."

# Executa pg_dump local ou via container birthhub_postgres se o binário local não existir
if command -v pg_dump >/dev/null 2>&1; then
  PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump -h localhost -p "${POSTGRES_PORT:-5434}" -U "${POSTGRES_USER:-prospector}" "${POSTGRES_DB:-prospectordb}" --clean --if-exists --no-owner --no-privileges > "$FILENAME"
elif docker ps --format '{{.Names}}' | grep -q '^birthhub_postgres$'; then
  echo "pg_dump local não encontrado. Executando via container birthhub_postgres..."
  docker exec birthhub_postgres pg_dump -U "${POSTGRES_USER:-prospector}" -d "${POSTGRES_DB:-prospectordb}" --clean --if-exists --no-owner --no-privileges > "$FILENAME"
else
  echo "Erro: pg_dump não encontrado no PATH e container birthhub_postgres não está ativo."
  exit 1
fi

# Falha real: sem arquivo, arquivo vazio ou dump irreconhecível = exit != 0.
if [ ! -s "$FILENAME" ]; then
  echo "Erro: dump gerado está vazio ou ausente: $FILENAME"
  exit 1
fi
if ! grep -qi "PostgreSQL database dump" "$FILENAME"; then
  echo "Erro: $FILENAME não contém um dump PostgreSQL reconhecível."
  exit 1
fi

echo "Backup completed successfully at $FILENAME ($(wc -c < "$FILENAME") bytes)."

# Política de retenção >= 14 dias (configurável via BACKUP_RETENTION_DAYS)
echo "Aplicando política de retenção (>= $BACKUP_RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "*.sql" -type f -mtime "+$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
echo "Retenção concluída."
