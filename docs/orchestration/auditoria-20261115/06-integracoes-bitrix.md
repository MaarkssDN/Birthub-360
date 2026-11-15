# Auditoria Geral — Agente 06/06A: Integrações e Bitrix / Extrações Bitrix

- **Demanda:** DEM-20261115-001 (auditoria orquestrada pelo Agente 00)
- **Escopo:** somente leitura. Cliente Bitrix24 (REST/webhooks/mappings/paginação/rate limit), Extrações Bitrix, WhatsApp/Baileys, e-mail, Google Workspace, Apollo/Hunter, 3CX, Birth Voice, `bitrix_fields.json`/`parsed_fields.json`.
- **Base auditada:** working tree atual de `C:\Github\Birthub-360` (pós-ondas; os relatórios `DIVIDAS-AGENTE-06.md`/`DIVIDAS-AGENTE-06A.md` de 2026-11-04 foram usados como baseline e cada achado foi re-verificado no código atual).

---

## 1. ELOGIOS (evidências verificadas)

### Bitrix24 — cliente HTTP (`src/features/integrations/bitrix/service/client.ts`)

- **SSRF guard em TODA chamada e a cada retry.** `safeFetch` + `assertSafeExternalUrl` revalidam a URL do webhook a cada attempt, com fixação de DNS (anti-rebinding documentado). `client.ts:290-296`, `client.ts:147`, `client.ts:10`.
- **Classificação explícita de erro recuperável vs. definitivo.** 429/`QUERY_LIMIT_EXCEEDED`/5xx/rede/timeout → `TransientBitrixError` (retentável); 401/403/filtro inválido → `BitrixDefinitiveError` (nunca retentado). `client.ts:313-379`, `client.ts:390-400`.
- **Pacing proativo por portal, não só reativo.** `BITRIX_MIN_INTERVAL_MS` (default 500ms ≈ 2 req/s do plano básico) com fila serializada por `webhookUrl` — chamadas concorrentes da mesma conexão não geram burst. `client.ts:39-69`. Isso é superior ao mínimo da spec 06A §10.
- **Circuit breaker por conexão.** 5 falhas consecutivas → circuito aberto por 60s, fail-fast com mesmo contrato de erro; chaveado pelo webhookUrl inteiro (não vaza entre tenants). `client.ts:402-471`.
- **Cancelamento cooperativo ponta a ponta.** `BitrixCallAbortedError` + `AbortSignal` propagado do run até o fetch em voo, sem classificar cancelamento como falha. `client.ts:228-254`, `client.ts:266-353`.
- **Correlation ID por chamada lógica**, timeout de 15s por attempt, 4 tentativas, backoff exponencial com jitter + respeito a `Retry-After`. `client.ts:26-29`, `client.ts:94-96`.
- **Webhook de entrada (Bitrix → Atlas) é um modelo de segurança:** `application_token` comparado com `timingSafeEqual` (`bitrix.webhook.ts:42-49, 277`), timestamp anti-replay (`bitrix.webhook.ts:249-256`), fingerprint do corpo inteiro contra replay (`bitrix.webhook.ts:300-313`), 404 genérico para não vazar existência da conexão (`bitrix.webhook.ts:270-275`), opt-in por conexão (`inboundEventsEnabled`), nunca cria Lead a partir de evento cru (só atualiza já importados — fecha loop Bitrix→Atlas→push→Bitrix por construção, `bitrix.webhook.ts:19-30`), lookup inicial sob `bypassRls` restrito e todo o resto sob `requestContext` do tenant real (`bitrix.webhook.ts:263-268, 91`).
- **Segredos cifrados em repouso (AES-256-GCM transparente).** `BitrixConnection.webhookUrl` (que embute o token do portal na URL) e `webhookSecret` cifrados via extensão Prisma — `prisma/schema.prisma:2674-2687`, `src/lib/crypto/secretFields.ts`. `listBitrixConnections` nunca devolve a URL/token ao browser — só `portalDomain`, `webhookReceiverUrl`, `hasWebhookSecret` (`connections.ts:52-60`). O segredo do webhook de saída só é devolvido em texto puro na resposta da regeneração (`connections.ts:119-139`).

