# Handoff — Voice Hub: diagnóstico do 503 e o que falta fora do ownership do Agente 65

De: 65 — Lena (Voice Hub UI)
Para: 00 — Astra (Coordenador Global) — cc: 12 (Voz e Telefonia), 02 (Nav/Shell), 01 (Dados)
Onda: 3 (ONDA3-65-VOICE-HUB, demanda DEM-20261123-001)
Status: em-andamento (parcela do 65 concluída; reabertura do gate é decisão do 00)
Prioridade: alto
Branch: `agente/65-voice-hub-onda3` · Worktree: `wt-65-voice-hub`

## Diagnóstico do 503 (causa-raiz)

O 503 que o Voice Hub exibia **não é um bug de UI nem um endpoint quebrado** — é o
`legacyModuleGate` fail-closed funcionando como projetado:

- `src/bootstrap/routes.ts:211` monta `/api/voice-hub` em
  `unavailableLegacyModule('voice-hub')` (`src/bootstrap/legacyModuleGate.ts`),
  que responde `503 { code: 'MODULE_NOT_READY' }` para **qualquer** path.
- O router real `src/lib/voice-hub/routes/index.ts` **não é importado em lugar
  nenhum** do bootstrap — mesmo que o gate abrisse, nada responderia.
- Motivo do NO-GO original: auditoria de tenancy do Agente 12
  (`.agents/handoffs/12-para-00-voicehub-tenancy-auditoria.md`) — identidade
  paralela (JWT próprio + `POST /auth/register` que criava tenants fora do Better
  Auth) e schema incompatível com os models canônicos.

## Estado atual na baseline (evidência)

- Adaptação aos models canônicos **entregue e aprovada**: PR #339, parecer
  APROVADO-COM-RESSALVAS do Agente 24
  (`.agents/handoffs/24-para-12-revisao-voicehub-adaptacao.md`, ressalva ACH-1
  corrigida em `bfc3d2e67`).
- Teste de integração RLS real **entregue e aprovado**: PR #384 + revisão do 24
  (PR #411) — `tests/integration/voice-hub-rls.test.ts` (10 testes, Postgres +
  FORCE RLS). Handoff `onda-3/00-para-12-voicehub-teste-integracao-rls.md` fechado.
- O que ainda trava a reabertura (decisão registrada do 00 em
  `00-para-12-17-voicehub-reactivacao.md` + nota em
  `24-para-12-revisao-voicehub-adaptacao.md`):
  1. deps `twilio` / `d3` / `openid-client` **não instaladas** (package.json é de
     outro agente — provável 14/00);
  2. decisão formal de mount: trocar `unavailableLegacyModule('voice-hub')` por
     `authenticateToken, requireTenant, <router src/lib/voice-hub/routes>` em
     `src/bootstrap/routes.ts` — arquivo de outro agente (02/00);
  3. verificar que `attachAuthIfPresent`/`getAuthUser` populam
     `requestContext.tenantId` (ressalva do handoff 01-para-12 — confirmar na
     revisão do 24 se já está coberto).

## O que o Agente 65 já corrigiu dentro do ownership (`src/features/voice-hub/**`)

- `pages/Results.tsx`: última tela do módulo que chamava o prefixo gated
  `/api/voice-hub/call-logs` — migrada para o endpoint canônico
  `GET /api/integrations/birth-voice/calls` (+ `/calls/:id` para transcrição sob
  demanda), via novos métodos `voiceHubApi.getVoiceCalls/getVoiceCall`. Bônus:
  removido o "sentimento" inventado — agora exibe o `outcome` real classificado.
- `components/VoiceHubView.tsx` (`/app/voice-hub`, rota ativa): já usava apenas
  endpoints canônicos (`birth-voice`, `3cx`, `cadence`); feedback transitório
  convertido de `role="alert"` inline para `toast.*` global (padrão do app).
- A11y: `scope="col"` nas tabelas de Telephony/Analytics/overviewSections/
  ComparisonTable; ícones Check/X da ComparisonTable com `role="img"` +
  `aria-label` Sim/Não.

## O que NÃO foi possível corrigir dentro do ownership (pedido ao 00)

1. **Reabrir `/api/voice-hub/*`**: exige editar `src/bootstrap/routes.ts` (trocar o
   gate pelo router real) + instalar as 3 deps acima + parecer do 24 sobre o
   mount final. Sem isso, as superfícies do studio (`/api/voice-hub/workflow*` em
   `store/workflowPersistence.ts` e `store/studioServerActions.ts`) continuarão
   503 — elas já degradam com honestidade (loadState/saveState 'error', log de
   simulação, nada fabricado), então não há urgência funcional, mas o Voice
   Studio não persiste nada enquanto o gate estiver fechado.
   **Nota**: não existe backend canônico equivalente a `workflow*` fora de
   `src/lib/voice-hub` — a alternativa "só apontar o front para endpoints
   canônicos" não se aplica ao studio; a decisão é montar o router adaptado ou
   construir API canônica nova (escopo do 12/20).
2. **Outras páginas legadas do dashboard** (`pages/Dashboard/Overview.tsx`,
   `Results.tsx`, `Telephony.tsx` etc.) chamam prefixos **não montados**
   (`/api/call-logs`, `/api/agents`, `/api/ready`, `/api/metrics`,
   `/api/onboarding`, `/api/ai/*`, `/api/generate-music`) — 404, não 503. Essas
   páginas não têm rota registrada no AppLayout (só `VoiceHubView` e
   `LandingInnovative` estão montadas), então são código órfão: recomendo
   decisão do 00/65 futura sobre aposentar ou religar — não editei por serem
   fora do caminho crítico e para não duplicar o que o commit 60d521224 já
   saneou.
3. `NAV_HIDDEN_TABS` (`src/components/layout/tabMeta.ts:261`) mantém 'voice-hub'
   oculto — remoção é do Agente 02 **depois** do GO do backend (handoff
   17→02 já prevê isso).

## Teste esperado para fechamento

- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub` → verde.
- Após o mount: `GET /api/voice-hub/workflow` responde por tenant e nega
  cross-tenant (o teste `tests/integration/voice-hub-rls.test.ts` já cobre os
  repositories; falta o mesmo para as rotas HTTP se o 24 exigir).
