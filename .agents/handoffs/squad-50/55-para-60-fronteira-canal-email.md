# Handoff 55 → 60 (Kiko/Teca/Eli) · Fronteira do canal e-mail no pipeline de mensagens

- **De:** Agente 55 — Ícaro (Squad 50) · **Para:** Squad 60 — Kiko (66), Teca (67), Eli (69)
- **Demanda:** DEM-20261123-001 · **Data:** 2026-11-24 · **Branch:** `agente/55-email-connectors-s50`
- **Tipo:** informativo/fronteira (mesmo padrão do handoff 50→00 sobre WhatsApp)

## O que mudou no canal e-mail

1. **Inbound**: além do webhook HTTP (provedor externo), agora existe porta programática
   `ingestInboundEmailReply()` + parser MIME `parseRawEmail()` + adaptador
   `buildInboundEmailPayload()` em `src/lib/integrations/email/` — prontos para um futuro sync
   IMAP (deps no handoff `55-para-20-inbound-email-imap-worker.md`).
2. **Outbound**: `recordOutboundEmailMessage()` pronto para persistir `EmailMessage`
   `direction:'outbound'` (hoje nada grava — ver handoff `55-para-00-...`). Quando o wiring
   acontecer, o histórico de e-mail por lead ficará completo.
3. **Opt-out**: réplicas de e-mail já passam por `isOptOutKeyword`/`recordOptOut` com
   `originChannel: 'email'` e marcam `optOut`/`optOutEmail` em Lead/Contact — o canal 'email'
   já está integrado ao `optOutService` compartilhado.
4. **Sanitização**: `sanitizeInboundEmailBody` (meu arquivo) remove scripts, iframes, handlers
   `on*`, URIs `javascript:`/`data:text/html` e pixels de rastreamento antes de persistir —
   se o Inbox Unificado (66) for renderizar `EmailMessage.body`, o conteúdo já vem sanitizado,
   mas recomendo tratar como texto (não HTML confiável) por defesa em profundidade.

## Fronteira proposta (para registro, sem ação imediata)

- **55 Ícaro**: transporte e pipeline de e-mail (SMTP outbound via mailer compartilhado,
  parsing MIME, ingest de respostas, histórico `EmailMessage`).
- **Squad 60**: apresentação no inbox unificado, templates de mensagem e políticas de opt-out
  por canal — `EmailMessage` é só mais um `direction/channel` para vocês consumirem.

Sem bloqueio: nada aqui exige mudança em código do Squad 60 nesta onda.
