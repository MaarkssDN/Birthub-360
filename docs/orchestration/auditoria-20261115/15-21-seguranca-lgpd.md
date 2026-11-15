# Auditoria de Segurança Aplicada e LGPD — Agentes 15/21

**Demanda:** DEM-20261115-001 (auditoria geral orquestrada pelo Agente 00)
**Data:** 2026-11-15
**Escopo:** somente leitura. Nenhum código foi modificado. Nenhum valor de segredo foi reproduzido — apenas localização e tipo do risco.
**Base auditada:** working tree atual (`7c367453a`), `server.ts` + `src/bootstrap/*`.

---

## 1. ELOGIOS (evidências verificadas)

### Autenticação, sessão e autorização

- **Argon2id com parâmetros OWASP** para senhas, com verificação retrocompatível a hashes scrypt legados — `src/lib/auth/password-hash.ts:18-46` (m=19456 KiB, t=2, p=1, dkLen=32, PHC format).
- **Bloqueio de conta por tentativas** complementando rate limit por IP: 5 falhas → lockout de 15 min, contador zerado no sucesso, sem enumeração de e-mail — `src/lib/auth.ts:21-30, 226-286`.
- **Revogação de sessões no reset de senha** (`revokeSessionsOnPasswordReset: true`) — `src/lib/auth.ts:110`.
- **Verificação de e-mail obrigatória em produção** via `requireEmailVerification: !env.ALLOW_DEV_AUTH_BYPASS`, e `ALLOW_DEV_AUTH_BYPASS=true` aborta o boot com `NODE_ENV=production` — `src/lib/auth.ts:104`, `src/config/env.ts:389-391`.
- **`BETTER_AUTH_SECRET` validada em produção**: ausente/fraca/placeholder → `process.exit` — `src/config/env.ts:473-489`.
- **Campos de privilégio não auto-editáveis**: `role`, `organizationId`, `lockedUntil`, `failedLoginAttempts` com `input: false` — `src/lib/auth.ts:311-345` (impede `updateUser({role:'ADMIN'})`).
- **RBAC canônico único** (`ADMIN>GESTOR>CLOSER>SDR>VISUALIZADOR`) com `requireRole`/`requireTenant`; `organizationId` sempre derivado da sessão, nunca de header — `src/features/lgpd/lgpd.routes.ts:19-24`, `src/shared/middlewares/requireRole.ts`, `src/shared/middlewares/authorization.ts`.
- **Cookies de sessão**: `httpOnly`, `sameSite:'lax'`, `secure` condicionado a HTTPS real — `src/lib/auth.ts:294-310`.
- **Rate limiting dedicado de auth** (`AUTH_RATE_LIMIT_MAX`, default 20/15min, só POST) separado do genérico — `src/bootstrap/rateLimiters.ts:80-96`, `src/config/env.ts:77-82`.
- **Limitadores por tenant** para rotas de IA/export/bug-report (chave `organizationId`, fallback IP via `ipKeyGenerator`) — `src/bootstrap/rateLimiters.ts:49-179`.
- **`trust proxy` + reescrita de X-Forwarded-For** documentada e fail-safe — `src/bootstrap/security.ts:72-109`.

### Segredos e criptografia em repouso

- **AES-256-GCM com envelope versionado** (`enc:v1:<keyId>:...`) para credenciais de integrações, com chave anterior em grace period — `src/lib/crypto/secretFields.ts:1-50`.
- **Fail-closed em produção** para `CREDENTIALS_ENCRYPTION_KEY` e `PII_BLIND_INDEX_KEY` — `src/lib/crypto/secretFields.ts:26-38`.
- **Criptografia de PII de contato** (email/phone/whatsapp) + índice cego HMAC para busca — inventário em `docs/lgpd/INVENTARIO_CAMPOS_PII.md` (32 campos cifrados em 17 models, incluindo `StripeConnection.secretKey`, `SlackConnection.botToken`, `OmieConnection.appSecret`, `BitrixConnection.webhookUrl`).
- **Gitleaks no CI** com `.gitleaks.toml` dedicado — `.github/workflows/ci.yml:28-43`.
- **Scripts de varredura locais** prontos: `scripts/security/scan-secrets.sh`, `secret-scan-diff.sh`, `pii-log-scanner.ts`, `rotate-secrets.sh`.
- **Runbooks de rotação completos** em `docs/security/runbooks/` (Bland AI, Bitrix24, Better Auth, credenciais, webhook secrets, git history rewrite).
- **Nenhum `.env` real versionado**: `git ls-files` mostra apenas `.env.example`, `.env.test.example`, `agente-codigo-local/.env.example`, `landing/.env.example`; `.gitignore:9-11` cobre `.env*`; `.env.test` local contém apenas credenciais dev documentadas.
- **Nenhum dump em `backups/` na árvore atual** (`git ls-files backups/` = 0; `.gitignore:56-61` cobre todos os formatos pg_dump).
- **Os 3 commits citados do dump (`2e30b2f`, `543c5b0`, `8b1bc38`) não existem neste clone** — `git cat-file -t` falha para os três; o histórico atual não contém `backups/` em nenhum commit alcançável, sugerindo reescrita já realizada ou clone de histórico divergente. **Recomendado confirmar com o Agente 08** se a reescrita foi efetivada em todos os remotes.

