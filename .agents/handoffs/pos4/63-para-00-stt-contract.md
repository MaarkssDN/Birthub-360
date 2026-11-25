# Handoff 63 → 00 — POS4-63-STT concluído (contrato STT→router)

- **De:** Agente 63 — Lira (STT e Diarização)
- **Para:** Agente 00 — Coordenador
- **Onda/POS:** POS4-63-STT (pos4)
- **Status:** aberto (aguardando auditoria independente — Agente 09/Silas)
- **Prioridade:** normal
- **Branch:** `agente/63-stt-pos4` (worktree `wt-63-stt`, base 9f80c07ed)

## Resumo da entrega

Missão: auditar o pipeline STT do voice hub, definir/normalizar o contrato de
saída para a ponte STT→router de comandos (consumo pelo Agente 64) e corrigir
defeitos comprovados nos arquivos de transcrição/STT.

### Arquivos alterados/criados

1. `src/features/voice-hub/transcription/sttTranscript.contract.ts` (NOVO)
   Contrato canônico `SttTranscriptEvent` + factory validada
   (`createSttTranscriptEvent`), gate de despacho (`isCommandDispatchable`),
   conversão para `VoiceCommandRequest` (`toVoiceCommandRequest`) e mapper
   batch (`mapDiarizedUtterancesToEvents`). Módulo puro, sem I/O.
2. `src/features/voice-hub/transcription/__tests__/sttTranscript.contract.test.ts` (NOVO)
   12 testes: normalização, rejeição de contexto incompleto, transcript vazio,
   confidence fora de [0,1], interim não despachável, mapeamento diarizado.
3. `src/features/voice-hub/transcription/whisper.worker.ts` (CORRIGIDO)
   `confidence` não é mais fabricada (`?? 0.95` removido); campo agora
   opcional e propagado somente quando o transcritor reporta.
4. `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts` (ATUALIZADO)
   Expectativas do teste de diarização alinhadas ao novo contrato de
   confidence + cobertura de descarte de segmento vazio.
5. `.agents/handoffs/pos4/63-para-64-stt-contract.md` (NOVO)
   Contrato EXATO documentado para o Agente 64.

### Auditoria do pipeline STT (achados)

- **Web Speech / nativo:** `useVoiceConversation.ts` e
  `src/lib/nativeSpeech.ts` emitem `isFinal` corretamente; `VoiceCommandWidget`
  (src/components/ui) consome `event.results` direto — legado de navegação,
  não reativado (fora de escopo, dono UI).
- **Batch diarizado:** `whisper.worker.ts` (PCM estéreo → AGENT/CUSTOMER com
  timestamps) — sem emissor de eventos; a ponte é o mapper entregue.
- **Whisper batch copiloto-ia:** `features/copiloto-ia/infra/whisperTranscription.service.ts`
  pertence a outro módulo (AGENTS.md próprio) — auditado, NÃO editado;
  documentado no handoff para o 64 (consumo via porta/contrato, sem import
  cross-feature).
- **PII:** `realtimeTranscription.service.ts` e
  `services/telephony/transcription.service.ts` fazem mascaramento em voo/
  persistência — mantidos; decisão de mascarar antes do router fica com 64/12.
- **Erros:** engines propagam exceções (Whisper lança erro HTTP; worker lança
  em tenantId/callId ausente) — sem erro silencioso encontrado nos arquivos
  auditados.

### Gates executados

- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/transcription tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts` → **17/17 verde**.
- `npx tsc --noEmit` → em execução no momento do fechamento (resultado reportado
  na resposta final / run).

### Pendências / handoffs abertos

- `63-para-64-stt-contract.md` — contrato pronto para o Agente 64 implementar
  o consumo STT→`processVoiceCommand`.
- Auditoria independente obrigatória (Agente 09) antes de integrar.

### SHAs

- A preencher após commit local (ver resposta final do agente).
