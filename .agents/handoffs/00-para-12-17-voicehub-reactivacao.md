# Handoff — Reativação VoiceHub/Telefonia (Onda F2)

De: 00 — Coordenador
Para: 12 (Voz e Telefonia) + 17 (Cadência) + 01 (gate/RLS) + 02 (nav)
Onda: F2
Status: em-andamento
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

## Resolução parcial (Agente 17 — 2026-11-12)

Parte do Agente 17 neste handoff:

- **Item 4 (decisão `dialer` → cadence): JÁ REGISTRADA E IMPLEMENTADA.** `/app/dialer` é alias de
  `/app/cadence` em `src/App.tsx` (`<Route path="dialer" element={<Navigate to="/app/cadence" replace />} />`,
  ~L460), com comentário explícito de que `/api/dialer-3cx/*` segue atrás do `legacyModuleGate`.
  Handoff anterior `17-para-02` sobre o redirect já consta como resolvido (ver histórico de commits
  `33a00b9ff`/`f423edf7b`/`29166b0a3`). Ou seja: o "Discador 3CX" como UI foi oficialmente cortado
  a favor de Cadências; reabrir o dialer 3CX é decisão do Agente 12, não pendência do 17.
- **Item 1 (isolamento por organização das rotas `/api/voice-hub/*`, `/api/outbound/*`,
  `/api/dialer-3cx/*`)**: os arquivos de voz são propriedade exclusiva do Agente 12
  (`src/features/voice-hub/AGENTS.md`). O Agente 17 não edita esses arquivos; a conclusão do
  isolamento depende do 12 (implementação) + 01 (gate/RLS) + 02 (nav). Nada no domínio de cadência
  bloqueia esse trabalho — o run de cadência já consulta `VoiceCallPort` via DI
  (`src/features/cadence/jobs/cadenceRun.worker.ts`), sem acoplamento às rotas gated.

Status mantido `em-andamento`: aguardando os demais destinatários (12/01/02). A parte do 17 está
encerrada com evidência acima.