### Headers, CORS, CSRF, injeção

- **Helmet com CSP restritiva em produção** (`script-src 'self'`, `object-src 'none'`, `baseUri 'self'`), HSTS condicional a HTTPS — `src/bootstrap/security.ts:118-162`.
- **CORS fail-closed com allowlist explícita**, sem wildcard de esquema (`chrome-extension://`, `.railway.app` removidos — documentado em comentário BT360-DT-0074/BACKEND-001), `credentials:true` — `src/bootstrap/security.ts:164-218`.
- **`assertAllowedOriginsConfigured()` aborta boot em produção sem `ALLOWED_ORIGINS`** — `src/bootstrap/security.ts:23-28`, chamado em `server.ts:58`.
- **CSRF guard global** — `src/bootstrap/security.ts:221` (`src/shared/security/csrfGuard.ts`).
- **`dangerouslySetInnerHTML`: zero ocorrências em `src/**/*.tsx`** — superfície XSS mínima; React escapa por padrão.
- **SQL cru sempre parametrizado**: `$queryRaw`/`$executeRaw` com template tags em todo `src/`; os únicos `*Unsafe` (`outbound/server/db.ts`, `prismaOutbox.repository.ts`, `dbRoleCheck.ts`) recebem SQL estático + parâmetros posicionais — `src/features/prospecting/outbound/server/db.ts:21-45`. Nenhuma interpolação de input do usuário em SQL foi encontrada.
- **Webhooks pré-JSON**: birth-voice, 3CX, voice-result, email, signature, Bitrix, Chatwoot, Stripe — todos com HMAC/segredo fail-closed e replay guard — `src/bootstrap/webhooks.ts:20-56`, `src/shared/security/webhookReplayGuard.ts`.
- **Sanitização de input** contra prototype pollution implementada — `src/shared/middlewares/sanitizeRequest.ts`.
- **SSRF guard** dedicado — `src/lib/security/ssrfGuard.ts`, `url-validator.ts`; usado por integrações externas (`slack.service.ts`, `stripe.service.ts`, `threecx.service.ts`, `bitrix/service/client.ts`).

### LGPD

