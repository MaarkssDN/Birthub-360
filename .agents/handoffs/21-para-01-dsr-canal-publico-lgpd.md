# Handoff — Canal público de solicitação DSR (LGPD art. 18)

De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: W7 (follow-up do handoff 00→21 portal do titular)
Status: aberto
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