### Extrações Bitrix (`src/features/integrations/bitrix/service/extraction.ts` + `extractionFiles.ts`)

- **Cancelamento cooperativo real:** `runAbortController` disparado por polling de `status='cancelled'` entre páginas e propagado a cada `callBitrix` — aborta fetch em voo e impede páginas seguintes (`extraction.ts:545-549, 615-629, 668-672`). Resolve DIV-06A-004.
- **Teto de segurança de páginas com sinalização honesta:** `PAGE_SAFETY_CAP=500` (`extraction.ts:128`); paginação que não esgota o portal gera `status='completed_partial'` + `errorMessage` legível na tela + métrica `bitrixExtractionPartialTotal` — nunca finge extração completa (`extraction.ts:651-658, 714-741`). Resolve o bloqueador #12 de "extração incompleta tratada como recurso final".
- **Checkpoint incremental por entidade** persistido em `progress.entities[].checkpointTo` (Onda 41), com retomada só para períodos preset (nunca `custom`), e só gravado quando a entidade de fato esgotou o portal (`extraction.ts:94-113, 583-599, 639-647`).
- **Retry por entidade (2 tentativas, backoff) + retry por página (`MAX_PAGE_RETRIES`),** com métricas `bitrixExtractionRetriesTotal`/`bitrixExtractionFailuresTotal`/`bitrixExtractionPartialTotal` (`extraction.ts:603-698, 320-356`).
- **CSV/Formula Injection sanitizado:** `sanitizeCsvCell` prefixa `'` em `= + - @ \t \r` e aplica escape RFC 4180 (`extractionFiles.ts:75-107`; wrapper `src/services/bitrix/exportFormatter.service.ts`). Resolve DIV-06A-002.
- **Expurgo LGPD implementado e LIGADO por padrão:** `bitrixExtractionPurge.worker.ts` anonimiza runs terminais > `BITRIX_EXTRACTION_RETENTION_DAYS` (default 45d): remove arquivos do disco, zera `files`, redige `filters.search` (único campo de texto livre), anonimiza `errorMessage`, marca `purgedAt`, audita. `BITRIX_EXTRACTION_PURGE_ENABLED` default `'true'` (`src/config/env.ts:311-315`), agendado diário 5h via `upsertJobScheduler` (`bitrixExtractionPurge.worker.ts:242-261`), registrado em `worker-extracoes.ts:14-17, 29`. Resolve DIV-06A-003.
- **Isolamento de tenant no download:** `downloadExtractionFile` valida `organizationId` na query e devolve 410 honesto quando o arquivo sumiu (disco efêmero) — nunca finge que existe (`extraction.ts:878-918`).
- **Reconciliação de runs travados** (`reconcileStuckRuns`, `extraction.ts:~987-1041`) com reenfileiramento por `attempts < MAX_RUN_ATTEMPTS`.
- **Idempotência de push outbound:** trava em memória por entidade + fila BullMQ `bitrix-outbound-sync` com `jobId` determinístico `bitrix-push-{org}-{lead}`, 10 tentativas, backoff exponencial 10s, dead-letter (`src/lib/queue/bitrixOutbound.queue.ts:11-46`; `idempotentSync.ts:100-139`; `outboundSync.ts:9,87`).
- **Escopo por papel:** CLOSER/SDR restritos ao próprio `ASSIGNED_BY_ID` via mapeamento por e-mail, nunca "sem filtro" (que vazaria o portal) — `bitrix.routes.ts:44-73`.
- **Schema maduro:** `BitrixExtractionRun` com `correlationId`, `attempts`, `schemaVersion` (versão do `BITRIX_FIELD_MAP`), `countByEntity`, `purgedAt` (`prisma/schema.prisma:2811-2900`). `CopilotoBitrixFieldMapping` com unique por `(org, entityType, semanticField)` (`schema.prisma:2511-2527`). `ExternalCrmStageMapping` com unique por `(connectionId, pipeline, stage)` (`schema.prisma:5162-5185`).

### Google Workspace (`src/features/integrations/google/google.service.ts`)

