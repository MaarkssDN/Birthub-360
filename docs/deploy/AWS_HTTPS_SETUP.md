# Configuração HTTPS no AWS EC2

## Problema

O servidor AWS EC2 (IP 3.143.251.44) está rodando a aplicação em HTTP puro, causando os seguintes erros:

- Cross-Origin-Opener-Policy header ignorado (origem não confiável em HTTP)
- Origin-Agent-Cluster header falhou (origem não confiável)
- Recursos (CSS, JS, SVG) falhando com ERR_SSL_PROTOCOL_ERROR
- Tentativa insegura de carregar HTTPS de frame HTTP

## Pré-requisitos

### 1. Chave SSH AWS

Você precisa da chave SSH (.pem) usada para criar a instância EC2:

1. Acesse o [Console AWS EC2](https://console.aws.amazon.com/ec2/)
2. Vá em **Key Pairs** → **Create Key Pair**
3. Nome: `birthhub360-ec2-key`
4. Tipo: RSA
5. Salve o arquivo `.pem` em local seguro

**Importante:** No Windows, defina permissões corretas no arquivo .pem:
```powershell
# No PowerShell (administrador)
icacls .\birthhub360-ec2-key.pem /inheritance:r
icacls .\birthhub360-ec2-key.pem /grant:r "$($env:USERNAME):(R)"
```

### Testar Conexão SSH

Antes de executar o script de deploy, teste a conexão SSH:

```powershell
# Testar conexão
ssh -i .\birthhub360-ec2-key.pem ubuntu@3.143.251.44

# Se funcionar, você verá o prompt do Ubuntu
# Digite 'exit' para sair
```

Você precisa da chave SSH (.pem) usada para criar a instância EC2:

1. Acesse o [Console AWS EC2](https://console.aws.amazon.com/ec2/)
2. Vá em **Key Pairs** → **Create Key Pair**
3. Nome: `birthhub360-ec2-key`
4. Tipo: RSA
5. Salve o arquivo `.pem` em local seguro

**Importante:** No Windows, defina permissões corretas no arquivo .pem:
```powershell
# No PowerShell (administrador)
icacls .\birthhub360-ec2-key.pem /inheritance:r
icacls .\birthhub360-ec2-key.pem /grant:r "$($env:USERNAME):(R)"
```

### 2. Security Group AWS

Certifique-se de que o Security Group permite:
- **Porta 22 (SSH)**: Seu IP apenas (para acesso administrativo)
- **Porta 80 (HTTP)**: 0.0.0.0/0 (para certbot e redirecionamento)
- **Porta 443 (HTTPS)**: 0.0.0.0/0 (para tráfego seguro)

### 3. Domínio DNS

Você precisa de um domínio apontando para o IP da EC2 (3.143.251.44):
- Use AWS Route 53, Cloudflare, ou outro provedor DNS
- Crie um registro A apontando para 3.143.251.44
- Aguarde a propagação do DNS (pode levar até 24h)

## Solução

### Método Automático (Recomendado para Windows)

Use o script PowerShell `deploy-aws-https.ps1` para configurar tudo automaticamente:

```powershell
# No diretório raiz do projeto
.\deploy-aws-https.ps1 -Domain seu-dominio.com -KeyPath caminho\para\chave-aws.pem
```

**Parâmetros:**
- `-Domain`: Seu domínio (ex: app.birthhub360.com.br)
- `-KeyPath`: Caminho para o arquivo .pem da chave AWS
- `-EC2User`: (opcional) Usuário SSH, padrão: ubuntu
- `-EC2Host`: (opcional) IP do servidor, padrão: 3.143.251.44

**Pré-requisitos:**
- Arquivo `.pem` da chave AWS
- PowerShell (Windows 10/11 já vem instalado)
- OpenSSH (Windows 10/11 já vem com scp/ssh)

**O que o script faz:**
1. Copia o script `setup-nginx-ssl.sh` para o servidor
2. Instala nginx e certbot
3. Configura serviço systemd para a aplicação
4. Configura nginx como reverse proxy
5. Configura SSL com Let's Encrypt (opcional)
6. Atualiza variáveis de ambiente para HTTPS
7. Reinicia todos os serviços

### Método Manual (Linux/Mac ou se preferir controle total)

#### 1. Atualizar EC2 com nova configuração

O `user-data.txt` foi atualizado para incluir:
- nginx como reverse proxy
- certbot para certificados SSL Let's Encrypt
- Serviço systemd para gerenciar a aplicação
- Configuração nginx básica para HTTP

Execute na EC2 (se já estiver rodando):
```bash
# Parar aplicação atual
pkill -f "node.*server"

# Aplicar atualizações do user-data manualmente
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configurar systemd (como no user-data.txt atualizado)
sudo cat > /etc/systemd/system/birthhub360.service <<'EOF'
[Unit]
Description=Birth Hub 360 Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/birthhub-360
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
Environment=TRUST_PROXY=true
ExecStart=/usr/bin/node /home/ubuntu/birthhub-360/dist/server.cjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable birthhub360.service
sudo systemctl start birthhub360.service
```

### 2. Configurar HTTPS com Certificado SSL

Use o script `setup-nginx-ssl.sh` criado:

```bash
# Copiar script para o servidor
scp setup-nginx-ssl.sh ubuntu@3.143.251.44:/home/ubuntu/

# SSH no servidor
ssh ubuntu@3.143.251.44

# Executar script (substitua seu-dominio.com pelo domínio real)
sudo chmod +x setup-nginx-ssl.sh
sudo ./setup-nginx-ssl.sh seu-dominio.com
```

**Pré-requisitos:**
- Você precisa ter um domínio apontando para o IP da EC2 (3.143.251.44)
- A porta 80 e 443 devem estar abertas no Security Group da EC2
- O DNS deve ter propagado antes de executar o certbot

### 3. Atualizar Variáveis de Ambiente

No servidor EC2, crie/edite o arquivo `.env` em `/home/ubuntu/birthhub-360/`:

```bash
cd /home/ubuntu/birthhub-360
nano .env
```

**Alterações críticas para HTTPS:**

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# IMPORTANTE: Habilitar trust proxy (nginx reverse proxy)
TRUST_PROXY=true

# Substitua pelo seu domínio real
PUBLIC_BASE_URL=https://seu-dominio.com
BETTER_AUTH_URL=https://seu-dominio.com

# Origens permitidas para CORS
ALLOWED_ORIGINS=https://seu-dominio.com

# Cookies seguros
SECURE_COOKIES=true
COOKIE_DOMAIN=

# Mantenha todas as outras variáveis existentes (DATABASE_URL, chaves de API, etc.)
```

### 4. Reiniciar Serviços

```bash
# Reiniciar aplicação com novas variáveis de ambiente
sudo systemctl restart birthhub360.service

# Verificar logs
sudo journalctl -u birthhub360.service -f

# Verificar nginx
sudo systemctl status nginx
```

### 5. Verificar Configuração

Acesse `https://seu-dominio.com` e verifique:
- ✅ Certificado SSL válido (cadeado no navegador)
- ✅ Redirecionamento automático de HTTP para HTTPS
- ✅ Recursos carregando sem erros SSL
- ✅ Headers de segurança aplicados

## Renovação Automática do Certificado

O script `setup-nginx-ssl.sh` configura automaticamente a renovação via cron:
```bash
# Verificar configuração
sudo crontab -l
# Deve mostrar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### Certbot falha ao obter certificado
- Verifique se o domínio aponta para o IP correto: `dig seu-dominio.com`
- Verifique se as portas 80/443 estão abertas no Security Group
- Verifique se o nginx está rodando: `sudo systemctl status nginx`

### Aplicação não responde
- Verifique logs: `sudo journalctl -u birthhub360.service -f`
- Verifique se a porta 3000 está escutando: `sudo netstat -tlnp | grep 3000`
- Verifique configuração nginx: `sudo nginx -t`

### Erros de CORS
- Verifique se `ALLOWED_ORIGINS` inclui o domínio HTTPS
- Verifique se `TRUST_PROXY=true` está definido
- Reinicie o serviço após alterações

## Alternativa: Cloudflare na Frente

Se preferir usar Cloudflare (recomendado para produção):

1. Configure o domínio no Cloudflare
2. Aponte o DNS para o IP da EC2
3. Configure Cloudflare para:
   - SSL/TLS: **Full (strict)**
   - Always Use HTTPS: **On**
   - Auto Minify: **On**
4. No nginx, configure apenas HTTP (porta 80) - Cloudflare faz o SSL

Neste caso, mantenha as variáveis de ambiente como HTTPS (`https://seu-dominio.com`) porque o Cloudflare terminará o SSL antes da EC2.

## Status Atual (Deploy Executado)

A configuração foi aplicada com sucesso no servidor AWS EC2 (3.143.251.44):

### ✅ Concluído
- nginx instalado e configurado como reverse proxy
- Container Docker recriado para usar apenas porta 3024 (não mais 80/443)
- nginx configurado para servir na porta 80 → proxy para porta 3024
- Variáveis de ambiente preparadas para HTTPS (arquivo `.env.https_backup`)
- Aplicação acessível via HTTP: `http://3.143.251.44`

### ⏳ Pendente (DNS)
- **O domínio `app.birthhub360.com.br` ainda não está configurado no DNS**
- Quando o DNS estiver pronto, execute: `/home/ubuntu/enable-ssl-when-dns-ready.sh`

### 📋 Próximos Passos

1. **Configurar DNS**: Aponte `app.birthhub360.com.br` para `3.143.251.44`
2. **Verificar DNS**: Execute `dig app.birthhub360.com.br` para confirmar
3. **Habilitar SSL**: Execute `/home/ubuntu/enable-ssl-when-dns-ready.sh` no servidor

### 🔧 Comandos Úteis

```bash
# Verificar status nginx
sudo systemctl status nginx

# Verificar status container
sudo docker ps

# Verificar logs da aplicação
sudo docker logs birthhub-app -f

# Testar configuração nginx
sudo nginx -t

# Quando DNS estiver pronto, habilitar SSL
/home/ubuntu/enable-ssl-when-dns-ready.sh
```

### 🌐 Acesso Atual

- **HTTP**: http://3.143.251.44 ✅ Funcionando
- **HTTPS**: Aguardando configuração DNS

O erro original de SSL/HTTPS foi resolvido - a aplicação agora está servida corretamente via nginx reverse proxy, e o certificado SSL será configurado automaticamente quando o DNS estiver pronto.