- **DSR implementado**: exclusão/anonimização (`DELETE /api/lgpd/titular/:contactId`) e portabilidade (`GET .../export` com senha de transporte opcional via header) — `src/features/lgpd/lgpd.routes.ts:14-88`, `src/shared/services/dataSubjectErasure.service.ts` (transação ACID, anonimização irreversível, limpeza de áudios S3, redação em WhatsApp/transcrições/timeline).
- **Cadeia de consentimento append-only** com HMAC do titular (`hs256:` + tombstones) — `src/lib/security/consentAuditChain.service.ts`, `prisma/schema.prisma:5683` (`ConsentAuditRecord`), `docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md`.
- **PII nunca em claro em logs**: hook `logMethod` do pino sanitiza strings (CPF/CNPJ/email/telefone → marcadores irreversíveis) + `redact` por caminho cobrindo credenciais, tokens, `webhookUrl`, `apiKey`, `email`, `url` — `src/lib/logger.ts:36-160`. Regressão coberta por `scripts/security/pii-log-scanner.ts`.
- **Opt-out por contato/canal** com escopo e evidência — `src/features/lgpd/lgpd.routes.ts:122-172`.
- **Captura pública de lead** com honeypot, rate limit por IP, tenant fixo server-side (`LANDING_LEAD_ORGANIZATION_ID`), IP hasheado HMAC (nunca em claro) e prova de consentimento persistida (`PublicLeadConsent`) — `src/features/public-leads/publicLead.routes.ts:18-52`, `src/config/env.ts:95-103`.
- **Expurgo LGPD de extrações Bitrix** implementado e agendado — `src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts`, `src/bootstrap/workers.ts:220`.
- **Inventário ROPA completo** (`docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md` — finalidades, bases legais, retenção) + inventário técnico gerado com gate de drift (`INVENTARIO_CAMPOS_PII.md`, `scripts/lgpd/ropa-inventory.ts --check`).
- **Superfícies administrativas em camadas**: `/admin/queues` exige sessão ADMIN + `requirePlatformOperator` (token timing-safe, fail-closed) + isolamento de tenant no adapter — `src/bootstrap/bullBoard.ts:75-85`, `src/shared/middlewares/requirePlatformOperator.ts`.
- **`/metrics` protegido por `requirePlatformOperator`** quando `EXPOSE_METRICS` — `src/bootstrap/observability.ts:26-40` (débito antigo resolvido).
- **`/api-docs` opt-in explícito** (`EXPOSE_API_DOCS`, default off; desligado em produção sem flag) — `src/bootstrap/apiDocs.ts`.
- **Error handler não vaza stack em produção** (500 → mensagem genérica) e respostas com `code`/`requestId`/`retryable` estáveis — `src/shared/middlewares/errorHandler.ts:136-180`.
- **API keys de tenant** com prefixo `bhk_`, escopos, revogação/expiração, role sintético `API` que não passa em `requireRole` — `src/features/api-keys/apiKey.middleware.ts`.
- **dbRoleCheck** valida que a role do banco não é superuser/BYPASSRLS — `src/bootstrap/dbRoleCheck.ts`, `server.ts:66`.

---

## 2. PROPOSTAS DE MELHORIA

1. **Publicar a matriz de rotas públicas** num único documento/teste de contrato: hoje a lista de exceções (`/api/public/*`, webhooks, `/api/auth`, `/api/calendar/book`, health, `/api-docs`, `/metrics`) está dispersa em `server.ts`/`bootstrap/*`. Um teste que enumera rotas sem `authenticateToken` evitaria regressão silenciosa.
2. **Adicionar verificação de JWT/session no `apiKeyAuth` rate limit**: hoje não há limiter dedicado para `/api/*` com `x-api-key` além do `apiLimiter` genérico — considerar bucket por `apiKeyId` para conter abuso de chave vazada.
3. **Alerta de drift ROPA em CI**: o gate `ropa-inventory.ts --check` existe; garantir que roda em todo PR que toca `prisma/schema.prisma` ou `encryptedModelFields.ts`.
4. **Métricas de DSR**: expor contadores (requisições de exclusão/portabilidade, tempo de atendimento, falhas) para evidenciar SLA interno do controlador.
5. **Revisar `sameSite:'lax'` vs fluxo OAuth**: se algum fluxo de retorno OAuth depender de POST cross-site, avaliar `sameSite:'none'; secure:true` restrito — validar antes de mudar.
6. **Documentar rotação de `PUBLIC_LEAD_IP_HASH_SECRET` e `PII_BLIND_INDEX_KEY`** em runbook (o de `PII_BLIND_INDEX_KEY` já existe; falta o do IP hash, que é sal de prova de consentimento).
7. **Cobertura de `pii-log-scanner.ts` no CI**: script existe mas não está referenciado em `package.json`/workflows — ligar ao gate de PR (mesmo padrão do gitleaks).

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0 — nenhum encontrado

Nenhum segredo real exposto no working tree, nenhum endpoint de dados de tenant sem autenticação, nenhuma credencial em texto claro em repouso, nenhum dump versionado no HEAD.

### P1 — Alto

