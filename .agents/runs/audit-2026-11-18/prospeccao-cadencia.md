# Auditoria READ-ONLY — Agentes 05 (Prospecção) + 17 (Cadência)
**Base:** `main @ b54060ad1`. Verificado: correções de tenancy do PR #383 JÁ ESTÃO EM MAIN (providerCache v2 tenant, findSearchExecution orgId, outbound legado → 503).

## Achados

### PRO-01 — hasLeadReplied sem corte temporal: resposta histórica encerra cadência no 1º tick — **P1**
`hasLeadReplied.ts:12-32` + `cadenceService.ts:180,298`. Query sem `createdAt >= run.startedAt` → lead que já respondeu antes da cadência é classificado "respondeu" → run morre `stopReason:'lead-reply'` em 5min. Cadência inerte p/ perfil mais comum, falha silenciosa.
Correção: parâmetro `since` (run.startedAt/lastTouchAt) nas 3 queries + propagação.

### PRO-02 — Toque de voz pending trava run para sempre (sem sweeper) — **P1**
`CadenceDispatchers.ts:417-421` → `wait 'locked'` indefinido se webhook do provedor nunca chegar. Zero sweep/timeout em cadence.
Correção: TTL de pending → failed/skipped ou re-dispatch.

### PRO-03 — Nenhuma mensagem outbound instrui opt-out (sem footer/link SAIR) — **P1**
`cadenceTemplates.ts`, `CadenceDispatchers.ts:316-318`, `cold-email.service.ts:120`. Opt-out existe mas destinatário nunca é informado → inexerciseível. LGPD/anti-spam.
Correção: sufixo obrigatório nos dispatchers + templates WhatsApp + List-Unsubscribe.

### PRO-04 — sendColdEmail não persiste nada: sem Activity/Timeline/EmailMessage, sem idempotência, sem bounce, legalBasis não persistida — **P1**
`cold-email.service.ts:72-138`, rota `prospecting.routes.ts:341-365`. Disparo invisível no CRM, duplo clique reenvia, "enviado"=aceito SMTP, base legal exigida mas nunca gravada → trilha LGPD incompleta.
Correção: persistir registro + dedupe + gravar legalBasis/dataSource.

### PRO-05 — sendColdEmailBatch sem consumidor em produção — P2 (dead code de compliance)

### PRO-06 — AdaptiveMultichannelCadenceService.executeNextStep simula envio, success:true, messageId fabricado — P2
`adaptiveMultichannelCadence.service.ts:159-177`. Bomba de sucesso fabricado se for ligado.

### PRO-07 — SelfDrivingCrmService: InMemoryOptOutRepository + Maps em singleton — P2
`selfDrivingCrm.service.ts:18-32,403`. Dead code hoje; se ligado, opt-outs não persistem (fail-open LGPD).

### PRO-08 — InMemoryOptOutRepository.list trunca em 200 vs contrato "todos" — P3
`InMemoryOptOutRepository.ts:37`.

### PRO-09 — Opt-out por customFields não verificado quando lead sem contactId (+ gap TOCTOU) — P2
`CadenceDispatchers.ts:165-183,287-305`, `cadenceService.ts:189-195`.

### PRO-10 — recordContactOptOut grava flags WA+email em TODOS leads ignorando scope/channel — P3
`optOutCheck.service.ts:372-387`.

### PRO-11 — Rate limit provider por processo não por tenant; sem teto configurado → sem débito nem bloqueio — P3
`providerRateLimit.ts:10-17,124-142`, `providerBudget.ts:335-381`. Verificar se `recordProspectingProviderSpend` ainda é chamado — se não, budget check compara contra 0 e nunca bloqueia.

### PRO-12 — POST /cold-email sem Zod, falhas colapsam em 500 — P3
`prospecting.routes.ts:341-365`.

### PRO-13 — Rotas /cadence/* e /prospecting/* sem module-gate server-side; GETs nem requireRole (VISUALIZADOR lê opt-outs/PII) — P3
`bootstrap/routes.ts:147-148,259`.

### PRO-14 — Dead code: outbound SPA 60+ arquivos (503), multichannelDispatcher stub success-sem-enviar, SelfDrivingCrm — P3

## Fluxos verificados VERDES
Discover (tenant→exclusões→providers→dedupe→enriquecimento pago só com autorizarPagos→tracker+crédito), enrich (cache 24h, dedupe contatos, MX-check, EnrichmentLog), promote (dedupe CNPJ, RLS), opt-out unificado (OptOutRecord+CallSuppression+flags, coberto em cold/cadence/voz/whatsapp), cadência worker (lock Redis fail-closed, janela comercial, rate limit, recordTouchAttempt honesto, retry), envio real SMTP/baileys/VoiceCallPort com falha explícita.

## Top-5 riscos prospecção/cadência
1. PRO-01 cadência morta por falso positivo de reply.
2. PRO-03+04 compliance envio sem opt-out visível + sem rastro/base legal.
3. PRO-02 voz congela cadência eterno.
4. PRO-04/06 sucesso fabricado (cold-email sem persistência, executeNextStep simulado).
5. PRO-07/08/13 camadas opt-out/gating inconsistentes.

**Gate recomendado: PRO-01, PRO-02, PRO-03 bloqueiam módulo Cadência; PRO-04 bloqueia cold-email.**
