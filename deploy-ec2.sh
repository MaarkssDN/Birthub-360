#!/bin/bash
# Script de deploy para AWS EC2 - Birth Hub 360
# Uso: ./deploy-ec2.sh [caminho/chave.pem]
#
# DEBT-0001: o deploy agora é fail-closed —
#   1. `prisma migrate deploy` roda DENTRO do container ANTES do restart;
#      se a migração falhar, o restart não acontece (schema novo nunca sobe
#      contra banco não migrado).
#   2. Healthcheck pós-deploy em /health/ready com retry+timeout; falha
#      aborta o script com exit != 0 e despeja os últimos logs do container.
#   3. Cada deploy grava DEPLOY_VERSION (git SHA + timestamp) no diretório
#      remoto para auditoria/rollback — não há rebuild de imagem neste fluxo
#      (o container monta o diretório e só é reiniciado), então "tag de imagem"
#      se traduz em versão de deploy registrada.

set -e

# Configurações
EC2_HOST="3.143.251.44"
EC2_USER="ubuntu"
KEY_PATH="${1:-C:/Users/marce/OneDrive/Desktop/Birthub360.pem}"
REMOTE_DIR="/home/ubuntu/birthhub-360"
APP_PORT="${APP_PORT:-3024}"
HEALTHCHECK_TIMEOUT="${HEALTHCHECK_TIMEOUT:-90}"   # segundos totais de espera pelo /health/ready
HEALTHCHECK_INTERVAL="${HEALTHCHECK_INTERVAL:-5}"  # intervalo entre tentativas

# Versão do deploy: SHA curto do commit (fallback: timestamp) + data/hora.
DEPLOY_GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
DEPLOY_VERSION="${DEPLOY_GIT_SHA}-$(date -u +%Y%m%dT%H%M%SZ)"

echo "🚀 Iniciando deploy para AWS EC2: $EC2_HOST"
echo "📁 Chave SSH: $KEY_PATH"
echo "🏷️  Versão do deploy: $DEPLOY_VERSION"

# 1. Build local
echo ""
echo "📦 Build local..."
npm run build

# 2. Copiar arquivos para EC2
echo ""
echo "📤 Copiando arquivos para EC2..."
scp -i "$KEY_PATH" -r dist/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/dist-new/"
scp -i "$KEY_PATH" -r node_modules/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/node_modules-new/"
scp -i "$KEY_PATH" -r prisma/ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/prisma-new/"
scp -i "$KEY_PATH" package.json "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$KEY_PATH" server.ts "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

# 3. Atualizar aplicação no servidor (migrate -> restart -> healthcheck fail-closed)
echo ""
echo "🔄 Atualizando aplicação no servidor..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" \
  "APP_PORT=$APP_PORT HEALTHCHECK_TIMEOUT=$HEALTHCHECK_TIMEOUT HEALTHCHECK_INTERVAL=$HEALTHCHECK_INTERVAL DEPLOY_VERSION='$DEPLOY_VERSION' bash -s" << 'ENDSSH'
set -e
cd /home/ubuntu/birthhub-360

# Backup do dist atual (rollback manual: ver docs/operations/DEPLOY_EC2.md)
if [ -d "dist" ]; then
  mv dist "dist-backup-$(date +%Y%m%d-%H%M%S)"
fi

# Mover novos arquivos
mv dist-new dist
mv node_modules-new node_modules
if [ -d "prisma-new" ]; then
  mv prisma prisma-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
  mv prisma-new prisma
fi

# Registra a versão do deploy para auditoria/rollback.
echo "$DEPLOY_VERSION" > DEPLOY_VERSION

# 4. Migrações ANTES do restart — falha aqui aborta o deploy sem derrubar a versão atual.
echo "🗄️  Aplicando migrações (prisma migrate deploy)..."
docker exec birthhub-app npx prisma migrate deploy

# 5. Reiniciar container Docker
echo "🔁 Reiniciando container birthhub-app..."
docker restart birthhub-app

# Verificar status do container
docker ps | grep birthhub-app || { echo "❌ Container birthhub-app não está rodando"; exit 1; }

# 6. Healthcheck fail-closed: /health/ready com retry até HEALTHCHECK_TIMEOUT segundos.
echo "🩺 Aguardando /health/ready (timeout ${HEALTHCHECK_TIMEOUT}s)..."
elapsed=0
ready=0
while [ "$elapsed" -lt "$HEALTHCHECK_TIMEOUT" ]; do
  if curl -fsS --max-time 5 "http://127.0.0.1:${APP_PORT}/health/ready" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep "$HEALTHCHECK_INTERVAL"
  elapsed=$((elapsed + HEALTHCHECK_INTERVAL))
done

if [ "$ready" -ne 1 ]; then
  echo "❌ Healthcheck FALHOU após ${elapsed}s. Últimos logs do container:"
  docker logs birthhub-app --tail 50 || true
  echo ""
  echo "❌ Deploy abortado: aplicação não ficou pronta. Verifique os logs acima."
  exit 1
fi

echo "✅ Healthcheck OK: /health/ready respondeu 200."
ENDSSH

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://$EC2_HOST"
echo "📋 Versão registrada no servidor: $DEPLOY_VERSION"
