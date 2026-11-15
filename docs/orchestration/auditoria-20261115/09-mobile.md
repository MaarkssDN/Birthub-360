# Auditoria Mobile — Agente 09 (Mobile / Capacitor)

**Demanda:** DEM-20261115-001 — Auditoria geral orquestrada pelo Agente 00
**Data:** 2026-11-15
**Escopo auditado (somente leitura):** `android/**`, `ios/**`, `capacitor.config.ts`, PWA (`vite.config.ts`, `index.html`, `src/main.tsx`, `dist/sw.js`), código mobile em `src/` (`src/features/mobile/**`, `src/hooks/useOnlineStatus.ts`, `src/components/layout/SyncIndicator.tsx`, `src/components/ui/BrandOrb.tsx`, `Gamified3DOrb.tsx`, `src/components/brand/BirthHubOrbit360.tsx`).
**Stack observada:** Capacitor 8.5 (`@capacitor/core/android/ios ^8.5.x`), Vite + `vite-plugin-pwa` + Workbox 7, React Three Fiber/Three.js ~884 kB em chunk dedicado, targetSdk 36 / minSdk 24.

---

## 1. ELOGIOS (evidências)

- **Deep link nativo implementado de verdade nas duas plataformas**, com diálogo de erro visível para destino inválido (nunca tela em branco): `android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java:92-177` (`handleDeepLink`, `showInvalidDeepLinkDialog`); `ios/App/App/SceneDelegate.swift` (`handleDeepLink`, `validTabs`). Strings localizadas em `android/app/src/main/res/values/strings.xml:7-8`.
- **Splash screen corrigida**: `SplashScreen.installSplashScreen(this)` antes de `super.onCreate()` (`MainActivity.java:75`), com tema `#0B132B` alinhado à marca em `capacitor.config.ts` (`plugins.SplashScreen`).
- **Governança de cleartext bem feita**: `usesCleartextTraffic=true` isolado só em `android/app/src/debug/AndroidManifest.xml`; release sem cleartext (`android/app/src/main/AndroidManifest.xml`).
- **Guard de CI em `capacitor.config.ts`**: build de produção sem `CAPACITOR_SERVER_URL` falha explicitamente — evita empacotar app apontando para backend morto.
- **Offline sync service robusto em si**: fila tipada com retry, `maxRetries`, dependências `dependsOnTempId`, sanitização de payload, storage criptografado (`src/features/mobile/offlineSync.service.ts`, `src/features/mobile/services/encryptedOfflineStorage.service.ts`, testes em `src/features/mobile/__tests__/offlineSync.service.test.ts`).
- **Áudio de campo com fallback de codecs e checagem de suporte** (`src/features/mobile/audioRecording.service.ts:52-149`) e consentimento LGPD no payload (`offlineSync.service.ts:24-34`).
- **3D com bom comportamento mobile**: `dpr={[1,1.5]}`, `frameloop='demand'` quando parado, `useReducedMotion` respeitado (`BrandOrb.tsx:128-129`, `Gamified3DOrb.tsx:196-197`), chunk `vendor-3d` isolado (~884 kB, lazy) em `vite.config.ts:208-213`, `prefers-reduced-motion` coberto em CSS (`src/components/layout/Sidebar.css:254`, `src/features/hub/hub-orbit.css:481`).
- **`useOnlineStatus` SSR-safe** e sem plugin nativo (`src/hooks/useOnlineStatus.ts`).
- **PWA configurada**: `registerType:'autoUpdate'`, `registerSW({immediate:true})` (`src/main.tsx:13-16`), manifest standalone com ícones maskable e atalhos (`vite.config.ts:19-51`), denylist de API no `navigateFallback` (`vite.config.ts:67`).
- **Permissões Android justificadas em comentário** com uso funcional real rastreado a componente (`CAMERA` → `OcrCapturePanel.tsx:105`; `RECORD_AUDIO` → `audioRecording.service.ts:108`).

---

## 2. PROPOSTAS DE MELHORIA (mobile)

