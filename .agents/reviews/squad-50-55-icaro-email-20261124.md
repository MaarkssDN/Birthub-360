# Parecer Silas (Agente 09) — Agente 55 Ícaro · Conectores de E-mail · Squad 50

- **Demanda:** DEM-20261123-001 · **Data:** 2026-11-24 · **Instância:** nona (auditoria paralela; escopo disjunto — Agente 55)
- **Branch auditada:** `agente/55-email-connectors-s50` · **SHA congelado:** `19866914a7a164cb303c4b992c3ec483820ce92d`
- **Base do diff:** `5422d99c3e` (`integracao/onda-3-dem20261123`)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-55`
- **Run doc:** `.agents/runs/squads/squad-50-run-55.md` (nome exato confirmado) · **Handoffs:** 3 emitidos (00, 20, 60) — todos presentes e coerentes

## Veredito: APROVADO-COM-CONDICAO

A fatia é coerente, cirúrgica e bem evidenciada. Única condição: **`biome format` reprova 3 arquivos novos e `biome check` aponta organizeImports no webhook — `format:check` é gate real de CI** (`.github/workflows/ci.yml:208`). Correção mecânica (`npx biome format --write` + `biome check --write` no escopo), sem alteração de lógica; reexecutar `format:check` antes do merge.

## Escopo do diff (verificado arquivo a arquivo)

13 arquivos, +1409/−31. Novos: `rawEmailParser.ts` (445 linhas), `inboundAdapter.ts`, `outboundEmailLog.ts`, `leadByEmail.ts`, 3 suítes de teste. Alterado: `emailReply.webhook.ts` (+46/−31). Docs: run doc, lease, 3 handoffs. **Zero arquivos fora do ownership** (`src/lib/integrations/email/**` + `src/features/integrations/email/**` — MATRIZ linha 55). `verify:ownership` → OK (13 alterados, 3 handoffs correspondentes).

## Verificações executadas nesta auditoria (wt-55, SHA congelado)

| Verificação | Resultado |
|---|---|
| `vitest -c vitest.unit.config.ts` no escopo email (lib+features) | **56/56 PASS** (5 arquivos) — reproduz o claim |
| `npx tsc --noEmit` | **0 erros** |
| `npm run lint` (`biome lint src`) no escopo | limpo |
| `npm run lint:architecture` (depcruise) | **0 violações** (70 known/stale pré-existentes) |
| `npm run verify:ownership` | OK |
| `npx biome format` no escopo | **FALHA em 3 arquivos** (ver condição) |
| `npx biome check` no escopo | 4 achados: 3 format + 1 organizeImports (`emailReply.webhook.ts`) |

## Claims críticos — verificados

1. **"Parser nunca lança"** — VERDADEIRO. `parseRawEmail` envolve tudo em try/catch que devolve resultado vazio; `decodeHeaderValue` tem catch interno por encoded-word; limites `MAX_MIME_DEPTH=10`, `MAX_MIME_PARTS=100`, `MAX_BODY_CHARS=512KB`, `MAX_HEADER_BYTES=256KB`. Edge cases cobertos por testes: encoded-words adjacentes (RFC 2047 §6.2), multipart preâmbulo/epílogo, charset latin1 byte-preserving, QP soft-breaks, html→texto, entidades.
2. **"Idempotência real do outbound log"** — VERDADEIRO, não é falso idempotente. `prisma/schema.prisma:3715` tem `@@unique([organizationId, providerMessageId])` em `EmailMessage` (constraint pré-existente; o commit não tocou o schema — diff vazio em `prisma/`). O catch P2002→`'duplicate'` em `outboundEmailLog.ts:86-91` é backstop de corrida real, com checagem prévia `findUnique` em :50-56. Teste unitário mocka P2002 (:73-78).
3. **Webhook refatorado sem regressão** — `findOpenLeadByEmail` extraído para `leadByEmail.ts` (lógica idêntica, incluindo o guard `emailIndex` null); `ingestInboundEmailReply` reutiliza `recordInboundEmail` — mesmo pipeline HTTP/programático, sem duplicação. `senderAuth` é estritamente observacional (warn em fail/permerror, nunca rejeita) — decisão correta: HMAC já autenticou o transporte.
4. **Ownership estrito** — confirmado; nenhum arquivo de outro dono tocado.
5. **Estado encontrado documentado** — `src/lib/email/mailer.ts` (nodemailer, sem timeout/retry/persistência) confirmado sem entrada na MATRIZ_PROPRIEDADE → órfão real; handoff ao 00 emitido. Parsing MIME realmente não existia antes.

## Condição de aceite (bloqueante para merge)

**C1 — Format gate:** `npx biome format src/lib/integrations/email src/features/integrations/email` reprova:
- `src/lib/integrations/email/rawEmailParser.ts`
- `src/lib/integrations/email/__tests__/rawEmailParser.test.ts`
- `src/lib/integrations/email/__tests__/outboundEmailLog.test.ts`
- e `biome check` aponta `organizeImports` em `src/features/integrations/email/emailReply.webhook.ts` (imports adicionados fora de ordem).

Aplicar `biome format --write` + `biome check --write` nos 4 arquivos, commitar e reexecutar `npm run format:check` + `npm run lint` + vitest do escopo. Sem mudança de lógica esperada. (Precedente interno: mesmo veredito APROVADO-COM-CONDICAO foi dado ao Agente 32 Ema por idêntico motivo — `4cb8d58728`.)

## Observações não-bloqueantes

- `references` header não é saneado de colchetes (diferente de `messageId`/`inReplyTo`) — campo hoje só propagado, sem consumidor; registrar se virar chave de dedup.
- `parseSenderAuth` regex `\b(spf|dkim|dmarc)\s*=` pode casar `header.dkim=` dentro de `Authentication-Results` — semanticamente equivalente (é veredito DKIM de qualquer forma); observacional apenas.
- `bodyText` de multipart prefere o ÚLTIMO `text/plain` — correto para `multipart/alternative` (ordem crescente de fidelidade); em `multipart/mixed` com múltiplos plain incomuns, pega o último — aceitável para reply-tracking.
- Fatia sem wiring é **coerente e aceitável**: parser+adapter+log são peças testáveis e o wiring depende de decisões de outros donos (mailer→00, schema→11, fila→23). Claims de "funcional" no run doc estão corretamente qualificados como fundação, não endpoint ativo.

## Pendências registradas para o Astra (00) — confirmadas como legítimas

1. `src/lib/email/**` (mailer.ts, meetingInvite.ts) sem dono na matriz — precisa deliberação de ownership; `recordOutboundEmailMessage` aguarda wiring em `sendEmail` (~12 call sites).
2. Sync IMAP depende de schema novo (Squad 10/11) + fila BullMQ (23) + credenciais por tenant — handoffs formais emitidos a 20, 11 e 23 via 20.
3. Fronteira de canal e-mail comunicada à Squad 60 (Kiko/Lena) — evita duplicidade de inbox.

## Integridade do processo

- SHA congelado `19866914a7` corresponde exatamente ao HEAD auditado; worktree limpa.
- Sem push realizado; parecer commitado apenas na branch `agente/09-audit-onda3`.
- Nenhum código de produção editado por este auditor.
