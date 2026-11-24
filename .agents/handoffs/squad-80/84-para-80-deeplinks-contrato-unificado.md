# Handoff 84 → 80 — Deep links: contrato unificado (resposta ao 80→84)

- De: Agente 84 — Pia (Squad 80) · Para: Agente 80 — Navi (Coord. Squad 80)
- Onda: DEM-20261123-001 · Status: resolvido-com-ressalvas · Prioridade: alto
- Branch: `agente/84-deeplinks-s80` · Worktree: `squads/squad-80/wt-84` · Base: `integracao/onda-3-dem20261123` @ `5422d99c3e`
- Responde a: `.agents/handoffs/squad-80/84-para-84-deeplink-parsers-divergentes.md`

## Bugs confirmados (evidência)

- **B1 confirmado**: `src/mobile/deeplinks/handler.ts` testava `parsed.protocol === 'birthhub:'`,
  mas o scheme real é `birthhub360:` — declarado em `android/app/src/main/AndroidManifest.xml:43`
  (`android:scheme="birthhub360"`), `ios/App/App/Info.plist:41` (CFBundleURLTypes) e consumido em
  `MainActivity.java:134` / `SceneDelegate.swift:59`. Todo link custom caía em `/app`.
- **B2 confirmado**: handler tinha `ALLOWED_DEEP_LINK_HOSTS` com 5 hosts fixos
  (leads/deals/tasks/inbox/voice → rotas ad-hoc como `/app/crm/leads`, `/app/voice-hub`) versus
  ~46 tabs dos VALID_TABS nativos (`MainActivity.java:57-67`, `SceneDelegate.swift:21-31`),
  espelhos de `ACTIVE_NAV_TABS` (`src/lib/navigationBus.ts:94`).
- **B3 confirmado**: `handler.ts`/`MobileDeepLinkRouter` só era importado por
  `tests/unit/mobile/onda3MobileSquad80.test.ts` — nenhum call-site de produção (grep em `src/**`).

## O que foi feito (cirúrgico, sem tocar nos parsers nativos 81/82)

- `src/mobile/deeplinks/handler.ts` reescrito para o contrato único:
  - `birthhub360://<tab>` → `/app/<tab>` para todo `ACTIVE_NAV_TABS`; host vazio/`dashboard` → `/app`;
    destino inválido ou tab oculto (`voice-hub`, `outbound`, `dialer`) → `/app` (nativo mostra
    diálogo; fallback seguro aqui, sem fingir sucesso).
  - `http(s)://<host>/app/<tab>[/...]` → preserva caminho profundo quando o 1º segmento é tab
    válido (React Router `/app/*` é a autoridade de sub-rotas); caso contrário `/app`.
  - Scheme legado `birthhub:` removido (nunca declarado em manifest algum).
  - Fonte de verdade: `ACTIVE_NAV_TABS` importado de `src/lib/navigationBus.ts` — paridade
    handler↔web garantida; handler↔nativo já é garantida pelos testes de paridade existentes
    (VALID_TABS ≡ ACTIVE_NAV_TABS em ambas plataformas).
- `tests/unit/mobile/deeplinksHandler.test.ts` (novo, 12 testes): cobre scheme, todos os tabs,
  fallback, App Links, router auth-gate e presença do scheme nos manifests.
- `tests/unit/mobile/onda3MobileSquad80.test.ts`: caso do Agente 84 atualizado — usava o scheme
  inexistente `birthhub://leads/...` e o contrato antigo de 5 hosts; agora exercita App Link
  `https://app.birthhub360.com.br/app/crm/leads/lead-889?tab=timeline` (mesma intenção:
  preservar destino pós-login).

## Decisão sobre o handler dormente (item 3 da missão)

**Proposta (não implementada — fora de escopo):** manter `MobileDeepLinkRouter` como contrato-futuro
correto e documentado, e abrir tarefa futura para conectá-lo a um call-site real: listener do evento
Capacitor `appUrlOpen` (`@capacitor/app`) dentro do webview, resolvendo para `navigate()` do React
Router e alimentando `handleIncomingDeepLink` no gate de auth. Isso depende de decisão do coordenador
(squad 80) sobre quando ativar deep links in-app e da posse do bridge (`src/mobile/plugins/**` = 81).
Alternativa rejeitada: deletar o handler — ele é o único contrato TS do deep link e a missão era
corrigi-lo, não removê-lo.

## Gates executados

- `npx vitest run -c vitest.unit.config.ts tests/unit/mobile tests/unit/navigation` → **28/28 pass**.
- `npx tsc --noEmit` → **limpo (exit 0)**.
- Builds nativos (gradle/xcodebuild) não executados — sem toolchain no host Windows (bloqueio já
  registrado no plano §2 do squad); nenhuma linha Java/Swift foi alterada, logo o risco é nulo.

## Pendências / handoffs

- **Para 81 Enzo** (plugins Capacitor): quando/quando não expor `appUrlOpen` ao web layer — insumo
  para a tarefa futura de wiring do `MobileDeepLinkRouter`.
- **Para 80 Navi**: registrar que `voice`/`voice-hub` não é destino de deep link (tab oculto); se
  produto quiser deep link para o Voice Hub, exige decisão sobre `NAV_HIDDEN_TABS` (dono: 02).
- Push/FCM-APNS segue sem implementação real (`src/mobile/push/**` inexistente) — mocks apenas,
  conforme plano Frente A item 1. Não bloqueia este handoff.
