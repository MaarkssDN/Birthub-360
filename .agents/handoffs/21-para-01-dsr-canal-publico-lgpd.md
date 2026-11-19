# Handoff — Canal público de solicitação DSR (LGPD art. 18)

De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: W7 (follow-up do handoff 00→21 portal do titular)
Status: em-andamento (backend implementado pelo 01 em 2026-11-17 — branch `agente/01-handoffs-20261117`; pendente: aplicar migration `20261117231500_data_subject_request_dsr`, páginas frontend `/privacidade/dsr/*` (handoff 01→02 aberto), teste de integração e parecer do Agente 24)
Prioridade: bloqueador (conformidade)
Sprint destino: próxima onda

## Problema

O exercício dos direitos do titular hoje só é possível por rota autenticada
(`DELETE/GET /api/lgpd/titular/:contactId`, ADMIN/GESTOR) ou por e-mail manual ao
DPO. Não existe canal público self-service: o titular que preencheu a landing não
consegue pedir acesso/exclusão/portabilidade sem login. Verificação de identidade,
confirmação ao titular e protocolo/SLA do pedido também não existem.

Inventário completo do que já existe:
`docs/lgpd/portal-titular-fluxo-e-gaps.md` (gaps G1–G4).

## Arquivo(s) envolvido(s)

- Novo endpoint público (sugestão: `POST /api/public/data-subject-requests` +
  `GET /api/public/data-subject-requests/:token` para status), montado em
  `src/bootstrap/routes.ts` ao lado de `/api/public/demo-leads` — rate limit
  obrigatório (ver `publicLeadLimiter` em `src/bootstrap/rateLimiters.ts` L123–135).
- Schema novo (solicitação DSR com protocolo, tipo de direito, status, token de
  verificação) — `prisma/schema.prisma` é propriedade sua; abrir migração.
- Reuso obrigatório: `exportDataSubjectDossier`
  (`src/shared/services/dataSubjectPortability.service.ts`),
  `eraseDataSubject` (`src/shared/services/dataSubjectErasure.service.ts`),
  `lgpdService.eraseContact` (encadeia revogação na `ConsentAuditChain`),
  `lib/email/mailer.ts` (confirmação transacional — padrão de
  `publicLead.confirmationEmail.ts`).

## Especificação LGPD (decidida pelo 21)

1. **Solicitação:** campos mínimos — e-mail do titular, tipo de direito
   (acesso/portabilidade, correção, eliminação, revogação de consentimento,
   informação sobre compartilhamento), canal de contato preferencial. Protocolo
   opaco + token de verificação enviado por e-mail (nunca expor `contactId`).
