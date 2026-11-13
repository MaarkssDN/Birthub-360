# Handoff — Reativação VoiceHub/Telefonia (Onda F2)

De: 00 — Coordenador
Para: 12 (Voz e Telefonia) + 17 (Cadência) + 01 (gate/RLS) + 02 (nav)
Onda: F2
Status: em-andamento (parcela do Agente 12 verificada/concluída em 2026-11-12 — itens 2 e 3 seguem com Agentes 01 e 02)
Prioridade: alto
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §3.1, §6

## Problema

`voice-hub`, `outbound`, `dialer` estão atrás de `legacyModuleGate` →
503 `MODULE_NOT_READY` intencional (handoff 17→12), ocultos em
`NAV_HIDDEN_TABS` (`src/components/layout/tabMeta.ts` L248). O Documento
Mestre V4.1 prevê VoiceHub WebRTC, CallRecording (retenção 90d
criptografada), WhatsAppMessage, ScheduledMeeting no MOD-08.

## Evidência

- `src/features/voice-hub/**` tem 113 arquivos e 43 com chamadas de API —
  a base existe, está desligada por gate.
- `src/features/mobile/server/mobileFieldMeeting.*` e mesa-tratamento
  seguem ativos.

## Alteração necessária

1. 12/17: concluir isolamento por organização das rotas de voz
   (`/api/voice-hub/*`, `/api/outbound/*`, `/api/dialer-3cx/*`).
2. 01: validar RLS/tenancy nos novos endpoints antes de abrir o gate.
3. 02: remover tabs de `NAV_HIDDEN_TABS` e reexpor destinos no painel
   contextual do P08 quando o backend responder 200.
4. Registrar decisão sobre `dialer` (alias → cadence) — confirmar se o
   discador 3CX entra no escopo ou é cortado oficialmente.

## Teste esperado

- Integração: endpoints de voz respondem por tenant autorizado e negam
  cross-tenant.
- E2E: aba Voice Hub visível e funcional em tenant habilitado.

## Fora de escopo

- Reescrever voice-hub; mexer em Capacitor/M10.

## Resolução — Agente 12 (2026-11-12, branch `agente/12-voz-handoffs`, base `origin/main` @ 0b52894e0)

**Item 1 (12/17 — isolamento por organização das rotas de voz): verificado como já implementado em main.**

- As rotas reais de voz NÃO estão atrás do gate: `src/bootstrap/routes.ts` monta
  `/api/integrations/birth-voice` e `/api/integrations/3cx` com `authenticateToken` + `requireTenant`
  (o frontend `voice-hub/api/voiceHub.api.ts` consome exatamente esses paths).
- Todo handler escopa por `organizationId` do usuário autenticado:
  `birthVoice.routes.ts` (conexões L165-210, supressões L103-146, call-logs L225-286) e
  `threecx.routes.ts` (L98-160). Webhook de resultado isola o segredo por conexão/org —
  coberto por `birthVoice.webhook.test.ts` (suíte ACH-06-01: rejeita segredo cross-tenant,
  replay, timestamp stale, 503 fail-closed sem segredo).
- As rotas legadas `/api/voice-hub`, `/api/outbound`, `/api/dialer-3cx` continuam atrás de
  `unavailableLegacyModule` → 503 `MODULE_NOT_READY` **intencional** até o item 2 (Agente 01).

**Item 4 (decisão sobre `dialer`): registrada.**
`dialer` é alias de UI para `cadence` — `NAV_TAB_ALIASES = { dialer: 'cadence' }`
(`src/components/layout/tabMeta.ts`, arquivo do Agente 02). Decisão do Agente 12: o discador
3CX (`/api/dialer-3cx`) permanece **cortado oficialmente** — nenhuma rota nova será criada;
a capacidade de discagem vive em `birth-voice`/`threecx` + cadência do Agente 17. Se o 00 decidir
reabrir o módulo, o caminho é novo router tenant-scoped, não reativação do legado.

**Pendente neste handoff (outros donos):**
- Item 2 → Agente 01: validar RLS/tenancy antes de abrir o gate.
- Item 3 → Agente 02: remover tabs de `NAV_HIDDEN_TABS` quando o backend responder 200.
