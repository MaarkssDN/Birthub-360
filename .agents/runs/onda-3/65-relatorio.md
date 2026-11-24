# Relatório — ONDA3-65-VOICE-HUB (Agente 65 — Lena)

- **MISSÃO**: ONDA3-65-VOICE-HUB (DEMAND DEM-20261123-001, Onda 3)
- **AGENTE**: 65 — Lena (Voice Hub UI e Landing Inovadora)
- **BRANCH**: `agente/65-voice-hub-onda3`
- **WORKTREE**: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-65-voice-hub`
- **SHA INICIAL**: `32d07c375` (baseline; HEAD de partida já continha `60d521224`, commit prévio do próprio 65 nesta onda)
- **SHA ATUAL**: `5c6093033` (+ handoff/run não commitados abaixo)

## STATUS: em-andamento (entregas do escopo concluídas; reabertura do gate é decisão do Agente 00 — ver handoff)

## RESULTADO

1. **Diagnóstico 503 — causa-raiz encontrada e documentada**: o 503 é o
   `legacyModuleGate` fail-closed (`src/bootstrap/routes.ts:211` →
   `unavailableLegacyModule('voice-hub')`); o router real
   `src/lib/voice-hub/routes/index.ts` nunca é montado. Não é bug de UI.
   Correção definitiva exige arquivos fora do ownership (routes.ts, package.json)
   → handoff `65-para-00-voicehub-503-gate.md` com checklist do que falta
   (deps twilio/d3/openid-client + decisão de mount + confirmação do 24).
   Dentro do ownership, eliminei o último caller user-facing do prefixo gated
   que tinha equivalente canônico: `pages/Results.tsx` migrado para
   `/api/integrations/birth-voice/calls` (+ `/calls/:id` p/ transcrição).
2. **Acessibilidade**: feedback transitório do VoiceHubView convertido de
   `role="alert"` inline para `toast.*` global (padrão do app); `scope="col"`
   adicionado a todas as `<th>` das tabelas do módulo; ícones Check/X da
   ComparisonTable com `role="img"` + `aria-label` (Sim/Não).
3. **Teste integração RLS**: já existia e foi aprovado nesta baseline
   (`tests/integration/voice-hub-rls.test.ts`, PRs #384/#411) — nenhuma ação
   necessária; RLS não foi enfraquecido.
4. **Bônus honesto**: removido o "Score Positivo/Neutro" fabricado da página
   Results — agora "Conversas Realizadas" derivado do `outcome` real
   classificado (`completed` = conversa confirmada).

## ARQUIVOS ALTERADOS

- `src/features/voice-hub/pages/Results.tsx` — migração p/ endpoint canônico,
  outcome real, transcrição lazy, métricas honestas.
- `src/features/voice-hub/api/voiceHub.api.ts` — `getVoiceCalls`/`getVoiceCall`
  (committed em `60d521224` junto com saneamento prévio do 65).
- `src/features/voice-hub/components/VoiceHubView.tsx` — toast global.
- `src/features/voice-hub/components/landing/ComparisonTable.tsx` — scope/aria.
- `src/features/voice-hub/pages/Dashboard/{Telephony,Analytics,overviewSections}.tsx` — scope="col".
- `tests/unit/features/voice-hub/voiceHubFlow.unit.test.tsx` — +2 testes API,
  asserts de toast.
- `tests/integration/features/voice-hub/voiceHubFlow.integration.test.tsx` — asserts de toast.
- `.agents/handoffs/onda-3/65-para-00-voicehub-503-gate.md` — handoff (novo).

## TESTES EXECUTADOS / APROVADOS / FALHOS

- `npx vitest run -c vitest.unit.config.ts tests/unit/features/voice-hub/voiceHubFlow.unit.test.tsx tests/unit/features/voice-hub-module-not-ready.test.ts` → **13/13 verdes**.
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub` → **30 arquivos, 266/266 testes verdes**.
- `npx vitest run -c vitest.integration.config.ts tests/integration/features/voice-hub/voiceHubFlow.integration.test.tsx` → **9/9 verdes** (projeto integration-ui/jsdom).
- `npx tsc --noEmit` (typecheck completo) → **exit 0**.
- `npx biome lint <arquivos alterados>` → 0 erros, 3 warnings **pré-existentes**
  (useMediaCaption no `<audio>` da Telephony; useSemanticElements no
  `role="button"` da lista de Results; exhaustive-deps do `reloadToken` — todos
  já existiam antes das minhas alterações).
- `tests/integration/voice-hub-rls.test.ts` → **não executado** (requer Postgres
  de teste/Docker indisponível neste worktree); spec já aprovado em PR anterior.

## EVIDÊNCIAS

- Commits locais: `34c85d44c` (Results→endpoint canônico), `bbd2a36b2`
  (alert→toast + testes), `5c6093033` (a11y tabelas). HEAD anterior `60d521224`
  (entrega prévia do 65 nesta onda: landing + honestidade de carga).
- Causa-raiz 503: `src/bootstrap/routes.ts:211`,
  `src/bootstrap/legacyModuleGate.ts:8-13`, handoff
  `12-para-00-voicehub-tenancy-auditoria.md` (NO-GO original).

## DEPENDÊNCIAS

- Reabertura do `/api/voice-hub/*`: Agente 00 (decisão) + 02/00 (routes.ts) +
  quem instalar deps (`package.json`) + revisão 24 do mount final.
- `NAV_HIDDEN_TABS`: Agente 02 após GO do backend.
- Studio workflow (`/api/voice-hub/workflow*`): não existe backend canônico —
  ou monta o router adaptado de `src/lib/voice-hub` ou o 12/20 constroem API
  canônica (decisão do 00).

## BLOQUEIOS

- Sem Docker/`.env.test` funcional neste worktree → teste RLS de integração não
  re-executado (já aprovado; spec intacto).
- Handoffs citados na missão com nomes
  (`00-para-02-12-voicehub-503-fallback-dashboard.md`,
  `00-para-12-tablevoicehub-aria-incompleto.md`,
  `00-para-12-voicehubview-alert-para-toast.md`, `ADR-014`) **não existem nesta
  baseline** — interpretei as pendências a partir do código real (503 gate,
  tabelas sem scope, alert inline→toast) e registrei o diagnóstico equivalente.

## SOLICITAÇÃO AO AGENTE 00

1. Decidir a reabertura do `legacyModuleGate` para `voice-hub` (pré-requisitos
   listados no handoff `65-para-00-voicehub-503-gate.md`).
2. Atribuir instalação de `twilio`/`d3`/`openid-client` e a edição de
   `src/bootstrap/routes.ts` aos donos corretos.
3. Decidir o destino das páginas legadas do dashboard voice-hub que chamam
   prefixos não montados (`/api/call-logs`, `/api/ready`, `/api/metrics`,
   `/api/onboarding`, `/api/ai/*`, `/api/generate-music`) — hoje código órfão
   (sem rota), mantido intacto por ser fail-closed.
