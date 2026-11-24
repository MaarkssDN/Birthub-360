# Handoff 80 → 84 — Deep links: parsers divergentes (P0)

- De: Agente 80 — Navi (Coord. Squad 80) · Para: Agente 84 — Pia
- Onda: DEM-20261123-001 · Status: aberto · Prioridade: alto
- Base: coord/squad-80 @ 93e82c220 (idêntico na linhagem Onda 4)

## Problema
Dois parsers de deep link com contratos incompatíveis:

1. **Nativo** (`android/.../MainActivity.java` VALID_TABS e `ios/App/App/SceneDelegate.swift`
   validTabs): ~46 destinos = ACTIVE_NAV_TABS; `birthhub360://<tab>` → `/app/<tab>`;
   desconhecido → diálogo nativo de erro. Paridade validada por
   `tests/unit/navigation/{android,ios}-valid-tabs-parity.test.ts`.
2. **Web/TS** (`src/mobile/deeplinks/handler.ts`, propriedade 84): `ALLOWED_DEEP_LINK_HOSTS`
   com apenas 5 hosts (leads/deals/tasks/inbox/voice) → rotas distintas
   (`voice` → `/app/voice-hub`, enquanto o nativo resolve `/app/voice`).

### Bugs concretos encontrados
- **B1**: `parseNativeDeepLinkToRoute` testa `parsed.protocol === 'birthhub:'`, mas o scheme
  real é `birthhub360:` (AndroidManifest/Info.plist) → todo deep link custom retorna '/app'
  silenciosamente.
- **B2**: divergência de destinos (5 vs ~46) e de mapeamento (`voice` → voice-hub vs voice).
- **B3**: `handler.ts`/`MobileDeepLinkRouter` não é importado por nenhum código de produção
  (só `tests/unit/mobile/onda3MobileSquad80.test.ts`) — código dormente com contrato divergente.

## Evidência
- `src/mobile/deeplinks/handler.ts:24-37` (protocol 'birthhub:' + ALLOWED_DEEP_LINK_HOSTS)
- `android/app/src/main/AndroidManifest.xml` intent-filter `android:scheme="birthhub360"`
- `MainActivity.java` VALID_TABS (~46 entradas)
- `SceneDelegate.swift` validTabs (mesma lista, comentário cita paridade)

## Alteração necessária
Unificar contrato: recomendo que o handler TS espelhe a mesma fonte de verdade dos VALID_TABS
(ou delegue ao React Router com `/app/<tab>`), corrija o scheme para `birthhub360:`, e cubra
com teste de paridade handler↔nativo. Push/FCM-APNS pode seguir em mocks (sem credenciais).
Ver plano: `.agents/runs/squads/squad-80-plano.md` §4 Frente A.
