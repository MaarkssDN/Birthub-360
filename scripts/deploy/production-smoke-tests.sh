#!/usr/bin/env bash
# scripts/deploy/production-smoke-tests.sh — Bateria de smoke tests HTTP reais pós-deploy
# Agente 94 — CI/CD e Operações Git/Deploy (fail-closed: exige DEPLOY_BASE_URL ou $1)
set -euo pipefail

BASE_URL="${DEPLOY_BASE_URL:-${1:-}}"
TIMEOUT_SECS="${SMOKE_TIMEOUT_SECS:-10}"

if [[ -z "$BASE_URL" ]]; then
  echo "[Smoke-Tests][ERRO] DEPLOY_BASE_URL (ou argumento \$1) é obrigatório. Recusando aprovação sem alvo real." >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
echo "[Smoke-Tests] Iniciando verificação HTTP real contra: ${BASE_URL}"

ENDPOINTS=(
  "/health/live"
  "/health/ready"
  "/health/version"
)

FAILED=0
for EP in "${ENDPOINTS[@]}"; do
  URL="${BASE_URL}${EP}"
  HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time "${TIMEOUT_SECS}" "${URL}" || echo "000")"
  if [[ "${HTTP_CODE}" == "200" ]]; then
    echo "  -> OK ${EP} (HTTP ${HTTP_CODE})"
  else
    echo "  -> FALHA ${EP} (HTTP ${HTTP_CODE})" >&2
    FAILED=1
  fi
done

if [[ "${FAILED}" -ne 0 ]]; then
  echo "[Smoke-Tests][FALHA] Um ou mais endpoints de saúde não retornaram HTTP 200." >&2
  exit 1
fi

echo "[Smoke-Tests] Todos os endpoints críticos responderam HTTP 200 OK."
exit 0
