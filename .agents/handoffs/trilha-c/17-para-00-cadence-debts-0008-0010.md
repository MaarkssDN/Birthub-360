- De: 17 (Cadência Multicanal e Ciclo de Receita)
- Para: 00 (Coordenador) — cc: 24 (Revisão Independente)
- Onda: Trilha C — pacote DEBT-0008 + DEBT-0009 + DEBT-0010
- Status: resolvido (com 1 handoff dependente aberto: `17-para-01-cadence-touchresult-enum-pending.md`)
- Prioridade: normal
- Bloqueador-ref: `.agents/runs/00-reconciliacao-release-readiness-20261119.md` (DEBT-0008/0009/0010)
- Branch: `agente/17-cadence-debts-0008-0010` (worktree `C:\Github\Birthub-360-worktrees\agente-17-cadence-debts`, base `origin/main`)

## Problema

Três débitos de release-readiness no domínio de cadência, todos do Agente 17:

- **DEBT-0008**: `hasLeadReplied` consultava WhatsApp/EmailMessage/VoiceCallLog sem corte
  temporal — uma resposta histórica (anterior ao run) encerrava a cadência nova no 1º tick com
  `stopReason: 'lead-reply'` (feature inerte para o perfil mais comum).
- **DEBT-0009**: toque de voz `pending` sem TTL/sweeper — e, na investigação, descoberto que o
  problema real em produção era pior: o enum `CadenceTouchResult` do PostgreSQL não tem
  `Pending`, então o adaptador Prisma persistia `pending` como `Skipped` e o `pending` nunca
  voltava na releitura → o run **re-despachava `callLead` em loop** a cada ciclo elegível, e o
  `cadenceWebhookResolver` estava quebrado (`select: { attempts: true }` em campo inexistente).
- **DEBT-0010**: nenhuma mensagem outbound de cadência instruía opt-out ao lead.

## Arquivo(s) envolvido(s)

- `src/features/cadence/infra/hasLeadReplied.ts`
- `src/features/cadence/application/cadenceService.ts`
- `src/features/cadence/domain/cadence.ts`
- `src/features/cadence/infra/cadenceWebhookResolver.ts`
- `src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`
- testes: `src/features/cadence/__tests__/{cadence,cadenceService,cadenceTemplateRendering}.test.ts`,
  `tests/unit/features/cadence/infra/hasLeadReplied.test.ts`

## Evidência / Alteração necessária (implementada)

### DEBT-0008 — corte temporal `since = run.startedAt`

- `hasLeadReplied(organizationId, leadId, since?)`: `since` opcional (omitir preserva o
  comportamento histórico para usos fora do ciclo). Filtro aplicado em `receivedAt` para
  `WhatsAppMessage`/`EmailMessage` (esses models não têm `createdAt` — verificado em
  `prisma/schema.prisma`) e `createdAt` para `VoiceCallLog`.
- `AdvanceCadenceRunDeps.hasLeadReplied` ganhou o 3º parâmetro; `advanceCadenceRun` passa
  `run.startedAt` nas DUAS checagens (início do ciclo e re-verificação pré-envio).

### DEBT-0009 — pending com TTL + reconhecimento da forma persistida

- `domain/cadence.ts`:
  - `PENDING_TOUCH_CONFIRMATION_TTL_MS = 24h` e `PENDING_TOUCH_EXPIRED_ERROR`.
  - `isPendingConfirmation(attempt)`: `pending` literal **ou** `skipped` + `providerMessageId`
    (forma durável enquanto o enum do banco não tem `Pending` — `skipped` legítimos de janela
    comercial/rate limit nunca têm `providerMessageId`).
  - `decideCadenceAction` e `resolvePendingTouchAttempt` passaram a usar o helper — o run
    persistido agora aguarda o webhook (`wait/locked`) em vez de re-despachar em loop.
  - `expireStalePendingTouchAttempts(run, sequence, now, ttlMs?)`: sweeper puro — pending
    stale vira `failed` e aplica a mesma regra de avanço de `resolvePendingTouchAttempt`
    (`maxAttempts`/`fallbackTouchOrder`); nunca reescreve run terminal; webhook tardio é
    idempotente (não encontra mais pending).
