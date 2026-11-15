# Mapa do fluxo do titular LGPD (portal/direitos do titular)

**Autor:** Agente 21 — Privacidade e LGPD
**Data:** 2026-11-14
**Base:** worktree `agente/21-onda2-handoffs` (branch `agente/21-onda2-handoffs`)
**Origem:** handoff `00-para-21-lgpd-portal-titular.md` (Onda W7, prioridade alto)

Este documento inventaria o fluxo completo exigido —
**solicitação → verificação de identidade → exportação → eliminação/anonimização →
confirmação → auditoria** — classificando cada etapa como IMPLEMENTADA, PARCIAL ou
AUSENTE, com evidência de código. Gaps fora do escopo do Agente 21 viraram handoffs
para os donos (`.agents/handoffs/21-para-01-*.md`).

---

## 1. Etapa a etapa

### 1.1 Solicitação do titular — PARCIAL / canal indireto

| Peça | Estado | Evidência |
|---|---|---|
| Canal público formal de DSR (form/endpoint sem login) | **AUSENTE** | Não existe rota pública de solicitação de direitos. `src/bootstrap/routes.ts` só monta `/api/lgpd` atrás de `authenticateToken + requireTenant` (L179) e `/api/public/demo-leads` (L108). |
| Canal informal (e-mail do DPO) | IMPLEMENTADO (documental) | `src/pages/PrivacyPolicy.tsx` §6 aponta `marcelo.nascimento@birthub360.com` como DPO; e-mail de confirmação do lead aponta para `/privacy` (`src/features/public-leads/publicLead.confirmationEmail.ts` L18–28 — atrás de flag `LANDING_LEAD_CONFIRMATION_EMAIL_ENABLED`, desligada por padrão, `src/config/env.ts` L106). |
| Execução pelos direitos por operador | IMPLEMENTADO | `DataSubjectRights.tsx` (montado em `src/features/settings/components/Settings.tsx` L317) + rotas autenticadas `DELETE /api/lgpd/titular/:contactId` e `GET /api/lgpd/titular/:contactId/export` (`src/features/lgpd/lgpd.routes.ts` L14–88), ambos com `requireRole(['ADMIN','GESTOR'])`. |
| Link público "Direitos do Titular" na landing | **AUSENTE** | `/privacy` existe e é linkado (`src/App.tsx` L115; footers da landing), mas não há fluxo público de DSR — a Política diz "através dos canais de contato" sem canal estruturado. |

### 1.2 Verificação de identidade do titular — AUSENTE

- Nenhuma verificação de identidade existe para o exercício de direitos: as rotas
  `/api/lgpd/titular/*` operam sobre `contactId` interno, acionadas por ADMIN/GESTOR
  que "comprovam" a solicitação fora do sistema.
- `eraseContact`/`exportContactData` não exigem prova de identidade do titular —
  aceitável enquanto o canal for manual via DPO, **inaceitável** se um canal público
  self-service for criado sem verificação (handoff `21-para-01-dsr-canal-publico-lgpd.md`).

### 1.3 Exportação / portabilidade (Art. 18, V) — IMPLEMENTADO

- `src/shared/services/dataSubjectPortability.service.ts` — `exportDataSubjectDossier`:
  dossiê completo (cadastro + customFields, leads, mensagens WhatsApp, voice calls com
  transcrição/resumo, conversas Copiloto IA com segmentos e insights, timeline events),
  pacote JSON + criptografia AES-256-GCM opcional (senha via header
  `x-lgpd-export-password`, nunca query string — `lgpd.routes.ts` L63–67), auditoria
  `PORTABILITY_EXPORT_LGPD_ART_18` sem PII.
- Rota autenticada `GET /api/lgpd/titular/:contactId/export` com RBAC e `tenantId`
  exclusivamente do usuário autenticado (nunca de header do cliente — comentário
  explícito em `lgpd.routes.ts` L19–23).
- Lacuna de cobertura (registrada, não bloqueante): o dossiê cobre Contact/Lead/
  WhatsApp/Voz/Copiloto/Timeline. Categorias fora desse grafo (ex.: dados de
  `PublicLeadConsent`, `OptOutRecord`, propostas/contratos em `crm360`) não entram
  no export — avaliar no inventário ROPA se devem compor a portabilidade.

### 1.4 Eliminação / anonimização (Art. 18) — IMPLEMENTADO

- `src/shared/services/dataSubjectErasure.service.ts` — `eraseDataSubject`:
  transação ACID (`runInTransaction`); cria `OptOutRecord` de supressão **antes** de
  destruir identificadores (B-13/§27); anonimiza Contact (nome →
  `[titular anonimizado — LGPD]`, zera e-mail/telefone/WhatsApp/LinkedIn/nascimento/
  observações/customFields); mascara `WhatsAppMessage.body`; redige
  `ConversationSignal`, `TimelineEvent`, `VoiceCallLog` (transcript/summary/
  recordingUrl); anonimiza Copiloto (transcripts, insights, sugestões CRM,
  avaliações, `audioObjectKey` + `deletedAt`); limpa `AgentMemory`; grava
  `AuditLog` `ERASURE_LGPD_ART_18` com hash do titular (sem PII); apaga objetos de
  áudio no S3/MinIO e chaves de cache Redis.
- `src/features/lgpd/lgpd.service.ts` `eraseContact`: captura o e-mail do titular
  **antes** da anonimização e encadeia `consentAuditChain.revokeConsent` com
  `ERASURE_REQUEST` (REMED-06) — revogação + `ConsentPurgeTask` (outbox) +
  crypto-shredding da chave do titular. Best-effort pós-commit com log de
  reconciliação (L50–58).
