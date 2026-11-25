# Handoff 85 → 00 — POS4-85-IDEM: X-Idempotency-Key no outbox mobile

- De: Agente 85 — Bóris (Squad 80 Mobile)
- Para: Agente 00 — Astra (Coordenador Global)
- Missão: POS4-85-IDEM — X-Idempotency-Key no outbox mobile
- Status: implementado e testado (commit local pendente neste branch)
- Prioridade: alta (resolve achado ALTA da auditoria Onda 4 — handoff `onda4/85-para-00` achado A1)
- Bloqueador-ref: nenhum
- Branch: `agente/85-mobile-idem-pos4` · Worktree `wt-85-mobile-idem`
- Base SHA: `9f80c07edc2000712e884febbdd3cd2fb2bee55d`
- Continuação: agente anterior morreu com trabalho parcial não-commitado; esta sessão
  auditou o diff, validou completude e finalizou handoffs.

## Problema

Mutations do outbox HTTP eram enviadas sem `X-Idempotency-Key`: um retry após falha
ambígua (timeout pós-commit no servidor) duplicava CREATE_LEAD/NOTE/áudio.
Skill `capacitor-offline-sync` §3 já exigia o header — o cliente não o enviava.

## Correções aplicadas (diff auditado e mantido)

Arquivo principal: `src/features/mobile/offlineSync.service.ts` (+75/-7)

1. **`idempotencyKey` no item da fila** (`OfflineQueueItem.idempotencyKey?: string`):
   gerada UMA vez via `generateIdempotencyKey()` (`idem_<uuid-v4>`, fallback
   timestamp+random) no `enqueue`, persistida com o item e reenviada em TODOS os
   retries/reconexões/`retryFailed`/restart.
2. **Header HTTP propagado**: `ApiClientAdapter.request` aceita `headers?`;
   `defaultApiClient` repassa via opções do `api.post/put/patch/delete`;
   `syncQueue` envia `{ 'X-Idempotency-Key': item.idempotencyKey }` (constante
   `IDEMPOTENCY_HEADER_NAME`).
3. **Backfill de itens legados**: filas persistidas antes do versionamento recebem
   chave estável no `loadFromStorage` (persistida via `persistQueue`); guarda
   adicional no `syncQueue` para itens injetados em memória.
4. **Isolamento multi-tenant**: nova opção `tenantId` namespacia as chaves de
   storage default (`birthhub_offline_sync_queue_v1:<tenantId>` e `..._id_mappings_v1:<tenantId>`),
   impedindo reenvio da fila de uma conta sob sessão de outra. Chaves explícitas
   (`storageKey`/`idMapKey`) continuam tendo precedência — retrocompatível.
5. **Opacidade/LGPD**: a chave é UUID aleatório puro — sem tenant, usuário ou PII.

Testes: `src/features/mobile/__tests__/offlineSync.idempotency.test.ts` (NOVO, 16
testes) + ajuste de asserts no `offlineSync.service.test.ts` existente (3 headers).

## Cobertura da matriz (itens da missão)

| Requisito | Coberto por |
|---|---|
| Key estável gerada no enqueue + persistida | teste "enqueue atribui idempotencyKey estável… persistida no storage" |
| Mesma operação → mesma key | it.each 5 tipos + teste de retry/reconexão/restart/retryFailed |
| Operações distintas → keys distintas | teste "operações distintas geram keys distintas" (lead/note/audio/generic) |
| Tipos: CREATE_LEAD, UPDATE_LEAD, CREATE_NOTE, FIELD_MEETING_AUDIO, GENERIC_MUTATION | `it.each` "Header propagado em todos os tipos do outbox" |
| Retry preserva key (falha transitória, esgotamento, manual) | 3 testes dedicados |
| Reconexão/restart do app | teste "restart do app (novo service sobre o mesmo storage)" |
| Isolamento multi-tenant | teste de storage namespacado por tenantId + teste de opacidade |
| Header efetivamente enviado (até o fetch) | 2 testes em `defaultApiClient` com `fetch` stubado |
| Backfill de fila legada | teste "item legado sem idempotencyKey recebe backfill estável no load" |

## Evidência

- `npx vitest run -c vitest.unit.config.ts src/features/mobile/__tests__/offlineSync.idempotency.test.ts src/features/mobile/__tests__/offlineSync.service.test.ts` → **37/37 passando**.
- `npm run typecheck` (tsc --noEmit repo inteiro) → exit 0.
- `npx biome lint` nos 3 arquivos → limpo.
- Sem dados reais (fixtures 100% sintéticos), sem push/PR.

## Handoffs emitidos

- `.agents/handoffs/pos4/85-para-22-api-idem-contract.md` — contrato EXATO do header
  (formato, escopo `(organizationId da sessão, key)`, TTL sugerido 72h/7d, semântica
  de resposta idempotente, tabela de endpoints cobertos). **Dependência externa**:
  a deduplicação no servidor é do Agente 22 (em paralelo). Sem handoff prévio do 22
  encontrado neste worktree — pedi ack via resposta no próprio handoff.
- Registro de execução: `.agents/runs/pos4-85-mobile-idem.md`.

## Pendências / riscos para o coordenador

1. **Dedup server-side pendente (Agente 22)**: até lá o header é inócuo — recomendo
   tratar a integração como par indivisível no gate de release.
2. **`tenantId` é opt-in**: quem instancia `OfflineSyncService` sem `tenantId` mantém
   as chaves de storage globais (comportamento anterior). Verificar se o ponto de
   instanciação real deve passar `tenantId` — candidato a follow-up com Squad 80/81.
3. **Escopo de ownership respeitado**: apenas `src/features/mobile/offlineSync.service.ts`
   e seus testes foram tocados (grant especial da missão). `src/mobile/offline/sync.ts`
   (merge field-level) não precisou de alteração — já validava tenant/ID.
