# AUDITORIA DE SEGURANÇA DA PUBLICAÇÃO AWS E DO ACESSO CORPORATIVO
## BIRTH HUB 360° — FASE 04
**Data:** 07 de Novembro de 2026  
**Status do Gate:** ❌ **REPROVADO PARA ACESSO CORPORATIVO PÚBLICO (BLOQUEADO ATÉ HTTPS)**  
**Instância Auditada:** `3.143.251.44` (AWS EC2 / Região `us-east-2`)  
**Repositório:** `MarksNN/Birthub-360`  

---

## 1. RESUMO EXECUTIVO E GATE DE SEGURANÇA

Conforme as diretrizes globais do `AGENTS.md` e os requisitos de segurança de publicação corporativa:

> **GATE CRÍTICO:** Nenhuma publicação pública contendo autenticação deve ser homologada com tráfego de credenciais por HTTP puro.

### Parecer do Gate
A aplicação implantada no endereço `http://3.143.251.44` encontra-se **INADEQUADA** para tráfego corporativo e manipulação de credenciais reais. Qualquer tentativa de autenticação trafega e-mails e senhas em **texto claro (plaintext)** pela internet pública, além de emitir cookies de sessão sem a flag `Secure`, violando as boas práticas de OWASP e os princípios de segurança da LGPD (Art. 46).

---

## 2. DIAGNÓSTICO TÉCNICO DETALHADO DA INFRAESTRUTURA

A inspeção remota (via sondagem de rede e cabeçalhos HTTP) e a auditoria de código local revelaram o seguinte diagnóstico:

### 2.1 Mapeamento de Portas e Serviços
| Porta | Protocolo | Serviço | Status Externo | Risco / Observação |
|---|---|---|---|---|
| **80** | HTTP | Nginx 1.24.0 (Ubuntu) | **ABERTA (0.0.0.0/0)** | Ativa, servindo o frontend SPA e roteando `/api/` para a porta 3024 sem redirecionamento para HTTPS. |
| **443** | HTTPS | N/A | **FECHADA / FILTRADA** | Conexões rejeitadas (`Failed to connect to 3.143.251.44:443`). O Nginx não escuta na 443 e/ou o Security Group bloqueia a porta. |
| **3024** | HTTP | Node.js Express (Container) | **ABERTA (0.0.0.0/0)** | ⚠️ **VULNERABILIDADE CRÍTICA**: A porta da aplicação Node.js está exposta diretamente para a internet, permitindo que usuários contornem o Nginx acessando `http://3.143.251.44:3024/`. |
| **22** | SSH | OpenSSH | **ABERTA (0.0.0.0/0)** | ⚠️ **RISCO ALTO**: Exposta publicamente para o mundo, sujeita a varreduras automatizadas e força bruta. Deve ser restrita ao IP administrativo do operador. |
| **5432** | TCP | PostgreSQL 16 | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. Não acessível publicamente. |
| **6379** | TCP | Redis 7 | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |
| **7700** | TCP | Meilisearch | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |
| **9000** | TCP | MinIO S3 | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |
| **4000** | TCP | LiteLLM | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |
| **11434**| TCP | Ollama | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |
| **6333** | TCP | Qdrant | **FECHADA / FILTRADA** | ✅ Protegida adequadamente. |

### 2.2 Reverse Proxy (Nginx) e Cabeçalhos HTTP
Ao inspecionar a resposta de `http://3.143.251.44`:
1. **Identificação do Servidor:** O cabeçalho `Server: nginx/1.24.0 (Ubuntu)` está ativo, revelando a versão exata do software e do sistema operacional para potenciais atacantes. A diretiva `server_tokens off;` estava ausente na configuração do site.
2. **HSTS Inoperante:** O cabeçalho `Strict-Transport-Security` não surte efeito em conexões HTTP. Os navegadores modernos descartam a instrução HSTS quando enviada fora de uma conexão segura TLS.
3. **Redirecionamento Inexistente:** Não há redirecionamento de `http://` para `https://`, pois o certificado SSL não está instalado.
4. **Defeito no script anterior `setup-nginx-ssl.sh`:** O script original continha uma falha de "ovo e galinha": configurava o bloco `listen 443 ssl` apontando para `/etc/letsencrypt/live/DOMAIN/fullchain.pem` e rodava `nginx -t` **antes** de o Certbot ser executado. Como os arquivos do certificado ainda não existiam, o comando falhava e abortava o script.

