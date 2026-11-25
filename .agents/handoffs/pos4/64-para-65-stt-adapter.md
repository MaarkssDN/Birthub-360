# Handoff 64 → 65 — Adapter STT → Voice Command Router pronto para consumo

- **De:** Agente 64 — Tito (Comandos de Voz e Ações)
- **Para:** Agente 65 — Lena (Voice Hub UI)
- **Onda/POS:** POS4-64-STT-WIRE (pos4)
- **Status:** resolvido — aguardando integração de branches
- **Prioridade:** alto (último quilômetro do pipeline B-07)
- **Branch:** `agente/64-stt-cmd-pos4` (worktree `wt-64-stt-cmd`)

## O que foi entregue

`src/features/voice-hub/commands/stt-adapter.ts` — adapter que recebe o
resultado FINAL de transcrição STT e o conecta ao
`createVoiceCommandRouter` da Onda 4, preservando todos os contratos
aprovados (tenant, autorização, confirmação TTL/uso-único, real vs simulação).

API pública:

```ts
import {
  createSttVoiceCommandAdapter,
  createDomainVoiceCommandExecutors,
} from './stt-adapter.js'; // ou caminho relativo do consumidor

const adapter = createSttVoiceCommandAdapter({
  executors: createDomainVoiceCommandExecutors(), // ou registry injetado
});

// Fluxo de voz:
const result = await adapter.handleTranscript({
  stt,                    // resultado bruto do STT (ver contrato abaixo)
  session,                // req.user / {user} do better-auth — OBRIGATÓRIO
  commandId?,             // opcional, para correlação
});
// result.status: 'executed' | 'failed' | 'needs_confirmation' |
//   'confirmation_cancelled' | 'confirmation_expired' | 'confirmation_denied' |
//   'denied' | 'ambiguous' | 'incomplete' | 'unrecognized' |
//   'executor_not_bound' | 'stt_interim' | 'stt_empty' | 'actor_unauthenticated'

// Confirmação via UI (botão) ou intent mapeada:
await adapter.handleConfirmationDecision({
  confirmationId: result.confirmationId,
  decision: 'confirm' | 'cancel',
  session,                // MESMA sessão do usuário que originou o comando
});
```

## Contrato de entrada `stt` (tolerante)

O adapter aceita, sem import do módulo do Agente 63:

| Shape | Origem |
|---|---|
| `SttTranscriptEvent` canônico do 63 (`{transcript, isFinal, sessionId, organizationId, userId, ...}`) | `transcription/sttTranscript.contract.ts` (branch `agente/63-stt-pos4`) |
| `{transcript, isFinal}` / `{text}` / `{finalTranscript}` | Whisper, serviços server-side |
| `{results: [...]}` | Web Speech API (`event.results[i].isFinal` + `transcript`) |
| `{segments: [{text}]}` | Whisper batch diarizado |
| string pura | atalhos/testes |

**Regra de tenancy (decisão deliberada):** `organizationId`/`userId` no payload
STT são SEMPRE ignorados para autorização. O ator vem exclusivamente de
`session` (resolvido no servidor). Divergência gera WARN de auditoria —
nunca troca de tenant. Isso é defesa em profundidade sobre o contrato do 63,
que já popula esses campos a partir da sessão.

## Como a UI deve tratar os status

- `stt_interim` / `stt_empty`: não mostrar como erro — interim é normal;
  empty pede nova tentativa ou fallback para texto.
- `needs_confirmation`: exibir `confirmationId` + `expiresAt` e chamar
  `handleConfirmationDecision` no confirm/cancel — NÃO reenviar transcript.
- `ambiguous`: listar `candidates` para o usuário escolher.
- `incomplete`: mostrar `missingSlots` (ex.: "informe data/hora").
- `denied` / `confirmation_denied`: mostrar `reason` (permissão/tenant).
- `executor_not_bound`: honesto — comando reconhecido mas sem executor real
  vinculado (ver pendências abaixo).
- `executed`: `execution.confirmed === true` e `committedAt` presente —
  SÓ então anunciar sucesso ao usuário.
- `failed`: `execution.error` explica; NUNCA anunciar sucesso.

## Pendências de binding de executores (handoff 64→00/04)

`createDomainVoiceCommandExecutors()` vincula SOMENTE `create_lead`
(via `container.resolve('LeadUseCases')` — registrado em
`src/shared/di/setup.ts:224`). Os demais tipos retornam
`executor_not_bound` honestamente até haver binding:

- `update_deal_stage`: `DealsService` exige `expectedVersion` (optimistic
  lock) + mapeamento stage-name→stageId.
- `schedule_meeting`: exige leadId, e-mails e janela; criar evento em Google
  Calendar seria ação externa real (proibida nesta fase).
- `log_activity`: `ActivityUseCases.createActivity` exige `leadId`; parser
  emite `dealId`.
- `generic_action`: sem domínio executável.

Para testes/preview, injete `executors` mockados via
`createSttVoiceCommandAdapter({ executors })` — registry é
`Partial<Record<VoiceCommandType, DatabaseMutationRunner>>`.

## Verificação

- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/commands` → 49/49 verde (29 adapter + 20 router).
- `npx tsc --noEmit` → limpo.
