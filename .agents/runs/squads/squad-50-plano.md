# PLANO DO SQUAD 50 — INTEGRAÇÕES EXTERNAS E ECOSSISTEMA BITRIX24 (DEM-20261123-001)

- **Coordenador:** Agente 50 — Atlas (Devin, sessão `squad-50-coord-20261124-devin`)
- **Data:** 2026-11-24
- **Branch de integração do squad:** `coord/squad-50` (→ `integracao/squad-50` na 1ª entrega auditada)
- **Worktree do coordenador:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-coord`
- **Base de corte:** `93e82c220` (head de `integracao/onda-3-dem20261123`)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`
- **Lease:** `.agents/runs/leases/squad-50.lease` (expira 2026-11-24T04:00Z, renovável)
- **Portas efêmeras do squad:** faixa 22500–22599 (regra 22000 + NN*10)
- **Postura:** NO-GO até homologação humana; sem push/PR/main.

## 1. Modo de operação

Sem ferramenta de subagente disponível nesta sessão → Atlas executa as missões priorizadas
diretamente e emite plano de despacho para executores quando houver slots livres.
Capacidade conservadora: máx. 3 executores concorrentes (estrutura §5).
Cada executor usará branch `agente/<id>-<slug>-s50` e worktree `squads/squad-50/wt-<id>`.

## 2. Achados estruturais de coordenação (baseline `93e82c220`)

1. **Divergência de ownership Bitrix (CRÍTICA para despacho):** `MATRIZ_PROPRIEDADE.md` atribui
   aos agentes 51–54 `src/lib/integrations/bitrix/{auth,batch,mapping,webhooks}/**`, mas a
   implementação real concentra-se em `src/features/integrations/bitrix/**` (~60 arquivos:
   `service/client.ts`, `service/extraction.ts` 1041 linhas, `service/syncRules.ts`,
   `paginatedExtractor.ts`, `bitrix.webhook.ts`, `bitrixWebhook.queue.ts`, etc.).
   `src/lib/integrations/bitrix/` contém apenas 4 arquivos (`client.ts` 106L, `batch/extractor.ts`
   102L, `mapping/mapper.ts` 43L — possivelmente wrappers/adapters finos).
   `src/features/integrations/AGENTS.md` (legado) declara dono "Agente 06 — Integrações e Bitrix"
   para toda a pasta. **Ação:** handoff formal ao Astra (00) para harmonização da matriz antes de
   despachar 51–54 com escrita em `src/features/integrations/**`. Até lá, missões de 51–54 ficam
   restritas a leitura/análise + artefatos em `.agents/` até deliberação.
2. **`src/lib/integrations/index.ts` (ownership do Agente 50) NÃO EXISTE** — será criado apenas se
   a matriz de prontidão justificar um registry/contrato compartilhado; caso contrário permanece
   ausente (P2 — simplicidade).
3. **`BITRIX24-LEAD-FLOW-AUDIT.md` referenciado pela skill `integration-audit` NÃO existe no
   repositório** (busca em todo o worktree). A skill manda "ler antes de reauditar" — o documento
   está ausente; reauditoria Bitrix deve reconstruir evidência `arquivo:linha` do zero ou o humano
   deve restaurar o documento. Registrado como bloqueio parcial de processo.
4. **Órfão Apollo documentado na skill está RESOLVIDO/removido:** `src/lib/enrichment/apollo.ts`
   e `src/lib/queue/enrich.worker.ts` não existem mais; pipeline ativo é
   `src/lib/queue/enrichment.queue.ts` + `enrichmentCascade.worker.ts` e providers em
   `src/features/prospecting/outbound/server/search/providers/{apollo,hunter}.provider.ts`.
5. **Integrações sem dono na MATRIZ_PROPRIEDADE:** `src/features/integrations/` contém também
   `chatwoot`, `hubspot`, `monday`, `omie`, `pipedrive`, `rdstation`, `slack`, `stripe`,
   `signature`, `components`, `routes`, `shared`. Squad 50 cobre apenas Bitrix/email/WhatsApp/
   calendário/ERP/monitoring → handoff ao Astra para classificar propriedade (provável Squad 20
   para rotas/contratos, ou extensão da matriz do Squad 50).
6. **Overlap WhatsApp Squad 50 (56 — Luna, `src/lib/integrations/whatsapp/**` +
   `src/features/integrations/whatsapp/**`) × Squad 60 (66 — Kiko inbox, 67 — Teca templates,
   69 — Eli opt-out):** fronteira a definir — Luna fica com transporte/sessão Baileys+Meta API;
   Kiko/Teca/Eli ficam com roteamento/templates/opt-out em `src/features/notifications/**` e
   `src/features/integrations/whatsapp/` camada de mensagem. **Handoff ao Astra antes de despachar 56.**

## 3. Backlog priorizado (ordem de execução)

