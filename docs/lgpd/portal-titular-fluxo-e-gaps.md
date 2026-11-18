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

---

## 4. Atualização — canal público DSR implementado (2026-11-18)

Os gaps G1–G5 foram endereçados e **aprovados pelo Agente 24**
(`.agents/reviews/24-revisao-pr381-agente01-handoffs.md`,
`.agents/reviews/24-revisao-pr385-agente02-handoffs.md` — ambos APROVADO).
Estado na data desta atualização: código em PRs aprovados, **pendente de merge e
de aplicação da migration em deploy** (etapa de integração do Coordenador, não
trabalho aberto do Agente 21).

| # | Gap | Novo estado | Evidência |
|---|---|---|---|
| G1 | Canal público self-service de solicitação DSR | **IMPLEMENTADO (PR #381 + PR #385)** | Backend: `POST /api/public/data-subject-requests`, `POST .../verify`, `GET .../status/:statusToken` em `src/features/lgpd/dsrRequest.routes.ts`, montados em `src/bootstrap/routes.ts` sob `/api/public/data-subject-requests`, com `dsrLimiter` dedicado (10 req/15 min por IP, `src/bootstrap/rateLimiters.ts`). Frontend: `DsrRequestForm` embutido na `/privacy` (§5.1), páginas públicas `/privacidade/dsr/verificar` e `/privacidade/dsr/acompanhamento` (`src/features/lgpd/pages/`, rotas em `src/App.tsx`, PR #385). |
| G2 | Verificação de identidade do titular | **IMPLEMENTADO** | Token de verificação de 32 bytes, uso único, expiração 72h, persistido só como SHA-256 (`verificationTokenHash`); `contactId` só é resolvido após o `/verify` (nunca confiado no submit). Resposta do `POST /` é 202 idêntica exista ou não o titular (anti-enumeração). E-mail do titular cifrado (`emailEncrypted`, AES-256-GCM) + blind index (`emailIndex`). |
| G3 | Confirmação ao titular e protocolo/SLA | **IMPLEMENTADO** | E-mail transacional único na solicitação com protocolo opaco, prazo de resposta art. 19 (15 dias) e links de verificação/acompanhamento (`dsrRequest.service.ts`). Dossiê de portabilidade devolvido **uma única vez** na resposta do `/verify` — não persistido (evita duplicar PII em repouso). `CORRECTION`/`SHARING_INFO` caem em `IN_PROGRESS` para tratamento manual do DPO (`detailsEncrypted` guarda o texto do titular, cifrado). |
| G4 | Modelo de solicitação DSR com status | **IMPLEMENTADO** | Model `DataSubjectRequest` + enums `DataSubjectRightType`/`DataSubjectRequestStatus` (`prisma/schema.prisma`), migration `20261117231500_data_subject_request_dsr` com RLS `tenant_isolation` forçada. `GET /status/:statusToken` retorna só metadados (protocolo, tipo, status) — sem PII. Auditoria `DSR_REQUEST_CREATED`/`DSR_COMPLETED`/`DSR_IN_PROGRESS`/`DSR_REJECTED` com `subjectHash` SHA-256 (sem PII). Direitos executados reusam `exportDataSubjectDossier`, `lgpdService.eraseContact` (encadeia `consentAuditChain.revokeConsent`) e `revokeConsent` com reason `TITULAR_REQUEST`. |
| G5 | Sweep de retenção dos leads `landing_360` | **IMPLEMENTADO (PR #381)** | `src/features/lgpd/jobs/landingLeadRetention.worker.ts` — fila BullMQ dedicada, scheduler diário 04:15 (`upsertJobScheduler`), descoberta cross-tenant só sobre `Lead` via `bypassRls`, anonimização por tenant dentro de `eraseDataSubject` (que grava `OptOutRecord` antes de destruir — B-13). Critério conservador: `source='landing_360'` + `status='Lead_Recebido'` + `updatedAt <= 90d` (o prazo "demo+30d" não se aplica — não existe campo de demo agendada; decisão documentada no handoff `21-para-01-retencao-leads-landing-lgpd.md`). Guarda extra: pula titular com outro lead em andamento. Idempotente. Teste de integração escrito (`tests/integration/landing-lead-retention-sweep.test.ts`) — executa no gate de CI com Postgres real. |
| G6 | Cobertura do dossiê de portabilidade | **ABERTO (baixo)** | Mantido como nota: `PublicLeadConsent`/`OptOutRecord`/propostas seguem fora do dossiê. Os campos PII do novo `DataSubjectRequest` já constam em `INVENTARIO_CAMPOS_PII.md` (regenerado nesta branch — 38 campos em 18 models). Reavaliar no próximo ROPA. |
| G7 | Texto de consentimento da landing (rascunho legal) | **ABERTO (governança)** | Sem mudança — aguarda OK do Marcelo (`consentimento-lead.md` §4). Não é gap de código. |

**Pendências operacionais pós-merge (não são trabalho aberto do Agente 21):**

1. Merge de PR #381 antes/junto de PR #383 (dependência `company` em chat) e PR #385;
   aplicar a migration `20261117231500_data_subject_request_dsr` no deploy.
2. `tests/integration/landing-lead-retention-sweep.test.ts` e o fluxo DSR ponta a
   ponta dependem de Postgres real — rodam no gate de integração/CI.
3. Tenant do DSR público é único (organização da landing, `LANDING_LEAD_ORGANIZATION_ID`,
   resolvido no servidor) — DSR multi-tenant exigiria canal por tenant; decisão
   registrada no handoff `21-para-01-dsr-canal-publico-lgpd.md`. Avaliar se clientes
   tenants precisarão de canal próprio no futuro (registrar no ROPA se virar escopo).

**Veredito atualizado:** o fluxo completo do titular — solicitação self-service,
verificação de identidade por token, execução do direito, protocolo/status com SLA
de 15 dias, confirmação por e-mail e auditoria sem PII — está implementado de ponta
a ponta (backend PR #381 + frontend PR #385, ambos aprovados pelo Agente 24). O
canal manual via DPO permanece como fallback. Restam apenas G6 (avaliação de
cobertura do dossiê) e G7 (aprovação legal do texto), nenhum bloqueador de
conformidade técnica.
