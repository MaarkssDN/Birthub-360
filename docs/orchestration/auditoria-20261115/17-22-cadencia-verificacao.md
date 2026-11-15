# Auditoria 2026-11-15 — Agentes 17/22: Cadência Multicanal, Ciclo de Receita e Verificação de Realidade

**Demanda:** DEM-20261115-001 · **Orquestrador:** Agente 00
**Escopo:** somente leitura. Auditoria de `src/features/cadence/**`, `src/shared/{domain,infra,services}/optOut*`, `src/shared/services/optOutCheck.service.ts`, `src/shared/services/dataSubjectErasure.service.ts`, `src/features/integrations/{email,whatsapp,birth-voice,threecx,signature}`, `src/features/proposals/**`, `src/features/automations/cadenceIntegration.service.ts`, `src/features/cadence/services/{adaptiveMultichannelCadence,selfDrivingCrm}.service.ts` e fluxos de escrita/realidade correlatos.
**Método:** leitura de código + rastreio de wiring (rotas → worker → dispatcher → banco). Sem execução de testes nem queries ao banco — veredito baseado em evidência estática de persistência.

---

## 1. ELOGIOS (evidências arquivo:linha)

### Opt-out unificado — a entrega mais forte do repositório
- **Domínio puro e completo:** `src/shared/domain/optOut.ts:19-151` — escopo por canal + `global`, matching por leadId/email/phoneE164, normalização E.164, porta `OptOutRepository`. Matriz canal×canal coberta por `scopeBlocksChannel` (`optOut.ts:119-121`).
- **Adaptador Prisma real aplicado:** `src/shared/infra/PrismaOptOutRepository.ts:65-117` — tabela `OptOutRecord` (migration `20260815120000_opt_out_record`), mapeamento PascalCase↔lowercase correto, `list` sem truncamento silencioso (linhas 99-113).
- **Interceptor fail-closed pré-envio:** `src/shared/services/optOutCheck.service.ts:108-297` — 5 camadas: tenant, anonimização LGPD, flags `customFields` do contato, flags dos leads, `OptOutRecord`. Contato inexistente/outro tenant → `blocked` (linhas 155-167); parâmetros ausentes → `blocked` (116-133). Nunca fail-open.
- **Cobertura real em TODOS os canais de envio:**
  - Cadência WhatsApp/e-mail/voz: `src/features/cadence/infra/dispatchers/CadenceDispatchers.ts:75,195,299` (checkOptOutStatus por toque);
  - Início de run, todos os canais da sequência, inclusive leads sem contato: `src/features/cadence/cadence.routes.ts:384-417` + `application/cadenceEligibility.ts:40-60`;
  - Worker por toque, antes de decidir: `application/cadenceService.ts:185-195` + re-verificação pré-dispatch anti-corrida (linhas 283-312);
  - Cold e-mail (prospecção): `src/features/prospecting/services/cold-email.service.ts:56-112,162-175` — filtro sanitizador na entrada + defesa em profundidade;
  - WhatsApp avulso: `src/features/integrations/whatsapp/whatsapp.service.ts:435-438`;
  - Voz/ThreeCX: `callSuppression.service.ts:91` e `threecx.service.ts:299-308` (espelho duplo em CallSuppression + OptOutRecord);
  - Exclusão LGPD cria opt-out Global ANTES de destruir identificadores: `dataSubjectErasure.service.ts:78-118`.
- **Registro de opt-out por resposta real do lead:**
  - WhatsApp inbound com keyword ("sair"/"stop"/"descadastrar"…): `whatsappMessage.service.ts:173-207` — flag legada + `OptOutRecord` scope `global` com evidência (o corpo da mensagem);
  - E-mail inbound: `emailReply.webhook.ts:148-186` — mesmo padrão, `isOptOutKeyword` + `recordOptOut` global + flags.
- **Resposta do lead encerra cadência em qualquer canal:** `hasLeadReplied.ts:12-32` cobre WhatsAppMessage inbound, EmailMessage inbound e VoiceCallLog concluída; re-checagem imediatamente antes do dispatch (`cadenceService.ts:298-312`).