| # | Agente | Missão | Ownership (matriz) | Depende de | Status |
|---|--------|--------|--------------------|------------|--------|
| M0 | 50 Atlas | Matriz de prontidão dos conectores (credencial, timeout, retry, paginação, webhook, idempotência) — evidência `arquivo:linha` | `.agents/runs/squads/` + `src/lib/integrations/index.ts` (se necessário) | — | **EXECUTADO** (ver `squad-50-matriz-prontidao-conectores.md`) |
| M1 | 50 Atlas | Handoffs de coordenação: ownership `src/features/integrations/**` vs matriz; overlap WhatsApp 56×60; integrações órfãs de dono; ausência do LEAD-FLOW-AUDIT | `.agents/handoffs/squad-50/` | — | **EXECUTADO** |
| M2 | 51 Bela | Auth/credenciais Bitrix: OAuth/token refresh/`tokenRefreshLock.ts`, `connections.ts`, criptografia `secretFields.ts`, fallback `BITRIX24_WEBHOOK_URL` | `src/lib/integrations/bitrix/auth/**` (+ features pendente deliberação §2.1) | Decisão Astra sobre ownership | BLOQUEADO (ownership) — preparar análise read-only |
| M3 | 52 Lino | Paginação/batch: `extraction.ts` (1041L), `paginatedExtractor.ts`, `batch/extractor.ts`; confirmar se syncRules segue `next` (evidência sugere correção já aplicada ~L105) | `src/lib/integrations/bitrix/batch/**` | M2 (contrato), ownership | BLOQUEADO (ownership) |
| M4 | 53 Vega | Webhooks/sync bidirecional: `bitrix.webhook.ts`, `bitrixWebhook.queue.ts`, `idempotentSync.ts`, `webhookIdempotency.ts`, `syncRules.ts`, `outboundSync.ts` | `src/lib/integrations/bitrix/webhooks/**` | M2, M3 | BLOQUEADO (ownership) |
| M5 | 54 Rita | De-para campos: `bitrixFieldMap.ts`, `customFields.ts`, `mapping/mapper.ts`, `CopilotoBitrixFieldMapping`, `ExternalCrmStageMapping` | `src/lib/integrations/bitrix/mapping/**` | M2 | BLOQUEADO (ownership) |
| M6 | 55 Ícaro | E-mail SMTP/IMAP: `src/lib/email/mailer.ts` (`MailerNotConfiguredError`), `features/integrations/email/*`, fallback "abrir cliente de e-mail" — confirmar comunicação ao usuário | `src/lib/integrations/email/**` | — (independente) | DESPACHÁVEL após handoff ownership email |
| M7 | 56 Luna | WhatsApp Baileys/Meta: `baileys.client.ts` (anti-ban 8s), `whatsapp.service.ts` (reconnect 5×/60s, lock 5×/30s), `WhatsAppMessage` | `src/lib/integrations/whatsapp/**` | **Handoff Astra: overlap Squad 60** | BLOQUEADO (delimitação) |
| M8 | 57 Nico | Calendário: `google.sync.ts`, `google.service.ts` (OAuth state HMAC, timeout 15s), Meet links, TZ, dedup | `src/lib/integrations/calendar/**` | — | DESPACHÁVEL (parcial — google.service.ts está em features/) |
| M9 | 58 Elisa | Enriquecimento/ERP: `erp/cnpj.service.ts`, providers Apollo/Hunter, `enrichmentCascade.worker.ts` | `src/lib/integrations/erp/**` | — | DESPACHÁVEL |
| M10 | 59 Ruy | Observabilidade/reconciliação B-11/B-12: `driftMonitor.ts`, `syncLogs.ts`, `metrics.ts`, `webhookIdempotency.ts`, dead-letter de sync | `src/lib/integrations/monitoring/**` | M4 (depende de contratos de sync) | PARCIAL — pode iniciar inventário read-only |

**Ordem de despacho proposta (quando Astra liberar ownership):**
1. Onda A: 55 Ícaro (e-mail — menor superfície, sem overlap) + 58 Elisa (enriquecimento) + 59 Ruy (inventário read-only de observabilidade).
2. Onda B: 51 Bela (auth) → depois 52 Lino → 54 Rita (sequencial por dependência de contrato).
3. Onda C: 53 Vega (webhooks — depois de auth+batch) + 57 Nico.
4. 56 Luna SOMENTE após deliberação do overlap com Squad 60.

## 4. Riscos e bloqueios

- **R1 — Ownership `src/features/integrations/**` indefinida** (ver §2.1): sem deliberação do Astra,
  51–54/56/57 não podem escrever código. Mitigação: missões read-only de auditoria já geram valor
  (matriz de prontidão por conector).
- **R2 — Credenciais/segredos:** OAuth real exige sandbox/credenciais do humano; nunca commitar
  segredos; `CREDENTIALS_ENCRYPTION_KEY` tem trava de produção em `secretFields.ts:37` (bom).
