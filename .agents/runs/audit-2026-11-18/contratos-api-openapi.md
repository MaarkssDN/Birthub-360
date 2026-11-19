# Auditoria Agente 18 — Contratos, API e Documentação Viva (READ-ONLY)
**Data:** 2026-11-18 | **Base:** `main @ b54060ad1` | PRs #381–#393 não considerados (estado = main apenas).

**Nota estrutural:** `server.ts` delega a `src/bootstrap/routes.ts` (`mountFeatureRoutes`), `webhooks.ts`, `rateLimiters.ts`, `auth.ts`. O "app.use central" vive em `src/bootstrap/routes.ts:87-288`.

## 1. Inventário de routers

### Montados: ~70 mounts cobrindo todos os `*.routes.ts` de feature, exceto:

### Não montados (código morto)
| Arquivo | Status |
|---|---|
| `src/features/settings/routes/settings.routes.ts` (`GET/PUT /api/settings`) | **Nunca importado** — `GET /api/settings` cai em 404 |
| `src/features/job-roles/routes/job-roles.routes.ts` | Não importado; mount real é `jobRole.routes.ts` — dois routers, um morto |
| `src/features/prospecting/outbound/server/routes/*` (7 arquivos) | Não montados; `/api/outbound` → `unavailableLegacyModule` — dead code intencional |
| `src/lib/voice-hub/routes/index.ts` + ~20 route files | Router raiz nunca importado (confirmado `MAPA-MODULOS.md:210`); `twilio` nem está no package.json |
| `src/features/voice-hub/pages/Dashboard/**` (~30 páginas) | Inalcançáveis; chamam `/api/settings`, `/api/call-logs`, `/api/billing/*` etc. — **endpoints inexistentes na API principal**. Dead code frontend↔backend inteiro |
| `LeadController.triggerStaleFollowups` | Método sem rota |

### Mounts sem authenticateToken explícito (todos justificados, exceto fragilidade)
- `/api/calendar/booking-links` → privateBookingRouter auto-protegido (`booking.routes.ts:97`) — OK mas não evidente no mount.
- `/api/intelligence`, `/api/agent`, `/api/knowledge`, `/api/bug-reports` → auth chega **indiretamente** via rate limiters (`rateLimiters.ts:66,69,74,114`). Funciona hoje, mas frágil: remover/condicionar um limiter deixa a rota sem auth sem erro de build.
- `/api/public/proposals/:token/view` — público justificado, mas **sem rate limit dedicado** (só apiLimiter genérico). Risco baixo.

## 2. Achados

### API-01 — Endpoints documentados que não existem (drift invisível ao gate) — P2, Alta
- `docs/openapi.yaml:7082` (`GET /cadence/opt-outs/check`), `:7374` (`POST /cadence/runs/{id}/events`) — rotas não existem em `cadence.routes.ts` nem no repo. Frontend não chama; doc mente e Postman propaga endpoints fantasmas.
- Correção: implementar ou remover do YAML.

### API-02 — `verify:openapi-drift` não detecta paths documentados sem rota — P2, Alta
- `openapiRouteInventory.ts:176-180` (phantom check só nível de prefixo); `verify-openapi-drift.ts:316-362` (Passe 2 só código→doc; nunca path doc sem código).
- API-01 é a prova viva do falso verde.
- Correção: diff simétrico doc×código.

### API-03 — Envelope de erro heterogêneo: 3+ formatos — P2, Alta
1. Canônico `{success:false,error,code,retryable,requestId}` (`errorHandler.ts:169-177`).
2. Respostas manuais `{success:false,error}` sem code/requestId (`prospecting.routes.ts` várias, `booking.routes.ts:246,311`, `pillarSettings.routes.ts:34-37`, catch-all `routes.ts:286`); cold-email `res.status(500)` hardcoded.
3. Públicos usam `{ok:true/false,error}` (`publicLead.routes.ts`, `dsrRequest.routes.ts`, `rateLimiters.ts`) — `apiFetch` (`api.ts:79`) só desembrulha `'success'`, `ok` nunca desembrulhado → reuso via apiFetch quebra silenciosamente.
4. Sucesso heterogêneo: `{success:true}` sem data, `{success:true,message}`, `{result}`.
- Correção: migrar manuais para `AppError`/`sendError`; padronizar `ok`→`success` ou documentar exceção.

### API-04 — POSTs de criação sensíveis sem idempotência — P2, Alta
- `POST /api/calendar/book/:slug` (`booking.routes.ts:302-457`): Contact+Lead+Activity sem idempotency key — duplo clique/retry duplica.
- `POST /api/prospecting/promote` (`:236-272`), `POST /api/prospecting/cold-email` (`:341-365`, e-mail real duplicável), `/crm/leads/:id/convert`, `/crm/documents`, `/mesa-tratamento/lead/:id/register`.
- Contraste: webhooks têm dedupe completo; whatsapp aceita `x-idempotency-key`; Stripe exige idempotencyKey; cadência tem índice único anti-run-duplo.
- Correção: `Idempotency-Key` header ou dedupe natural `(organizationId, leadId, slot)`.

