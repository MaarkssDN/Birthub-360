# Handoff 85 → 00 — Offline-First e Sincronização Mobile (Onda 4)

- De: Agente 85 — Bóris (Runtime, Workers e Escala / Squad 80 Mobile)
- Para: Agente 00 — Coordenador
- Onda: Onda 4 — MISSÃO ONDA4-85-MOBILE-OFFLINE
- Status: resolvido (escopo próprio) / achados externos abertos para outros donos
- Prioridade: normal (2 correções comprovadas no módulo próprio já commitadas)
- Bloqueador-ref: nenhum
- Branch: `agente/85-mobile-offline-onda4` · Worktree `wt-85-mobile-offline`
- Base SHA: `32d07c3750c370b63da8b720019413c9a40e0e68`
- SHA de entrega: `1e0f77b4542758964393016407a87957a865d920`

## Problema

Auditar estratégia offline (persistência, fila de mutações, reconexão, conflitos,
idempotência, separação por conta/tenant, LGPD em repouso), corrigir problemas
comprovados em `src/mobile/offline/**` e produzir matriz de conflitos.

## Arquivo(s) envolvido(s)

### Sob minha propriedade (editados)
- `src/mobile/offline/sync.ts` — resolvedor de conflito field-level 3-way merge.
- `src/mobile/offline/__tests__/sync.test.ts` — NOVO, 9 testes.

### Auditados read-only (propriedade de outros — achados abaixo)
- `src/features/mobile/offlineSync.service.ts` (fila outbox HTTP, 850 linhas)
- `src/features/mobile/services/encryptedOfflineStorage.service.ts` (AES-GCM-256)
- `src/features/mobile/services/offlineStorageAdapter.ts`
- `src/features/mobile/services/offlineSyncQueue.service.ts` (fila em memória, não persistida)
- `src/contexts/AuthContext.tsx` (purge no logout → `clearQueue()`)
- `src/components/layout/SyncIndicator.tsx` (gatilho de sync manual)

## Correções aplicadas no meu módulo (commit `1e0f77b45`)

1. **Validação do snapshot `base`** (`sync.ts`): o guard anterior só comparava
   `local` vs `remote`. Um `base` de outra entidade/tenant produzia merge
   silenciosamente corrompido. Agora `base.id`/`base.tenantId` também são
   validados contra `local`/`remote` → `throw` em divergência.
2. **Remoção real de campo deletado** (`sync.ts`): ao vencer o lado local com
   valor `undefined`, a chave herdada do spread de `base.fields` permanecia no
   resultado (`'campo' in mergedFields === true` com valor `undefined`).
   Adicionada limpeza pós-merge que deleta chaves cujo valor final é `undefined`
   (em `mergedFields` e `mergedFieldTimestamps`). JSON não serializa `undefined`,
   então `undefined` ≡ campo ausente.

## Evidência

- `npx vitest run -c vitest.unit.config.ts src/mobile/offline/__tests__/sync.test.ts tests/unit/mobile/onda3MobileSquad80.test.ts` → **13/13 passando** (9 novos + 4 da suíte Squad 80 existente, incluindo o cenário de campo).
- `npx tsc --noEmit` → exit 0 (repo inteiro).
- `npx biome lint src/mobile/offline/` → limpo.
- Teste que reproduziu o bug de deleção: `campo removido localmente (undefined) vence quando remoto não alterou` falhou antes da correção (`expected true to be false`) e passou depois.

## Achados da auditoria (fora do meu escopo — ver matriz de conflitos)

