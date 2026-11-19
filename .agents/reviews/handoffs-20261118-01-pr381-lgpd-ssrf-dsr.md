# Parecer Agente 24 — Revisão Independente — PR #381 (Agente 01)

- **Data:** 2026-11-18
- **Revisor:** Agente 24 — Revisão Independente
- **PR:** #381 `feat(lgpd+sec): handoffs Agente 01 — SSRF IPv6, DSR público, retenção landing, tenant chat`
- **Branch/revisão:** `agente/01-handoffs-20261117` @ `6cc36061133c22265393f8b83b63caa93da68eb4` (base `origin/main` @ `f8d4bc76d`)
- **Método:** diff integral via `git diff origin/main...<branch>` + inspeção dos blobs; execução real dos testes de unidade tocados em worktree isolado (`agente-24-inspect-381`, detached no head do PR).

## Escopo entregue

1. SSRF IPv6 transição (handoff `onda-2/15-para-01-ssrf-ipv6-transition-ranges`, destinatário "01 ou 15"):
   - novo módulo compartilhado `src/shared/security/ipv6.ts` (`ipv6ToBytes`, `classifyIpv6Transition`, `isPrivateIpv6Transition`);
   - integração em `src/lib/security/ssrfGuard.ts` (`isPrivateOrInternalIpv6`) e `src/shared/security/urlGuard.ts` (`isPrivateOrReservedIp`), ambos delegando o IPv4 embutido à política IPv4 da própria camada (6to4 `2002::/16`, Teredo `2001::/32` → bloqueio total por IPv4 ofuscado, NAT64 `64:ff9b::/96`, IPv4-compatible `::/96`).
2. Canal público DSR LGPD art. 18 (handoff `21-para-01-dsr-canal-publico-lgpd`): migration `20261117231500_data_subject_request_dsr`, model `DataSubjectRequest`, `dsrRequest.{schema,service,routes}.ts`, mount `/api/public/data-subject-requests`, rate limiter dedicado, OpenAPI.
3. Retenção landing (handoff `21-para-01-retencao-leads-landing-lgpd`): `landingLeadRetention.worker.ts` (90d sem avanço → `eraseDataSubject`), wiring em `workers.ts`/`worker.ts`.
4. Tenant do chat legado (handoff `05-para-01-chat-sessions-sem-coluna-tenant`): migration `20261117230000_outbound_chat_tenant_company` (`company` em `chat_sessions`/`chat_messages`).
5. Suporte: `ENCRYPTED_MODEL_FIELDS` +`DataSubjectRequest`, `TENANT_INJECTED_MODELS` +`DataSubjectRequest`, guarda anti-dupla-cifra `enc:v1:` em `piiFields.ts`, testes.

## Verificações

### Tenancy / RLS / migration DSR
- `prisma/migrations/20261117231500_data_subject_request_dsr/migration.sql`: `ENABLE` + `FORCE ROW LEVEL SECURITY` e policy `tenant_isolation` com `USING`/`WITH CHECK` em `current_setting('app.current_tenant_id', true)` — fail-closed, mesmo padrão de `PublicLeadConsent`. Classificação ADITIVA correta (só CREATE/ALTER aditivos).
- Tenant NUNCA vem do cliente: `resolveDsrOrganizationId()` (`dsrRequest.service.ts`) lê `LANDING_LEAD_ORGANIZATION_ID` (env validado em `src/config/env.ts:102`) e todo o fluxo roda dentro de `requestContext.run({ tenantId })` — RLS e injeção de tenant (`TENANT_INJECTED_MODELS`) aplicam a mesma rede dos demais models.
- `verifyDataSubjectRequest` resolve o titular pelo `emailIndex` (blind index HMAC via `contactEmailIndex`) gravado no pedido — nunca por `contactId` do cliente. Correto.

