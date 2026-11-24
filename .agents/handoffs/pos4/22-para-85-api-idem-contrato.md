# Handoff 22 → 85 (Bóris) — Contrato de deduplicação/idempotência do backend (POS4)

Data: 2026-11-24 · Agente: 22 — Hugo · Missão: POS4-22-IDEM

## Status: IMPLEMENTADO (aguardando revisão/merge do Coordenador)

## Contrato consumido pelo outbox mobile

O `OfflineSyncService` (`src/features/mobile/offlineSync.service.ts`) enfileira 4 tipos de
mutação. Os endpoints correspondentes e a cobertura do middleware `idempotencyKeyMiddleware`:

| Operação outbox | Endpoint | Método | Coberto? |
|---|---|---|---|
| `CREATE_LEAD` | `/api/leads` | POST | ✅ mount `/api/leads` |
| `UPDATE_LEAD` | `/api/leads/:id` | PUT | ✅ mesmo mount |
| `CREATE_NOTE` | `/api/leads/:leadId/notes` | POST | ✅ mount dedicado (reaplicado) |
| `FIELD_MEETING_AUDIO` | `/api/mobile/field-meetings/sync` | POST | ✅ mount `/api/mobile` |

`GENERIC_MUTATION` fica a critério do chamador — o middleware só atua em métodos
POST/PUT/PATCH/DELETE com header presente.

## Como o cliente deve usar

1. Gerar **uma `X-Idempotency-Key` por item de fila** (recomendado: o `item.id` do
   `OfflineQueueItem`, formato `op_<uuid>` — estável entre retries do mesmo item).
   NÃO reutilizar a key entre itens distintos da fila.
2. Enviar o header em **todas as tentativas** daquele item (retry após falha de rede
   DEVE repetir a mesma key + mesmo payload).
3. Tratar respostas:
   - `2xx` → sucesso; marcar `synced` (comportamento atual).
   - `409` com `code: 'IDEMPOTENCY_KEY_CONFLICT'` → a key foi gasta com payload
     diferente. Isso indica bug no cliente (payload mutado entre retries ou key
     reutilizada). Tratar como falha permanente do item, não como retry.
   - `400` com `code: 'INVALID_IDEMPOTENCY_KEY'` → key vazia/>255 chars; falha de programação.
   - `4xx/5xx` demais → key NÃO foi consumida; retry com mesma key é seguro.
4. Resposta de replay traz header `X-Idempotent-Replay: true` e corpo **idêntico**
   à primeira resposta 2xx — `extractEntityId` funciona normalmente.

## Semântica garantida pelo backend

- Dedup por `(organizationId, X-Idempotency-Key)` — namespaced por tenant; mesma key
  em orgs diferentes nunca colide.
- Payload comparado = `método + path (originalUrl) + body` (JSON com chaves ordenadas,
  hash SHA-256). **Atenção**: se o outbox reenviar o mesmo item mas com `leadId`
  temp→real já resolvido de forma diferente, o path muda → payload hash muda →
  409. Gerar a key APÓS a resolução de dependências (`resolveTemporaryIds`) ou usar
  key estável por item e garantir payload final idêntico entre retries.
- Somente respostas 2xx são registradas. Falha não consome a key.
- TTL 24h, teto 10k entradas/processo.

## O que o Agente 85 precisa fazer no cliente

- Propagar `X-Idempotency-Key` no `ApiClientAdapter.request` (hoje o adapter não envia
  headers customizados — `defaultApiClient` usa `api.post/put/patch/delete` de
  `src/lib/api.ts`; verificar se há suporte a headers extras ou estender o adapter).
- Usar `item.id` (ou um uuid gerado no `enqueue`) como key — estável por item.
- Tratar `409 IDEMPOTENCY_KEY_CONFLICT` como falha permanente (não retry infinito).
- `CREATE_NOTE` usa `/api/leads/:leadId/notes` — o path já resolve tempId antes do
  envio, então a key deve ser gerada sobre o estado final do item.

## Limitação conhecida (transparência)

Store em memória por processo: dedup NÃO sobrevive a restart do backend nem é
compartilhado entre réplicas. Para o outbox isso é aceitável na 1ª iteração
(retry window típico ≪ TTL de 24h em processo único), mas produção multi-réplica
exige persistência — ver handoff 22→01 (schema) e nota Redis (Agente 17).
