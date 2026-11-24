# Plano do Squad 80 — Mobile & Experiência Multiplataforma

- Coordenador: Agente 80 — Navi (DEM-20261123-001)
- Branch: `coord/squad-80` · Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-80/wt-coord`
- Integração do squad: `integracao/squad-80` (fluxo: executor → coord/squad-80 → integracao/squad-80 → SHA congelado → Silas → Astra)
- Lease: `.agents/runs/leases/squad-80.lease` · Portas: 22800–22899 (faixa `22000+80*10`, confirmado em `estrutura-10-coordenadores-squads-20261124.md` §4)
- Base: `93e82c220` (commit de governança "estrutura oficial 10 squads/10 coordenadores", sobre `0141f258a`)
- Fontes lidas: `AGENTS.md`, `.agents/prompts/80-mobile/80-papel-especifico.md`,
  `.agents/runs/REGISTRO_GLOBAL_100_AGENTES_20261124.md` (§Squad 80),
  `.agents/runs/estrutura-10-coordenadores-squads-20261124.md`, `.agents/MATRIZ_PROPRIEDADE.md`.

> Nota operacional: o clone canônico da missão é `C:/Github/Birthub-360`. Uma primeira tentativa de
> worktree foi feita por engano no clone `D:/Github/Birthub-360` (onde `93e82c220` não existe);
> foi desfeita por completo (worktree removido, branch deletada) e refeita no clone correto.

## 1. Estado do squad segundo o REGISTRO_GLOBAL (§Squad 80)

Todos os agentes 80–89 constam **PREPARADO**, exceto **83 — Ceci: BLOQUEADO (parcial)** — build
nativo iOS impossível em host Windows sem macOS/Xcode; auditoria estática liberada.
Branches/Worktrees planejados no registro (`agente/<id>-squad80-*`, `ondaN/wt-*`) diferem da
convenção vigente do documento de estrutura (`agente/<id>-<slug>-s80`, `squads/squad-80/wt-<id>`) —
**vale o documento de estrutura (mais recente)**; divergência registrada para o Astra.

Missões registradas: 80 consolidar matriz de compatibilidade; 81 auditar bridges/plugins/
permissões; 82 auditar Gradle/manifests/build Android; 83 auditoria estática Xcode/Info.plist;
84 deep links/universal links/FCM-APNS mocks (preserva AppLink canônico PR #475, interface c/ 68 Paco);
85 IndexedDB/RxDB/fila offline/conflitos (preserva outbox Wave E PR #451); 86 gestos/tap targets/
viewports; 87 permissões microfone/contatos/bridge de voz (interface c/ 62 Sol, 65 Lena);
88 Keychain/Keystore/biometria/logout (interface c/ 96 Nera, 08 Dora); 89 startup/memória/FPS/
sanitização Sentry Mobile (interface c/ 95 Íon, 07 Íris).

## 2. Inventário real do mobile (verificado em 93e82c220)

### Wrapper Capacitor
- `capacitor.config.ts` — appId `br.com.birthhub360.prospector`, `server.url` =
  `CAPACITOR_SERVER_URL || https://app.birthhub360.com.br`; **obrigatória em CI prod**;
  cleartext só em debug/LAN. `app.birthhub360.com.br` **ainda não resolve DNS** e o Render está
  desativado (modo Local-First) → endpoint de produção do app indefinido (R1).
- Plugins instalados: `@capacitor/{core,android,ios,cli} ^8.5`, `filesystem`, `share`,
  `@capacitor-community/speech-recognition`. Scripts npm: só `mobile:sync`/`mobile:open` (android).

### Android (`android/`)
- Manifest: INTERNET, CAMERA (OCR), RECORD_AUDIO+MODIFY_AUDIO_SETTINGS (campo); geolocalização
  removida por falta de uso funcional (auditoria DEM-20261115-001). `usesCleartextTraffic` só em
  `src/debug/`.
- Deep links: `birthhub360://` (custom) e `https://app.birthhub360.com.br/app*` (autoVerify=true,
  **sem assetlinks.json publicado** → funciona só como link comum).