### Anti-enumeração / rate limit / PII
- POST `/` retorna `202 {ok:true}` idêntico para `created` e `no_subject` (rotas colapsam os dois resultados — `dsrRequest.routes.ts`); protocolo e tokens são aleatórios de 256 bits (`DSR-XXXX-…`, `randomBytes(32)`), tokens persistidos somente como SHA-256.
- GET `/status/:statusToken` devolve apenas metadados (protocol/rightType/status/datas) — sem e-mail, contactId ou dados do titular.
- Rate limit dedicado `dsrLimiter` (10 req/15min por IP, Redis-ou-memória) montado ANTES do router em `rateLimiters.ts` — coerente com endpoint sem auth que dispara SMTP e pode exportar/excluir dados.
- PII: `emailEncrypted`/`detailsEncrypted` via `encryptField` (AES-256-GCM) e registrados em `ENCRYPTED_MODEL_FIELDS`; a guarda `startsWith('enc:v1:')` adicionada em `src/lib/crypto/piiFields.ts` evita dupla cifragem pelo interceptor Prisma (o service já cifra) — alteração cirúrgica e necessária, não regressão.
- AuditLog registra apenas `subjectHash` (SHA-256 org:contact) — sem PII.

### Retenção landing
- `landingLeadRetention.worker.ts`: descoberta cross-tenant restrita a `Lead` via `requestContext.run({ bypassRls: true })`; cada anonimização roda escopada (`tenantId`) e delega a `eraseDataSubject` (que grava `OptOutRecord` de supressão — LGPD-correto). Guarda conservadora: pula titular com outro lead ativo (<90d, status não-terminal). Idempotente (pula contato já anonimizado). Agendado 04:15 diário em `workers.ts` e `worker.ts`; dead-letter registrado.

### SSRF IPv6 e chat tenant
- `ipv6.ts` é módulo único compartilhado (sem duplicação entre guards); parser byte-a-byte com suporte a `::`, cauda dotted-quad e sufixo de zona; política injetada (`isPrivateIpv4`/`isPrivateOrReservedIp` de cada camada) — desenho correto.
- Migration `20261117230000`: `ALTER TABLE IF EXISTS` + `ADD COLUMN IF NOT EXISTS` em tabelas legadas fora do Prisma — decisão documentada (sem RLS de propósito pois o módulo usa `$queryRawUnsafe` sem `app.current_tenant_id`; isolamento por filtro `company` é responsabilidade do 05 — coerente com a divisão de propriedade). `company NULL` em linhas antigas = fail-closed/invisível.

### Escopo/propriedade
- `prisma/**` → 01 ✓; `src/features/lgpd/**`, `src/lib/crypto/**`, `src/lib/security/ssrfGuard.ts`, `src/shared/security/**` cobertos pelo handoff 15→01 ("01 ou 15") ✓; bootstrap/workers/`worker.ts` são wiring de plataforma dentro do domínio 01; `docs/openapi.yaml` é contrato compartilhado (vizinho do 18) mas o diff apenas documenta os endpoints implementados — sem contradição.
- Handoffs alheios atualizados para `resolvido`/status sem apagar pedidos originais ✓.

### Evidência executável
- `npx vitest run` (config default) nos 5 arquivos de teste tocados: **158/158 verde** — `ssrfGuard.test.ts` (95), `urlGuard.test.ts` (48), `dsrRequest.routes.test.ts` (7), `dsrRequest.service.test.ts` (6), `landingLeadRetention.worker.test.ts` (2). Inclui vetores 6to4/Teredo/NAT64/IPv4-compatible em ambos os guards e contrato anti-dupla-cifra.

## Achados / ressalvas (não bloqueantes)

