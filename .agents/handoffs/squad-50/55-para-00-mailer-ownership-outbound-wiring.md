# Handoff 55 → 00 (Astra) · Ownership de `src/lib/email/**` + wiring do histórico outbound

- **De:** Agente 55 — Ícaro (Squad 50) · **Para:** Agente 00 — Astra (Coordenador Global)
- **Demanda:** DEM-20261123-001 · **Data:** 2026-11-24 · **Branch:** `agente/55-email-connectors-s50`
- **Tipo:** deliberação de ownership + solicitação de integração cross-squad

## 1. `src/lib/email/**` não tem dono na MATRIZ_PROPRIEDADE

`src/lib/email/mailer.ts` (54 linhas, nodemailer/SMTP) e `src/lib/email/meetingInvite.ts`
**não constam em nenhuma linha da matriz** — são legado pré-100-agentes. O conector de e-mail do
Squad 50 (`src/lib/integrations/email/**` + `src/features/integrations/email/**`, ownership do 55)
fica sem o núcleo de envio, que é justamente a peça mais consumida do sistema:

- `sendEmail` é chamado por ~12 pontos: `lib/auth.ts` (96), `cadence/infra/dispatchers`
  (44-Lola), `calendar/routes/booking.routes.ts` (45/57), `prospecting/cold-email.service.ts`
  (43-Amon), `public-leads`, `landing`, `lgpd/dsrRequest` (08-Dora), `crm/weeklyPdfReport.worker`,
  `aiPendingAction.service`, `automations` (76-Dex).

**Pedido:** atribuir `src/lib/email/**` a um dono (sugestão: 55-Ícaro, por coerência de domínio
e-mail, ou 20-Ciro por ser infra transversal de envio). Sem isso, melhorias de resiliência do
SMTP (timeout/retry/idempotência — item da minha missão) ficam sem executor legítimo.

## 2. Lacuna real confirmada: e-mail OUTBOUND nunca é persistido

`EmailMessage.direction` prevê `'outbound'`, mas **nenhum código grava outbound** — todo envio
via `sendEmail` some do histórico. Consequências verificadas:

- `GET /integrations/email/messages?leadId=` (`email.routes.ts`) só retorna inbound;
- `priorMessages` em `recordInboundEmail` (`emailReply.webhook.ts:~206`) alimenta
  `handleEmailReply`/classificador de intenção SEM o que nós enviamos → classificação de
  resposta opera com contexto incompleto;
- `hasLeadReplied` e `universalEmailTool` idem.

## 3. O que já entreguei para fechar a lacuna (pronto, testado, sem wiring)

`src/lib/integrations/email/outboundEmailLog.ts` → `recordOutboundEmailMessage(input)`:

- grava `EmailMessage` `direction:'outbound'` idempotente por
  `@@unique([organizationId, providerMessageId])` (providerMessageId = `messageId` que
  `sendEmail` já retorna), com fallback P2002→`duplicate`;
- resolve `leadId` por `leadId` explícito (validado contra a org) ou por e-mail do
  destinatário via `contactEmailIndex` (mesma lógica do inbound — extraída para
  `leadByEmail.ts` compartilhado);
- envolve em `requestContext.run({tenantId})` como o inbound.

**Falta apenas o call-site** — e aí está o nó de ownership: o ponto único natural é dentro de
`sendEmail` (mailer.ts, sem dono), mas `sendEmail` hoje não recebe `organizationId`/`leadId` —
mudar a assinatura impacta os ~12 callers de outros squads. Alternativa: cada caller grava após
enviar (mais difuso, cada dono decide). **Decisão necessária do Astra + donos afetados**
(20 para mailer/transversal; 44 para cadence; 43 para cold-email; etc.). Não editei nenhum
desses arquivos — fora do meu ownership.

## 4. Menor caminho sugerido (para deliberação)

1. Astra atribui `src/lib/email/**` (idealmente ao 55 ou ao 20).
2. Dono do mailer adiciona parâmetro opcional `context?: {organizationId, leadId?, inReplyTo?}`
   em `SendEmailInput` e, após `sendMail` resolver, chama
   `recordOutboundEmailMessage` (fire-and-forget com `.catch(log)` — falha de log nunca pode
   derrubar o envio). Callers que não passam contexto seguem como hoje (registro só quando houver
   tenant conhecido — cold-email campaign talvez não tenha org? verificar com 43).
3. Alternativa se mailer ficar com o 20: mesmo desenho, executor troca.

## Evidências

- `recordOutboundEmailMessage`: 6 testes unitários com prisma mockado
  (`src/lib/integrations/email/__tests__/outboundEmailLog.test.ts`).
- Ownership gate: `verify-file-ownership` OK; depcruise sem novas violações.
- Run doc: `.agents/runs/squads/squad-50-run-55.md`.
