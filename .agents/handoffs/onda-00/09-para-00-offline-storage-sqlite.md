# Handoff — Persistência offline criptografada entregue; SQLite nativo pendente

```
De: Agente 09 — Mobile
Para: Agente 00 (Coordenador) — triagem de escopo / decisão de dependência nativa
Onda: 00 (auditoria "persistência offline frágil")
Status: em-andamento (base correta entregue; SQLite nativo fica para onda futura)
Prioridade: alto
Bloqueador-ref: auditoria Onda 00 — "modo reunião de campo precisa reconstrução com SQLite nativo criptografado"
Sprint destino: próxima onda mobile
```

## Problema

Auditoria do estado offline antes da correção:

- `src/features/mobile/offlineSync.service.ts` persistia a fila de mutações
  (notas de reunião, `meetingNotes`, `audioData` base64, dados de leads) em
  **localStorage em texto claro** (`birthhub_offline_sync_queue_v1`).
- `src/features/mobile/services/offlineSyncQueue.service.ts` é uma segunda fila
  **só em memória** (perde tudo em reload/kill do app) e **não tem nenhum
  consumidor** no codebase — código morto candidato a remoção.
- `src/lib/db/rxdb.ts` (RxDB + Dexie/IndexedDB) está no package.json
  (`rxdb@^17.5.0`) mas **não é importado por nenhum arquivo** — código morto.
- Não existe feature de check-in geolocalizado nem "roteiros" de campo no
  código mobile; o único dado de campo persistido offline hoje é a fila do
  `OfflineSyncService` (áudio + notas + leads).
- Não há `@capacitor-community/sqlite` nem `@capacitor/preferences` no
  package.json — dependência nativa ausente.

## O que foi entregue nesta onda

Camada de persistência criptografada (decisão pragmática 3b da missão — sem
adicionar plugin nativo pesado):

- **Novo** `src/features/mobile/services/encryptedOfflineStorage.service.ts`:
  - `EncryptedStorageAdapter` implementa `StorageAdapter` cifrando todos os
    valores com **AES-GCM-256 via WebCrypto** (formato `bh360enc:v1:<iv>:<ct>`).
  - Chave `non-extractable` persistida no **IndexedDB** do WebView (material
    protegido pelo keystore do SO quando disponível). Sem IndexedDB → chave só
    em memória da sessão (degradação segura, warning explícito, nunca texto
    claro).
  - Leitura de valores legados em texto claro permitida (migração
    transparente: próxima escrita já sai cifrada).
  - Ciphertext adulterado ou chave perdida → `null` (fila tratada como vazia,
    sem crash).
- **Modificado** `src/features/mobile/offlineSync.service.ts`:
  - Storage default agora é `createDefaultOfflineStorage()` (criptografado
    quando `crypto.subtle` existe).
  - `loadFromStorage`/`persistQueue`/`persistIdMap` tornados assíncronos;
    novo `service.ready: Promise<void>` e evento `queue_loaded`; todos os
    métodos públicos que tocam a fila aguardam `ready`.
- **Novo teste** `src/features/mobile/__tests__/encryptedOfflineStorage.service.test.ts`
  (10 testes: roundtrip, não-vazamento de PII no storage cru, tamper,
  chave errada, legado plaintext, reload da fila criptografada).
- `npx tsc --noEmit` limpo nos arquivos tocados; 31/31 testes mobile verdes.

## Arquivo(s) envolvido(s)

- `src/features/mobile/services/encryptedOfflineStorage.service.ts` (novo)
- `src/features/mobile/offlineSync.service.ts` (modificado)
- `src/features/mobile/__tests__/encryptedOfflineStorage.service.test.ts` (novo)

## Alteração necessária (pendente — decisão do 00)

1. **SQLite nativo criptografado**: instalar `@capacitor-community/sqlite`
   (requer aprovação de package.json — dono 00). Criar
   `NativeSqliteStorageAdapter` implementando `StorageAdapter` (ou KV
   dedicado) com SQLCipher/`PRAGMA key`, e injetar em `OfflineSyncService`
   via opção `storage`. Vantagem sobre a solução atual: sem limite de quota
   do localStorage (~5–10 MB) — **crítico porque `audioData` base64 de
   reuniões estoura a quota do localStorage em gravações longas**.
2. **Áudio grande**: mesmo com criptografia, base64 em localStorage é frágil.
   Caminho intermediário sem plugin nativo: gravar áudio em IndexedDB
   (chunked) e persistir só a referência na fila — avaliar com 01/01A (PII em
   repouso) e 23 (tamanho/token).
3. **Código morto**: remover `src/lib/db/rxdb.ts` + dep `rxdb` **ou** adotá-lo
   formalmente — decisão do 00 (mexer em package.json exige aprovação).
   Idem `offlineSyncQueue.service.ts` (sem consumidores).
4. **Check-in geolocalizado / roteiros de campo**: não existem no código —
   se a auditoria os pressupunha, são features novas (escopo 02/09), não bug.

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts src/features/mobile/__tests__/` — verde.
- Em device: enfileirar reunião offline, matar o app, reabrir → fila
  recuperada e payload legível apenas após decriptação.

## Contexto adicional

- Branch: `agente/09-mobile-offline` (base `integracao/coordenador-20261112`).
- LGPD: `meetingNotes`, nomes de leads e áudio de reunião agora ficam cifrados
  em repouso no dispositivo. Consentimento continua enforced
  (`consentGranted` obrigatório antes de enfileirar).
- `sanitizePayload` continua redigindo tokens/senhas antes de cifrar
  (defesa em profundidade).