- OAuth com `state` assinado HMAC-SHA256 (org + nonce) e `timingSafeEqual` — `google.service.ts:54-84, 95`.
- `prompt:'consent'` + `access_type:'offline'` para refresh_token em reconexão; falha explícita quando o Google não devolve refresh_token (`google.service.ts:90-96, 146-154`).
- Renovação de access_token com timeout de 15s (`withTimeout` sobre `refreshAccessToken`, que não tem timeout próprio), refresh forçado uma vez em 401, e re-emissão de refresh_token quando o Google rotaciona (`google.service.ts:12, 133-144, 206-248, 288-299`).
- Tokens cifrados em repouso; todas as chamadas REST com `fetchWithTimeout` + allowlist `www.googleapis.com` (`google.service.ts:100-107, 279-299`).
- Validação do domínio do Meet retornado pelo Google antes de repassar (`google.service.ts:463-469`) — detalhe raro e correto.

### WhatsApp/Baileys (`src/features/integrations/whatsapp/`)

- Credenciais de sessão Baileys cifradas em repouso no Redis com o mesmo AES-256-GCM, tolerante a legado (`useRedisAuthState.ts:14-46`).
- Trava distribuída por organização entre réplicas (SET NX + heartbeat + retry agendado) — evita WASocket duplicado; liberação explícita em logout/esgotamento (`whatsapp.service.ts:186-296`).
- Reconexão com backoff exponencial limitado (`RECONNECT_BASE_DELAY_MS * 2^n`, teto) e comandos connect/disconnect/send via fila com idempotency-key (`whatsapp.service.ts:262-275`; `whatsapp.routes.ts:13-16, 66-141`).

### Webhooks de entrada — demais integrações

- **3CX:** fail-closed sem `THREECX_WEBHOOK_SECRET` (503), HMAC sobre corpo cru com `express.raw` montado antes do `express.json()`, timestamp anti-replay, fingerprint pela assinatura, 401 genérico (`threecx.routes.ts:30-93`; montagem em `src/bootstrap/webhooks.ts:22-23`).
- **E-mail inbound:** HMAC-SHA256 sobre corpo cru + timestamp + replay guard (`emailReply.webhook.ts:63-68, 247-277`).
- **Birth Voice:** segredo por organização (`VoiceHubConnection.webhookSecret`, cifrado) com fallback global; timestamp + assinatura + replay guard (`birthVoice.webhook.ts:265-382`; `schema.prisma:2946-2962`). Correção histórica ACH-06-01 documentada no schema.
- **Stripe:** segredo `whsec_` por conexão, validado contra `Stripe-Signature` (`stripe.service.ts:206-217`).

### Apollo/Hunter (propriedade do Agente 05 — verificado de passagem)

- Opt-in duplo: chave só vale com `PROSPECTING_PROVIDER_MODE=hybrid` (`src/config/prospecting-integrations.ts:17-24`).
- `checkProviderRateLimit` + `fetchWithProviderRetry` + custo por chamada + allowlist de host (`apollo/organizationEnrich.ts:21-51`, `hunter.service.ts:72-91`). Health-check dedicado da Apollo sem consumir créditos (`apollo/client.ts:8-9, 52-93`). Fallback documentado Apollo→Hunter em plano restrito (`APOLLO_PLAN_RESTRICTED_CODE`, `apollo/client.ts:32-43`).

---

## 2. PROPOSTAS DE MELHORIA

