#!/bin/bash
# Script de deploy para AWS EC2 - Birth Hub 360
# Uso: ./deploy-ec2.sh [caminho/chave.pem]
#
# DEBT-0001: deploy agora aplica `prisma migrate deploy` e exige healthcheck
# fail-closed antes de declarar sucesso. Registra o SHA implantado.

set -euo pipefail

# Configurações
EC2_HOST="3.143.251.44"
EC2_USER="ubuntu"
KEY_PATH="${1:-C:/Users/marce/OneDrive/Desktop/Birthub360.pem}"
REMOTE_DIR="/home/ubuntu/birthhub-360"
APP_PORT="${APP_PORT:-3000}"
HEALTH_PATH="${HEALTH_PATH:-/health/ready}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

echo "🚀 Iniciando deploy para AWS EC2: $EC2_HOST"
echo "📁 Chave SSH: $KEY_PATH"
echo "🏷️  SHA: $GIT_SHA"

# 1. Build local
echo ""
echo "📦 Build local..."
npm run build

# 2. Copiar arquivos para EC2
echo ""
echo "📤 Copiando arquivos para EC2..."
scp -i "$KEY_PATH" -r dist/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/dist-new/"
scp -i "$KEY_PATH" -r node_modules/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/node_modules-new/"
scp -i "$KEY_PATH" package.json "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$KEY_PATH" server.ts "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$KEY_PATH" prisma/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/prisma-new/" 2>/dev/null || true

# 3. Atualizar aplicação no servidor + migrate + healthcheck
echo ""
echo "🔄 Atualizando aplicação no servidor..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "DEPLOY_SHA='$GIT_SHA' APP_PORT='$APP_PORT' HEALTH_PATH='$HEALTH_PATH' HEALTH_RETRIES='$HEALTH_RETRIES' HEALTH_INTERVAL='$HEALTH_INTERVAL'" << 'ENDSSH'
set -e
cd /home/ubuntu/birthhub-360
TS=$(date +%Y%m%d-%H%M%S)

# Backup do dist atual
if [ -d "dist" ]; then
  mv dist "dist-backup-$TS"
fi

# Mover novos arquivos
mv dist-new dist
mv node_modules-new node_modules
if [ -d prisma-new ]; then
  rm -rf prisma-old
  [ -d prisma ] && mv prisma prisma-old
  mv prisma-new prisma
fi

# Migrar banco ANTES do restart (fail-closed: erro de migration aborta o deploy)
echo "🗄️  prisma migrate deploy..."
docker exec birthhub-app npx prisma migrate deploy

# Reiniciar container Docker
docker restart birthhub-app

# Healthcheck fail-closed: o script falha se o app não responder /health/ready
echo "🩺 Healthcheck $HEALTH_PATH (até $((HEALTH_RETRIES * HEALTH_INTERVAL))s)..."
OK=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fsS --max-time 5 "http://localhost:${APP_PORT}${HEALTH_PATH}" >/dev/null 2>&1; then
    OK=1
    break
  fi
  sleep "$HEALTH_INTERVAL"
done

if [ "$OK" != "1" ]; then
  echo "❌ DEPLOY FALHOU: healthcheck não respondeu após $((HEALTH_RETRIES * HEALTH_INTERVAL))s" >&2
  echo "Container logs:" >&2
  docker logs --tail 50 birthhub-app >&2 || true
  exit 1
fi

# Registrar SHA implantado para rollback rastreável
echo "$DEPLOY_SHA $(date -Is)" >> deploy-history.log
docker ps | grep birthhub-app
echo "✅ Deploy $DEPLOY_SHA concluído — healthcheck OK"
ENDSSH

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://$EC2_HOST"