- **R3 — Webhooks pré-auth:** `threecxWebhookRouter` e `birthVoiceWebhookRoutes` montados antes de
  `authenticateToken` em `src/bootstrap/webhooks.ts:22-23` — validação de origem/assinatura é
  responsabilidade do handler; Squad 50 audita (59/53) mas ownership dos handlers é legado (Agente 06).
- **R4 — WhatsApp protocolo não-oficial (Baileys):** risco estrutural de quebra sem aviso —
  classificar como risco de produto na matriz, não bug.
- **R5 — LEAD-FLOW-AUDIT ausente:** reauditoria Bitrix exige reconstrução de evidência ou
  restauração do documento pelo humano.
- **R6 — Portas:** squad usa 22500–22599; testes de integração efêmeros devem respeitar a faixa.
- **R7 — Suites pesadas em fila:** `test:integration`/`test:e2e`/build 1 por vez no squad.

## 5. Evidências desta sessão

- Worktree `wt-coord` criado em `93e82c220`, branch `coord/squad-50`.
- Junction `node_modules` criada (mklink /J).
- Lease `squad-50.lease` registrado.
- Matriz de prontidão publicada: `.agents/runs/squads/squad-50-matriz-prontidao-conectores.md`.
- Handoffs emitidos em `.agents/handoffs/squad-50/` (ver §6).

## 5b. Sessão 2 (2026-11-24, continuação) — reconciliação solicitada pelo Orquestrador Humano

- **Proposta de ownership Bitrix publicada** (`50-para-00-proposta-ownership-bitrix.md`):
  redistribuição dos 58 arquivos reais de `src/features/integrations/bitrix/` entre núcleo (50),
  51 auth, 52 batch, 53 sync/webhooks, 54 mapping, 59 observabilidade; rotas/filas/produto-CRM
  marcados para Squad 20/40. Aguarda publicação na MATRIZ pelo Astra.
- **Classificação de conectores sem dono** (`50-para-00-classificacao-conectores.md`):
  chatwoot PARCIAL; hubspot/monday/pipedrive/rdstation IMPLEMENTADOS via framework
  `ExternalCrmService`+`externalCrmOutbound.queue` (outbound-only, sem webhook inbound);
  omie/slack/stripe/signature IMPLEMENTADOS. Stripe proposto ao Squad 20 (26-Dália).
- **Fronteira WhatsApp** (`50-para-00-fronteira-whatsapp-s60.md`): texto de cláusula proposto
  para ratificação — Luna = transporte/sessão; Squad 60 = inbox/templates/opt-out.
- **BITRIX24-LEAD-FLOW-AUDIT.md**: confirmado que existiu e foi removido por decisão humana
  (`e9fba0b0c`); diagnóstico novo criado em
  `docs/integrations/BITRIX24-DIAGNOSTICO-INTEGRACAO-20261124.md`.
- **Hubtasks authz (43→50)**: verificado resolvido — `hubTasks.service.ts:104-116` aplica
  filtro `CREATED_BY`/`RESPONSIBLE_ID`.
- **Webhooks pré-auth revalidados**: chatwoot (HMAC+timestamp+dedup), 3CX (`x-3cx-signature` +
  `claimWebhookDelivery`), signature (HMAC+dedup), stripe (`stripe-signature`), birth-voice
  (candidatos de segredo) — todos validam origem; risco R3 do §4 rebaixado.
- **Testes executados:** `tests/unit/lib/integrations/` → 13/13 PASS (circuit breaker,
  webhookIdempotency, whatsappAntiBan, bitrixBatchExtractor); client Bitrix 24/24 PASS (sessão 1);
  `tests/unit/features/integrations/` + `chatwoot/__tests__` → **282/282 PASS em 30 arquivos**
  (omie, slack, stripe, signature, chatwoot, bitrix outbound/dedup/idempotentSync/hubTasks,
  ExternalCrm providers, whatsapp conversation-intelligence) — baseline de saúde dos conectores.

## 6. Handoffs emitidos nesta sessão

- `.agents/handoffs/squad-50/50-para-00-ownership-features-integrations.md` — deliberação de
  propriedade `src/features/integrations/**`, integrações sem dono, ausência do LEAD-FLOW-AUDIT.
- `.agents/handoffs/squad-50/50-para-00-overlap-whatsapp-squad60.md` — delimitação 56 Luna ×
  66/67/69 Squad 60 antes de despachar.
- `.agents/handoffs/squad-50/50-para-00-relatorio-sessao-coordenacao.md` — relatório padrão ao Astra.
- Sessão 2: `50-para-00-proposta-ownership-bitrix.md`, `50-para-00-classificacao-conectores.md`,
  `50-para-00-fronteira-whatsapp-s60.md`; diagnóstico `docs/integrations/BITRIX24-DIAGNOSTICO-INTEGRACAO-20261124.md`.