1. **Migrar a execução de `BitrixExtractionRun` para worker BullMQ dedicado** (mesmo padrão de `bitrixSync.worker.ts`/`bitrixExtractionPurge.worker.ts`). Hoje é fire-and-forget no processo HTTP (`extraction.ts:51-63`): não sobrevive a restart e depende de `reconcileStuckRuns` manual via rota admin. Com worker, cancelamento, retry e DLQ ficam uniformes com o resto do domínio.
2. **Streaming real na extração:** hoje `rows.push(...data.result)` acumula TODA a entidade em memória e `datasets[]` segura todas as entidades até `generateFiles` (`extraction.ts:303, 370, 551, 637`). O `PAGE_SAFETY_CAP=500` limita (~25k linhas/entidade × 6), mas um portal no teto ainda gera centenas de MB + buffer XLSX inteiro em RAM (`buildXlsxWorkbook` retorna `Buffer`, `extractionFiles.ts:139`). Existe `BitrixStreamingExtractionService` pronto (`src/services/bitrix/extraction.ts`) — está morto; ou ligue-o ou remova-o.
3. **Deduplicação de runs em andamento:** `createExtractionRun` não impede N extrações concorrentes da mesma conexão/entidade (`extraction.ts:753-823`). Um `jobId` determinístico ou checagem de run `queued|running` por `(connectionId, entities)` reduziria rajadas contra o rate limit do portal.
4. **Promover `reconcileStuckRuns` a job agendado** (ex.: a cada 15 min no `worker-extracoes.ts`) em vez de depender de chamada manual — runs 'running' órfãs de restart hoje só se resolvem se um admin lembrar de chamar a rota.
5. **Rate limit/pacing também para os providers de CRM externo** (HubSpot/Pipedrive/RDStation/Monday) e para o Google Calendar — hoje só o Bitrix tem pacing serializado; os demais usam `fetch` cru sem espaçamento.
6. **Mover `bitrix_fields.json`/`parsed_fields.json` para `docs/` ou removê-los** — são dumps de metadados de um portal real commitados na raiz (higiene + minimização de exposição de taxonomia do cliente).
7. **Instrumentar `pushLeadToAllConnections`** para gravar `ExternalCrmSyncLog` de falha por conexão e devolver resumo por provider — hoje `Promise.allSettled` engole tudo (ver DÍVIDAS P1-01).
8. **Timeout + retry uniforme nos providers externos** via `fetchWithTimeout`/`fetchWithProviderRetry` (já existem em `src/lib/http.ts` e `src/lib/enrichment/providerFetch.js`) em vez de `fetch` cru.

---

## 3. ERROS, FALHAS E DÍVIDAS

### P1 — Falhas funcionais / falso sucesso

- **P1-01 — Sync "import" de CRM externo é no-op que reporta sucesso.** `ExternalCrmService.importLeads` documenta "Does NOT persist to the database — caller is responsible for upsert" (`ExternalCrmService.ts:99-120`), mas o único caller real — `POST /api/integrations/external-crm/:id/sync` — devolve `importedCount: result.leads.length` e `message: "N lead(s) processado(s)"` SEM persistir nada (`externalCrm.routes.ts:148-155`). A tela mostra sincronização bem-sucedida que não importou lead algum. Além disso o `nextCursor` retornado nunca é persistido — toda sync rebusca a mesma primeira página. **Evidência:** `ExternalCrmService.ts:99-120`, `externalCrm.routes.ts:140-163`.
- **P1-02 — `pushLeadToAllConnections` engole falhas por provider.** `Promise.allSettled` (`ExternalCrmService.ts:144`) descarta os `reason` sem log e sem `ExternalCrmSyncLog` de status `failed` (só grava `success`, linhas 204-214). O worker BullMQ (`externalCrmOutbound.queue.ts:56-85`) nunca vê exceção → retries nunca disparam para falha de provider → lead "sincronizado" no CRM externo pode ter falhado silenciosamente em todas as conexões. Falha silenciosa clássica, proibida pelo prompt 06 §2.
- **P1-03 — Webhook 3CX processa CRM inline de forma síncrona (DIV-06-003 PERSISTE).** `threecx.routes.ts:86` aguarda `process3CXWebhook(payload)` na mesma requisição HTTP; o serviço faz `findFirst`/`create` em `threeCXCallEvent` + writes de CRM na hora (`threecx.service.ts:652+`). Em pico de discagem, o 3CX pode descartar o webhook por latência → perda de registro de ligação. A dívida de 2026-11-04 (DIV-06-003, P1) **não foi remediada** — não há enqueue/202/outbox.

### P2 — Segurança / resiliência / LGPD

