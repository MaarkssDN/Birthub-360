# Handoff — Reativação VoiceHub/Telefonia (Onda F2)

De: 00 — Coordenador
Para: 12 (Voz e Telefonia) + 17 (Cadência) + 01 (gate/RLS) + 02 (nav)
Onda: F2
Status: aberto
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

## Resolução (Agente 12 — 2026-11-12, branch `agente/12-voicehub-reactivacao`)

Auditoria concluída — parecer **NO-GO** para abrir o gate. Bloqueio raiz:
voice-hub referencia models inexistentes no schema canônico (Tenant,
Membership, Role, Session do Better Auth vs. AgentSession, User.companyName,
TenantWebhookEndpoint vs. OrganizationWebhookEndpoint, Notification.message/
isRead) e tem JWT/registro de tenants paralelos ao Better Auth. `/api/outbound`
expõe banco legado sem auth em `campaigns.routes.ts` (handoff ao 05);
`/api/dialer-3cx` é app Express sem auth/tenant (handoff ao 17). Decisão de
adaptadores de identidade/schema escalada ao 01. Evidências e checklist
completo em `12-para-00-voicehub-tenancy-auditoria.md`; isolamento por tenant
nos services sãos congelado em `src/lib/voice-hub/__tests__/tenant-isolation.test.ts`
(36 testes verdes). Gate permanece fechado.
