#!/bin/bash
# Script oficial e testado para configurar Nginx + SSL (Let's Encrypt) no AWS EC2
# Projeto: Birth Hub 360°
# Uso: sudo ./setup-nginx-ssl.sh <seu-dominio.com> [email-responsavel]

set -e

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

if [ -z "$DOMAIN" ]; then
  echo "Erro: Domínio não fornecido."
  echo "Uso: sudo ./setup-nginx-ssl.sh <seu-dominio.com> [email-responsavel]"
  exit 1
fi

echo "=== 1. Atualizando pacotes e dependências ==="
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx

# Ocultar assinatura de versão do Nginx
if [ -f /etc/nginx/nginx.conf ]; then
  sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf || true
fi

echo "=== 2. Configurando Nginx para validação ACME HTTP-01 ==="
mkdir -p /var/www/certbot
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

cat > /etc/nginx/sites-available/birthhub360 <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Validação do desafio ACME Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Servir arquivos do frontend temporariamente enquanto o certificado é emitido
    location / {
        root /home/ubuntu/birthhub-360/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/birthhub360 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo "=== 3. Solicitando certificado TLS via Certbot (Webroot) ==="
certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

echo "=== 4. Aplicando configuração definitiva HTTPS com TLS 1.2/1.3 e cabeçalhos seguros ==="
cat > /etc/nginx/sites-available/birthhub360 <<EOF
# Redirecionamento permanente HTTP -> HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# Servidor Seguro HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Protocolos e Cifras Modernas (Compatível com TLS 1.2 e TLS 1.3)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Cabeçalhos HTTP de Segurança Avançada
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "0" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Raiz do frontend SPA
    root /home/ubuntu/birthhub-360/dist;
    index index.html;

    # Fallback SPA (F5 e rotas client-side)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy reverso para API Node.js (Better Auth / Express)
    location /api/ {
        proxy_pass http://localhost:3024;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3024;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

nginx -t
systemctl restart nginx

echo "=== 5. Configurando renovação automática no Crontab ==="
(crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -

echo "=== SUCESSO! Acesso seguro configurado em https://$DOMAIN ==="
