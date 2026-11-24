# Handoff 64 → 00 — Adapter STT → Voice Command Router (POS4-64-STT-WIRE)

- **De:** Agente 64 — Tito (Comandos de Voz e Ações)
- **Para:** Agente 00 — Astra (Coordenador Global)
- **Onda/POS:** POS4-64-STT-WIRE (pos4)
- **Status:** resolvido — commits locais na branch `agente/64-stt-cmd-pos4`
- **Prioridade:** alto (conclusão da ponte STT→router do B-07)

## Entrega

Dois arquivos novos dentro do ownership `src/features/voice-hub/commands/**`:

- `src/features/voice-hub/commands/stt-adapter.ts` (~500 linhas)
- `src/features/voice-hub/commands/__tests__/sttCommandAdapter.test.ts` (29 testes)

Continuação de trabalho parcial não-commitado do agente anterior: os dois
arquivos foram auditados, o cabeçalho foi atualizado para o contrato REAL do
Agente 63 (lido via `git show agente/63-stt-pos4:...`), e a suíte foi
executada — 49/49 verde (29 adapter + 20 router Onda 4).

## Contrato STT do Agente 63 — conformidade

O contrato canônico (`SttTranscriptEvent` com `transcript`, `isFinal`,
`sessionId`, `organizationId`, `userId`, `speaker?`, `confidence?`,
`startSec?`, `endSec?`) é reconhecido pelo extrator tolerante do adapter
SEM import cross-branch. Após o merge das branches, eventos canônicos podem
ser passados diretamente em `input.stt` sem alteração de código.

Decisão deliberada registrada: o adapter ignora `organizationId`/`userId`
do payload STT e resolve o ator exclusivamente da `session` autenticada
(`resolveVoiceActorFromSession` aceita `req.user`, `{user}` better-auth ou
usuário direto; roles mapeadas ADMIN→admin, GESTOR→manager,
CLOSER/SDR→agent, demais→viewer fail-closed). Divergência gera WARN de
auditoria. Isso é mais estrito que o contrato do 63 (que confia nos campos
do evento, populados upstream pela sessão) — defesa em profundidade.

## Contratos Onda 4 preservados (verificado em teste)

- Tenant: payload STT com organizationId/userId de outro tenant é ignorado;
  confirmação cross-tenant → `confirmation_denied`, zero mutação.
- Confirmação: TTL + uso único + revalidação de autorização no consumo;
  replay → `confirmation_expired`.
- Real vs simulação: executor `simulation: true` → `failed`/`simulated`,
  `confirmed: false`, `mutate` nunca chamado.
- Erros honestos: interim → `stt_interim`, vazio → `stt_empty`, sessão sem
  ator → `actor_unauthenticated`, sem executor → `executor_not_bound`,
  ambíguo/não reconhecido/incompleto propagados do router.

## Pendências registradas (não bloqueantes)

1. **Bindings de executores** (handoff detalhado em `64-para-65`): apenas
   `create_lead` tem executor real via `container.resolve('LeadUseCases')`.
   `update_deal_stage`, `schedule_meeting`, `log_activity`, `generic_action`
   retornam `executor_not_bound` até decisão de domínio (Agentes 04/20/45/47).
   Sugestão: abrir handoff 64→20 (Ciro) para priorização dos bindings.
2. **Merge 63↔64**: nenhum conflito esperado — o 63 criou
   `transcription/sttTranscript.contract.ts` + handoffs; este entregou
   `commands/stt-adapter.ts` + handoffs. Paths disjuntos.
3. **Consumidor**: a UI/serviço que invoca `handleTranscript` é responsabilidade
   do Agente 65 (ver `64-para-65-stt-adapter.md` para o contrato de status).

## Verificação executada

- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/commands/__tests__/sttCommandAdapter.test.ts src/features/voice-hub/commands/__tests__/voiceCommandRouter.test.ts` → **49/49 verde**.
- `npx tsc --noEmit -p tsconfig.json` → **0 erros**.

## SHAs

- Base: `9f80c07ed` (merge onda-4)
- Commit(s) desta entrega: ver `git log agente/64-stt-cmd-pos4` (registrado no relatório final da sessão).
