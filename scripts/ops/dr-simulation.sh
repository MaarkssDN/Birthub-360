#!/usr/bin/env bash
# scripts/ops/dr-simulation.sh — Verificação de RPO/RTO do Disaster Recovery (DEBT-0002)
#
# ANTES: este script imprimia RTO=4min/RPO=15s fixos e saía 0 — sucesso falso.
# AGORA: fail-closed e honesto.
#
# O que é REALMENTE verificável localmente: RPO — a idade do backup mais recente
# em BACKUP_DEST_DIR contra DR_RPO_TARGET_SECONDS (default 86400 = 24h).
#
# O que NÃO é verificável sem um evento real de failover: RTO. Para medi-lo,
# configure DR_FAILOVER_CMD — um comando shell que executa o failover/restauração
# real e retorna 0 em caso de sucesso. O tempo decorrido é medido e comparado a
# DR_RTO_TARGET_SECONDS (default 900 = 15min). Sem DR_FAILOVER_CMD o script sai
# com código 2 e status NOT_MEASURED — nunca finge ter medido.
#
# Exit codes: 0 = RPO ok E RTO medido dentro do alvo | 1 = violação | 2 = não executável.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/birthhub}"
BACKUP_DEST_DIR="${BACKUP_DEST_DIR:-${BACKUP_DIR:-./backups}}"
RPO_TARGET="${DR_RPO_TARGET_SECONDS:-86400}"
RTO_TARGET="${DR_RTO_TARGET_SECONDS:-900}"

verify() {
  # 1. Localizar backup mais recente (criptografado ou plain, dev ou prod).
  local newest
  mkdir -p "$BACKUP_DEST_DIR" 2>/dev/null || true
  newest="$(find "$BACKUP_DEST_DIR" -maxdepth 1 -type f \
    \( -name 'birthhub_backup_*.sql.gz.enc' -o -name 'birthhub_backup_*.sql.enc' \
       -o -name 'prospectordb_backup_*.sql' -o -name '*.sql.gz' -o -name '*.sql' \) \
    -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2- || true)"

  if [[ -z "$newest" || ! -f "$newest" ]]; then
    echo "[DR-Simulation] FALHA: nenhum backup encontrado em $BACKUP_DEST_DIR. RPO = ilimitado." >&2
    return 1
  fi

  local mtime now age
  mtime=$(stat -c %Y "$newest" 2>/dev/null || stat -f %m "$newest")
  now=$(date +%s)
  age=$((now - mtime))
  echo "[DR-Simulation] Backup mais recente: $newest (idade: ${age}s)"

  if [[ "$age" -gt "$RPO_TARGET" ]]; then
    echo "[DR-Simulation] RPO VIOLADO: ${age}s > alvo ${RPO_TARGET}s." >&2
    return 1
  fi
  echo "[DR-Simulation] RPO OK: ${age}s <= ${RPO_TARGET}s (alvo)."

  # 2. RTO — somente mensurável executando um failover real.
  if [[ -z "${DR_FAILOVER_CMD:-}" ]]; then
    echo "[DR-Simulation] RTO: NOT_MEASURED — configure DR_FAILOVER_CMD com o comando real de failover/restore para medir."
    return 2
  fi

  echo "[DR-Simulation] Executando failover real via DR_FAILOVER_CMD..."
  local start end elapsed
  start=$(date +%s)
  # shellcheck disable=SC2086
  if ! eval "$DR_FAILOVER_CMD"; then
    echo "[DR-Simulation] FALHA: DR_FAILOVER_CMD retornou erro." >&2
    return 1
  fi
  end=$(date +%s)
  elapsed=$((end - start))
  echo "[DR-Simulation] Failover concluído em ${elapsed}s (alvo RTO: ${RTO_TARGET}s)."
  if [[ "$elapsed" -gt "$RTO_TARGET" ]]; then
    echo "[DR-Simulation] RTO VIOLADO: ${elapsed}s > ${RTO_TARGET}s." >&2
    return 1
  fi
  echo "[DR-Simulation] RTO OK: ${elapsed}s <= ${RTO_TARGET}s."
  return 0
}

verify
EXIT=$?
case $EXIT in
  0) echo "[DR-Simulation] Simulação concluída: RPO e RTO dentro dos alvos." ;;
  2) echo "[DR-Simulation] Parcial: RPO verificado; RTO não mensurável sem DR_FAILOVER_CMD." ;;
  *) echo "[DR-Simulation] Simulação FALHOU (exit $EXIT)." ;;
esac
exit $EXIT