### Máquina de estados e honestidade de envio
- `domain/cadence.ts` — pura, sem I/O, `now` injetado; opt-out e reply verificados ANTES de paused/terminal (`decideCadenceAction:211-218`); `recordTouchAttempt` só marca `sent` com confirmação do dispatcher (347-403); erros sanitizados (PII/credencial, 458+); `fallbackTouchOrder` para canal estruturalmente quebrado; estados `failed`/`completed`/`stopped` distintos.
- **Anti-duplicidade real:** trava Redis por run (`RedisCadenceRunLock`, `cadenceService.ts:170-177`), `saveWithRetry` pós-dispatch com log de severidade alta quando a persistência falha após envio real (320-341), índice único parcial `CadenceRun_leadId_active_unique` → 409 tratado (`cadence.routes.ts:430-438`), rate limit cross-cadência por contato/domínio (`rateLimitService.ts`, worker `cadenceRun.worker.ts:112-117`).
- **Runtime de verdade:** worker BullMQ registrado em `src/bootstrap/workers.ts:200,256` (scan a cada 5 min, `MAX_RUNS_PER_TICK=500`), sequência malformada encerra run como `failed` em vez de pular para sempre (`cadenceRun.worker.ts:160-185`), runs processados com `requestContext.run({tenantId})` por tenant (linha 187).
- **UI↔API↔banco ponta a ponta:** `CadenceHub.tsx` → `useCadence.ts` → `cadence.api.ts` → `cadence.routes.ts` montado em `/api/cadence` com `authenticateToken+requireTenant` (`bootstrap/routes.ts:258`). Criação de sequência, start/pause/resume/stop de run, opt-outs, templates e seed-defaults — tudo persiste em `CadenceSequence`/`CadenceRun`/`OptOutRecord` (schema.prisma:3552-3651). RBAC de escrita coerente front (`canManage`, CadenceHub.tsx:35) e back (`writeRoles`, cadence.routes.ts:49).
- **Agendamento com trava anti-inferência:** `scheduleMeeting.ts` + `domain/scheduling.ts` — só `manual-verified` aceito hoje; nota de evidência obrigatória; rota `POST /cadence/leads/:leadId/schedule-meeting` (cadence.routes.ts:514+). Exatamente o que o prompt exigia.
- **Assinatura/fechamento determinístico:** `documentSignature.ts` + `shared/domain/{signature,dealClosure}.ts` + `PrismaSignatureRequestRepository` — webhook HMAC fail-closed (`signatureStatus.webhook.ts:53-77`), transições validadas idempotentemente, `recordSignatureDealClosure` só após `isDeterministicCloseEvent`. UI real via `crm360.routes.ts:108` → `Crm360UseCases.requestDocumentSignature`. Proposta versionada imutável (`CrmCommercialDocumentVersion`, schema ~3785).
- **Reply tracking de e-mail:** `emailReply.webhook.ts` — HMAC, replay guard, idempotência por `providerMessageId`, filtro de auto-resposta ANTES de escrita, `EmailMessage` persistido, `ConversationSignal` via `PrismaConversationSignalPort`, classificador LLM real (`emailIntentClassifier.ts:56-87`, gateway com `logAiUsage`).

---

## 2. PROPOSTAS DE MELHORIAS

