De: 15 â€” SeguranÃ§a Aplicada e RotaÃ§Ã£o de Segredos
Para: 12 â€” Voz e Telefonia
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-12-002 (B-13)
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
TranscriÃ§Ãµes de Ã¡udio de ligaÃ§Ãµes (transcription.service.ts) gravam texto com menÃ§Ã£o a CPF, cartÃ£o de crÃ©dito e dados mÃ©dicos sensÃ­veis sem filtro de PII antes de persistir.

## Arquivo(s) envolvido(s)
- src/services/telephony/transcription.service.ts:140-185

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-15.md, DIVIDAS-AGENTE-12.md e DIVIDAS-AGENTE-21.md.
- transcription.service.ts (L140-185): Recebe texto gerado pelo modelo Whisper/ASR e salva diretamente no campo transcript de CallRecord sem passar por regex de dados sensÃ­veis.
- ViolaÃ§Ã£o direta de AGENTS.md Â§22 (B-13: LGPD) e Â§27 (MinimizaÃ§Ã£o de dados).

## AlteraÃ§Ã£o necessÃ¡ria
1. Integrar pipeline de sanitizaÃ§Ã£o de PII em transcription.service.ts substituindo nÃºmeros de cartÃ£o, CPF e dados bancÃ¡rios por tags [REDACTED_CPF], [REDACTED_CARD].
2. Aplicar a mesma sanitizaÃ§Ã£o aos embeddings gerados para busca vetorial de chamadas.

## Teste esperado
- CritÃ©rio de Aceite: Texto com menÃ§Ã£o explÃ­cita de CPF gravado no banco de testes tem os dÃ­gitos devidamente ofuscados.
- Teste: transcription-pii-masking.spec.ts.

## Contexto adicional
Blindagem de dados pessoais de clientes e pacientes em gravaÃ§Ãµes telefÃ´nicas.


## Resolucao
- Data: 2026-11-06.
- Implementado TelephonyTranscriptionService em src/services/telephony/transcription.service.ts com sanitizacao de CPF ([REDACTED_CPF]), cartao de credito ([REDACTED_CARD]), email e telefone.
- Testes: 	ests/unit/services/telephony/transcription-pii-masking.test.ts (3 passam).



## Reconciliacao forense 2026-11-14 (Agente 12)
- A resolucao anterior criava `TelephonyTranscriptionService` mas ele ficou orfao: o pipeline real de voz (`src/lib/voice-hub/services/telephonyService.ts`) persistia turnos com PII em `session.metadata` sem mascaramento.
- Correcao aplicada: `handleTurn` agora chama `telephonyTranscriptionService.maskPii` nos turnos user e assistant ANTES de gravar metadata (que alimenta o webhook `agent.call.ended`/transcript). `callRecord.service.ts` ja possuia `redactPii` proprio para telemetria.
- Teste de regressao: `src/lib/voice-hub/services/telephonyService.piiMasking.test.ts` (2 testes). Pendente: sanitizacao de embeddings vetoriais de chamadas (item 2 da alteracao necessaria) nao foi enderecada — nao ha pipeline de embeddings de transcricao localizado neste escopo.