1. **Offline-first real para leitura**: hoje só existe fila de *mutações* (e ela está desconectada — ver P1-1). Propor cache de GETs via Workbox `StaleWhileRevalidate` para endpoints de leitura quentes (dashboard, CRM board) + indicador "dados de HH:MM" já previsto no padrão de estados do Agente 02.
2. **Cold start offline**: com `server.url` remoto, o app abre em branco sem rede. Avaliar empacotar `dist` como fallback (`server.url` + bundle local) ou página offline nativa.
3. **Baixar `vendor-3d` (884 kB) para on-demand real**: `Gamified3DOrb`/`BrandOrb` são importados estaticamente por `GamificationWidget.tsx:9` e `OnboardingTour.tsx:4`; verificar se o chunk entra no caminho crítico do shell autenticado. Se sim, lazy-load dos orbes.
4. **Unificar `VALID_TABS` Android/iOS/TS**: hoje são 3 listas manuais divergentes (ver P1-3). Propor gerar as listas a partir de `TAB_ROUTE_SET` em build (script) ou, no mínimo, teste de paridade automatizado — o comentário em `MainActivity.java:53-54` já admite a necessidade.
5. **Push notifications nativas**: nenhum plugin Capacitor de push instalado; `UIBackgroundModes` ausente no iOS; `POST_NOTIFICATIONS` ausente no Android (obrigatória em runtime no Android 13+). Se notificações são requisito de produto, abrir demanda para `@capacitor/push-notifications` + FCM/APNs.
6. **`Network` plugin**: `navigator.onLine` não detecta "conectado mas sem internet real". `@capacitor/network` daria status real no WebView.
7. **`minifyEnabled false` em release** (`android/app/build.gradle:49`): habilitar R8/ProGuard + `shrinkResources` para reduzir APK e ofuscar.
8. **iPad/landscape**: `UISupportedInterfaceOrientations` inclui landscape no iPhone (`Info.plist`) enquanto o manifest PWA trava `portrait-primary` — decidir política única de orientação.
9. **assetlinks.json / apple-app-site-association**: App Links https configurados mas sem verificação publicada (handoff já aberto para 08/10) — concluir para deep links https funcionarem sem seletor.
10. **Safe areas**: adicionar `viewport-fit=cover` ao viewport e definir utilitário `pb-safe-area-inset-bottom` (hoje classe inexistente — ver P2-2).

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0 — Bloqueador / crash ou funcionalidade prometida inexistente

- **P0-1. iOS crash garantido ao usar câmera/microfone/localização.** `ios/App/App/Info.plist` **não declara** `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` nem `NSLocationWhenInUseUsageDescription`. No iOS, chamar `getUserMedia`/`MediaRecorder`/`geolocation` sem a usage description **encerra o app** (SIGKILL), não apenas falha. O código usa `getUserMedia` em `OcrCapturePanel.tsx:105` e `audioRecording.service.ts:108,131` — ambos acessíveis no app iOS empacotado. No Android as permissões correspondentes existem (`AndroidManifest.xml`: CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, ACCESS_FINE/COARSE_LOCATION), mas no iOS nada disso está declarado. **Qualquer uso de OCR de câmera ou FieldMeetingRecorder no iOS = crash imediato.**
- **P0-2. Offline sync é infraestrutura morta — marketing promete o que o produto não entrega.** `offlineSyncService.enqueue*` (`offlineSync.service.ts:434-539`) **não é chamado por nenhum código fora de `src/features/mobile/`** (verificado por grep em todo `src/`). `FieldMeetingRecorder.tsx` só é exportado por `src/features/mobile/index.ts:2` e referenciado em páginas de *landing* (`PillarRegistry.tsx:636,657,1296-1306`, `Landing360.tsx:236`) — **não há rota nem montagem do componente no app**. `SyncIndicator.tsx` exibe stats da fila, mas a fila nunca é populada. Resultado: "sincronização offline" anunciado não funciona em lugar nenhum do produto.

### P1 — Alto