1. **Unificar as DUAS cadências** (ver P1-1): decidir qual é o motor oficial e remover/deprecar a outra — hoje `MultichannelCadenceEnrollment` é um segundo sistema que automações movem mas nada executa.
2. **Transporte de e-mail de entrada real** (ver P0-1): plugar provedor (inbound-parse/IMAP por tenant) — sem isso, reply tracking e opt-out por e-mail são código correto sem dados.
3. **Rodapé de descadastro + `List-Unsubscribe`** nos e-mails de cadência e cold-email (ver P1-2): uma URL/token por tenant que chame `recordOptOut` direto — torna o opt-out de e-mail executável sem depender do webhook de inbound.
4. **Cobertura de anonimização LGPD** (ver P1-3): estender `dataSubjectErasure.service.ts` para `EmailMessage`, `CadenceRun.attempts`, `MultichannelCadenceEnrollment` e `SignatureRequest`.
5. **Verificação contínua (Agente 22):** criar suíte de "persistência real" para os fluxos deste domínio — ex.: criar run → assert linha em `CadenceRun` + `CadenceTouchAttempt.result='sent'` só após provider; opt-out via WhatsApp → assert bloqueio em e-mail/voz com query SQL; reload do CadenceHub → runs/opt-outs íntegros. Os testes de unidade atuais são fortes, mas nenhum teste E2E prova "UI salvou → banco tem".
6. **Métricas/alertas operacionais:** runs `failed` por `policy-guardrail`, toques com `result='failed'` recorrente por canal, e cadências que disparam após opt-out (deveria ser zero — vale um assert/alarme).
7. **Template real:** `templateRef` hoje É o corpo da mensagem (`CadenceDispatchers.ts:15-19`) — um sistema de templates versionados com variáveis (`{{nome}}`, opt-out link) reduziria o risco de enviar texto cru e permitiria o rodapé de descadastro de forma sistemática.

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0 — Bloqueadores / risco legal ou funcional grave

**P0-1. Canal de e-mail da cadência é "surdo": não existe transporte de entrada de e-mail.**
`emailReply.webhook.ts:24-35` documenta explicitamente: "nenhum provedor real (IMAP/webhook de inbound-parse) está conectado ainda" — o endpoint existe e é real, mas nenhum e-mail de resposta jamais chegará a ele em produção. Consequências em cadeia:
- `hasLeadReplied` (`hasLeadReplied.ts:18-21`) nunca encontrará `EmailMessage` inbound → cadência com toques de e-mail **não para quando o lead responde por e-mail** — viola o requisito duro "resposta do lead encerra a cadência, em qualquer canal";
- opt-out por e-mail ("descadastrar") é inalcançável → a única saída do titular de e-mail é pedir manualmente ao vendedor;
- `ConversationSignal` de e-mail e reply tracking (entrega 3) produzem zero dados reais.
**Severidade:** P0 para o canal e-mail (funcionalidade prometida na UI que não pode funcionar ponta a ponta). O restante (WhatsApp/voz) está coberto.

**P0-2. E-mails de cadência/cold-email não contêm mecanismo de descadastro.**
`CadenceDispatchers.ts:217-219` envia `subject`/`body` crus de `templateRef`; `src/lib/email/mailer.ts` não tem `List-Unsubscribe` nem rodapé de opt-out (grep por `unsubscribe|List-Unsub` = 0 ocorrências). Sem inbound (P0-1) e sem link de descadastro, o titular de e-mail **não tem como exercer o direito de oposição** a partir da própria mensagem — exposição LGPD Art. 18/21 e boa prática CAN-SPAM/GDPR. Agravante: a UI vende "opt-outs unificados", mas para e-mail a porta de entrada não existe.
**Severidade:** P0 (LGPD).

### P1 — Altas

**P1-1. Dois motores de cadência paralelos; o segundo é cenográfico.**
- Motor real: `CadenceRun`/`CadenceSequence` + `cadenceRun.worker.ts` (envia de verdade).
- Motor paralelo: `MultichannelCadenceEnrollment` (`schema.prisma:3762`) + `adaptiveMultichannelCadence.service.ts` + `automations/cadenceIntegration.service.ts`. Automations (`automation.engine.ts:643`) matriculam/movem/pausam leads nesse store, mas:
  - `executeNextStep` (`adaptiveMultichannelCadence.service.ts:159-177`) é explicitamente "Execução simulada bem-sucedida" — gera `messageId` falso, **não envia nada**;
  - `cadenceStepsStore` é `Map` em memória (linha 22) — só existe `'default-b2b-cadence'`; qualquer outro `cadenceId` encerra o enrollment como `completed` sem enviar (linhas 104-116);
  - nenhum caller de produção invoca `executeNextStep`/`enrollLead` do adaptive service (só `selfDrivingCrm.service.ts`, ele mesmo morto — ver P2-3).
