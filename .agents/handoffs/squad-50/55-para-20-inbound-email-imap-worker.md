# Handoff 55 → 20 (Ciro) · Dependências para sync IMAP de e-mail inbound

- **De:** Agente 55 — Ícaro (Squad 50) · **Para:** Agente 20 — Ciro (Squad 20, Backend & Contratos)
- **Demanda:** DEM-20261123-001 · **Data:** 2026-11-24 · **Branch:** `agente/55-email-connectors-s50`
- **Tipo:** dependência cross-squad (implementação futura, não bloqueia o entregue)

## Contexto

O conector de e-mail inbound hoje só existe como webhook HTTP
(`src/features/integrations/email/emailReply.webhook.ts`), projetado para um provedor de
inbound-parse (SendGrid/Postmark/Mailgun) que ainda não foi plugado. A alternativa IMAP —
mailbox real por tenant, polling de mensagens novas — precisa de peças que são propriedade do
Squad 20/Squad 10 e por isso não foram implementadas por mim (ownership estrito).

## O que JÁ está pronto e é reutilizável (meu ownership, testado)

1. **Parser MIME/RFC822** — `src/lib/integrations/email/rawEmailParser.ts`
   `parseRawEmail(buffer|string) → ParsedInboundEmail`: Message-ID, In-Reply-To, From/To,
   Subject (encoded-words RFC 2047), Date, Auto-Submitted, corpo text/plain preferido com
   fallback text/html→texto, multipart/* recursivo, base64/QP, charset utf-8/latin1, e
   vereditos SPF/DKIM/DMARC de `Authentication-Results`/`Received-SPF`. Função total, nunca lança.
2. **Adaptador** — `src/lib/integrations/email/inboundAdapter.ts`
   `buildInboundEmailPayload(parsed, {organizationId, toEmail, leadIdHint?, providerMessageId?})`
   → payload idêntico ao contrato do webhook; `providerMessageId` cai para hash determinístico
   quando falta Message-ID (dedup estável). `toInboundEmailReply()` monta o tipo de domínio.
3. **Ingest programático** — `ingestInboundEmailReply(email, toEmail, leadIdHint, senderAuth?)`
   exportado de `emailReply.webhook.ts`: MESMO pipeline do HTTP (auto-reply → dedup por
   providerMessageId → resolução de lead → opt-out → classificação → timeline). Um worker IMAP
   chama isto direto, sem HTTP.
4. **`senderAuth` observacional** — vereditos SPF/DKIM/DMARC `fail`/`permerror` geram `logger.warn`
   de auditoria, nunca rejeição (decisão documentada: política de rejeição por auth de domínio
   cabe ao sync, não ao ingest).

## O que falta (dependências fora do meu ownership)

| # | Peça | Dono proposto | Observação |
|---|------|---------------|------------|
| 1 | Credenciais de mailbox IMAP por organização (host/porta/user/pass criptografado, mailbox de destino) | **11 Pietro** (schema) + **51 Bela** (padrão de credenciais — `secretFields.ts` AES-256-GCM já existe) | Hoje `SMTP_*` é conta única compartilhada; o webhook documenta que não há mailbox por tenant — IMAP precisa resolver isso antes do primeiro sync. |
| 2 | Worker/fila de polling IMAP (schedule, backoff, DLQ, lock por mailbox) | **23 Pina** (`src/lib/queue/**`) + **24 Ivo** (retry/DLQ) | Cliente IMAP (ex.: `imapflow`) seria dependência nova — decisão do squad. |
| 3 | Resolução `organizationId` por mensagem (mailbox→tenant) | 20/10 | Com mailbox dedicada por org, é lookup direto; com alias compartilhado, precisa de tag/convenção — decisão de produto. |
| 4 | Registro de e-mail OUTBOUND | ver handoff `55-para-00-mailer-ownership-outbound-wiring.md` | Sem isso, `priorMessages` da classificação continua sem o que enviamos. |

## Contrato de uso (para o futuro worker)

```ts
import { parseRawEmail } from '@/lib/integrations/email/rawEmailParser.js';
import { buildInboundEmailPayload } from '@/lib/integrations/email/inboundAdapter.js';
import { ingestInboundEmailReply } from '@/features/integrations/email/emailReply.webhook.js';

const parsed = parseRawEmail(rawBuffer);            // bytes do IMAP
const payload = buildInboundEmailPayload(parsed, {
  organizationId,                                    // resolvido mailbox→tenant
  toEmail: mailboxAddress,
  providerMessageId: `${uidValidity}:${uid}`,        // mais estável que Message-ID
});
if (payload) {
  const reply = toInboundEmailReply(payload, '');    // leadId resolvido pelo ingest
  await ingestInboundEmailReply(reply, payload.toEmail, null, payload.senderAuth);
}
```

## Critério de aceite sugerido para a integração futura

Worker puxa mensagem de mailbox de teste → `EmailMessage` inbound persistido com
`providerMessageId` estável → re-sync da mesma mensagem retorna `duplicate` (idempotência) →
resposta classificada aparece em `GET /integrations/email/messages?leadId=` e no timeline.

## Evidências

- Testes: `src/lib/integrations/email/__tests__/` (30 testes: parser 18, adapter 6, outbound 6)
  — todos com dados sintéticos, sem rede/credenciais.
- Run doc: `.agents/runs/squads/squad-50-run-55.md`.
