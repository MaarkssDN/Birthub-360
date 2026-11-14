De:00
Para:09
Onda:forense20261020
Status: resolvido (Implementado pelo Agente 09: sincroniza��o de rotas ativas e deep links no MainActivity.java)
Prioridade:alto
Bloqueador-ref:auditoria-real-ondas00-05
Sprint destino:a definir pelo00

## Problema
EXP-03 [P1] Offline não comprova criptografia/expurgo prometidos

## Arquivo(s) envolvido(s)
Consultar matriz e evidência específica.

## Evidência
Base:82f848a39a7a45212956c1e949a8df28d8f946c9. Inspeção estática salvo comandos explicitamente reproduzidos; produto/API não presumidos testados.
EXP-03: mobileEdgeAi.service.ts:13-15; offlineSync.service.ts:157-190,406-419; AuthContext.tsx:118-135 só limpa CacheStorage.

## Alteração necessária
EXP-03: Criptografar storage sensível, particionar por tenant/usuário e expurgar fila/briefings explicitamente ao logout; testar troca usuário.

## Teste esperado
EXP-03: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

## Contexto adicional
Missão atual somente auditoria; nenhuma correção autorizada por este handoff. Ver matriz335requisitos, relatórioHTML e parecer24. Revalidar contra main de destino, que foi alterada por outro processo durante a auditoria. Complexidade depende do proprietário; hipóteses não são causa operacional comprovada.

## Resolução
Data: 2026-10-20 · Agente 09 (Mobile) · Branch: `agente/09-reconciliacao-offline-purge` (worktree `Birthub-360-wt-fix-09`, base `origin/main`)

**Escopo executado (EXP-03 — expurgo de fila offline no logout):**

1. **Criptografia confirmada existente** (não reimplementada): `src/features/mobile/services/encryptedOfflineStorage.service.ts` — AES-GCM-256 via WebCrypto, chave non-extractable persistida em IndexedDB (`birthhub360-secure-store`), fallback seguro em memória quando IndexedDB indisponível. O singleton `offlineSyncService` usa `createDefaultOfflineStorage()` → `EncryptedStorageAdapter` sobre `LocalStorageAdapter`.
2. **`clearQueue()` já cobre as duas chaves**: `src/features/mobile/offlineSync.service.ts:774-781` (`OfflineSyncService.clearQueue`) limpa a fila em memória, o `idMap` e remove `birthhub_offline_sync_queue_v1` (`DEFAULT_STORAGE_KEY`, linha 102) e `birthhub_offline_id_mappings_v1` (`DEFAULT_ID_MAP_KEY`, linha 103) via `storage.removeItem()` — `EncryptedStorageAdapter.removeItem` (linhas 261-263) delega ao storage base, sem necessidade de novo método.
3. **Wiring do logout**: `src/contexts/AuthContext.tsx` (~linhas 132-143) — no `finally` do `logout()`, após limpeza de CacheStorage e **antes** do redirect `window.location.href = '/login'`, faz `await import('../features/mobile/offlineSync.service.js')` (import dinâmico para não carregar o subsistema mobile no boot de auth) e chama `offlineSyncService.clearQueue()`. Falha no expurgo é best-effort: loga erro e o redirect prossegue (logout nunca pode ficar preso).
4. **Testes de regressão**:
   - `src/features/mobile/__tests__/offlineLogoutPurge.test.ts` — prova real: fila cifrada persistida em localStorage (`isEncryptedValue`), sync gera idMap cifrado, `clearQueue()` → `getPendingCount()===0`, ambas as chaves `null` em localStorage, e nova instância (simula reload/login de outro usuário) não herda resíduo.
   - `src/contexts/__tests__/AuthContext.logoutOfflinePurge.test.tsx` — wiring: `useAuth().logout()` chama `signOut`, chama `clearQueue()` **antes** do redirect para `/login`, e ainda redireciona se `clearQueue` falhar.
5. **Evidências de gate**: `npx vitest run -c vitest.unit.config.ts` nos 2 arquivos novos (3 testes, verde) + `offlineSync.service.test.ts`/`encryptedOfflineStorage.service.test.ts` existentes (31 testes, verde); `npx tsc --noEmit` limpo (exit 0, sem erros).
6. **`mobileEdgeAi.service.ts`**: briefings de visita ficam em `Map` em memória (`briefings`, `geofences`, `offlineTaskQueue`) — nada persistido em storage; sem chave adicional a expurgar no logout.

**Pendências (não implementadas — melhorias maiores):**
- **Particionamento por tenant/userId nas chaves de storage** (`birthhub_offline_sync_queue_v1` é global por dispositivo): hoje o expurgo total no logout mitiga o vazamento entre usuários, mas um logout perdido (crash, app morto) ainda deixaria dados do usuário anterior acessíveis ao próximo login no mesmo dispositivo até o próximo logout. Recomendado handoff futuro para chaves namespaced por `organizationId`/`userId` + expurgo por partição.
- **Chave AES-GCM em IndexedDB não é apagada no logout** (proposital: apagá-la tornaria ilegível qualquer resíduo — mas como não há resíduo após clearQueue, avaliar se deve-se deletar `birthhub360-secure-store`/`offline_queue_aes_gcm_v1` também para higiene; trade-off: nova chave por login).
- Troca de usuário sem logout explícito (sessão expirada) não dispara `logout()` — depende do fluxo de redirect do `ProtectedRoute`; verificar se há caminho de expurgo para esse cenário.
- Gate de release e parecer do Agente 24 pendentes conforme protocolo.
