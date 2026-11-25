# Run doc — Agente 84 (Pia) · DEM-20261123-001

- Runtime: Devin (subagente) · Windows · Clone: `C:/Github/Birthub-360`
- Worktree: `C:/Github/Birthub-360-worktrees/squads/squad-80/wt-84`
- Branch: `agente/84-deeplinks-s80` · Base: `integracao/onda-3-dem20261123` @ `5422d99c3e` (CONVERGIDA)
- Lease: `.agents/runs/leases/squad-80-wt84.lease` (portas 22800–22899)
- node_modules: junction → `C:\Github\Birthub-360\node_modules`
- Missão: corrigir parsers de deep link divergentes (handoff 80→84, bugs B1–B3) + testes + tsc.

## Setup executado

1. `git worktree add .../wt-84 -b agente/84-deeplinks-s80 integracao/onda-3-dem20261123` → HEAD `5422d99c3e`.
2. `mklink /J node_modules C:\Github\Birthub-360\node_modules` (junction ok).
3. Lease escrito em `.agents/runs/leases/squad-80-wt84.lease`.
4. Ownership verificado em `.agents/MATRIZ_PROPRIEDADE.md`: `src/mobile/deeplinks/**` → **84 Pia** (linha 124). Arquivos nativos (`android/**`, `ios/**`) e `src/lib/navigationBus.ts` NÃO foram editados (somente leitura/import).

## Bugs confirmados (evidência)

- **B1**: `handler.ts` testava `protocol === 'birthhub:'`; scheme real `birthhub360:` em
  `AndroidManifest.xml:43`, `Info.plist:41`, `MainActivity.java:134`, `SceneDelegate.swift:59`.
  → todo link custom retornava `/app` silenciosamente.
- **B2**: `ALLOWED_DEEP_LINK_HOSTS` (5 hosts fixos, rotas ad-hoc `/app/crm/leads`, `/app/voice-hub`)
  divergia dos ~46 VALID_TABS nativos → `/app/<tab>`.
- **B3**: handler sem call-site de produção — único import era `tests/unit/mobile/onda3MobileSquad80.test.ts`.

## Arquivos alterados/criados

- `src/mobile/deeplinks/handler.ts` — reescrito: scheme `birthhub360://<tab>` → `/app/<tab>`
  validado contra `ACTIVE_NAV_TABS` (fonte única, importada de `src/lib/navigationBus.ts`);
  App Links `http(s)://.../app/<tab>[/...]` com preservação de sub-rota quando o 1º segmento é
  tab válido; fallbacks `/app`; scheme legado `birthhub:` removido.
- `tests/unit/mobile/deeplinksHandler.test.ts` — **novo**, 12 testes (scheme, paridade de tabs,
  fallbacks, App Links, auth-gate do router, presença do scheme nos manifests).
- `tests/unit/mobile/onda3MobileSquad80.test.ts` — caso do Pia atualizado para o contrato real
  (App Link https com path profundo; antes usava `birthhub://leads/...` inexistente).
- `.agents/handoffs/squad-80/84-para-80-deeplinks-contrato-unificado.md` — handoff de resposta.
- `.agents/runs/leases/squad-80-wt84.lease` — lease da worktree.

## Decisão: handler dormente

Mantido como contrato-futuro corrigido (não deletado — é o único contrato TS do deep link).
Proposta de wiring futuro (`appUrlOpen` do Capacitor → `navigate()` + `handleIncomingDeepLink`)
documentada no handoff para o coordenador 80; depende de decisão de squad e de 81 (plugins).

## Comandos e resultados

- `npx vitest run -c vitest.unit.config.ts tests/unit/mobile tests/unit/navigation` → **28/28 pass** (6 arquivos).
- `npx tsc --noEmit` → **exit 0, sem erros**.
- Builds nativos não executados (sem JDK/Android SDK/Xcode no host Windows — bloqueio já conhecido
  do squad); nenhum arquivo nativo foi modificado.

## Pendências

- Wiring real do handler (call-site) — decisão do coord. 80; insumo de 81.
- `src/mobile/push/**` (FCM/APNS) continua inexistente — mocks apenas, conforme plano Frente A.
- Push notifications e Universal Links (assetlinks/AASA) dependem de infra (90/94) — fora do escopo.
