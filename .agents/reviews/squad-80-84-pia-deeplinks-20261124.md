# Parecer do Auditor Independente — Agente 09 (Silas)

- **Missão:** DEM-20261123-001 — Auditoria da entrega do Agente 84 (Pia, Squad 80 — deep links mobile, bug P0)
- **Data:** 2026-11-24
- **Objeto auditado:** branch `agente/84-deeplinks-s80`, SHA congelado `e373a760ad4773ba217d9342480c797c0531955a`
- **Base de diff:** `5422d99c3e` (merge-base real = pai direto do commit; diff = 1 commit)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-80/wt-84` (HEAD = SHA congelado, `git status` limpo)
- **Run doc:** `.agents/runs/squads/squad-80-run-84.md` · **Handoff:** `.agents/handoffs/squad-80/84-para-80-deeplinks-contrato-unificado.md` · **Bug original:** `.agents/handoffs/squad-80/84-para-84-deeplink-parsers-divergentes.md` (commit `43c92b43cc`, branch `coord/squad-80`)

## Veredito: APROVADO

Com pendências não bloqueantes registradas para o Agente 00 (ver §6).

## 1. Verificação dos bugs alegados (todos confirmados)

| Claim | Verificação | Resultado |
|---|---|---|
| **B1** — handler testava `protocol === 'birthhub:'` mas scheme real é `birthhub360:` | Diff base `5422d99c3e:src/mobile/deeplinks/handler.ts` linha ~24 confirma `'birthhub:'`. `android/app/src/main/AndroidManifest.xml` intent-filter `android:scheme="birthhub360"`; `ios/App/App/Info.plist` CFBundleURLSchemes `birthhub360`; `MainActivity.java` (`br/com/birthhub360/prospector/MainActivity.java`) e `SceneDelegate.swift:59` guardam `scheme == "birthhub360"` | **Confirmado** — todo link custom caía em `/app` silenciosamente |
| **B2** — `ALLOWED_DEEP_LINK_HOSTS` (5 fixos) divergia de ~46 VALID_TABS nativos | Base tinha mapa `leads/deals/tasks/inbox/voice` → rotas ad-hoc (`voice`→`/app/voice-hub`, que nem é tab válido). `VALID_TABS` Android e `validTabs` iOS listam ~55 entradas espelhando `ACTIVE_NAV_TABS` (`src/lib/navigationBus.ts:94`, `TAB_ROUTE_SET` menos `NAV_HIDDEN_TABS`) | **Confirmado** |
| **B3** — handler sem call-sites de produção | Grep em todo o worktree: `parseNativeDeepLinkToRoute`/`MobileDeepLinkRouter` só referenciados em `handler.ts` e `tests/unit/mobile/{deeplinksHandler,onda3MobileSquad80}.test.ts`; zero `appUrlOpen`/import em `src/` | **Confirmado** — código dormente |

## 2. Correção — análise

`src/mobile/deeplinks/handler.ts` reescrito (diff completo inspecionado):

- **Scheme custom:** `birthhub360://<tab>` → hostname lowercased; vazio/`dashboard` → `/app`; fora de `ACTIVE_NAV_TABS` → `/app` (fallback seguro, espelha o "nunca fingir navegação" do nativo, que mostra diálogo de erro — divergência documentada no JSDoc como diferença de plataforma aceitável). Path/query do scheme custom são ignorados — **idêntico ao nativo**, que só lê `url.host` (`SceneDelegate.swift:59-70`, `MainActivity.extractTab`). Correto.
- **App Links https/http:** `/app` → `/app`; `/app/<seg>` preserva sub-rota **somente** se o primeiro segmento for tab válido ou `dashboard`; demais → `/app`. Endurecimento intencional vs. base (que aceitava qualquer `pathname.startsWith('/app')`, incluindo `/application/...` — na verdade `/appX` também casava, falso-positivo eliminado). React Router (`/app/*` → `AppLayout`, `src/App.tsx:173`) segue autoridade das sub-rotas. Correto.
- **Fonte de verdade:** `ACTIVE_NAV_TABS` importado de `src/lib/navigationBus.ts` — arquivo **somente lido**, não editado. Paridade com VALID_TABS nativos já é garantida por `tests/unit/navigation/{android,ios}-valid-tabs-parity.test.ts` (executados nesta auditoria, verdes). Sem duplicação de lista — adere à regra de não-duplicação.
- **Regressão no parsing https:** analisados edge cases — `/app?query` perde o search (base preservava via `${pathname}${search}`); pathname não é lowercased (`/APP/crm` → `/app`). Ambos triviais e sem impacto prático (App Links canônicos são lowercase; query em `/app` nu é irrelevante). Registrado como observação, não bloqueio.
- **Scheme legado `birthhub://`:** removido — nunca foi declarado em manifest algum; teste trava isso explicitamente.