**Efeito:** automações reportam sucesso ao "avançar cadência" (`cadenceIntegration.service.ts:76-85` devolve `success:true`) enquanto nenhum toque é disparado — exatamente a classe "formulário cenográfico / sucesso otimista" que o Agente 22 caça. Além disso, `CadenceIntegrationService` **não consulta opt-out** ao matricular — hoje inócuo porque nada envia, mas é uma armadilha pronta se alguém ligar o executor.
**Severidade:** P1 (enganoso operacionalmente; risco LGPD latente).

**P1-2. Anonimização LGPD não cobre tabelas de cadência/e-mail/assinatura.**
`dataSubjectErasure.service.ts` mascara `whatsAppMessage.body` (137-140), `conversationSignal` (222-231), `timelineEvent`, `voiceCallLog`, copiloto — mas **não toca**:
- `EmailMessage` (`fromEmail`, `toEmail`, `subject`, `body` — PII direta, schema.prisma:3653);
- `CadenceTouchAttempt`/`CadenceRun.attempts` (templateRef = corpo das mensagens enviadas);
- `MultichannelCadenceEnrollment.contactEmail/contactPhone` (plaintext, schema.prisma:3762-3772);
- `SignatureRequest`/`CrmCommercialDocument*` (dados do signatário).
Após "anonimização", o banco continua contendo e-mail, telefone e conteúdo de mensagens do titular → exclusão LGPD Art. 18 incompleta. **Handoff para 21/01.**
**Severidade:** P1.

**P1-3. `recordContactOptOut` marca flags de lead de forma assimétrica (over-block parcial).**
`optOutCheck.service.ts:373-387`: para QUALQUER escopo (inclusive `email`), todo lead vinculado recebe `optOutWhatsApp: true` — um opt-out só de e-mail passa a bloquear WhatsApp via `lead_flag` (linhas 214-232), contrariando a semântica "opt-out é por canal" do domínio. Direção fail-safe (bloqueia a mais, não a menos), mas inconsistente com o registro `OptOutRecord` que respeita escopo — duas fontes de verdade divergentes sobre o mesmo pedido.
**Severidade:** P1→P2 (comportamento, não risco de vazamento).

### P2 — Médias

**P2-1. Provedor de assinatura gov.br é stub; `proposalAutomation.service.ts`/`proposalDocument.service.ts` são 100% cenográficos e sem callers.**
- `GovBrSignatureProviderPort.ts:15-30` — devolve `providerRequestId` sintético, nenhuma chamada real (documentado honestamente, mas o fluxo "proposta→assinatura" não pode concluir sem provedor).
- `src/features/proposals/services/proposalAutomation.service.ts` — `proposalsStore = new Map` (linha 11), `signatureUrl` fabricada `https://${provider}.com/sign/${envelopeId}` (linha 183); `proposalDocument.service.ts:17` gera "%PDF-1.4 **Mocked** Content". Grep confirma **zero callers** fora do próprio diretório — código morto que simula um ciclo comercial inteiro. Risco: alguém expor isso numa rota e a UI passa a mentir.
**Severidade:** P2 (cenográfico + dead code; o caminho real via crm360 existe e é honesto).

**P2-2. `selfDrivingCrm.service.ts` — serviço inteiro em memória, singleton exportado, zero callers.**
`services/selfDrivingCrm.service.ts:18-32` — `signalsStore`/`recommendationsStore`/`mockLeadsStore` são Maps de processo; `optOutRepo` default `InMemoryOptOutRepository` (linha 20) que **perde todos os opt-outs no restart** se alguém o injetar em produção. Nenhum caller de produção encontrado (grep vazio fora de testes/contrato). Se for reativado sem trocar os stores, "aprovar recomendação de cadência" (`approveCadenceRecommendation`) publicará eventos de domínio sobre estado volátil.
**Severidade:** P2 (dead code perigoso).

**P2-3. `CadenceExecutionService`/`CadenceExecutionPort` aparentemente sem uso em produção.**
`application/CadenceExecutionService.ts` só aparece em `index.ts` (re-export) e testes — o worker usa `advanceCadenceRun`. Segundo motor de execução parcial → confusão de "qual é o real".
**Severidade:** P2/P3.

