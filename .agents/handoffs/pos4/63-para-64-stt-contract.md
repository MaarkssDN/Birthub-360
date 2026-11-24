# Handoff 63 → 64 — Contrato STT → Voice Command Router

- **De:** Agente 63 — Lira (STT e Diarização)
- **Para:** Agente 64 — Tito (Comandos de Voz)
- **Onda/POS:** POS4-63-STT (pos4)
- **Status:** aberto
- **Prioridade:** alto (desbloqueia a ponte STT→router)
- **Branch de origem:** `agente/63-stt-pos4` (worktree `wt-63-stt`)

## Problema

O router de comandos (`src/features/voice-hub/commands/voice-command-router.ts`)
consome `VoiceCommandRequest { transcript, actor }`, mas não existia contrato
canônico entre os motores de STT existentes e o router. Este handoff entrega o
contrato implementado e pronto para consumo.

## Artefato entregue

`src/features/voice-hub/transcription/sttTranscript.contract.ts` — módulo puro
(sem I/O, sem áudio real), testado em
`src/features/voice-hub/transcription/__tests__/sttTranscript.contract.test.ts` (12 testes).

## Contrato EXATO

### Evento canônico de saída do STT

```ts
interface SttTranscriptContext {
  sessionId: string;        // VoiceSession.sessionId ou callId — obrigatório, nunca vazio
  organizationId: string;   // tenant dono da sessão — obrigatório, nunca vazio
  userId: string;           // usuário autenticado da sessão de voz — obrigatório
}

interface SttTranscriptEvent extends SttTranscriptContext {
  transcript: string;       // texto já com trim; vazio é erro de contrato
  isFinal: boolean;         // true = final/despachável; false = interim (UI/sentimento)
  speaker?: 'AGENT' | 'CUSTOMER';  // só quando o motor diariza (whisper.worker)
  confidence?: number;      // 0..1, SOMENTE se o motor reportar — nunca fabricada
  startSec?: number;        // timestamps quando o motor reporta
  endSec?: number;
}
```

### API pública (todas exportadas do módulo acima)

- `createSttTranscriptEvent(context, input)` → `SttTranscriptEvent`
  Valida tenancy/sessão, trim do transcript, `isFinal` boolean e
  `confidence ∈ [0,1]`. Lança `SttTranscriptContractError` em qualquer violação.
- `isCommandDispatchable(event)` → `boolean`
  `true` somente quando `isFinal === true` e transcript não vazio.
- `toVoiceCommandRequest(event, role: VoiceActorRole)` → `VoiceCommandRequest`
  Produz exatamente `{ transcript, actor: { userId, organizationId, role } }`
  no formato que `processVoiceCommand` já consome. Lança
  `SttTranscriptContractError` para eventos não despacháveis (interim).
- `mapDiarizedUtterancesToEvents(utterances, context)` → `SttTranscriptEvent[]`
  Ponte batch: saída de `diarizeStereoAudioChannels` (whisper.worker.ts) vira
  eventos `isFinal=true` com `speaker`/`startSec`/`endSec`/`confidence`.
  Valida o contexto ANTES de iterar (falha rápido em tenant inválido).
- `SttTranscriptContractError extends Error` — erro de contrato, sempre
  propagado, nunca silenciado.

## Como o Agente 64 deve consumir

```ts
import {
  createSttTranscriptEvent,
  isCommandDispatchable,
  toVoiceCommandRequest,
} from '../transcription/sttTranscript.contract.js';

// Para cada resultado STT (Web Speech, adaptador nativo ou Whisper):
const event = createSttTranscriptEvent(
  { sessionId, organizationId, userId }, // do contexto autenticado da sessão
  { transcript, isFinal, speaker?, confidence? },
);

if (isCommandDispatchable(event)) {
  const request = toVoiceCommandRequest(event, actorRole); // role da sessão auth, NUNCA do texto
  const result = await router.processVoiceCommand(request);
}
```

Para saídas batch diarizadas: `mapDiarizedUtterancesToEvents(utterances, context)`
depois despachar cada evento via `toVoiceCommandRequest` (ordem já vem por
`startSec` do whisper.worker).

## Regras invioláveis do contrato

1. `role` do actor vem SEMPRE da sessão autenticada/RBAC — nunca do transcript.
2. Apenas `isFinal=true` gera comando; interim (`isFinal=false`) é para UI.
3. `organizationId`/`userId`/`sessionId` são obrigatórios — o router já faz
   binding de confirmação por (organizationId, userId); evento sem esses
   campos não pode existir.
4. `confidence` nunca é fabricada: se o motor não reporta, o campo fica ausente.
5. Erros de contrato propagam como exceção — não capturar e engolir.

## Fontes STT auditadas (estado atual)

| Fonte | Arquivo | Saída hoje | Ponte para o contrato |
|---|---|---|---|
| Web Speech API (navegador) | `useVoiceConversation.ts`, `VoiceCommandWidget.tsx` | `event.results[i].isFinal` + `transcript` | `createSttTranscriptEvent({transcript, isFinal})` por resultado |
| Adaptador nativo Capacitor | `src/lib/nativeSpeech.ts` | mesma interface `SpeechRecognitionLike` | idem |
| Whisper batch diarizado (estéreo) | `transcription/whisper.worker.ts` | `DiarizedUtterance[]` | `mapDiarizedUtterancesToEvents` |
| Whisper batch (copiloto-ia, fora do voice-hub) | `features/copiloto-ia/infra/whisperTranscription.service.ts` | `{text, durationSeconds, segments[]}` | normalizar para eventos via `createSttTranscriptEvent` (NÃO importar cross-feature — dependency-cruiser) |
| PII masking | `services/realtimeTranscription.service.ts`, `services/telephony/transcription.service.ts` | `sanitizedText`/`hasPii` | aplicar ANTES de persistir/logar; o router recebe o texto cru do evento — decisão de mascarar pré-router fica com o 64/12 |

## Defeito corrigido nesta entrega

`whisper.worker.ts`: `diarizeStereoAudioChannels` fabricava `confidence: 0.95`
quando o transcritor não informava confiança — dado inventado propagado como
real. Agora `DiarizedUtterance.confidence` é `number | undefined` e só é
preenchida quando o motor reporta. Teste da Squad 60 atualizado
(`tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts`) para provar
passthrough e descarte de segmento vazio.

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/transcription tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts` → 17/17 verde.
- Integração: emitir evento final → `toVoiceCommandRequest` →
  `router.processVoiceCommand` retorna status do router (unrecognized/ambiguous/
  executed conforme o texto).

## Contexto adicional

- `commands/**` (router, parser, guard) pertence ao Agente 64 — este handoff
  apenas consome os tipos exportados (`VoiceCommandRequest`, `VoiceActorRole`).
- Confirmations do router já fazem binding por (organizationId, userId) — o
  contrato garante que esses campos do evento são os mesmos do actor.