- **P1-1. App mobile é 100% dependente de rede; sem fallback offline.** `capacitor.config.ts` usa `server.url = PRODUCTION_URL` (default `https://app.birthhub360.com.br`, fallback documentado para `birthhub-360.onrender.com` — que segundo o próprio comentário está **desativado**). O WebView não carrega `dist` local (`webDir` existe mas `server.url` sobrepõe). Sem rede: tela branca/erro do WebView. O SW do PWA (`dist/sw.js`, Workbox) pode até registrar dentro do WebView https, mas `navigateFallbackDenylist` exclui `/api/` e **não há runtimeCaching para dados** — só fontes (`vite.config.ts:55-65`). O `offlineSync.service` mitiga mutações (quando ligado), mas leitura fica zerada offline.
- **P1-2. `SceneDelegate.swift` com URL hardcoded divergente e desatualizada.** `ios/App/App/SceneDelegate.swift:14`: `serverURL = "https://birthhub-360.onrender.com"` — diverge do default atual `app.birthhub360.com.br` em `capacitor.config.ts` e aponta para backend declarado desativado. Deep links iOS navegam para origem morta (o `navigateWebView` carrega `serverURL + "/app/..."`). Além disso `validTabs` do iOS (`SceneDelegate.swift:17-26`) tem ~34 entradas e **diverge do Android** (`MainActivity.java:55-65`, ~60 entradas): faltam `crm360`, `mesa-tratamento`, `propostas`, `daily-plan`, `sdr-diagnostic`, `module-access`, `settings_*`, etc.; e o iOS tem `sdr-diagnostic-joao` que **não existe** na lista Android. Drift bidirecional = deep link válido numa plataforma falha na outra.
- **P1-3. Permissões de localização declaradas sem uso funcional.** `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` no manifest (`AndroidManifest.xml:106-107`) com comentário alegando "geofencing consentido em campo", mas **não existe nenhuma chamada a `geolocation`/`getCurrentPosition`/`watchPosition` em `src/`** (grep em todo o código). Viola a própria regra do AGENTS.md do Agente 09 ("não solicitar permissão sem uso funcional correspondente") e a regra global de minimização. Ou implementar o recurso ou remover as permissões.
- **P1-4. Nenhum plugin Capacitor instalado além do core.** `package.json` só tem `@capacitor/{core,cli,android,ios}` — sem `@capacitor/network`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/geolocation`, `@capacitor/camera`. Consequências: detecção de rede limitada a `navigator.onLine` (não detecta captive portal/sem internet real); sem push; sem storage nativo robusto (o `encryptedOfflineStorage` usa o que? verificar — provavelmente IndexedDB/localStorage do WebView, que pode ser evictado).

### P2 — Médio

- **P2-1. `index.html:6` viewport sem `viewport-fit=cover`.** `content="width=device-width, initial-scale=1.0"` — sem `viewport-fit=cover`, `env(safe-area-inset-*)` retorna 0 em devices com notch/Dynamic Island, e todo o trabalho de safe area é anulado.
- **P2-2. Classe `pb-safe-area-inset-bottom` não existe.** `src/components/ui/BottomSheet.tsx:79` usa `pb-safe-area-inset-bottom` mas nenhum CSS/Tailwind define essa utility (grep por `safe-area` em `src/**/*.css` retorna apenas os dois `env()` inline). O BottomSheet não respeita a home indicator. Já `MobileNavDrawer.tsx:39` usa `env()` corretamente — mas inócuo por causa do P2-1.
- **P2-3. Android 13+ sem `POST_NOTIFICATIONS`.** Manifest não declara `android.permission.POST_NOTIFICATIONS` nem há plugin de push — se o app usa `Notification` web dentro do WebView, no Android 13+ não há canal/permissão. Não encontrei uso de Notification API no escopo mobile, mas o `universalNotificationsTool` existe no lado IA — verificar se algum fluxo tenta notificar o app.
- **P2-4. `minifyEnabled false` + sem `shrinkResources`** em `android/app/build.gradle:49` — APK release maior e sem ofuscação.
- **P2-5. `versionCode 1` / `versionName "1.0"`** (`android/app/build.gradle:10-11`) — aceitável pré-release, mas sem estratégia de versionamento incrementado documentada.
- **P2-6. Orientação divergente**: PWA `orientation: 'portrait-primary'` (`vite.config.ts:26`) vs iOS plist liberando landscape no iPhone (`Info.plist` `UISupportedInterfaceOrientations` com `LandscapeLeft/Right`) vs Android `configChanges` tratando rotação. Política inconsistente entre as três superfícies.
- **P2-7. Tema do manifest PWA diverge do app**: `theme_color/background_color '#F4F7FB'` (claro) vs splash `#0B132B` (escuro, Obsidian) — flash de cor clara na instalação/PWA.

### P3 — Baixo / dívida técnica

- **P3-1. Três fontes de verdade para destinos de deep link** (`TAB_ROUTE_SET` TS, `VALID_TABS` Java, `validTabs` Swift) — comentário em `MainActivity.java:52-54` admite; falta teste de paridade automatizado.
- **P3-2. `UIRequiredDeviceCapabilities: armv7`** no `Info.plist` — armv7 é 32-bit legado; apps modernos exigem arm64. Pode restringir dispositivos iOS atuais ou ser ignorado, mas é ruído/erro de template.
- **P3-3. `allowBackup="true"`** no manifest Android sem regra de exclusão — dados do app (fila offline criptografada) entram no backup do Google; verificar se é desejado sob LGPD.
- **P3-4. iOS sem `UIBackgroundModes`** — se a gravação de áudio de campo precisar continuar com app em background (gravação longa de reunião), não há `audio` background mode declarado.
- **P3-5. `ios/App/CapApp-SPM` + `App.xcodeproj` coexistem** — projeto híbrido SPM/CocoaPods pode causar drift de build; validar qual é o caminho canônico.
- **P3-6. Nenhum teste instrumentado real**: `android/app/src/androidTest/.../ExampleInstrumentedTest.java` e `ExampleUnitTest.java` são templates padrão — zero cobertura nativa.

---

## Resumo executivo

O empacotamento Capacitor está **arquiteturalmente correto** (deep links reais, splash, cleartext isolado, chunk 3D com reduced-motion), mas tem **dois P0**: iOS crasha sem usage descriptions de câmera/mic e o "offline sync" anunciado é código morto não conectado a nenhuma rota. A maior dívida é a **divergência iOS/Android** (URL hardcoded morta no SceneDelegate, listas de tabs dessincronizadas) e a **ausência total de plugins Capacitor** que limita rede, push e storage nativo. Recomendo prioridade: (1) adicionar usage descriptions iOS, (2) decidir offline real vs. remover claims de marketing, (3) sincronizar `serverURL`/`validTabs` iOS com o config TS.