- **P2-01 — Token da Pipedrive viaja na query string.** `api_token` vai na URL (`PipedriveProvider.ts:21-26`) — vaza para logs de proxy/HTTP, APM e qualquer `console` de URL. Demais providers usam header. Migrar para header `x-api-token` quando a API permitir, ou ao menos garantir que nenhuma camada loga a URL.
- **P2-02 — Providers de CRM externo sem timeout nem retry.** `fetch` cru em `HubspotProvider.ts:23`, `PipedriveProvider.ts:26`, `RdStationProvider.ts:23`, `MondayProvider.ts:23` — sem `AbortSignal`/`fetchWithTimeout`: uma API pendurada trava o job BullMQ até o `lockDuration`/stall do worker; sem tratamento de 429/5xx (erro genérico com body cru na mensagem — que pode ecoar PII do payload do CRM). O Bitrix tem solução completa; os "irmãos menores" não.
- **P2-03 — Mensagens WhatsApp legíveis por qualquer usuário autenticado do tenant.** `GET /api/whatsapp/conversations`, `/messages`, `/signals`, `/status` não têm `requireRole` (`whatsapp.routes.ts:18-64, 85-93`) — qualquer papel (incl. `VISUALIZADOR`, que é só-leitura no resto do produto) lê conteúdo de mensagens (PII de leads) e status da sessão. Escrita exige ADMIN/GESTOR/CLOSER/SDR, leitura deveria ter piso mínimo coerente (ex.: CLOSER/SDR+) ou ao menos documentar a decisão.
- **P2-04 — Extração Bitrix não sobrevive a restart; reconciliação é manual.** Documentado honestamente (`extraction.ts:51-63`), mas `reconcileStuckRuns` só roda via rota admin (`bitrix.routes.ts:776-791`) — runs 'running' órfãs ficam presas indefinidamente sem intervenção. Agravante: enquanto 'running', `retryExtractionRun` recusa (`extraction.ts:932-933`). Mitigação parcial já existe; falta o agendamento automático (proposta 4).
- **P2-05 — Acúmulo em memória na extração (DIV-06A-001 PERSISTE, parcialmente mitigado).** `rows` por entidade + `datasets[]` + `toCsv`/`toJson`/`buildXlsxWorkbook` materializam tudo em strings/buffers antes de gravar (`extraction.ts:303-383, 445-487`; `extractionFiles.ts:115-180`). O `PAGE_SAFETY_CAP` limita o pior caso, mas não elimina o risco de OOM em portal grande com muitas entidades — e `completed_partial` pode gerar arquivo gigante mesmo assim.
- **P2-06 — Lock de idempotência e circuit breaker/pacing são por processo.** `syncLocks` Map em memória com TTL 60s (`idempotentSync.ts:100-139`), `circuitState`/`paceQueueByWebhook` Maps (`client.ts:44-45, 440`). Em deployment multi-réplica (o WhatsApp já assume multi-réplica via lock Redis), duas réplicas podem processar o mesmo evento duas vezes e o pacing por réplica permite burst agregado acima de 2 req/s no portal. Aceitável hoje se o deploy for réplica única — registrar a restrição ou mover para Redis.
- **P2-07 — Erros de provider externo vazam body cru para o cliente.** `externalCrm.routes.ts:79, 133, 160` devolvem `err.message` ao browser; os providers embutem `res.statusText + body` na mensagem (`HubspotProvider.ts:34-36` etc.) — resposta do CRM pode conter dados do registro (PII) ou detalhes de auth. Sanitizar antes de devolver.

### P3 — Dívidas menores / higiene