## 3. Ownership e escopo do diff

Diff `5422d99c3e..e373a760a` (6 arquivos, +297/−19):

- `src/mobile/deeplinks/handler.ts` — **propriedade do Agente 84** ✔
- `tests/unit/mobile/deeplinksHandler.test.ts` (novo, 12 testes), `tests/unit/mobile/onda3MobileSquad80.test.ts` (1 caso atualizado) — testes ✔
- `.agents/runs/...`, `.agents/handoffs/...`, `.agents/runs/leases/squad-80-wt84.lease` — docs/coordenação ✔

**Zero** toque em `navigationBus.ts`, `android/**`, `ios/**`, `capacitor.config.ts` ou qualquer arquivo de outro agente. Lease `squad-80-wt84.lease` confere escopo/branch/base. Sem secrets no diff (apenas código, docs e paths).

## 4. Execução de evidências no worktree (reproduzido nesta auditoria)

- `npx vitest run tests/unit/mobile tests/unit/navigation` → **6 arquivos, 28/28 testes passando** (12 novos do handler + paridade Android/iOS + demais mobile). Claim "28/28" **confirmado**.
- `npx tsc --noEmit` → **exit 0, limpo**. Claim confirmado.
- Builds nativos não executados — **irrelevante para este diff** (nenhum arquivo nativo alterado); bloqueio de toolchain permanece registrado como limitação ambiental conhecida.
- Worktree em HEAD = SHA congelado, working tree limpo — auditoria sobre o estado exato entregue.

## 5. Avaliação do handler sem call-site (pergunta da missão)

**Aceitável.** O handler já era dormente antes da mudança (B3) — o diff não introduz risco de runtime: nada o invoca. A entrega corrige o contrato documentado, adiciona 12 testes que travam paridade com manifests e com `ACTIVE_NAV_TABS`, e formaliza o wiring futuro (`appUrlOpen` → `MobileDeepLinkRouter`) em handoff para 80/81. Manter código dormente **corrigido e testado** é estritamente melhor que dormente divergente; o risco residual é o contrato evoluir sem o wiring — mitigado pelo handoff explícito.

## 6. Pendências para o Agente 00 (não bloqueantes)

- **P-1 (tracking):** agendar a tarefa de wiring `appUrlOpen` (`@capacitor/app`) → `navigate()` + `handleIncomingDeepLink` conforme proposta em `84-para-80-deeplinks-contrato-unificado.md` §"Proposta". Sem ela, deep links custom continuam tratados **só pelo nativo** (que já funciona corretamente) — o handler TS permanece contrato-futuro.
- **P-2 (opcional):** preservar `parsed.search` no branch `pathname === '/app'` e considerar `pathname.toLowerCase()` no branch https — polish de paridade, sem urgência.
- **P-3 (informativo):** builds Android/iOS seguem sem toolchain nesta onda — quando houver, validar `birthhub360://<tab>` ponta a ponta.

## 7. Conformidade

- Auditoria read-only sobre código de produção: nenhum arquivo de produção editado por este parecer.
- Escopo disjunto das demais instâncias Silas (24, 58, 48) — esta cobre exclusivamente a entrega do Agente 84.
- SHA auditado congelado e verificado: `e373a760ad4773ba217d9342480c797c0531955a`.

**Parecer emitido por:** Agente 09 — Silas · DEM-20261123-001 · 2026-11-24