1. **Canal lateral de timing no POST `/`**: `createDataSubjectRequest` só envia o e-mail de verificação quando o titular existe, e o `await sendVerificationEmail` ocorre dentro do request — a resposta é idêntica, mas a latência pode distinguir "e-mail cadastrado" de "não cadastrado". Severidade baixa (a verificação por e-mail é o modelo decidido pelo 21 e o vazamento é de existência de lead, não de DSR); registrar como débito se o volume de abuso justificar (ex.: equalizar com envio simulado ou debounce).
2. **Ordem de merge obrigatória**: o PR #383 (Agente 05) já referencia a coluna `company` de `chat_sessions`/`chat_messages` criada aqui — **#381 deve mergear antes de #383** (o próprio #383 documenta a dependência e o módulo segue atrás do gate 503).
3. `GET /status` revela protocol/rightType/status a quem detém o `statusToken` (256 bits, hash-only no banco) — adequado; apenas não registrar o token em logs (o código não o faz).
4. `verifyDataSubjectRequest` executa ERASURE/PORTABILITY imediatamente após prova de posse do e-mail — decisão de produto documentada no service; o dossiê de portabilidade volta uma única vez no body da resposta (não persistido) — consistente com o schema (`resultSummary` não-PII).

## Veredito

**APROVADO-COM-RESSALVAS** — implementação correta, tenancy/RLS/anti-enumeração/PII verificados com evidência executável; ressalvas 1–2 acima (timing side-channel de baixa severidade e dependência de ordem de merge com #383). Nenhuma violação de propriedade, P1–P4 ou LGPD bloqueante.

**Recomendação de merge:** aprovar e mergear **antes** do PR #383.

---

## Adendo — decisão de dedup SSRF #381 × #394

Comparação integral das duas implementações do handoff `15-para-01-ssrf-ipv6-transition-ranges`:

| Critério | PR #381 (Agente 01) | PR #394 (Agente 15) |
|---|---|---|
| Arquitetura | Módulo único `src/shared/security/ipv6.ts`, política injetada, zero duplicação | `ipv6ToHextets` + `embeddedIpv4FromIpv6` **duplicados verbatim** em `ssrfGuard.ts` e `urlGuard.ts` (~70 linhas ×2) — violação P2 |
| Cobertura ssrfGuard | Equivalente (mapped hex/dotted já existia + 4 mecanismos) | Equivalente (consolida mapped no mesmo parser; malformado → fail-closed `block`) |
| Cobertura urlGuard | 4 mecanismos de transição; **NÃO cobre `::ffff:` em forma hex** (`::ffff:7f00:1`) — gap pré-existente mantido; **NÃO corrige link-local `fe80::/10`** (só `fe80:` literal) | Cobre os 4 mecanismos **+ mapped hex + `fe80::/10`** — estritamente mais completo neste arquivo |
| Testes | ssrfGuard +18 linhas, urlGuard +45 (4 vetores DNS + 1 público) | ssrfGuard arrays parametrizados (8 rejeitados/3 públicos), urlGuard `it.each` (9 casos) — cobertura equivalente ou maior no urlGuard |
| Propriedade | Autorizado pelo handoff ("01 ou 15") | Autorizado pelo mesmo handoff |

**Veredito de dedup: prevalece a implementação do PR #381** (`src/shared/security/ipv6.ts` + injeção de política nos dois guards) por ser arquiteturalmente superior (fonte única, sem duplicação, política por camada). O PR #394 deve **descartar/rebasear** seu parser duplicado. O delta funcional exclusivo do #394 — (a) `::ffff:` hex em `urlGuard.ts` e (b) correção `fe80::/10` em `urlGuard.ts` — é real e valioso (o gap hex-mapped existe em `main` hoje), mas deve ser portado como diff mínimo **sobre a base pós-#381**, idealmente estendendo `ipv6.ts`/`urlGuard.ts` sem reintroduzir parser paralelo. Detalhes no parecer `handoffs-20261118-15-pr394-ssrf-ipv6-dedup.md`.

**Evidência executável #381:** `npx vitest run tests/unit/lib/security/ssrfGuard.test.ts tests/unit/shared/security/urlGuard.test.ts tests/unit/features/lgpd/dsrRequest.{routes,service}.test.ts tests/unit/features/lgpd/landingLeadRetention.worker.test.ts` → **158/158 passou** (exit 0).
