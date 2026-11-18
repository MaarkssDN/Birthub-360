De:00
Para:12
Onda:forense20261020
Status: em-andamento
Prioridade:alto
Bloqueador-ref:auditoria-real-ondas00-05
Sprint destino:a definir pelo00

## Problema
F04-04 [P1] Chamadas, reuniões, assinatura e tarefa CRM simuladas como executadas

EXP-01 [P1] Bimodal Live é simulação sem transporte/provedor

EXP-07 [P1] Precisão conversacional não calculada integralmente

## Arquivo(s) envolvido(s)
src/features/ai-voice/server/autonomousSdr.service.ts:65
src/features/ai-voice/server/autonomousSdr.service.ts:139
src/features/proposals/services/proposalAutomation.service.ts:176
src/features/intelligence/agents/tactical/promiseGuardian.agent.ts:186

## Evidência
Base:82f848a39a7a45212956c1e949a8df28d8f946c9. Inspeção estática salvo comandos explicitamente reproduzidos; produto/API não presumidos testados.
F04-04: Resultado/IDs/URLs são construídos sem provider; Guardião aprova id inexistente fabricando compromisso e task UUID. Strings/logs alegam confirmação externa.

EXP-01: bimodalLiveVoice.service.ts:26-34,103-119,155; sem consumidor produtivo encontrado.

EXP-07: conversationalIntelligence.service.ts:65-94 soma turnos, fixa overlap0/confiança0.95.

## Alteração necessária
F04-04: Retornar simulação explícita ou exigir confirmação da porta real; teste negativo sem provedor nunca deve afirmar sucesso.

EXP-01: Implementar adaptador Live e medições de áudio reais; remover métricas demonstrativas do estado operacional.

EXP-07: Calcular união/interseção de intervalos e distinguir estimativa de medição; validar diarização com ground truth.

## Teste esperado
F04-04: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

EXP-01: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

EXP-07: Teste sintético positivo/negativo cobrindo a lacuna, persistência/reload, tenant cruzado quando aplicável; gate e parecer24.

## Contexto adicional
Missão atual somente auditoria; nenhuma correção autorizada por este handoff. Ver matriz335requisitos, relatórioHTML e parecer24. Revalidar contra main de destino, que foi alterada por outro processo durante a auditoria. Complexidade depende do proprietário; hipóteses não são causa operacional comprovada.

## Resolução

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — métricas/dados fabricados em ai-voice/proposals/promiseGuardian; billing e maskPii órfãos. Correção pendente de despacho. Ver RESULTADOS-RECONCILIACAO-20261114.md.