- **P3-01 — Código morto que simula a solução real.** Três implementações paralelas de Bitrix existem sem nenhum importador de produção (só testes as referenciam): `src/features/integrations/bitrix/client.ts` (`BitrixClient`, "rate limiting 500ms" próprio), `src/features/integrations/bitrix/paginatedExtractor.ts` (checkpoints em `Map` em memória — **apesar do nome/docstring "checkpoint persistido"**, `paginatedExtractor.ts:2-38`), e `src/services/bitrix/extraction.ts` (`BitrixStreamingExtractionService` — o streaming que DIV-06A-001 pedia, não ligado). `src/services/bitrix/exportFormatter.service.ts` também só é usado por teste. Risco real: testes verdes sobre código que não roda em produção — falsa sensação de cobertura. Deletar ou ligar.
- **P3-02 — Comentário de arquitetura desatualizado.** `extraction.ts:44-49` afirma que o worker de expurgo "continua DESLIGADO por padrão" — `BITRIX_EXTRACTION_PURGE_ENABLED` agora default `true` (`env.ts:312-315`). Docs mentem sobre comportamento de retenção LGPD.
- **P3-03 — `bitrix_fields.json` (1.544 linhas) e `parsed_fields.json` (202 linhas) na raiz.** Dumps de metadados de campos de um portal Bitrix real (labels `UF_CRM_*`, enums). Sem segredos detectados, mas expõem taxonomia interna do cliente e poluem a raiz do repo. Mover para `docs/` ou `fixtures/` com aviso, ou remover.
- **P3-04 — DIV-06-002 parcialmente remediada, ainda acima do alvo.** Painéis de integrações encolheram (Integrations.tsx 862, ExternalCrmPanel.tsx 841, BitrixImportPanel.tsx 628 linhas — meta era <400 cada). `HOTSPOT_EXCEPTIONS.md` deve ser reavaliado.
- **P3-05 — `importLeads` de CRM externo ignora `lastImportedAt` incremental de forma confiável:** usa `rule.lastRunAt` como cursor (`ExternalCrmService.ts:112-119`) mas a rota `/sync` não atualiza `lastRunAt` nem persiste leads — cada chamada repete o mesmo range. (Consolidado com P1-01, mas a falha de cursor merece linha própria se o P1 for corrigido parcialmente.)
- **P3-06 — Webhook Bitrix sem rate limit na borda.** A rota pública `/api/integrations/bitrix/webhook/:connectionId` não tem throttle dedicado; o token é 64-hex (inviável brute-force), mas um flood de POSTs válidos/inválidos consome lookup de conexão + parse. Considerar rate limit por IP na borda (provavelmente escopo do 10/15).
- **P3-07 — `testWebhook`/`testBitrixConnection` não atualizam `lastSyncAt`/health da conexão** — falha de token revogado só aparece na próxima operação real ou no health report comercial (`bitrixSyncHealthReport.ts` existe, bom), mas a tela de Integrações não reflete "token revogado" como estado da conexão (só erro pontual do teste). Cosmético/UX.

### Verificação de achados de auditorias anteriores

| Achado prévio | Status atual |
|---|---|
| DIV-06-001 socket timeout Bitrix (`bitrixApiClient.ts`) | **Resolvido por substituição** — arquivo não existe mais; `service/client.ts` tem timeout 15s + retry + pacing |
| DIV-06-002 monólitos de UI (>1000 linhas) | **Parcial** — ver P3-04 |
| DIV-06-003 webhook 3CX síncrono | **Persiste** — ver P1-03 |
| DIV-06-004 AbortController em ExternalCrmPanel | **Não re-verificado a fundo** (componente existe, 841 linhas; recomendo re-checar na próxima passada de frontend) |
| DIV-06A-001 OOM por acúmulo em memória | **Persiste mitigado** — ver P2-05 |
| DIV-06A-002 CSV Injection | **Resolvido** — `sanitizeCsvCell` |
| DIV-06A-003 sem expurgo de arquivos | **Resolvido** — purge worker ativo por padrão |

---

## 4. ACHADOS COMPLEMENTARES — segunda passada focada (atomicidade, rotas, caches, estados presos)

Revisão independente dos mesmos arquivos com foco em atomicidade de escrita, autorização de leitura, caches e estados que podem ficar presos. Nenhum achado abaixo duplica os itens das seções 2–3.

### P1 — Falhas funcionais

- **P1-04 — Lead pode ficar preso em `bitrixSyncStatus='syncing'` PARA SEMPRE.** `claimOutboundSync` faz a transição atômica `bitrixLeadId:null → 'syncing'` (`outboundSync.ts:61-67`), mas se o processo morrer (deploy, crash, OOM) entre o claim e o `prisma.lead.update` final, nada reconcilia esse estado: `claimOutboundSync` exige `bitrixSyncStatus != 'syncing'` para sempre, então toda tentativa futura retorna 409 "já está sendo sincronizado" (`outboundSync.ts:85-90`). O retry do BullMQ (`bitrixOutbound.queue.ts`) esgota as 10 tentativas e vai para dead-letter — o lead nunca mais sincroniza, e `bitrixSyncHealthReport` só olha `'failed'` (`bitrixSyncHealthReport.ts:25`), então nem o health report acusa. Não existe TTL nem varredura de `'syncing'` órfão em lugar nenhum do código (verificado por grep em `src/`). Correção sugerida: tratar `'syncing'` com `bitrixSyncedAt`/timestamp velho como claimável, ou reconciliar no worker.
- **P1-05 — Importação Bitrix não é transacional e duplica Company a cada lead.** Em `importSelectedBitrixLeads` (`leads.ts:322-368`) e `importSelectedBitrixDeals` (`deals.ts:437-501`) a sequência `company.create → enrichmentQueue.add → contact.create → lead.create` roda SEM `$transaction` (não existe nenhum `$transaction` em `src/features/integrations/`): se `lead.create` falhar (erro não-P2002), a `Company` e o `Contact` recém-criados ficam órfãos no banco. Agravante: `company.create` é incondicional — não há dedup por CNPJ/nome/`bitrixCompanyId` para leads (deals gravam `bitrixCompanyId`, mas nada consulta antes de criar), então dois leads da mesma empresa no Bitrix geram duas Companies no Atlas, e reimportações futuras continuam duplicando. O `enrichmentQueue.add` ainda enfileira enriquecimento de uma empresa que pode nunca ganhar lead.

