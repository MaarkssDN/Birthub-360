# Parecer 24 — Revisão Independente: Wave E — produtores do DomainEventMesh com `idempotencyKey`

- Missão: revisar lote Wave E do handoff `.agents/handoffs/onda-3/16-para-00-outbox-produtores-sem-idempotency-key.md` (produtores sem `idempotencyKey`).
- Autor das entregas: Agentes 02, 04, 06, 07, 09, 10, 12 (PRs #444–#453).
- Auditor: Agente 24 (slot de revisão independente desta sessão; na arquitetura de 100 agentes o papel formal é do Agente 09/Silas — ver `.agents/prompts/20-backend-apis/24-papel-especifico.md`).
- Data da revisão: 2026-11-19.
- Base auditada: `origin/main` @ `f634da0c1` (pós-merge de #444, #445, #448).
- Worktree do auditor: `C:\Github\Birthub-360-worktrees\review-24-waveE`, branch `agente/24-review-waveE`.

## Escopo e revisões exatas

| PR | Agente | Domínio | Estado no momento do parecer | Head SHA |
|---|---|---|---|---|
| #444 | 17 | cadence | MERGED | `b5567a8b8` |
| #445 | 04 | commercial-intelligence + proposals + market-intelligence | MERGED | `eba25a25a` |
| #447 | 07 | automations + intelligence + knowledge graph | OPEN | `b75526799` |
| #448 | 06 | whatsapp + bitrix webhooks | MERGED | `39f2bee11` |
| #450 | 12 | ai-voice | OPEN | `c43f54a7d` |
| #451 | 09 | mobileEdgeAi | OPEN | `8c74b0d4a` |
| #452 | 10 | multiRegionResilience | OPEN | `9e39952e5` |
| #453 | 02 | gamification | OPEN | `551ab608c` |

Nota: #445 e #448 constavam OPEN na primeira listagem e foram mergeados durante a revisão
(`gh pr view` reconfirmado: MERGED 2026-11-19T22:51Z). Os pareceres abaixo valem para o
conteúdo mergeado; ressalvas permanecem válidas como dívida de contrato.

## Verificações executadas (evidência, não narrativa)

1. **Semântica do outbox confirmada na fonte:**
   - `src/lib/queue/outbox/inMemory.ts:17-27` — `append` deduplica por `(organizationId, idempotencyKey)` e devolve `created:false`.
   - `src/lib/queue/outbox/prismaOutbox.repository.ts:~99-127` — `INSERT ... ON CONFLICT DO NOTHING` cobrindo `(organizationId, eventId)` e o UNIQUE parcial; em conflito devolve o registro existente do mesmo tenant.
   - `prisma/migrations/20261020210000_remed05_domain_event_outbox/migration.sql:56-57` — `CREATE UNIQUE INDEX "DomainEventOutbox_organizationId_idempotencyKey_key" ... WHERE "idempotencyKey" IS NOT NULL` (índice parcial, conforme decisão de contrato).
   - `src/lib/queue/domainEventMesh.service.ts:27,101-119` — `PublishOptions.idempotencyKey` propagado ao `repo.append`; warn throttled por eventType quando ausente (instrumento do 16).
   - Conclusão: a chave de fato deduplica na outbox; a decisão de contrato (determinística `dominio:{entityId}`, nunca randomUUID por publish) está sendo cumprida em todas as parcelas.

2. **Cobertura — `git grep domainEventMesh origin/main -- src/**`:** 34 arquivos; os
   produtores (excluídos testes, `src/lib/queue/**` e consumidores/bridges) são
   exatamente os cobertos pela união #444+#445+#447+#448+#450+#451+#452+#453.
   - `bitrixEventMeshBridge.service.ts` é consumidor (`subscribe`), não produtor.
   - `automation-dry-run.service.ts`, `globalSecurityEvent.port.ts`, `webhookIdempotency.ts`
     não publicam no mesh (comentários apenas).
   - `src/features/roleplay/services/multimodalRoleplaySimulator.service.ts` **não existe**
     (confirmado por `find`/`git grep`) — item do inventário obsoleto; o 07 registrou
     corretamente no handoff.
   - Contagem por arquivo nos worktrees das branches: cada `publish` tem 2º argumento
     com `idempotencyKey` (verificado por grep `.publish` vs `idempotencyKey` em todos
     os arquivos alterados dos 7 worktrees `agente-*-waveE-outbox`).

3. **Testes executados pelo auditor** (`npx vitest run -c vitest.unit.config.ts`, worktrees das branches):
   - #447 (agente-07): `outboxIdempotencyKeys` + `accountKnowledgeGraph.outboxIdempotency` + `automation.engine.extended-actions` → **16/16 verde**.
   - #450 (agente-12): `tests/unit/ai-voice/` → **21/21 verde**.
   - #451 (agente-09): `outboxIdempotency.test.ts` → **3/3 verde**.
   - #452 (agente-10): `multiRegionResilience.service.test.ts` → **5/5 verde**.
   - #453 (agente-02): `tests/unit/gamification/outboxIdempotency.test.ts` → **4/4 verde**.
   - #445/#448 (merged): testes novos presentes no diff e mergeados em main; asserts do
     2º argumento verificados por leitura do diff (mock de `domainEventMesh.publish` +
     `toHaveBeenCalledWith(event, { idempotencyKey })`). Não reexecutados — worktree de
     auditor em main não tem `node_modules`; mecânica de dedup já coberta por
     `tests/unit/queue/outbox.remed05.test.ts` e `domainEventMesh.service.test.ts`.
   - Em todos os PRs os testes assertam o **2º argumento** de `publish` (não só o evento).

4. **Escopo/propriedade:** diffs restritos a arquivos do domínio de cada agente +
   testes do domínio + handoffs. Exceção benéfica: `src/features/knowledge/**` pertence
   ao Agente 07 (`src/features/knowledge/AGENTS.md` — "Dono: Agente 07"), então a parcela
   do knowledge graph no #447 está correta. `src/features/gamification/**` pertence ao
   Agente 02 (decisão 2026-11-18) — o 04 abriu handoff 04→02 em vez de editar (#445) e o
   02 executou (#453): fluxo de propriedade exemplar.

## Parecer por PR

### #444 — Agente 17 (cadence) — MERGED — **APROVADO** (referência de padrão)
Chaves por identidade do fato (`engagement-signal:{signalId}`, `lead-stagnated:{leadId}:{daysInactive}`, `cadence-change-approved:{recommendationId}` etc.). Padrão `dominio:{entityId}`/id de execução sem `randomUUID` por publish. Teste `outboxIdempotency.test.ts` cobre retry real na outbox. É o padrão de referência do lote.

### #445 — Agente 04 — MERGED — **APROVADO-COM-RESSALVAS**
- `proposal:{id}`, `what-if:{simulationId}`, `market-signal:{contentHash}` — corretos.
  `contentHash` é sha256(org+companyName+title), a mesma dedup do serviço; `signal.id`
  é `sig-${randomUUID()}`, então derivar dele seria inútil — decisão correta.
- **Ressalva (média, contrato):** `revenue-forecast:{org}:{YYYY-MM}` colapsa **todas**
  as projeções do mesmo mês — a 2ª recomputação do cockpit (payload potencialmente
  diferente) é descartada pela UNIQUE. Se o fato de negócio é "projeção do período",
  ok; se consumidores esperam o forecast mais recente, a chave é agressiva demais.
  Decisão de produto/contrato a registrar; não bloqueia (já mergeado).
- **Ressalva (baixa):** `value-realization:{trackerId}:{history.length}` usa índice do
  histórico — funciona (push ocorre antes do publish, `valueRealization.service.ts`),
  mas é frágil a reordenação futura; um id de medição seria mais robusto.

### #447 — Agente 07 — OPEN — **APROVADO-COM-RESSALVAS**
- 9 call sites em 8 arquivos, todos com chave determinística; testes fortes
  (determinismo real via `buildTriggerIdempotencyKey` sem mock da função pura).
- `lead-enrichment:{sha256(...)}` reusa a identidade do dedupe de disparo — excelente.
- `graph-relationship:{sourceId}:{targetId}:{type}` — **adequado**: `edge.id` é
  `edge-${randomUUID()}` por chamada; a tupla é a identidade estável da relação.
  Limitação aceita: re-adição da mesma tupla (ex.: aresta removida e recriada, ou
  mudança de `confidence`/`source`) gera a mesma chave e o evento é suprimido —
  semanticamente defensável ("a relação X→Y do tipo T existe"), mas registrar.
- **Ressalva (baixa):** `circuit-breaker-{tripped,recovered}:{org}:{timestamp da
  transição}` depende de estado em memória — após restart do processo a mesma
  transição lógica pode ser reemitida com timestamp novo (não deduplica entre
  processos). Aceitável para o escopo; o TRIPPED/RECOVERED é por design por transição.
- `devils-advocate:{dealId}:{analysisDate(ISO)}` — único por execução; reavaliações
  não são suprimidas. Correto.

### #448 — Agente 06 — MERGED — **APROVADO**
- `wa-message:{waMessageId}` / `wa-engagement:{waMessageId}` — waMessageId é a
  identidade estável da mensagem; prefixos distintos impedem que os 2 eventos da
  mesma mensagem se descartem mutuamente (o UNIQUE não inclui eventType). Corretíssimo.
- `bitrix-webhook:{fingerprint}` / `bitrix-engagement:{fingerprint}` — o Bitrix não
  envia id de evento; o `webhookDeliveryFingerprint` (hash do corpo autenticado) é a
  mesma identidade do replay guard — coerente. Ressalva mínima: reentrega com corpo
  byte-diferente (ex.: `ts` novo) gera fingerprint novo e evento duplicado — mas isso
  já é a semântica do replay guard, não regressão desta parcela.
- Teste novo fixa as duas chaves e a não-colisão entre eventos da mesma entrega.

### #450 — Agente 12 — OPEN — **APROVADO-COM-RESSALVAS**
- `sdr-call:{callId}`, `sdr-meeting:{meetingId}`, `live-voice-session:{sessionId}`,
  `live-voice-fallback:{sessionId}` — corretos (ids da execução/sessão).
- **Ressalva (média, contrato):** `live-voice-barge-in:{sessionId}:{turns.length}` —
  `triggerBargeIn` não adiciona turnos (verificado: `turns.push` só em
  `sendAudioStream`/resposta). Dois barge-ins **legítimos consecutivos** sem turno
  intermediário colidem e o segundo evento é suprimido. O comentário assume que isso
  só ocorre em retry; na prática um usuário pode interromper duas vezes seguidas.
  Impacto provavelmente baixo (evento informativo), mas é supressão de fato distinto —
  alternativa: contador de barge-ins por sessão ou aceitar a perda documentando-a.
- Mesma classe de ressalva para `live-voice-fallback:{sessionId}` se o fallback puder
  ser re-engatado (state machine sugere terminal — baixo risco).

### #451 — Agente 09 — OPEN — **APROVADO-COM-RESSALVAS**
- `geofence-proximity:{geofenceId}:{sellerId}:{YYYY-MM-DD}` — bucket diário
  documentado (padrão aceito do 17 com `:daysInactive`); múltiplas detecções reais no
  mesmo dia colapsam em 1 evento. Trade-off consciente; se consumidores precisarem de
  frequência, a chave é agressiva.
- **Ressalva (média, contrato):** `briefing-access:{briefingId}:{online|offline}`
  colapsa **todos** os acessos repetidos ao mesmo briefing em cache — cada
  `getVisitBriefing` é um fato distinto ("alguém abriu o briefing"), mas só o primeiro
  por briefing+modo emite evento. Diferente do geofence (bucket temporal), aqui não há
  janela: acessos em dias diferentes do mesmo cache são suprimidos. Se a métrica de
  acesso for relevante para produto, considerar bucket por dia como o geofence.
  Não bloqueia — decisão de granularidade a confirmar com o 02/04.

### #452 — Agente 10 — OPEN — **APROVADO**
`multi-region-failover:{from}->{to}:{failoverId}` — failoverId único por execução de
`triggerFailover`; simples e correto. Teste verifica 2 failovers → 2 chaves distintas.

### #453 — Agente 02 — OPEN — **APROVADO-COM-RESSALVAS**
- `adaptive-mission:{missionId}`, `adaptive-mission-completed:{missionId}`,
  `seller-xp:{sellerId}:{missionId}`, `war-room:{roomId}` — corretos.
- `bottleneck-detected:{b.id}` — `b.id` é `btn-${randomUUID().substring(0,8)}` gerado a
  cada `detectBottlenecks`; a chave é efetivamente única por execução e só deduplica
  retry de publish (não re-detecções do mesmo gargalo). Aceitável — cada detecção é um
  fato novo — mas vale registrar que NÃO segue o formato `dominio:{entityId}` do
  contrato (não há entityId estável; `{sellerId}:{metric}` seria alternativa se a
  re-detecção do mesmo gargalo devesse colapsar).
- **Ressalva operacional (bloqueia merge limpo, não o conteúdo):** #453 cria
  `.agents/handoffs/onda-3/04-para-02-gamification-outbox-idempotency.md`, arquivo que
  #445 (já mergeado) também criou com `Status: aberto`. Versão do #453 é superset
  (`Status: resolvido` + seção `## Resolução — Agente 02`) → conflito add/add; na
  resolução manter a versão do #453. Idem para o handoff-mãe
  `16-para-00-outbox-produtores-sem-idempotency-key.md`: todos os PRs abertos inserem
  seções `## Resolução parcial` no mesmo anchor → conflitos textuais triviais na
  sequência de merges (manter todas as seções).

## Achados consolidados

| # | Prioridade | Dono | Achado |
|---|---|---|---|
| 1 | média | 04 (já mergeado) | `revenue-forecast:{org}:{YYYY-MM}` suprime projeções distintas do mesmo mês — confirmar semântica desejada do evento. |
| 2 | média | 09 | `briefing-access:{briefingId}:{modo}` suprime acessos repetidos ao mesmo briefing — considerar bucket por dia (padrão geofence). |
| 3 | média | 12 | `live-voice-barge-in:{sessionId}:{turns.length}` suprime barge-ins consecutivos sem turno intermediário. |
| 4 | baixa | 07 | knowledge graph: mesma tupla com atributos alterados colide (aceitável); circuit-breaker não deduplica entre restarts. |
| 5 | baixa | 04 | `value-realization` por índice de histórico — frágil a reordenação. |
| 6 | operacional | 00/08A | Conflitos de merge esperados: handoff-mãe (todos os PRs) e add/add em `04-para-02-gamification-outbox-idempotency.md` (#453 vs #445 mergeado — ficar com a versão do #453). |
| 7 | informativo | — | Inventário do handoff continha `multimodalRoleplaySimulator.service.ts` inexistente — confirmado obsoleto; handoff-mãe pode ser saneado na integração. |

## Veredito do lote

- **#444, #445, #448: APROVADO / APROVADO-COM-RESSALVAS** (já mergeados — ressalvas são dívida de contrato, não regressão).
- **#447, #450, #451, #452, #453: APROVADO-COM-RESSALVAS** — aptos a merge após resolver os conflitos de handoff; nenhuma chave usa `randomUUID` por publish; todas as chaves são determinísticas e derivadas de identidade de negócio ou de execução.
- **Nenhum BLOQUEADO, nenhum REPROVADO.**
- Cobertura final: após o merge dos 5 PRs abertos, **zero** call sites de
  `domainEventMesh.publish` em `src/` permanecerá sem `idempotencyKey` (verificado por
  `git grep` em origin/main + diffs dos PRs).

## Escopo exato da aprovação

Este parecer aprova **somente** a correção das `idempotencyKey` nos call sites listados,
nos SHAs de head indicados. Não aprova: comportamento dos eventos em consumidores, o
`publishInTransaction`/UoW (G10 da auditoria do 16, decisão separada), nem qualquer
mudança fora do diff auditado. Modificação posterior nos arquivos auditados exige novo
parecer.