> Correção executada 2026-11-14 (Agente 12, branch `agente/12-reconciliacao-voz-simulada`, worktree `Birthub-360-wt-fix-12`) — abordagem "honestidade primeiro": nenhum dado fabricado é mais apresentado como real sem flag. Status sugerido: **em-andamento** (falta parecer do 24 e integrações reais continuam pendentes).
>
> **F04-04 — flags `simulated` adicionadas:**
> - `src/shared/contracts/autonomousSdr.contract.ts`: `simulated?: boolean` em `ScheduledMeetingProposal` e `SdrCallExecutionResult`.
> - `autonomousSdr.service.ts`: `simulated: true` no resultado da chamada fabricada (durationSeconds=195, notas, transcriptSnippet) e na `ScheduledMeetingProposal` (googleCalendarEventId/googleMeetLink UUIDs falsos, status 'confirmed'). Resultado de bloqueio por horário NÃO é marcado (política real).
> - `proposalAutomation.contract.ts` + `proposalAutomation.service.ts`: `digitalSignatureRef.simulated: true` — envelopeId/signatureUrl são UUIDs/URLs fabricados, sem Clicksign/DocuSign real.
> - `promiseGuardian.agent.ts`: `approveCommitment` agora retorna `simulated: true` (crmTaskId é UUID local, nunca tarefa CRM real) e loga WARN quando o compromisso não existe no store (antes fabricava compromisso fantasma silenciosamente).
>
> **EXP-01 — bimodal Live:**
> - `bimodalLiveVoice.contract.ts`: `BimodalLiveSession.simulated?: boolean`, `LiveTurn.simulated?: boolean`, `LiveLatencyMetrics.isEstimate?: boolean`.
> - `bimodalLiveVoice.service.ts`: sessão, turnos fabricados e métricas placeholder marcados; `bargeInResponseMs` não soma mais offset artificial de +85ms (mede elapsed real).
>
> **EXP-07 — métricas conversacionais:**
> - `conversationalIntelligence.service.ts`: `overlapTimeSeconds` agora é calculado de verdade (interseção de intervalos seller×customer com merge de spans); `diarizationQualityConfidence` 0.95 fabricado → 0.5 neutro e `isEstimate: true`.
>
> **Órfãos reconciliados:**
> - `src/services/telephony/billing.service.ts`: confirmado órfão; o caminho produtivo é `src/lib/voice-hub/services/billingService.ts` (`computePeriodEnd` já faz clamp de fim de mês p/ monthly/yearly). Serviço mantido com nota de rodapé documentando que não é billing de produção (decisão: não remover — testes unitários o cobrem e remoção é decisão do 00).
> - `src/services/telephony/transcription.service.ts`: **integrado** — `telephonyService.ts` (`handleTurn`) agora aplica `maskPii` nos turnos user/assistant ANTES de persistir em `session.metadata` (que alimenta o webhook `agent.call.ended` → transcript). Resolução real do B-13 no pipeline de voz.
>
> **Testes:** `tests/unit/voice-reconciliation/reconciliacao-forense-12.test.ts` (novo, 7 testes), `src/lib/voice-hub/services/telephonyService.piiMasking.test.ts` (novo, 2 testes); expectativas `isEstimate` atualizadas em `onda05Contracts.test.ts` e `conversationalIntelligence.service.test.ts`. `npx tsc --noEmit` limpo; vitest dos arquivos afetados verde.
>
> **Pendências explícitas:** implementação de integrações reais (Google Calendar/Meet, Clicksign/DocuSign, CRM tasks, transporte Live, STT/TTS real, diarização com ground truth) continua fora do escopo — este handoff agora apenas garante que simulações sejam honestamente sinalizadas.
>
> **Ressalva do Agente 24 (enderrçada no mesmo dia):** os eventos `SDR_CALL_COMPLETED` e `MEETING_SCHEDULED_CALENDAR` do domainEventMesh carregavam IDs fabricados sem flag. Corrigido: payloads agora incluem `simulated: true`; idem nos eventos `LIVE_VOICE_SESSION_STARTED`/`LIVE_VOICE_BARGE_IN_TRIGGERED`/`LIVE_VOICE_FALLBACK_ENGAGED` do bimodal Live. `PromiseApprovalResult` (tacticalSwarm.contract.ts) ganhou `simulated?: boolean` para que consumidores via `IPromiseGuardianPort` enxerguem o flag. Teste de regressão cobre `payload.simulated === true` nos dois eventos SDR.

> **Atualização (Agente 12 — 2026-11-17, verificação em `main@414a0ca5f`):** as correções
> estão mergeadas em `main` — commits `33742cc01` (flags `simulated` em
> ai-voice/proposals/promiseGuardian + `maskPii` integrado em `telephonyService`) e
> `3bf56d71a` (propagação aos eventos do domainEventMesh, ressalva do 24). O header de
> `Status` foi alinhado de `aberto` para `em-andamento`, coerente com a Resolução acima:
> **falta apenas o parecer formal do Agente 24** sobre esta reconciliação de voz
> (não localizado em `.agents/reviews/` até esta data — existem pareceres do 24 para as
> reconciliações dos agentes 00, 06, 09 e 17 de 2026-11-14, mas não para a do 12).
> Integrações reais (Calendar/Meet, Clicksign, CRM tasks, transporte Live, STT/TTS,
> diarização) permanecem explicitamente fora do escopo conforme registrado.
