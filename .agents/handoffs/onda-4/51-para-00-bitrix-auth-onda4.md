# Handoff 51 (Bela) → 00 — Auditoria de Autenticação e Credenciais Bitrix24 (Onda 4)

- **De:** Agente 51 — Bela (Autenticação e Credenciais Bitrix24)
- **Para:** Agente 00 — Coordenador
- **Onda:** 4 (missão ONA4-51-BITRIX-AUTH)
- **Status:** resolvido (auditoria concluída; 1 achado fora do ownership encaminhado; 0 defeitos corrigidos por inexistência de código sob `src/lib/integrations/bitrix/auth/**`)
- **Prioridade:** normal
- **Branch/worktree:** `agente/51-bitrix-auth-onda4` em `dem-20261123-onda4/wt-51-bitrix-auth` (base `32d07c375`)
- **Sprint destino:** —

## Problema

Auditar autenticação/credenciais Bitrix24: fluxos OAuth/token, expiração/renovação,
isolamento por tenant, armazenamento seguro de segredos. Ownership exclusivo:
`src/lib/integrations/bitrix/auth/**`.

## Achado estrutural principal (decisão de escopo)

**Não existe `src/lib/integrations/bitrix/auth/` e ela NÃO deve ser criada.**

- O módulo `src/lib/integrations/bitrix/` contém apenas `client.ts` (circuit breaker B-11,
  sem nenhuma lógica de auth), `batch/extractor.ts` (validação B-12) e `mapping/mapper.ts`
  (fallback tipado de campos) — propriedade dos Agentes 52–54.
- A autenticação real do Bitrix24 **não é OAuth**: é webhook de entrada — token estático
  embutido na `BitrixConnection.webhookUrl` (`https://portal/rest/<user>/<token>/`) mais
  `webhookSecret` para o webhook de saída (entrada de eventos). Não há `access_token`/
  `refresh_token`/`expires_at` no schema para Bitrix — logo **não há fluxo de renovação a
  auditar**. `tokenRefreshLock.ts` (entregue na onda-2, commit `f6089a5da`) é um helper
  genérico de lock distribuído para OAuth futuro, **sem nenhum caller de produção** — apenas
  testes. Manter é correto (infra pronta), remover seria regressão de entrega anterior.
- A lógica de credenciais vive em `src/features/integrations/bitrix/service/`
  (`connections.ts`, `client.ts`, `settings.ts`, `tokenRefreshLock.ts`), território do
  Agente 06/squad 50 — fora do meu ownership. Criar `lib/.../auth/` agora duplicaria essa
  lógica (viola P2/P3). Recomendação: se o Coordenador quiser consolidar auth Bitrix em
  `lib/integrations/bitrix/auth/`, isso é um refactor de propriedade do 06/00, não uma
  correção minha.

## Auditoria executada (evidências)

### 1. Armazenamento em repouso — OK
- `BitrixConnection.webhookUrl` e `webhookSecret` estão em `ENCRYPTED_MODEL_FIELDS`
  (`src/lib/crypto/encryptedModelFields.ts:16`), cifrados AES-256-GCM via extensão Prisma
  (`src/lib/crypto/secretFields.ts`, envelope `enc:v1:`, fail-closed em produção sem
  `CREDENTIALS_ENCRYPTION_KEY`, com grace period de rotação via `..._PREVIOUS`).
- `decryptSensitiveRecord` usa `tryDecryptField` — falha de decifragem isola por registro,
  nunca vaza ciphertext; valor corrompido nunca é tratado como válido.

### 2. Isolamento por tenant — OK (sem fallback inseguro)
- Toda resolução de credencial passa por `getConnectionWebhookUrl(organizationId,
  connectionId)` (`service/client.ts:210`) com `where: { id, organizationId }` — 404 se o
  par não pertence ao tenant. ~30 call sites auditados (leads, deals, extraction,
  outboundSync, dailyPlan, hubTasks, syncRules, customFields, webhook).
- Fallback global `BITRIX24_WEBHOOK_URL` é fail-closed por allowlist
  (`BITRIX24_WEBHOOK_URL_ORG_ALLOWLIST`, `service/settings.ts:16-24`, correção DEBT-0006) —
  org fora da lista recebe `null`, nunca a credencial de outro tenant.
- Webhook de entrada (`bitrix.webhook.ts:282-300`): `findUnique` por `connectionId` roda só
  sob `bypassRls` para o lookup inicial; `organizationId` é derivado DA CONEXÃO persistida,
  todo o resto roda em `requestContext.run({ tenantId })` com RLS. `application_token`
  comparado com `timingSafeEqual`; timestamp com replay guard + fingerprint de entrega.
  `processQueuedWebhookEvent` revalida `connection.organizationId === data.organizationId`.