- `application/cadenceService.ts`: `advanceCadenceRun` chama o sweeper a cada ciclo do scanner
  existente (`cadenceRun.worker.ts`, tick de 5 min) — nenhum job novo necessário.
- `infra/cadenceWebhookResolver.ts`: corrigido o `select` inválido (`attempts` →
  `touchAttempts { result, providerMessageId }`) e matcher tolerante a `Pending`/`Skipped`.

### DEBT-0010 — sufixo opt-out obrigatório

- `CadenceDispatchers.ts`: `WHATSAPP_OPTOUT_SUFFIX` e `EMAIL_OPTOUT_SUFFIX` anexados ao
  conteúdo realmente enviado (e registrado em Activity/TimelineEvent/Bitrix — registro
  honesto). As palavras ("SAIR", "descadastrar") são exatamente as que `isOptOutKeyword`
  (`src/shared/services/optOutCheck.service.ts`) já reconhece — o lead respondendo "SAIR"
  vira `OptOutRecord` via webhooks existentes, sem código novo.
- **Decisão sobre `List-Unsubscribe`**: não implementado — `sendEmail`
  (`src/lib/email/mailer.ts`, fora da propriedade do 17) não expõe headers e não existe
  endpoint de descadastro self-service para a URL apontar; a instrução textual é o mecanismo
  real e processável de ponta a ponta hoje. Se o produto quiser o header, é handoff para o dono
  de `src/lib/email/**` + definição de endpoint de unsubscribe.

## Teste esperado (executado)

- `npx tsc --noEmit` → limpo.
- `npm run lint` (`biome lint src`) → exit 0 (warnings pré-existentes do repo, nenhum nos
  arquivos tocados — lint direcionado a `src/features/cadence` limpo).
- `npx biome format` nos arquivos tocados → limpo.
- `vitest run -c vitest.unit.config.ts src/features/cadence tests/unit/features/cadence` →
  **28 arquivos, 298 testes, todos passando** (inclui 9 novos testes de domínio DEBT-0009,
  3 novos de serviço DEBT-0008/0009, 2 novos de dispatcher DEBT-0010 e 1 novo de
  `hasLeadReplied` cobrindo `since`).

Novos testes cobrem: propagação de `receivedAt`/`createdAt >= since` nas 3 queries;
`startedAt` passado nas duas checagens do serviço; `locked` para pending recente nas duas
formas (literal e persistida); `skipped` legítimo sem `providerMessageId` NÃO tratado como
pendente; expiração → `failed` → avanço/complete conforme `maxAttempts`; run terminal
intocado; webhook tardio idempotente; resolução de pending na forma persistida; sufixo
opt-out presente em WhatsApp e e-mail.

## Pendências / handoffs

1. **`17-para-01-cadence-touchresult-enum-pending.md` (aberto, prioridade alto)**: adicionar
   `Pending` ao enum `CadenceTouchResult` + migration; depois mapear `pending ↔ 'Pending'` no
   `PrismaCadenceRunRepository`. Sem isso, o downgrade `pending → Skipped` +
   `providerMessageId` continua sendo a representação durável (funcional, mas implícita).
2. Observação: `CadenceExecutionService`/`CadenceExecutionPort` (portas de execução de ações
   do enxame, sem caller de produção hoje) não passa pelo `CadenceDispatchers` — se um dia for
   conectado a envio real, o sufixo DEBT-0010 precisará ser replicado na porta de conteúdo ou
   centralizado. Não alterado (fora do caminho real de disparo hoje).
3. `tests/integration/emailReplyTracking.test.ts` chama `hasLeadReplied` sem `since` —
  assinatura retrocompatível, sem alteração necessária.

## Contexto adicional

- `DEBT-0011` (prospecção/cold-email) é do Agente 05 — **não tocado**, conforme instrução.
- `cold-email.service.ts`, `src/lib/email/mailer.ts`, `prisma/schema.prisma`,
  `src/features/integrations/**` — nenhum editado (fora de propriedade).
- PR #389 (optOutRepo durável) não duplicado: o sufixo apenas instrui o lead a usar o
  mecanismo de opt-out já existente; nenhum registro novo foi criado.