- `MainActivity.java`: `SplashScreen.installSplashScreen`, deep link → `VALID_TABS` (~46 tabs,
  espelho manual de `ACTIVE_NAV_TABS` de `src/lib/navigationBus.ts`), destino inválido → diálogo
  nativo de erro. Paridade coberta por `tests/unit/navigation/*-valid-tabs-parity.test.ts`.
- `fastlane/Fastfile` presente; sem keystore versionado (correto).

### iOS (`ios/`)
- `Info.plist`: `birthhub360://` em CFBundleURLTypes; NSCamera/NSMicrophoneUsageDescription ok;
  **sem Associated Domains** (Universal Links não implementado — mesmo bloqueio de infra);
  `UIRequiredDeviceCapabilities: armv7` obsoleto (R8).
- `SceneDelegate.swift`/`AppDelegate.swift` espelham o deep link custom; `CapApp-SPM`, fastlane.

### TypeScript mobile
- `src/mobile/` (9 arquivos, ~568 linhas): `index.ts` (CRM360_PARITY_ENDPOINT_MAP +
  MobileCrm360ParityClient), `deeplinks/handler.ts` (**segundo parser de deep link**, 5 hosts
  fixos — diverge dos VALID_TABS nativos, R3), `offline/sync.ts` (merge 3-way field-level),
  `security/storage.ts`, `telemetry/sentry.ts` (sanitização PII), `native-audio/recorder.ts`,
  `plugins/permissionAuditor.ts`, `ios/certRenewal.ts`, `ui/LeadListCompact.tsx`.
- `src/features/mobile/` (14 arquivos): `offlineSync.service.ts` (~850 linhas, outbox HTTP real),
  `services/{encryptedOfflineStorage,offlineStorageAdapter,offlineSyncQueue}.service.ts`,
  `audioRecording.service.ts`, `mobileEdgeAi.service.ts` (geofencing opt-in + briefing offline),
  `server/mobileFieldMeeting.{routes,service}.ts`, `components/FieldMeetingRecorder.tsx`,
  `__tests__/` (4 arquivos, 35 testes).
- **`src/features/mobile/**` não consta na MATRIZ_PROPRIEDADE** — ownership gap formal (R4).

### Testes mobile existentes
- `tests/unit/mobile/` (3 arquivos), `tests/unit/features/mobile/` (3), `src/features/mobile/__tests__/` (4),
  `tests/unit/navigation/*-valid-tabs-parity.test.ts`, `tests/integration/features/mobile/`,
  `tests/e2e/{deeplink,mobile-sweep,crm-kanban-mobile}.spec.ts`.

### Evidência executada nesta sessão (worktree coord/squad-80 @ 93e82c220)
- `npx vitest run -c vitest.unit.config.ts tests/unit/mobile tests/unit/features/mobile` → **43/43**.
- `npx vitest run -c vitest.unit.config.ts src/features/mobile/__tests__` → **35/35**.
- **Total: 78 testes unitários mobile passando, 0 falhas.**

### Bloqueios de ambiente (honestos)
- Sem `java`, `ANDROID_HOME`/`ANDROID_SDK_ROOT` vazios → `assembleDebug` impossível.
- Host Windows sem Xcode → build iOS impossível (confirma BLOQUEADO do 83 no registro).
- `npx cap` CLI 8.6.0 disponível, mas `cap sync`/builds exigem SDKs nativos.
- Fase atual: auditoria de código/configs + testes unitários; builds nativos exigem toolchain
  (handoff a 93 Max / 82 Davi / 83 Ceci).

## 3. Riscos e achados priorizados

