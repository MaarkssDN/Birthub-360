# Run — Agente 02: Saneamento UX, hotspots e auditoria da landing

- **Agente:** 02 — Produto e UX
- **Data:** 2026-11-12
- **Branch:** `agente/02-ux-saneamento` (worktree `agente-02-ux`, base `origin/main` pós-#237/#239/#240)
- **Escopo:** todos os handoffs abertos/em-andamento destinados ao 02

## Commits

| Commit | Escopo |
|---|---|
| `6b36e7110` | Remove `as any` de `tabMeta.ts` e `UniversalEcosystemPanel.tsx` (contrato `TabNavIcon`) |
| `4c94148cf` | Extrai `CrmBoardToolbar.tsx` — CrmBoard.tsx 977→886 linhas |
| `2078c8b9b` | Extrai router `/app/*` para `AppLayout.tsx` — App.tsx 169 linhas |
| `510bce4bd` | Landing: bugs funcionais, dead code, mobile/a11y, copy honesto, form lead realista |

## Handoffs tratados

### Resolvidos
- `onda-paralela-8/00-para-02-asany-layout.md` — zero `as any` nos arquivos-alvo.
- `00-para-02-hotspot-pillar-settings.md` — 1235→663 linhas + `PillarToolsForms.tsx`; exceção removida.
- `onda-saneamento-20261110/...-src-app-tsx.md` — router extraído; **pendente revisão 24**.
- `onda-saneamento-20261110/...-crmboard-tsx.md` — 886 linhas; **pendente revisão 24**.
- `onda-saneamento-20261110/...-notificacao-broadcast.md` — semântica por-usuário confirmada + 14 testes.
- `onda-landing-360-auditoria/auditoria-para-02-bugs-funcionais.md`
- `onda-landing-360-auditoria/auditoria-para-02-limpeza-deadcode.md`
- `onda-landing-360-auditoria/auditoria-para-02-ux-mobile-a11y.md`
- `onda-landing-360-auditoria/01-para-02-sticky-bar-zindex.md` — status→resolvido.

### Em andamento (bloqueio externo / decisão pendente)
- `auditoria-para-02-form-lead-fake.md` — POST `/api/public/demo-requests` implementado com falha observável; **endpoint pendente do Agente 01** e validação LGPD do consent pendente do Agente 21.
- `auditoria-para-02-verdade-no-copy.md` — métricas/depoimentos rotulados ilustrativos e claims suavizados; **pendente decisão comercial** (certificações, "20+ agentes", depoimentos nominados).
- `00-para-12-17-voicehub-reactivacao.md` — navegação segue oculta até 12/17 (backend) + 01 (tenancy/RLS).
- `00-para-17-07-orquestracao-sem-demo.md` — nota 02 registrada; execução com 17/07/08.
- `00-para-01-02-settings-pilares-persistentes.md` — lado UI íntegro; aguarda e2e (08) e revisão 24.
- `15-para-02-03-sonar-new-coverage.md` — cobertura do form de lead adicionada; quality gate com 08.

## Gates executados

- `npx tsc --noEmit` ✅
- `npm run check:hotspots` ✅ — 1898 arquivos, 0 acima de 1000 sem exceção válida
- Biome (`biome check --write` nos arquivos tocados) ✅ — restam apenas warnings pré-existentes
- `npm run build` ✅ (inclui verify:pwa-precache)
- Vitest focado: `tests/unit/features/landing/**` + `tests/unit/components/layout/**` + `notification-service.test.ts` — **todos verdes** (Landing360 11/11, Impeccable 14/14, notification 14/14, layout/nav 45+)
- Verificação visual 375px: recomendada via dev server no PR (não executada nesta sessão)

## Riscos / pendências para o orquestrador

1. `Landing360.tsx` ficou com ~3478/3500 linhas (exceção vigente até 2026-11-30, dono Marks-Mah) — margem de ~22 linhas; próximo crescimento deve acionar split.
2. Revisão formal do Agente 24 pendente para AppLayout/CrmBoard (condição de fechamento dos handoffs de saneamento).
3. Endpoint `/api/public/demo-requests` não existe — form falha observavelmente até o 01 entregar o contrato.
4. `Landing360Impeccable.tsx` mantido (testes/E2E ativos); remoção depende de decisão do dono/00.

## Remediação SonarQube — cobertura de código novo (PR #245, 2026-11-12)

**Problema:** Sonar reprovou o PR com cobertura em código novo = 21,9% (mínimo 80%).

**Ação:** suíte de testes unitários nova/estendida cobrindo os arquivos novos do diff, sem alterar código de produção e sem mocks que simulem integração real (handlers permanecem vi.fn() de fronteira de componente; fetch só mockado nos pontos de contrato HTTP já existentes).

**Testes adicionados:**
- `tests/unit/components/CrmBoardToolbar.test.tsx` (novo, 12 testes) — cobre 100% stmt/func/lines de `CrmBoardToolbar.tsx` (header, vitals, filtros, batch bar; branch 88,6%).
- `tests/unit/features/settings/PillarToolsForms.test.tsx` (novo, 9 testes) — cobre 100% stmt/branch/func/lines de `PillarToolsForms.tsx` (8 pilares + fallback, todos os setters disparados).
- `tests/unit/components/layout/AppLayout.test.tsx` (novo, 86 testes) — cobre ~99,4% de `AppLayout.tsx`: todas as ~65 rotas /app/* resolvidas com módulos lazy mockados por marcador, redirects (dialer/outbound/catch-all), gates RequireRole (negado p/ VISUALIZADOR, permitido p/ ADMIN), PageFallback, OnboardingTour on/off, onNavigate do CrmOverview.
- `tests/unit/features/landing/Landing360.test.tsx` (+5 testes) — nav mobile (toggle aria-expanded, fechamento por link), validações do lead form (sem consent LGPD, WhatsApp inválido → sem fetch), erro HTTP 500 observável + payload consentimentoLgpd/equipe/origem, footer (link /privacy + modal editorial), iteração dos 11 COMMAND_MODULES.

**Cobertura medida (vitest --coverage, arquivos-alvo):**
- `CrmBoardToolbar.tsx`: 100% stmts / 100% funcs / 100% lines (branch 88,6%)
- `PillarToolsForms.tsx`: 100% em todas as métricas
- `AppLayout.tsx`: 99,4% stmts / 100% branch / 99,2% funcs / ~100% lines (após cobrir onNavigate)
- `Landing360.tsx`: 81,6% stmts / 79,6% branch / 71,2% funcs / 83,1% lines (rodando só sua suíte; restante do diff já tinha cobertura prévia)

**Gates:** `npx tsc --noEmit` ✅ · vitest focado 123+ testes verdes ✅ · biome não cobre `tests/**` (config `includes: src/**`) — nenhum arquivo de `src/` alterado nesta remediação, logo `npm run build`/`lint` inalterados em relação ao gate anterior ✅.

**Observação:** sob `--coverage` (instrumentação v8), 2 testes de Landing360 ficaram lentos e falharam por timeout pontual; sem instrumentação a suíte passa 16/16 de forma estável — flake de ambiente de cobertura, não regressão.
