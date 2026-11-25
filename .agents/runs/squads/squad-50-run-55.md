# Run — Agente 55 (Ícaro) · Conectores de E-mail (SMTP/IMAP/parsing/histórico) · Squad 50

- **Demanda:** DEM-20261123-001 · **Data:** 2026-11-24
- **Runtime:** Devin (subagente)
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-50/wt-55`
- **Branch:** `agente/55-email-connectors-s50` (base `integracao/onda-3-dem20261123` @ `5422d99c3e`)
- **Lease:** `.agents/runs/leases/squad-50-wt55.lease` (portas 22500–22599, sem uso — fatia sem servidor)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`
- **Ownership executado:** `src/lib/integrations/email/**` + `src/features/integrations/email/**` (MATRIZ_PROPRIEDADE linha 55)

## 1. Estado real do conector (functional-completeness)

| Peça | Estado encontrado | Veredito |
|---|---|---|
| Envio SMTP (`src/lib/email/mailer.ts`, legado **sem dono**) | nodemailer + env `SMTP_*`; `MailerNotConfiguredError` fail-closed; **sem timeout, sem retry, sem idempotência, sem registro** | Funcional mínimo; resiliência = gap (fora do ownership → handoff ao Astra) |
| Parsing de e-mail recebido | **Não existia** — nenhum parser MIME, nenhuma dependência IMAP no repo | Era esqueleto: webhook esperava JSON de provedor inexistente |
| Inbound webhook (`emailReply.webhook.ts`) | HMAC + timestamp anti-replay + dedup `providerMessageId` + sanitização + opt-out + classificação + timeline — **completo e testado** | Funcional (stub de transporte documentado) |
| Histórico (`email.routes.ts` GET /messages + `EmailMessage`) | Só leitura; **outbound nunca era persistido** por ninguém | Lacuna real confirmada |
| IMAP/sincronização de mailbox | Inexistente; depende de schema (Squad 10), fila (23) e credenciais por tenant | Fora de alcance desta fatia → handoff formal |

## 2. Fatia implementada (menor valor com evidência)

Duas peças complementares, 100% dentro do ownership, sem rede/credenciais:

**A. Pipeline de parsing inbound** (`src/lib/integrations/email/`):
- `rawEmailParser.ts` — parser RFC5322/MIME dep-free: unfolding, encoded-words RFC2047 (B/Q),
  endereços, multipart/* recursivo (limites 10 níveis/100 partes), base64/QP/7-8bit,
  charset utf-8/latin1/utf-16, html→texto fallback, `Authentication-Results`→SPF/DKIM/DMARC.
  Função total (nunca lança).
- `inboundAdapter.ts` — `parseRawEmail` → payload idêntico ao contrato do webhook;
  `providerMessageId` com fallback hash determinístico; `providerMessageId` explícito aceita
  identidade de transporte (`mailbox:uid`).
- `emailReply.webhook.ts` — exporta `ingestInboundEmailReply()` (mesmo pipeline do HTTP, sem
  duplicação); `senderAuth` opcional no payload → `logger.warn` em fail/permerror
  (observacional, nunca rejeita); lookup de lead extraído para `leadByEmail.ts` compartilhado.

**B. Histórico outbound** (`outboundEmailLog.ts` + `leadByEmail.ts`):
- `recordOutboundEmailMessage()` — persiste `EmailMessage direction:'outbound'` idempotente
  (`@@unique` + P2002→duplicate), resolve lead por `leadId` validado ou por e-mail do
  destinatário, `requestContext` por tenant. **Pronto para wiring** — call-site depende de
  decisão de ownership do `mailer.ts` (handoff ao Astra).

## 3. Arquivos

Novos:
- `src/lib/integrations/email/rawEmailParser.ts`
- `src/lib/integrations/email/inboundAdapter.ts`
- `src/lib/integrations/email/outboundEmailLog.ts`
- `src/lib/integrations/email/leadByEmail.ts`
- `src/lib/integrations/email/__tests__/{rawEmailParser,inboundAdapter,outboundEmailLog}.test.ts`

Alterados:
- `src/features/integrations/email/emailReply.webhook.ts` (lookup compartilhado, ingest exportado, senderAuth warn)

Docs:
- `.agents/handoffs/squad-50/55-para-20-inbound-email-imap-worker.md`
- `.agents/handoffs/squad-50/55-para-00-mailer-ownership-outbound-wiring.md`
- `.agents/handoffs/squad-50/55-para-60-fronteira-canal-email.md`
- `.agents/runs/leases/squad-50-wt55.lease`

## 4. Comandos e resultados

- `npx vitest run -c vitest.unit.config.ts src/lib/integrations/email src/features/integrations/email`
  → **56/56 PASS** (5 arquivos: parser 18, adapter 6, outbound 6, sanitizer 23, webhook 3)
- `npx tsc --noEmit` → **0 erros** (2 erros de tipagem `string|undefined→string|null` encontrados
  e corrigidos durante a execução)
- `npx biome lint <escopo>` → limpo (3 `noAssignInExpressions` corrigidos com `matchAll`)
- `depcruise` no escopo → 0 violações novas (4 known, pré-existentes: cross-feature cadence do
  webhook + 2 circular libs)
- `verify-file-ownership` → OK
- Sem credenciais, sem rede externa, dados 100% sintéticos nos testes.

## 5. Bugs reais encontrados pelos testes (evidência de valor)

1. Charset: input string corrompia UTF-8 no roundtrip latin1 → normalização byte-string.
2. Multipart: preâmbulo/epílogo vazavam como leaf text/plain espúrio → skip de segmentos.
3. CRLF antes do delimitador MIME sujava `bodyText` → `trimEnd` nos leaves.

## 6. Pendências / handoffs

- **Astra (00):** `src/lib/email/**` sem dono; wiring de `recordOutboundEmailMessage` (ver
  `55-para-00-mailer-ownership-outbound-wiring.md`).
- **Ciro (20) + Pietro (11) + Pina (23):** dependências do sync IMAP
  (`55-para-20-inbound-email-imap-worker.md`).
- **Squad 60:** fronteira canal e-mail informada (`55-para-60-fronteira-canal-email.md`).
- `test:integration`/`test:e2e`/build não executados (fatia unitária; gate de integração é do squad).

## 7. SHA congelado (Silas)

- HEAD de `agente/55-email-connectors-s50` — registrado na mensagem de conclusão (o hash não
  pode constar dentro do próprio commit).