| # | Achado | Evidência | Severidade | Dono sugerido |
|---|--------|-----------|-----------|---------------|
| R1 | Backend de produção indefinido p/ `server.url` (DNS pendente, Render off, Local-First) | capacitor.config.ts + docs/deploy | ALTA | 80 escala → 00/90/91 |
| R2 | assetlinks.json / apple-app-site-association não publicados; autoVerify/Universal Links inertes | AndroidManifest, Info.plist | MÉDIA | 84 + 90/94 |
| R3 | Dois parsers de deep link divergentes (nativo ~46 tabs vs handler.ts 5 hosts fixos; ex.: `voice`→`/app/voice` vs `/app/voice-hub`) | MainActivity/SceneDelegate vs handler.ts | ALTA | 84 Pia |
| R4 | `src/features/mobile/**` sem dono na MATRIZ_PROPRIEDADE | MATRIZ §80 | MÉDIA | 80 propõe adendo via 00 |
| R5 | Sem `X-Idempotency-Key` HTTP no outbox offline; idempotência coberta só em DomainEventMesh producers (mobileEdgeAi) | offlineSync.service.ts (grep negativo), outboxIdempotency.test.ts | ALTA | 85 + backend 20/24 |
| R6 | Chaves de storage offline sem escopo de tenant (`birthhub_offline_sync_queue_v1` fixas) | offlineSync.service.ts:102-103 (handoff Bóris A2) | MÉDIA | 85/88 |
| R7 | `offlineSyncQueue.service.ts` é fila em memória não persistida, referenciada só por si mesma (código morto/duplicata) | grep de usos | BAIXA | 81 Enzo |
| R8 | iOS `UIRequiredDeviceCapabilities: armv7` obsoleto | Info.plist | BAIXA | 83 Ceci |
| R9 | Sem `mobile:sync:ios`, sem scripts de build/lint mobile | package.json | BAIXA | 81 Enzo |
| R10 | Push notifications inexistente (sem `src/mobile/push/**`, sem plugin FCM/APNs) | ausência de arquivos | MÉDIA | 84 Pia |
| R11 | **Divergência de linhagem**: `sync.ts` nesta base (onda-3/squad) NÃO contém as correções do Bóris mergeadas na Onda 4 (`1e0f77b45`: validação de `base.id/tenantId`, limpeza de campos `undefined`) nem `offline/__tests__/sync.test.ts` — risco de regressão/conflito na promoção a `integracao/onda-3` | diff vs 9f80c07ed | ALTA | 85 Bóris + coordenação |

## 4. Backlog priorizado por risco (execução sem run_subagent — farei inline, máx. 3 frentes)

**Frente A — P0/P1 imediato (esta sessão do coordenador):**
1. **84 Pia (R3, R10)**: unificar contrato de deep link — fazer `src/mobile/deeplinks/handler.ts`
   derivar destinos da mesma fonte de verdade dos VALID_TABS nativos (ou deprecar para rota
   `/app/<tab>`) e adicionar teste de paridade handler↔nativo. Push: documentar plano FCM/APNS
   com mocks (sem credenciais reais).
2. **85 Bóris (R5, R6, R11)**: re-aplicar/verificar correções do merge 3-way sobre esta base
   (R11) e tratar idempotency key HTTP + escopo de tenant no storage.
3. **81 Enzo (R7, R9)**: inventário plugins Capacitor vs uso real; deprecar
   `offlineSyncQueue.service.ts`; adicionar `mobile:sync:ios`.

**Frente B — P1/P2:** 88 Sasha (biometria/keystore, R6), 87 Tomás (delimitar
`native-audio/recorder.ts` vs `audioRecording.service.ts` — overlap c/ Squad 60), 86 Alana
(mobile UI quase virgem), 89 Zico (integrar Sentry nativo), 82/83 auditorias estáticas
(toolchain ausente).

**Frente C — escalonamentos (handoff 00):** R1/R2 (backend canônico + assetlinks/AASA — infra),
R4 (adendo à MATRIZ), divergência de linhagem R11 (promoção squad→onda-3).

## 5. Governança

- Ownership estrito por MATRIZ_PROPRIEDADE; `src/features/mobile/**` tratado como zona cinzenta
  até adendo (R4) — ninguém edita sem handoff.
- Cross-squad formal: 60↔87 (voz nativa), 90↔88 (segredos/biometria), 20/24↔85 (idempotência).
- Handoffs: `.agents/handoffs/squad-80/`. Gates: vitest direcionado executado (78/78);
  `tsc --noEmit`/`lint`/builds nativos pendentes de toolchain; SHA final → Silas via Astra.

## 6. Registro de execução

- Runtime: Devin (subagente), Windows, clone `C:/Github/Birthub-360`.
- Comandos: `git worktree add ... -b coord/squad-80 93e82c220`; junction node_modules →
  `C:\Github\Birthub-360\node_modules` (PowerShell `New-Item -ItemType Junction`);
  vitest unit mobile (acima).
- Sem `run_subagent` disponível → execução priorizada inline conforme missao.