**P2-4. Espelhamento Bitrix fire-and-forget sem retry/DLQ.**
`CadenceDispatchers.ts:144-155,256-267` — `syncActivityToBitrix(...).catch(log warn)`: se o Bitrix estiver fora, a atividade de cadência nunca chega ao CRM do cliente e só resta um warn. Aceitável como best-effort, mas não há métrica/alerta de "atividades de cadência perdidas no Bitrix".
**Severidade:** P2.

### P3 — Baixas / observações

- **P3-1.** `rawModelOutput` do classificador de IA persistido em `ConversationSignal` (`PrismaConversationSignalPort.ts:29`, `conversation-intelligence.service.ts:126-156`) — pode conter trechos de PII da conversa do lead. É anonimizável pela exclusão LGPD (linha 228 zera), mas em repouso fica em claro; considerar truncar/mascarar.
- **P3-2.** `emailReply.webhook.ts:169-186`: opt-out por e-mail grava `optOut/optOutEmail` mas **não** `optOutWhatsApp/optOutVoice` nas flags de lead/contato — o bloqueio cross-channel depende exclusivamente do `OptOutRecord` global; funciona, mas deixa as flags legadas inconsistentes com o que `recordContactOptOut` escreveria.
- **P3-3.** Toque `voice` retorna `pending` e depende de webhook do provador de voz para resolver (`cadenceWebhookResolver.ts`); se o webhook se perder, o attempt fica `pending` e `decideCadenceAction` devolve `wait/locked` para sempre (cadence.ts:220-225) — sem timeout/varredura de attempts órfãos.
- **P3-4.** `whatsappMessage.service.ts` opt-out só dispara quando `lead` foi resolvido (linha 172: `if (lead && direction==='inbound')`) — mensagem de opt-out de número desconhecido não registrado; aceitável (sem lead não há cadastro), mas vale log/métrica.
- **P3-5.** Duplicidade de implementações de opt-out: `features/cadence/application/optOutService.ts` (1 linha, re-export?), `features/cadence/infra/PrismaOptOutRepository.ts` (re-export de shared), `features/lgpd/services/optOutCheck.service.ts` (1 linha) — funciona, mas três caminhos de import para a mesma coisa; consolidar documentação de "import canônico".

---

## Veredito por fluxo auditado

| Fluxo | Estado |
|---|---|
| Opt-out unificado (registro→bloqueio canal×canal) | ✅ Real e persistido (P1-3 ressalva de flags) |
| Cadência WhatsApp/voz (run→worker→dispatch→tentativa) | ✅ Real ponta a ponta |
| Cadência **e-mail** | ⚠️ Envia de verdade, mas **nunca recebe resposta** (P0-1) e **não oferece descadastro** (P0-2) |
| Reply tracking e-mail→sinal→encerra cadência | ✅ Código real; ⛔ sem transporte de entrada (P0-1) |
| Agendamento com confirmação verificável | ✅ Trava correta (só manual-verified) |
| Proposta versionada→assinatura→fechamento | ⚠️ Domínio+webhook+fechamento determinístico reais; **provedor é stub** (P2-1) |
| Automações→"cadência" (MultichannelCadenceEnrollment) | ❌ Cenográfico: move estado, nunca envia (P1-1) |
| Self-driving CRM / proposal automation services | ❌ Dead code em memória (P2-1/P2-2) |
| Exclusão LGPD do titular | ⚠️ Parcial: não cobre e-mail/cadência/assinatura (P1-2) |

**Recomendações ao Agente 00:** abrir handoffs — (a) 05/06: transporte de entrada de e-mail + `List-Unsubscribe` (P0-1/P0-2); (b) 01/01A+21: cobertura de anonimização (P1-2); (c) 07+17: decidir destino do `MultichannelCadenceEnrollment`/`cadenceIntegration` (P1-1); (d) 04/17: remover ou completar `src/features/proposals/**` (P2-1).