- Rotas `/connect`, `/disconnect`, `/test`, secrets exigem `managementRoles`
  (`bitrix.routes.ts:94,109,127`).

### 3. Vazamento de segredo — OK
- Nenhum `logger.*` em `src/features/integrations/bitrix/**` ou `src/services/bitrix/**`
  emite `webhookUrl`/`webhookSecret`/token (grep dedicado). Logs usam `hostnameOf()`
  (só host), `connectionId`, `correlationId`, `portalDomain`.
- Mensagens de erro de `callBitrix`/`testWebhook`/`urlGuard` são sanitizadas — teste
  existente `client.test.ts` ("esgota as tentativas ... AppError sanitizado (sem vazar
  webhook/token)") passa. `urlGuard.ts` nunca ecoa a URL nas mensagens.
- Respostas HTTP nunca devolvem `webhookUrl`/`webhookSecret` em claro — `listBitrixConnections`
  expõe só `portalDomain`/`hasWebhookSecret`; `regenerateWebhookSecret` devolve o segredo uma
  única vez por design (documentado).
- `bitrixWebhook.queue.ts` job data carrega só ids — nunca a URL/token.

### 4. Falhas de reconexão — OK
- 401/403 do Bitrix → `BitrixDefinitiveError` "reconecte o portal" (não retentado), conta
  para circuit breaker por `webhookUrl` (chave = conexão inteira, não hostname — um tenant
  quebrado não derruba outro). Pacing por portal serializado (`paceBitrixRequest`).
- `connectBitrix` valida a URL com chamada real a `profile.json` antes de persistir
  (token revogado/typo falha na hora, não na primeira exportação).

## Achado encaminhado (fora do ownership — NÃO corrigido por mim)

**Inconsistência de seleção de conexão em orgs multi-portal (mesmo tenant, portal errado
possível — prioridade normal, não P0 cross-tenant):**

- `getBitrixSettings` (`service/settings.ts:27-31`) usa `orderBy: { createdAt: 'desc' }`
  → conexão **mais nova**. Consumidores: `universalConnectors.service.ts:55` e
  **`universalTasksAndNotesTool.ts:328-333`**, que chama `tasks.task.add` direto no
  `webhookUrl` retornado.
- Todos os demais caminhos usam a conexão **mais antiga**: `outboundSync.ts` (3×
  `findFirst asc`), `BitrixLeadWritebackAdapter.ts:17-20`, `listBitrixConnections`
  (`connections.ts:44`, `asc`) → `dailyPlan.service.ts`/`hubTasks.service.ts`
  (`connections[0]`).
- Efeito: numa organização com 2+ portais Bitrix, tarefas criadas pela ferramenta de IA
  podem ir para um portal diferente do usado por export/sync/plano diário. Não é vazamento
  cross-tenant (sempre `organizationId` no where), mas é credencial errada dentro do mesmo
  tenant.
- **Ação sugerida ao 00:** alinhar a ordenação (decidir `asc` como canônico, pois é o que a
  maioria usa) em `settings.ts` e/ou exigir `connectionId` explícito nas ferramentas.
  Arquivos: `src/features/integrations/bitrix/service/settings.ts` (06) +
  `src/features/intelligence/tools/universalTasksAndNotesTool.ts` (07). Além disso, essa
  tool chama o Bitrix com `safeFetch` direto, fora do `callBitrix` — sem pacing
  (`BITRIX_MIN_INTERVAL_MS`), sem retry e sem circuit breaker (observação correlata).

## Testes / evidências

- `npx vitest run -c vitest.unit.config.ts src/features/integrations/bitrix
  src/lib/integrations` → **19 arquivos, 216 testes, todos verdes** (baseline e
  pós-auditoria — nenhum código alterado, pois nada sob meu ownership exigia correção).
- Auditoria prévia `BITRIX24-LEAD-FLOW-AUDIT.md`: **não encontrada** no worktree
  (`find` em `.`, `docs`, `.agents`) — este relatório cobre o escopo de auth; lead-flow
  fica para os agentes de extração/sync.
- Sem chamadas reais ao Bitrix24; sem credenciais acessadas; mocks apenas.

## Arquivos alterados

- Nenhum arquivo de código. Somente este handoff (propriedade do emissor).

## Bloqueios / pendências

- Nenhum bloqueador. Decisão pendente do 00: (a) aceitar que `lib/.../auth/` não se aplica
  a este módulo (recomendado); (b) rotear o achado de ordenação de conexão acima.
