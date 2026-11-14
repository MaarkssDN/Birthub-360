#!/usr/bin/env bash
#
# verify-docker-2375-restriction.sh — verificação de contenção do daemon
# Docker remoto 192.168.0.116:2375 (sem TLS/auth na LAN 192.168.0.0/24).
#
# Handoff: .agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md
# Runbook: infrastructure/security/DOCKER-REMOTE-DAEMON.md
#
# USO — rodar a partir de QUALQUER host da LAN:
#
#   # Verificação de "IP não autorizado" (obrigatória após Passo 1 do runbook):
#   ./verify-docker-2375-restriction.sh --expect blocked
#
#   # Verificação do workstation autorizado (deve continuar funcionando):
#   ./verify-docker-2375-restriction.sh --expect allowed
#
#   # Sem --expect: apenas reporta o estado observado (diagnóstico).
#
# Exit codes: 0 = resultado conforme esperado; 1 = inesperado/erro de uso.
# Requer apenas bash + curl (presente no Git Bash do workstation e na
# maioria das estações Linux da LAN).

set -u

HOST="192.168.0.116"
PORT="2375"
EXPECT=""          # blocked | allowed | "" (somente reportar)
TIMEOUT=5

usage() {
    sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --host)    HOST="$2"; shift 2 ;;
        --port)    PORT="$2"; shift 2 ;;
        --expect)  EXPECT="$2"; shift 2 ;;
        --timeout) TIMEOUT="$2"; shift 2 ;;
        -h|--help) usage 0 ;;
        *) echo "Argumento desconhecido: $1" >&2; usage 1 ;;
    esac
done

case "$EXPECT" in
    ""|blocked|allowed) ;;
    *) echo "--expect deve ser 'blocked' ou 'allowed'" >&2; exit 1 ;;
esac

URL="http://${HOST}:${PORT}/version"
echo "== Verificação de contenção do Docker daemon remoto =="
echo "Alvo : $URL"
echo "Origem: $(hostname 2>/dev/null || echo '?')  (IP: $(hostname -I 2>/dev/null | awk '{print $1}'))"
echo ""

# curl: -m timeout total; -sS mostra erro; -o /dev/null descarta corpo;
# -w extrai o código HTTP (000 em falha de conexão/timeout).
CODE=$(curl -sS -m "$TIMEOUT" -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null)
CURL_RC=$?

if [ "$CODE" = "200" ]; then
    STATE="EXPOSTO (HTTP 200 — daemon responde sem autenticação)"
elif [ "$CURL_RC" -eq 28 ]; then
    STATE="BLOQUEADO (timeout — firewall/rede não deixa passar)"
else
    STATE="BLOQUEADO (conexão recusada/inacessível, curl rc=$CURL_RC)"
fi

echo "Resultado observado: $STATE"
echo ""

case "$EXPECT" in
    "")
        echo "Modo diagnóstico (sem --expect). Interpretar conforme o IP de origem:"
        echo "  - de estação NÃO autorizada: deve ser BLOQUEADO após Passo 1 do runbook."
        echo "  - do workstation autorizado   : deve ser EXPOSTO enquanto usar DOCKER_HOST=tcp://."
        ;;
    blocked)
        case "$STATE" in
            BLOQUEADO*)
                echo "OK: contenção confirmada a partir deste IP."; exit 0 ;;
            *)
                echo "FALHA: daemon ainda responde a partir deste IP." >&2; exit 1 ;;
        esac
        ;;
    allowed)
        case "$STATE" in
            EXPOSTO*)
                echo "OK: acesso autorizado funcionando."; exit 0 ;;
            *)
                echo "FALHA: workstation autorizado perdeu acesso ao daemon." >&2; exit 1 ;;
        esac
        ;;
esac
exit 0