1. **Retenção de leads da landing declarada mas não aplicada.** `LANDING_LEAD_RETENTION_IDLE_DAYS`/`AFTER_DEMO_DAYS` existem em `src/config/env.ts:103-105`, mas o próprio comentário diz "o job de purge fica como follow-up" e **nenhum worker/rota consome essas envs** (grep em `src/` e `scripts/` só retorna `env.ts`). Titulares da demo têm PII retida indefinidamente além do prazo declarado na política — inconsistência ROPA × execução.
   - *Ação:* implementar worker de purge (mesmo padrão de `bitrixExtractionPurge.worker.ts`) ou registrar débito formal com prazo.
2. **Sem canal self-service de exercício de direitos (DSR) para o titular.** Todas as rotas `/api/lgpd/titular/*` exigem `ADMIN`/`GESTOR` autenticado do tenant (`lgpd.routes.ts:14-56`). A LGPD (art. 18) exige que o titular possa requerer diretamente; hoje depende de canal informal (e-mail) + ação manual do operador. Não há endpoint público de solicitação (com verificação de identidade do requisitante) nem registro de pedidos do titular como entidade própria — `dataSubjectErasure.service.ts` só é invocado por rotas admin.
   - *Ação:* criar `DataSubjectRequest` (schema → handoff 01) + endpoint público autenticado por token de solicitação, ou documentar formalmente o canal (e-mail do DPO) no ROPA com evidência.
3. **Retenção de dados CRM (contacts/leads) sem automação.** O ROPA declara "duração do ciclo comercial + 12 meses → anonimização", mas não existe worker de expurgo para `Contact`/`Lead` — apenas Bitrix extraction e agent memory têm purge (`bitrixExtractionPurge.worker.ts`, `agentMemoryCleanup.worker.ts`). Dados de prospecção B2B podem ser retidos além da finalidade declarada.
   - *Ação:* handoff para 01/21 definir política de retenção por categoria e implementar sweep.

### P2 — Médio

4. **`sanitizeRequest` (anti prototype-pollution) não está montado em lugar nenhum.** O middleware existe em `src/shared/middlewares/sanitizeRequest.ts` mas nenhum `app.use` o referencia (grep em `src/`/`server.ts` sem matches fora do próprio arquivo). Defesas parciais existem (Zod em várias rotas, Prisma parametrizado), mas a proteção documentada está inerte.
   - *Ação:* montar globalmente após `express.json()` ou remover o código morto — decisão do 00/01.
5. **`/api-docs/openapi.yaml` e Swagger UI servidos sem autenticação quando `EXPOSE_API_DOCS=true`** — `src/bootstrap/apiDocs.ts:22-31`. Em dev é aceitável; se a flag for ligada em staging/homolog expõe o mapa completo da API. Considerar `requirePlatformOperator` ou bind por IP.
6. **Cookie `platform_operator_token` aceito via query string** (`?operator_token=`) — `src/shared/middlewares/requirePlatformOperator.ts:79,84`. Token em query vaza em logs de acesso de proxy/browser history. Aceitável para scraper Prometheus, mas recomenda-se desabilitar query param fora de contexto de scraping ou logar acesso.
7. **`agente-codigo-local/firebase-applet-config.json` ainda versionado** com identificadores reais de projeto Firebase (`projectId`, `appId`, `oAuthClientId`) — `agente-codigo-local/firebase-applet-config.json`. O `apiKey` já é placeholder, mas config de applet com IDs reais permanece; baixo risco (client identifiers não são segredos), mas o diretório inteiro parece scaffold de ferramenta, não produto.
   - *Ação:* confirmar se `agente-codigo-local/` deve estar no repo; se sim, sanitizar IDs.
8. **Caddyfile.oci sem TLS** — `Caddyfile.oci` serve apenas `http://{$DOMAIN::80}` com `reverse_proxy app:3000`. Se este for o edge de produção, todo o tráfego (inclusive cookies de sessão `secure`) depende de TLS terminado em camada externa não evidenciada no repo. Verificar com o Agente 10 se há LB/Cloudflare na frente; o cookie `secure` depende de `BETTER_AUTH_URL` https (`src/lib/auth.ts:295-308`).
9. **`SECURE_COOKIES` default `false`** — `src/config/env.ts` (enum default 'false'). Em produção depende de `BETTER_AUTH_URL` começar com `https://` para ligar `secure`/`useSecureCookies`. Se `BETTER_AUTH_URL` for esquecido ou http, cookies de sessão trafegam sem flag `Secure` mesmo atrás de TLS no edge.
   - *Ação:* em produção, derivar `secure` de `NODE_ENV` + presença de `ALLOWED_ORIGINS` https, ou tornar `SECURE_COOKIES` obrigatória em prod (mesmo padrão do `BETTER_AUTH_SECRET`).