---

## 3. AUDITORIA DOS MECANISMOS DE AUTENTICAÇÃO

### 3.1 Tratamento de Cookies e Sessões (Better Auth)
No arquivo `src/lib/auth.ts`:
```typescript
advanced: {
  useSecureCookies: Boolean(
    process.env.SECURE_COOKIES === 'true' || process.env.BETTER_AUTH_URL?.startsWith('https://'),
  ),
  defaultCookieAttributes: {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(
      process.env.SECURE_COOKIES === 'true' ||
        process.env.BETTER_AUTH_URL?.startsWith('https://'),
    ),
  },
}
```
* **Diagnóstico:** Como a instância de produção opera com `BETTER_AUTH_URL=http://3.143.251.44` e sem `SECURE_COOKIES=true`, os cookies de autenticação são emitidos **SEM a flag `Secure`**.
* **Impacto:** O cookie de sessão trafega desprotegido na rede. Um observador na mesma rede local ou no provedor de internet pode interceptá-lo (Session Hijacking) ou capturar a senha submetida no endpoint `/api/auth/sign-in/email`.

### 3.2 Provedores SSO Corporativos
A chamada ao endpoint público `/api/auth/sso-providers` retornou:
```json
{"success":true,"providers":{"google":{"id":"google","name":"Google Workspace","configured":false},"microsoft":{"id":"microsoft","name":"Microsoft Entra ID","configured":false}}}
```
* **Diagnóstico:** Os provedores Google Workspace e Microsoft Entra ID estão desativados (faltam `GOOGLE_CLIENT_ID`, `MICROSOFT_CLIENT_ID`, etc.).
* **Proteção:** O backend possui tratamento defensivo no endpoint `/api/auth/sso-discover`, retornando código HTTP `503 SSO_NOT_CONFIGURED` com mensagem explicativa amigável, sem vazar segredos ou stack traces.

### 3.3 Recuperação de Senha e Enumerabilidade
* O endpoint de redefinição de senha (`sendResetPassword` em `src/lib/auth.ts`) trata de forma neutra os casos em que o serviço SMTP não está provisionado (`MailerNotConfiguredError`), evitando revelar se um e-mail existe ou não na base de dados.
* A flag `revokeSessionsOnPasswordReset: true` revoga sessões anteriores em todos os dispositivos após a troca de senha.

### 3.4 Rate Limiting e Bloqueio de Força Bruta
* **Por IP:** `authLimiter` protege `/api/auth` com limite rigoroso (`AUTH_RATE_LIMIT_MAX`, padrão 60 req/15min).
* **Por Conta:** Bloqueio após 5 tentativas consecutivas de senha incorreta (`MAX_FAILED_LOGIN_ATTEMPTS = 5`), aplicando lockout temporário de 15 minutos (`LOCKOUT_DURATION_MS`), mitigando ataques de força bruta distribuídos.
* **Isolamento de Dados:** RLS multi-tenant ativo nas tabelas do banco de dados, impedindo acesso cruzado entre organizações.

---

## 4. AUDITORIA DE COMUNICAÇÃO E CORREÇÃO DE CLAIMS NA INTERFACE

A inspeção identificou discrepâncias entre as afirmações textuais da interface e o ambiente real:

### Discrepâncias Identificadas e Sanadas no Código
1. **Afirmação "TLS 1.3 Em Trânsito":**
   * *Inconsistência:* A aplicação em `http://3.143.251.44` opera sem TLS/HTTPS. Apresentar o selo "TLS 1.3" induzia o usuário a acreditar que sua conexão era segura, mesmo com o navegador exibindo "Não Seguro".
   * *Ajuste Realizado:* Substituído por `TLS / HTTPS` com classificação de padrão de governança e adequação arquitetural.