- Supressão contínua: `optOutCheck.service.ts` (`checkOptOutStatus`,
  `assertOptOutStatus`, `isOptOutKeyword` — palavra-chave `SAIR`) é consultado pelos
  dispatchers (`multichannelDispatcher.service.ts` L17,
  `adaptiveMultichannelCadence.service.ts` L155).
- Retenção automatizada parcial: `src/features/crm/jobs/autoAnonymizeDisqualified.worker.ts`
  anonimiza leads `Negocios_Perdidos` > 90 dias via `eraseDataSubject`.
  **Lacuna:** não há sweep dedicado aos leads `landing_360` (`Lead_Recebido`), cuja
  retenção confirmada pelo Marcelo é "90 dias sem avanço ou demo + 30 dias" —
  handoff `21-para-01-retencao-leads-landing-lgpd.md`.
- Schema (propriedade do 01, só inventariado): `OptOutRecord` (schema.prisma L3174),
  `PublicLeadConsent` (L5659 — prova de consentimento com texto integral, versão e
  `grantedAt`), `ConsentAuditRecord`/`ConsentAuditChainHead`/`ConsentSubjectKey`/
  `ConsentSubjectKeyTombstone`/`ConsentPurgeTask` (L5714+, cadeia append-only com
  hash-chain, crypto-shredding e triggers de imutabilidade).

### 1.5 Confirmação ao titular — PARCIAL

| Peça | Estado | Evidência |
|---|---|---|
| Confirmação de recebimento do pedido de demo | IMPLEMENTADO (flag off) | `publicLead.confirmationEmail.ts` — melhor esforço, sem PII em log. |
| Confirmação de conclusão de pedido DSR (acesso/exclusão respondido) | **AUSENTE** | Nenhum e-mail/notificação ao titular quando um pedido é atendido. |
| Confirmação visual ao operador | IMPLEMENTADO | toast + mensagem em `DataSubjectRights.tsx` L81/L103. |
| Status/rastreio do pedido (protocolo, SLA de resposta — art. 19: 15 dias) | **AUSENTE** | Nenhum modelo/endpoint de "solicitação DSR" com status, protocolo ou prazo. |

### 1.6 Auditoria — IMPLEMENTADO

- `AuditLog` genérico via extensão Prisma (`src/lib/prisma.ts`) + registros explícitos
  `LGPD_TITULAR` DELETE/EXPORT e `LGPD_OPTOUT` UPDATE (`lgpd.routes.ts` L31–39,
  L76–83, L157–165) e `ERASURE_LGPD_ART_18` / `PORTABILITY_EXPORT_LGPD_ART_18`
  dentro dos services.
- Cadeia de consentimento append-only `ConsentAuditRecord` (hash-chain SHA-256,
  genesis imutável, `ConsentSubjectKey` com crypto-shredding e tombstone por trigger)
  — `src/lib/security/consentAuditChain.service.ts`,
  `prismaConsentAuditChain.repository.ts`, `s3ObjectLockConsentCheckpoint.store.ts`,
  wiring em `src/bootstrap/consentPurgeWiring.ts`.
- Consulta: `GET /api/lgpd/audit-logs` (ADMIN/GESTOR) + componente `AuditLogs.tsx`.

---

## 2. Gaps classificados

| # | Gap | Severidade | Dono proposto | Handoff |
|---|---|---|---|---|
| G1 | Canal público self-service de solicitação DSR (form + endpoint rate-limited, sem login) | **Bloqueador de conformidade** — hoje o titular depende de e-mail manual ao DPO | 01 (endpoint/schema) + 02 (UI) | `21-para-01-dsr-canal-publico-lgpd.md` |
| G2 | Verificação de identidade do titular antes de exportar/excluir | Alto — pré-requisito de G1 | 01 | mesmo handoff G1 |
| G3 | Confirmação ao titular (recebimento + conclusão) e protocolo/SLA do pedido | Alto | 01 (e-mail transacional já existe: `lib/email/mailer.ts`) | mesmo handoff G1 |
| G4 | Modelo/endpoint de "solicitação DSR" com status (aberta → em verificação → atendida → expirada) | Alto — necessário para SLA art. 19 e auditoria do ciclo | 01 (schema: `prisma/schema.prisma` é dele) | mesmo handoff G1 |
| G5 | Sweep de retenção dos leads `landing_360` (90d sem avanço / demo+30d) | Médio — retenção confirmada pelo Marcelo sem implementação | 01 | `21-para-01-retencao-leads-landing-lgpd.md` |
| G6 | Cobertura do dossiê de portabilidade (PublicLeadConsent, OptOutRecord, propostas) | Baixo — avaliar contra ROPA | 21 + 01 | nota neste doc; reavaliar no próximo ROPA |
| G7 | Texto de consentimento da landing ainda é rascunho aguardando OK legal do Marcelo | Governança — fora de código | Marcelo/00 | `docs/lgpd/consentimento-lead.md` §4 |

## 3. Veredito

O **miolo operacional** do portal (exportação completa, anonimização transacional
abrangente, supressão de canal, cadeia de consentimento com crypto-shredding e
auditoria imutável) está implementado e testado. O que falta é a **camada de
entrada self-service** (G1–G4) e um **sweep de retenção** (G5) — ambos dependem de
schema/endpoint, propriedade do Agente 01. Enquanto G1 não existir, o canal real do
titular é o e-mail do DPO documentado na Política de Privacidade, o que é defensável
operacionalmente mas deve constar como pendência de conformidade formal.