| # | Achado | Arquivo | Severidade | Dono sugerido |
|---|--------|---------|-----------|---------------|
| A1 | **Sem idempotency key HTTP**: `ApiClientAdapter.request` não aceita headers; mutações reenviadas após falha ambígua (timeout pós-commit no servidor) duplicam CREATE_LEAD/CREATE_NOTE/etc. Skill §3 exige `X-Idempotency-Key: <local_id>`. O item `id` (`op_<uuid>`) já existe e é estável — falta apenas propagá-lo como header e o backend honrá-lo. | `src/features/mobile/offlineSync.service.ts` (linhas ~85-91, 686-690) | ALTA | 80/81 + backend (18/20) |
| A2 | **Chaves de storage globais, sem escopo de tenant/conta**: `birthhub_offline_sync_queue_v1` e `..._id_mappings_v1` são fixas. Itens enfileirados sob conta A podem ser enviados sob sessão da conta B se houver troca sem logout. Mitigação parcial existente: `AuthContext.logout` chama `clearQueue()`. Recomendo sufixo `:${tenantId}` ou validação de tenant no drain. | `offlineSync.service.ts:102-103` | MÉDIA | 81/88 (segurança mobile) |
| A3 | **`offlineSyncQueue.service.ts` é fila em memória não persistida** (sem storage, sem status, sem retry) — duplicata funcional do outbox real; risco de uso indevido. Candidato a remoção ou deprecação. | `services/offlineSyncQueue.service.ts` | BAIXA | 81 |
| A4 | Itens com status `'syncing'` persistidos após crash são re-tentados corretamente (bom), mas sem idempotency key (A1) um crash pós-commit duplica a mutação. Mesma causa raiz de A1. | `offlineSync.service.ts:655-657` | coberto por A1 | — |
| A5 | **LGPD/repouso OK**: `EncryptedStorageAdapter` cifra AES-GCM-256 com chave non-extractable persistida em IndexedDB; sem fallback para texto claro (apenas warning). `sanitizePayload` redige password/secret/token/etc. antes de persistir. Nenhum PII em logs observado (logs só com `err`, sem payload). | `encryptedOfflineStorage.service.ts`, `offlineSync.service.ts:104-136` | OK | — |
| A6 | Reconexão: `NetworkStatusProvider` ouve `online`/`offline` + `navigator.onLine`, autoSync dispara `sync()`; `syncLock` evita concorrência; erro transitório interrompe o lote preservando retries. Comportamento correto. | `offlineSync.service.ts:235-297, 626-746` | OK | — |
| A7 | Resolução de IDs temporários (`dependsOnTempId`/`idMap`) funciona para cadeias lead→nota→áudio; dependente de pai `failed` é marcado `failed` (cancelado). Coberto por `offlineSync.service.test.ts`. | `offlineSync.service.ts:558-621` | OK | — |

## Matriz de conflitos (estratégia vigente + recomendação)

| Cenário | Estratégia atual | Avaliação |
|---------|------------------|-----------|
| Mesmo registro, campos distintos editados offline+web | Field-level 3-way merge (`reconcileOfflineFieldLevelMerge`) — ambos preservados | Correto após fix; timestamps por campo |
| Mesmo campo, ambos alteraram | Maior `fieldTimestamps[field]` vence (LWW por campo); empate → local | Correto; empate é determinístico mas arbitrário — aceitável, registrado em `conflictingFieldsResolvedByTimestamp` |
| Campo deletado localmente | Vence deleção quando remoto não tocou (após fix de remoção de chave) | Corrigido nesta entrega |
| Entidades de tenants/IDs distintos | `throw` (agora inclui validação do `base`) | Corrigido nesta entrega |
| Mutações HTTP (outbox) | Ordem cronológica da fila, `syncLock`, retry×3, backoff implícito por interrupção de lote | Falta idempotency key (A1) — único gap real |
| Conta/tenant no dispositivo | Purge total no logout; sem partição por tenant em sessão | Gap médio (A2) |

## Teste esperado / pendente para outros donos

- **A1**: estender `ApiClientAdapter.request` com `headers` e enviar
  `X-Idempotency-Key: <item.id>`; teste: replay do mesmo item após falha
  transitória não duplica registro no backend (exige suporte do endpoint).
- **A2**: teste de dois tenants sequenciais no mesmo storage sem logout.

## Contexto adicional

- Dependências instaladas já cobrem a skill: `rxdb` existe mas é código morto
  (comentário em `encryptedOfflineStorage.service.ts:29-30` sugere decisão do
  00: remover ou adotar). Não adicionei dependências (P2).
- `src/lib/db/rxdb.ts` não foi encontrado em uso por este subsistema; a
  persistência efetiva é localStorage/IndexedDB via `StorageAdapter`.
- Não executei gate completo (test:unit inteiro / integration / e2e): escopo
  cirúrgico em módulo puro; typecheck global + lint + vitest do escopo verdes.
  Fica para o gate de integração da onda.
- `.agents/runs/` é propriedade do Agente 00 — registro de execução embutido
  neste handoff em vez de arquivo separado.
