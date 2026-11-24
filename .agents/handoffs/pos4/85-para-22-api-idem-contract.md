# Handoff 85 → 22 — Contrato X-Idempotency-Key no Outbox Mobile

- De: Agente 85 — Bóris (Squad 80 Mobile · offline-first/sync)
- Para: Agente 22 — Hugo (Camada HTTP, Middlewares e Rotas)
- Missão: POS4-85-IDEM — X-Idempotency-Key no outbox mobile
- Status: contrato definido; implementação cliente concluída (pendente commit local deste branch)
- Branch cliente: `agente/85-mobile-idem-pos4` (worktree `wt-85-mobile-idem`, base `9f80c07ed`)
- Escopo backend do destinatário: deduplicação no servidor dos endpoints consumidos pelo outbox mobile.

## Contexto

O outbox mobile (`src/features/mobile/offlineSync.service.ts`) agora envia TODA mutação
com header de idempotência estável, gerado uma única vez no `enqueue` e persistido com o
item da fila. Retries após falha ambígua (timeout com commit no servidor), reconexão,
`retryFailed` e restart do app reenviam a MESMA chave — eliminando duplicação de efeitos
colaterais no servidor.

A deduplicação efetiva é responsabilidade do backend (este handoff). Sem ela, o header é
inócuo; com ela, retries do outbox são seguros.

## Contrato EXATO (cliente → servidor)

### 1. Header HTTP

```
X-Idempotency-Key: idem_<uuid-v4>
```

- Nome: `X-Idempotency-Key` (exportado como `IDEMPOTENCY_HEADER_NAME` no cliente).
- Valor: string opaca no formato `idem_` + UUID v4 (ex.: `idem_3f6a1c2e-9b4d-4e8a-a1c2-7d5e9f0b2c4a`).
  - Clientes antigos/fallbacks podem gerar `idem_<ts36>_<rand>` — o servidor DEVE aceitar
    qualquer string não-vazia ≤ 255 chars, sem validar formato estrito.
- A chave NÃO contém tenant, usuário ou PII — é apenas um identificador opaco.
  O escopo multi-tenant é resolvido pelo servidor a partir da sessão autenticada.

### 2. Escopo de deduplicação

Chave de dedup = `(organizationId derivado da sessão autenticada, X-Idempotency-Key)`.

- A mesma chave em tenants/sessões diferentes é uma operação DIFERENTE (sem colisão).
- O servidor deve derivar `organizationId` da sessão/JWT — NUNCA de campo do payload
  controlado pelo cliente.

### 3. TTL sugerido

- Janela mínima de retenção das chaves processadas: **72 horas** (outbox mobile pode
  permanecer offline por dias; retries após essa janela são aceitáveis como "nova
  operação" — risco residual documentado).
- Recomendado: tabela `idempotency_keys (organization_id, key, endpoint, status,
  response_snapshot, created_at)` com unique `(organization_id, key)` e expurgo
  automático > 7 dias.

### 4. Semântica de resposta (idempotente)

- **Primeira requisição** (chave nova): processar normalmente.
- **Repetição com mesma chave + mesmo endpoint/método**:
  - Se a primeira concluiu com sucesso (2xx): retornar a MESMA resposta (status + body
    do snapshot), sem reexecutar efeitos colaterais. Se snapshot indisponível, retornar
    `200/201` com o recurso existente quando recuperável.
  - Se a primeira está em voo ou falhou de forma ambígua: `409` ou `425` com
    `Retry-After` (cliente re-tenta com a mesma chave).
- **Mesma chave + endpoint/método DIFERENTE**: `422 Unprocessable Entity`
  (indica bug de cliente — chaves são por operação).

### 5. Endpoints cobertos pelo outbox mobile (todos devem honrar o header)

| Operação outbox | Método | Endpoint |
|---|---|---|
| CREATE_LEAD | POST | `/api/leads` |
| UPDATE_LEAD | PUT | `/api/leads/:id` |
| CREATE_NOTE | POST | `/api/leads/:leadId/notes` |
| FIELD_MEETING_AUDIO | POST | `/api/mobile/field-meetings/sync` |
| GENERIC_MUTATION | POST/PUT/PATCH/DELETE | qualquer `/api/**` enfileirado |

### 6. O que o cliente garante

- Uma chave por ITEM da fila — nunca reutilizada entre operações distintas.
- Chave persistida: sobrevive a restart, reconexão, retries e retry manual.
- Chave opaca e aleatória (UUID v4): impossível colidir ou inferir tenant.
- Backfill: itens legados sem chave recebem uma no primeiro load pós-update.

## Evidência cliente

- `src/features/mobile/__tests__/offlineSync.idempotency.test.ts` — 16 testes:
  mesma operação→mesma key; operações distintas→keys distintas; retry/reconexão/
  restart/retryFailed preservam key; isolamento multi-tenant (storage namespacado por
  `tenantId`); propagação real do header até o `fetch` via `defaultApiClient`.
- Testes: `npx vitest run -c vitest.unit.config.ts src/features/mobile/__tests__/offlineSync.idempotency.test.ts src/features/mobile/__tests__/offlineSync.service.test.ts` → **37/37 passando**.

## Pendências para o Agente 22

1. Middleware/handler de dedup lendo `X-Idempotency-Key` nos endpoints da tabela §5.
2. Teste de integração: duas POSTs `/api/leads` com a mesma chave → um único lead.
3. Responder neste handoff (ou criar `22-para-85-api-idem-ack.md`) confirmando quais
   endpoints já estão cobertos e o TTL efetivamente implementado.

## Observação de tenancy/LGPD

A chave de idempotência é pseudônimo opaco; armazená-la no servidor por até 7 dias é
compatível com a finalidade (integridade de mutações) — registrar na base legal de
execução de contrato se o inventário LGPD exigir.