### P2 — Segurança / resilição / LGPD

- **P2-08 — `POST /api/bitrix/leads/export-batch` sem limite e síncrono na request.** O modo `leadIds[]` não tem cap (a importação limita a 100 em `leads.ts:236`, a exportação não tem equivalente — `bitrix.routes.ts:501-519`); cada item dispara `exportLeadToBitrixNow` → várias chamadas Bitrix sequenciais dentro da mesma requisição HTTP. O modo `'all'` (`outboundSync.ts:475-492`) itera TODOS os leads da organização na request — com pacing de 500ms/chamada e ~3 chamadas/lead, uma org com centenas de leads estoura o timeout do proxy e martela o rate limit do portal; falhas individuais são engolidas em `skippedCount` sem detalhe ao usuário (`bitrix.routes.ts:513-516`).
- **P2-09 — Rotas GET de metadados Bitrix sem `requireRole`.** `GET /users`, `/fields`, `/deal-pipelines`, `/deal-stages`, `/lead-statuses`, `/sync-rules`, `/connections` não têm middleware de papel (`bitrix.routes.ts:75-86, 273-350, 536-549`) — qualquer usuário autenticado, incluindo `VISUALIZADOR` (papel só-leitura do resto do produto), lista e-mails e nomes de TODOS os usuários do portal do cliente (PII de funcionários) e a taxonomia completa de campos/etapas. `/leads` e `/deals` aplicam o escopo `assignedById` corretamente; os metadados não. `/sync-logs` tem comentário justificando abertura (linha 651-653); as demais não têm justificativa registrada.
- **P2-10 — Multi-conexão: outbound sempre usa a conexão mais antiga.** `pushLeadToBitrix` (`outboundSync.ts:415-419`), `postCommentToBitrix` (`outboundSync.ts:324-327`) e `syncActivityToBitrix` (`outboundSync.ts:523-527`) fazem `findFirst({ organizationId }, orderBy createdAt asc)` — com 2+ portais conectados, todo push vai para o primeiro cadastrado, mesmo se ele estiver com token revogado/circuit breaker aberto, enquanto uma segunda conexão saudável nunca é tentada. Não há seleção de conexão por lead/regra.
- **P2-11 — Bug de mapeamento no HubSpotProvider.** `mapHubSpotDeal` define `status: 'open'` quando `hs_deal_stage_probability` é truthy (`HubspotProvider.ts:48`) — o valor é string `'0'`–`'1'` e `'0'` é truthy em JS, então deals com probabilidade zero também saem `'open'`; e deals fechados/won não são distinguidos. Adicional: todos os providers de CRM externo (`HubspotProvider.ts:23`, `PipedriveProvider.ts:26`, `RdStationProvider.ts:23`, `MondayProvider.ts:23`) usam `fetch` cru sem timeout/`AbortSignal`/retry — confirmado; request pendurado trava o worker BullMQ até stall.
- **P2-12 — Janela anti-replay do webhook Bitrix é opcional e o dedup é fail-open.** `validateWebhookTimestamp` retorna `valid:true` quando o timestamp está ausente (`webhookReplayGuard.ts:55-57`) — ou seja, um POST forjado com `application_token` vazado e sem `ts`/`x-bitrix-timestamp` passa pela validação temporal; a única barreira restante é o fingerprint do corpo (que um replay exato ainda bate por 30min, mas só se o Redis estiver de pé — `claimWebhookDelivery` é fail-open em `'unavailable'`, `webhookReplayGuard.ts:109`). O risco residual está documentado no cabeçalho do arquivo, mas a combinação "timestamp ausente = válido" + "Redis down = processa" merece registro explícito no threat model.
- **P2-13 — Fingerprint de replay depende da serialização do body.** `webhookDeliveryFingerprint(..., JSON.stringify(body))` (`bitrix.webhook.ts:306-309`): a ordem das chaves do objeto parseado por `qs` segue a ordem do payload original; duas entregas semanticamente idênticas com ordem de chaves diferente produzem fingerprints distintos e passam como "fresh" (dedup furado). Além disso `body.ts` numérico vs. string muda o fingerprint. Baixo impacto (efeito é só reprocessar um update idempotente), mas a justificativa do comentário assume dedup mais forte do que a implementação garante.