2. **Verificação de identidade:** token de uso único com expiração (sugestão 24–72h)
   enviado ao e-mail cadastrado do titular; alternativa: confirmação de posse do
   e-mail + dados complementares. Sem verificação, NENHUM dado é exportado ou
   excluído — resposta genérica anti-enumeração ("se o e-mail existir, enviaremos
   instruções").
3. **Confirmação:** e-mail de recebimento (protocolo + prazo de resposta — art. 19,
   15 dias) e e-mail de conclusão com link do dossiê (se portabilidade) — pacote
   já criptografável via `encryptionPassword` do portability service.
4. **Status:** modelo persistido permite ao titular consultar o andamento pelo
   token; todo ciclo auditado em `AuditLog` (sem PII — hash do titular, padrão já
   usado em `ERASURE_LGPD_ART_18`).
5. **Tenancy:** o tenant é resolvido no servidor (config), nunca pelo client;
   dados do titular só são localizados após verificação de identidade.
6. **LGPD extra:** incluir na solicitação a opção de revogação de consentimento —
   deve encadear `consentAuditChain.revokeConsent` (mesmo caminho de
   `lgpd.service.ts` L40–64).

## Teste esperado

- Fluxo completo: solicitação → e-mail com token → verificação → exportação/
  eliminação → confirmação → registros de auditoria.
- Token inválido/expirado/usado → recusa sem vazar existência do titular.
- Rate limit ativo; nenhum PII em logs; RLS/tenant isolation nos novos models.

## Contexto adicional

- `ConsentAuditRecord`/`ConsentSubjectKey`/`ConsentPurgeTask` já existem
  (schema.prisma L5714+) — reusar para revogação e crypto-shredding.
- O canal manual via DPO (e-mail em `/privacy`) permanece válido como fallback
  enquanto o self-service não existir.

## Resolução (Agente 01 — 2026-11-17)

**Schema + migration (propriedade do 01):**
- `prisma/schema.prisma`: enums `DataSubjectRightType`/`DataSubjectRequestStatus`
  e model `DataSubjectRequest` (protocolo opaco, tipo de direito, status, e-mail
  CIFRADO via `encryptField` + blind index `contactEmailIndex`, hashes SHA-256
  dos tokens, `contactId` resolvido só pós-verificação, `resultSummary` Json
  não-PII). Back-relation em `Organization`.
- `prisma/migrations/20261117231500_data_subject_request_dsr/migration.sql`:
  CREATE TYPE/TABLE/INDEX + RLS `tenant_isolation` forçada (mesmo padrão de
  `PublicLeadConsent`). Classificação: ADITIVA.

**Backend implementado:**
- `src/features/lgpd/dsrRequest.schema.ts` — Zod (rightType = enum do schema).
- `src/features/lgpd/dsrRequest.service.ts` — fluxo completo:
  - `createDataSubjectRequest`: tenant via `LANDING_LEAD_ORGANIZATION_ID`
    (nunca pelo client); 202 idêntico exista ou não o titular (anti-enumeração);
    token de verificação 32B uso único, expiração 72h, guardado só como SHA-256;
    `statusToken` opaco para acompanhamento; e-mail único com protocolo + prazo
    art. 19 (15d) + links de verificação/acompanhamento.
  - `verifyDataSubjectRequest`: valida protocolo+token+status+expiração (erro
    único `invalid_or_expired_token`); resolve contactId pelo emailIndex;
    EXECUTA o direito na mesma chamada — ACCESS/PORTABILITY →
    `exportDataSubjectDossier` (pacote devolvido uma única vez na resposta,
    NÃO persistido); ERASURE → `lgpdService.eraseContact` (encadeia
    `consentAuditChain.revokeConsent`, mesmo caminho das rotas autenticadas);
    CONSENT_REVOCATION → `revokeConsent` com reason `TITULAR_REQUEST`;
    CORRECTION/SHARING_INFO → `IN_PROGRESS` (tratamento manual DPO,
    `detailsEncrypted` guarda o texto do titular).
  - `getDataSubjectRequestStatus`: só metadados (protocolo/rightType/status) —
    sem PII, e-mail ou contactId.
  - Auditoria: `AuditLog` com ações `DSR_REQUEST_CREATED`/`DSR_COMPLETED`/
    `DSR_IN_PROGRESS`/`DSR_REJECTED`, `subjectHash` = sha256(org:contactId) —
    sem PII (padrão `ERASURE_LGPD_ART_18`).
- `src/features/lgpd/dsrRequest.routes.ts` — 3 endpoints públicos montados em
  `src/bootstrap/routes.ts` (`POST /`, `POST /verify`, `GET /status/:token`)
  ANTES de `/api/public`; rate limit dedicado `dsrLimiter` (10/15min por IP)
  em `src/bootstrap/rateLimiters.ts`.

**Decisões assumidas (registradas):**
- Tenant único = organização da landing (mesma config do `publicLead`). Titular
  de OUTRO tenant não é encontrado → resposta genérica (fail-closed). DSR
  multi-tenant exigiria canal por tenant — fora de escopo, documentado.
- Um único e-mail transacional na solicitação (protocolo + token de verificação
  + link de status) em vez de dois envios — menos ruído, mesmo efeito do item 3.
- Dossiê de portabilidade NÃO é persistido (evita duplicar PII em repouso): é
  devolvido uma vez na resposta do `/verify` via TLS.
- `CORRECTION`/`SHARING_INFO` vão para `IN_PROGRESS` (DPO manual) — não há
  aplicação automática segura de correção de dados.

**Pendente (não fechado):**
- Migration NÃO aplicada (deploy é decisão do 00/08A); `npx prisma generate`
  rodado localmente para tipos.
- Páginas frontend `/privacidade/dsr/verificar` e `/acompanhamento` NÃO existem
  — links dos e-mails apontam para elas; handoff 01→02 aberto.
- Teste de integração do fluxo completo (Postgres real) pendente — há teste
  unitário de rotas (`tests/unit/features/lgpd/dsrRequest.routes.test.ts`,
  anti-enumeração + token inválido + status sem PII) e `npx tsc --noEmit`/`lint`
  verdes; cobertura de integração deve rodar no gate.
- Página `/privacy` pode linkar o canal quando o frontend existir.