### API-05 — Listas sem paginação (amostral) — P3, Alta
- `mesaTratamento.routes.ts:192` (`lead.findMany` sem `take` — todos os leads abertos a cada poll), `:410,418`; `prospecting.routes.ts:443`; `booking.routes.ts:105`.
- Positivos: leads/contacts/companies paginam; cadence take:200; notifications take:50.

### API-06 — Divergência de campo frontend↔backend (voz) — P3, Alta
- `voiceHub.api.ts:57` espera `run.currentTouchIndex`; DTO real expõe `currentTouchOrder` (`cadence.api.ts:69`). `VoiceHubView.tsx:435` renderiza `Toque atual: #{run.currentTouchIndex + 1}` → `#NaN` com cadências de voz ativas.
- Correção: renomear no client ou mapear no service.

### API-07 — Escritas de prospecção sem validação Zod — P2, Alta
- `/decision-makers` (`:296-312`), `/icebreaker` (`:322-335`), `/cold-email` (`:349`), `/promote` (`:241`), `/companies/:id/enrich-cascade` (`:407`), `/saved-searches` POST (`:459`), `/enrich-cnpj` (`:213`) — casts diretos/`req.body||{}`. Contraste: `/discover`, `/interpret`, `/ocr`, `/reject` usam `validateRequest(zod)`.
- Correção: schemas Zod por rota.

### API-08 — Autorização por papel ausente em rotas de IA — P2, Média-Alta
- `intelligence.routes.ts`: só 4 pontos com requireRole (`:470,523,676,927`); ~24 endpoints restantes aceitam qualquer papel incl. VISUALIZADOR sob aiLimiter (rate limit ≠ autorização). `/prospecting/enrich-cnpj`, `/providers`, saved-searches idem.
- Correção: `requireRole` nas rotas que disparam LLM/provider pago.

### API-09 — Tipos duplicados frontend↔backend — P3, Alta
- `analytics` domain/service/api/UseCases; `cadence.api.ts:5-8` declara "tipos locais espelhando o shape real". Padrão de duplicação persiste por design em `*.api.ts`.
- Correção: contratos compartilhados em `src/shared/contracts/` (existe — `predictiveRevenueOracle.contract.ts` é o bom exemplo).

### API-10 — Sem versionamento de API — P3, Alta
- Sem `/v1`/`/v2`; app Android Capacitor consome mesma API — breaking change quebra clientes instalados.
- Correção: política documentada (aditivo OK; breaking exige alias/dupla escrita).

### API-11 — Endpoints legados documentados como 500/501 ambíguo — P3, Média
- `openapi.yaml:5055,5129,5162,5218` declaram que `/agent/model-benchmark`, `/agent/proactive-alerts`, `/agent/audit-logs`, `/agent/prompt-ab-testing/experiments` "falham sempre com 500" e "501 é o planejado" — spec registra bug como verdade ou está desatualizado.
- Correção: verificar resposta real e alinhar.

### API-12 — `catch (error: any)` sistemático em boundaries — P3, Alta
- Dezenas de ocorrências; mascara divergências de contrato no limite (antipadrão api-contracts).

## 3. Saudável
- errorHandler central sanitiza status/mascara 5xx em prod, mapeia ZodError/P2002/P2025, inclui code/retryable/requestId.
- Rate limiting exemplar (global + por tenant IA/export + por IP auth/público/booking/DSR, fallback memória).
- Idempotência de webhooks completa.
- Paginação nos fluxos quentes OK.
- `enumMap.ts` centraliza enums — classe de bug contida.
- OpenAPI cobertura ampla (~400+ paths); verify:openapi-drift 2 passes + schemathesis script.

## 4. Limitações
- PRs #381–#393 não auditados.
- verify:openapi-drift não executado nesta sessão (executado depois pelo coordenador: PASS — mas ver API-02).
- Divergências DTO amostradas, não exaustivas.
- `agente-codigo-local/` fora do escopo.

## 5. Top-5 riscos de contrato
1. **API-01+02:** OpenAPI mente sobre endpoints de cadência e o gate não detecta "doc sem código" — integração errada garantida.
2. **API-03:** 3 envelopes de erro/sucesso — sem contrato único para clientes novos (mobile).
3. **API-04:** POSTs de criação/envio sem idempotência — duplicatas em produção.
4. **API-07+08:** prospecção/IA sem Zod e sem requireRole — payload inválido vira 500; VISUALIZADOR dispara LLM pago.
5. **~31k LOC de código morto de contratos** (voice-hub routes+pages, settings.routes, job-roles.routes, outbound/*) — falso positivo de cobertura e herança de contratos nunca validados se reativados.