### P3 — Dívidas menores / higiene

- **P3-08 — `retryExtractionRun` não limpa metadados da execução anterior.** O reset (`extraction.ts:952-961`) zera status/erro/datas mas mantém `progress`, `files`, `countByEntity` e `totalCount` da run anterior — o histórico exibe contagens/progresso obsoletos até a nova execução terminar (download é bloqueado pelo status, então é só cosmético, mas confunde auditoria).
- **P3-09 — `connectBitrix` não deduplica portal.** `connections.ts:78-80` cria uma `BitrixConnection` por chamada sem checar `webhookUrl` já existente na organização — o mesmo portal pode ser conectado N vezes, multiplicando regras, sync logs e confusão na tela (e agravando o P2-10, já que "a conexão mais antiga" fica ainda mais arbitrária).
- **P3-10 — Caches single-entry chaveados por webhookUrl.** `statusLabelCache` (`client.ts:582-594`) guarda UMA entrada e não tem TTL; `FieldMapsCache` (`customFields.ts:21-26`) também é single-entry (com TTL de 10min). Com múltiplas conexões ativas, cada alternância de portal derruba o cache do anterior — `getStatusLabels` refaz `crm.status.list` a cada troca de conexão.
- **P3-11 — `importLeads` de CRM externo não recebe/persiste cursor.** A rota `/sync` não aceita `cursor` no body e `importLeads` só usa `rule.lastRunAt` como marca incremental (`externalCrm.routes.ts:148-155`, `ExternalCrmService.ts:102-120`) — além do P1-01 (não persiste nada), nem a paginação manual é possível hoje.
- **P3-12 — `BitrixActivitySyncService` é stub com sucesso fabricado.** `src/features/integrations/bitrix/syncActivityToBitrix.ts:38-44` retorna `synced:true` com `bitrixActivityId: 9001` fixo sem chamar o Bitrix — hoje só testes o referenciam, mas qualquer futura ligação desse caminho reportará sync fantasma. Deletar ou implementar de verdade (o caminho real já existe: `syncActivityToBitrix` em `service/outboundSync.ts`).
| DIV-06A-004 sem cancelamento cooperativo | **Resolvido** — `AbortSignal` ponta a ponta |

---

## Resumo executivo

O domínio Bitrix24 está em excelente estado — cliente com SSRF guard por attempt, pacing, circuit breaker, cancelamento cooperativo, webhooks de entrada com HMAC-equivalente (token timing-safe + replay guard), segredos AES-256-GCM e extrações com checkpoint incremental, `completed_partial` honesto e expurgo LGPD ativo. As dívidas reais concentram-se em: (a) o subsistema de **CRMs externos genéricos** (HubSpot/Pipedrive/RDStation/Monday), que é bem mais fraco — sync de importação que não persiste nada e reporta sucesso (P1-01), push que engole falhas (P1-02), fetch sem timeout/retry e token em query string; (b) **webhook 3CX síncrono** (P1-03, dívida antiga não remediada); (c) acúmulo em memória e execução fire-and-forget das extrações (P2-04/P2-05); e (d) código morto que imita soluções reais (P3-01). Nenhuma credencial exposta foi encontrada em código ou nos JSONs da raiz.