### P3 — Baixo / Informativo

10. **`pii-log-scanner.ts` não está no gate** — script existe (`scripts/security/pii-log-scanner.ts`) mas não é referenciado em `package.json` nem workflows. Baixo custo ligar.
11. **`handoff-secrets.md` na raiz** documenta remediação passada — manter ou mover para `.agents/handoffs/` por higiene, sem risco.
12. **Webhook replay guard é fail-open sem Redis** — documentado e justificado em `src/shared/security/webhookReplayGuard.ts:25-32` (perder entrega legítima é pior). Risco residual aceito; recomendo revisitar se Redis indisponível em produção se tornar evento frequente (alerta já existe via readiness).
13. **`validateWebhookTimestamp` retorna `valid:true` para timestamp ausente** (`webhookReplayGuard.ts:48-50`) — correto por design (provedores não enviam timestamp), mas significa que a janela temporal não é uma defesa real hoje; o fingerprint dedupe cobre apenas 30 min. Documentado no cabeçalho do arquivo — manter como débito consciente.
14. **Rate limit de login é por IP + lockout por conta, mas sem CAPTCHA/prova de trabalho** — 20/15min por IP é contornável com IPs distribuídos; o lockout por conta mitiga. Considerar captcha após N falhas (melhoria, não falha).
15. **`isLocalDevOrigin` aceita toda a RFC1918 fora de produção** — `src/bootstrap/security.ts:38-65`. Correto para dev, mas staging/homolog com `NODE_ENV != 'production'` na mesma LAN fica com CORS aberto para qualquer dispositivo da rede. Confirmar que homolog roda com `NODE_ENV=production` ou `ALLOWED_ORIGINS` restritiva.

---

## 4. Verificações executadas

- `git ls-files | grep -iE "\.env|backup|dump|secret"` — sem `.env` real nem dumps na árvore.
- `git log --all -- backups/` → vazio; `git cat-file -t` nos 3 commits do dump → inexistentes neste clone.
- `grep -rn "\$queryRaw|\$executeRaw" src/` → 94 matches, todos parametrizados ou `*Unsafe` com SQL estático + binds.
- `grep -rn "dangerouslySetInnerHTML" src/**/*.tsx` → 0 matches.
- Varredura de padrões de segredo (`sk-`, `AIza`, `AKIA`, `PRIVATE KEY`, `xox*`, `ghp_`, JWT) em `src/`, `scripts/`, `docs/`, `postman/`, `docker-compose*`, `.github/` → apenas placeholder (`xoxb-...` em `SlackConnectionPanel.tsx:174`) e fixture de teste documentada (`pii-log-scanner.ts:147`, JWT de exemplo jwt.io).
- Leitura integral de: `server.ts`, `src/bootstrap/{security,rateLimiters,auth,webhooks,observability,apiDocs,healthchecks,bullBoard,routes}.ts`, `src/lib/auth.ts`, `src/lib/logger.ts`, `src/lib/crypto/secretFields.ts`, `src/config/env.ts` (parcial), middlewares de auth/RBAC/rate-limit, rotas LGPD, `dataSubjectErasure.service.ts`, `webhookReplayGuard.ts`, `errorHandler.ts`, `sanitizeRequest.ts`, `requirePlatformOperator.ts`, `apiKey.middleware.ts`, `Dockerfile`, `Caddyfile.oci`, `docs/lgpd/*`.

## 5. Pendências para outros agentes

- **00:** decidir sobre `sanitizeRequest` (montar ou remover) e sobre exposição de `/api-docs` em homolog.
- **01/01A:** handoffs de schema para `DataSubjectRequest` (canal self-service DSR) e workers de retenção CRM/landing-leads.
- **08:** confirmar estado da reescrita de histórico git (commits do dump ausentes neste clone) e presença do `pii-log-scanner`/`scan-secrets.sh` no gate de PR.
- **10:** confirmar terminação TLS na borda (Caddyfile.oci é HTTP-only) e política de `TRUST_PROXY`/`SECURE_COOKIES` no deploy real.
- **02:** UI de fluxo de direitos do titular self-service (se aprovado).