2. **Afirmação "AES-256-GCM Em Repouso":**
   * *Inconsistência:* O banco de dados PostgreSQL como um todo não possui criptografia transparente de tablespace no container. O AES-256-GCM é aplicado a nível de aplicação em **segredos, tokens de integração e dados pessoais sensíveis (PII)** via envelope `enc:v1:`.
   * *Ajuste Realizado:* Especificado como `AES-256-GCM / Segredos & PII` (técnica e factualmente verdadeiro).
3. **Afirmação de "Conformidade Total / 100% LGPD":**
   * *Inconsistência:* Nenhuma plataforma de software possui "certificação automática e total" da LGPD, que é um processo contínuo de governança jurídica, operacional e de segurança.
   * *Ajuste Realizado:* Atualizado para `LGPD (Art. 18) / Direitos do Titular` e `Governança de Privacidade LGPD`.

---

## 5. PROPOSTA DE ARQUITETURA HTTPS E SEGURANÇA PERIMETRAL

Para disponibilização corporativa segura, propomos 3 modelos, recomendando a **Opção 1 (ALB)** ou a **Opção 3 (Nginx + Let's Encrypt Refatorado)**:

### Opção 1: AWS Application Load Balancer (ALB) + ACM (Recomendada para Produção Enterprise)
```
[ Usuário ] 
     │ (HTTPS / 443 com TLS 1.3 + Certificado ACM)
     ▼
[ AWS Application Load Balancer ]
     │ (HTTP 301 automático na porta 80 -> HTTPS 443)
     │ (Segurança perimetral AWS WAF e DDoS Shield)
     ▼ (VPC Privada / Rede Interna)
[ EC2 Security Group: Ingress apenas do ALB na porta 80 ]
     ▼
[ Nginx Reverse Proxy ] ──> [ Container birthhub-app:3024 ]
```
* **Vantagens:** Gestão de certificados zero-touch via AWS ACM (renovação 100% automática), sem necessidade de rodar Certbot na instância; TLS 1.3 nativo; IP da EC2 pode ser mantido totalmente privado.

---

### Opção 2: Nginx + Certbot Let's Encrypt (Refatorado na Instância Atual)
Caso a arquitetura permaneça em Single-Node EC2:
1. **Domínio DNS:** Configurar um registro tipo `A` apontando o domínio oficial (ex: `app.birthhub360.com.br`) para o IP `3.143.251.44` (ou associar um Elastic IP fixo).
2. **Security Group:**
   * Abrir porta **443** (0.0.0.0/0).
   * Manter porta **80** (0.0.0.0/0) exclusivamente para o desafio ACME e redirecionamento 301.
   * **FECHAR porta 3024** para o mundo exterior (remover regra de inbound).
   * **RESTRINGIR porta 22** apenas ao IP do administrador (`<SEU_IP>/32`).
3. **Execução do Script Refatorado:**
   O script `setup-nginx-ssl.sh` foi reescrito no repositório para evitar o erro de certificados ausentes. Ele executa:
   - Configuração temporária de validação ACME HTTP-01 em `/var/www/certbot`.
   - Emissão do certificado Let's Encrypt com Certbot Webroot.
   - Aplicação da configuração HTTPS com protocolos TLS 1.2 e TLS 1.3, cifras modernas, HSTS Preload e `server_tokens off`.
   - Renovação diária no crontab com recarregamento suave do Nginx (`systemctl reload nginx`).

---

## 6. PLANO DE IMPLANTAÇÃO E REVERSÃO (ROLLBACK)

### Fase 1: Pré-Requisitos e DNS (Fora da EC2)
1. Garantir que o domínio `app.birthhub360.com.br` (ou equivalente) aponte para `3.143.251.44`.
2. Verificar propagação com `nslookup app.birthhub360.com.br` ou `dig +short app.birthhub360.com.br`.
3. No console da AWS EC2 -> Security Groups:
   - Adicionar Inbound Rule: Porta 443 (HTTPS), Origem `0.0.0.0/0`.
   - Remover Inbound Rule: Porta 3024 (fechar acesso direto).
   - Alterar Inbound Rule: Porta 22 (SSH) para o IP do operador.

### Fase 2: Aplicação na Instância EC2
```bash
# 1. Conectar via SSH
ssh -i "CHAVE_AWS.pem" ubuntu@3.143.251.44

# 2. Atualizar repositório e executar script SSL refatorado
cd /home/ubuntu/birthhub-360
git pull origin main
sudo chmod +x setup-nginx-ssl.sh
sudo ./setup-nginx-ssl.sh app.birthhub360.com.br admin@birthhub360.com.br

# 3. Atualizar .env de produção
nano /home/ubuntu/birthhub-360/.env
# Configurar:
# PUBLIC_BASE_URL=https://app.birthhub360.com.br
# BETTER_AUTH_URL=https://app.birthhub360.com.br
# ALLOWED_ORIGINS=https://app.birthhub360.com.br
# SECURE_COOKIES=true
# TRUST_PROXY=true

# 4. Reiniciar container da aplicação
docker restart birthhub-app
```

### Plano de Reversão (Rollback)
Caso ocorra qualquer falha na obtenção do certificado ou interrupção do serviço:
```bash
# Restaurar configuração HTTP original do Nginx
sudo cp /home/ubuntu/birthhub-360/nginx/birthhub360.conf /etc/nginx/sites-available/birthhub360
sudo nginx -t && sudo systemctl restart nginx

# Reverter variáveis do .env para HTTP
sed -i 's/https:\/\//http:\/\//g' /home/ubuntu/birthhub-360/.env
sed -i 's/SECURE_COOKIES=true/SECURE_COOKIES=false/g' /home/ubuntu/birthhub-360/.env
docker restart birthhub-app
```

---

## 7. SUÍTE DE TESTES E VERIFICAÇÃO DE SEGURANÇA

Após a ativação do HTTPS, os seguintes testes devem ser executados para aprovação do Gate:

1. **Teste de Redirecionamento 301:**
   ```bash
   curl -I http://app.birthhub360.com.br/
   # Deve retornar: HTTP/1.1 301 Moved Permanently com Location: https://app.birthhub360.com.br/
   ```
2. **Teste de Cabeçalhos e TLS:**
   ```bash
   curl -I https://app.birthhub360.com.br/
   # Validar presença de:
   # Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   # X-Content-Type-Options: nosniff
   # X-Frame-Options: SAMEORIGIN
   # Server: nginx (sem versão)
   ```
3. **Teste de Flag de Cookies:**
   ```bash
   curl -i -X POST https://app.birthhub360.com.br/api/auth/sign-in/email \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@dominio.com","password":"teste"}'
   # O cabeçalho Set-Cookie DEVE conter obrigatoriamente: Secure; HttpOnly; SameSite=Lax
   ```
4. **Teste de Bloqueio da Porta 3024:**
   ```bash
   curl --connect-timeout 5 http://3.143.251.44:3024/
   # Deve falhar por timeout / conexão recusada (bloqueada no Security Group).
   ```

---

## 8. SOLICITAÇÃO DE AUTORIZAÇÃO

Conforme exigido pelas restrições da Missão:
> **Nenhuma modificação direta foi aplicada na infraestrutura da AWS sem prévia autorização.**  
> Todas as correções de código (claims na interface, template seguro de Nginx e script de automação SSL resiliente) foram concluídas, testadas e integradas localmente no repositório.

**Solicitamos a autorização do responsável para os seguintes passos de infraestrutura:**
1. Confirmação do nome de domínio oficial (ex: `app.birthhub360.com.br`).
2. Aplicação das regras de Security Group na AWS (abrir 443, fechar 3024, restringir 22).
3. Execução do procedimento de ativação HTTPS no servidor EC2.
