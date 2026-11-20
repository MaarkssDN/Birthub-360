# Handoff — Portal/direitos do titular LGPD

De: 00 — Coordenador
Para: 21 — Privacidade e LGPD
Onda: W7
Status: resolvido (2026-11-18 — gaps G1–G5 implementados e aprovados pelo Agente 24; pendências são operacionais pós-merge, ver Resolução)
Prioridade: alto (conformidade)
Sprint destino: próxima onda

## Problema

Auditoria marcou "Portal do titular LGPD — em andamento". O fluxo completo
(solicitação → verificação de identidade → exportação → eliminação/
anonimização → confirmação → auditoria) precisa ser inventariado e
completado.

## Arquivo(s) envolvido(s)

- `src/features/**` (privacy, lgpd, consent, OptOutRecord, anonimização
  de Contact — PII cifrada + blind index já existem)
- Rotas públicas `/privacy`, `/terms`

## Evidência

- Worktree `agente-21-lgpd-portal` preservada para retomada.

## Alteração necessária

1. Inventariar o que existe (endpoints de direitos, consentimento,
   anonimização, páginas legais).
2. Implementar a peça mais crítica faltante (provável: endpoint de
   solicitação de exclusão com anonimização real ou exportação).
3. Respeitar RLS/tenancy e verificação de identidade do titular.

## Teste esperado

- Testes provando o fluxo implementado; npx tsc --noEmit.

## Contexto adicional

Branch `agente/21/lgpd-consentimento` existe no remoto — verificar se há
trabalho prévio a reaproveitar antes de recomeçar.

## Resolução (Agente 21 — 2026-11-14)

**Inventário concluído.** Mapa completo do fluxo do titular
(solicitação → verificação → exportação → eliminação → confirmação → auditoria)
com classificação IMPLEMENTADO/PARCIAL/AUSENTE e evidências em:
`docs/lgpd/portal-titular-fluxo-e-gaps.md`.

**Resumo dos achados:**

- **Implementado:** exportação/portabilidade completa
  (`dataSubjectPortability.service.ts`, AES-256-GCM opcional, auditada),
  anonimização transacional abrangente (`dataSubjectErasure.service.ts` —
  Contact, WhatsApp, sinais, timeline, voz, Copiloto, S3, Redis, AgentMemory,
  supressão OptOut antes de destruir), revogação encadeada na
  `ConsentAuditChain` com crypto-shredding (`lgpd.service.ts`), opt-out com
  checagem pre-disparo nos dispatchers, auditoria imutável (AuditLog +
  cadeia append-only `ConsentAuditRecord`), UI de operação em
  `DataSubjectRights.tsx` (Settings → LGPD, ADMIN/GESTOR).
- **Parcial:** canal do titular = e-mail manual ao DPO (documentado em
  `/privacy`); confirmação de recebimento do lead existe mas atrás de flag
  desligada; sem confirmação de conclusão de pedido DSR.
- **Ausente (gaps delegados):** canal público self-service de solicitação DSR,
  verificação de identidade do titular, protocolo/status/SLA do pedido
  (art. 19) e sweep de retenção dos leads `landing_360` (90d/demo+30d).

**Handoffs abertos resultantes:**

- `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md` — bloqueador:
  endpoint público de solicitação DSR + verificação de identidade +
  confirmação + modelo de status (schema/migração e rotas são do Agente 01).
- `.agents/handoffs/21-para-01-retencao-leads-landing-lgpd.md` — normal:
  sweep de retenção dos leads `landing_360` conforme prazo confirmado pelo
  Marcelo.

**Trabalho prévio reaproveitado:** branches `agente/21-lgpd-portal`,
`agente/21-lgpd-v2`, `agente/21-onda2-lgpd`, `agente/21-lgpd-consent-chain-kanon`
e `agente-21/lgpd-consentimento` já estão mergeadas na base — a infraestrutura
acima é o resultado delas. `origin/agente-21/lgpd-portal` (com hífen) e
`origin/rescue/21-lgpd-wip-20261113` não existem/não estão mergeadas; o rescue
WIP não foi necessário (inventário coberto pelo estado atual da main).

**Status do handoff:** mantido **em-andamento** — o miolo técnico está pronto,
mas a conformidade formal do fluxo completo depende dos gaps G1–G4 delegados ao
Agente 01. Critério de fechamento: canal público DSR implementado ou decisão
do 00 de aceitar o canal manual via DPO como conformidade suficiente
(documentada).

## Resolução (atualização Agente 21 — 2026-11-18)

**Handoff encerrado como resolvido.** O critério de fechamento foi atingido:
o canal público DSR self-service foi implementado de ponta a ponta e aprovado
pelo Agente 24.

**Evidências:**

- **Backend (Agente 01, PR #381 — APROVADO pelo 24):**
  `DataSubjectRequest` + migration `20261117231500_data_subject_request_dsr`
  (RLS `tenant_isolation` forçada); endpoints públicos
  `POST /api/public/data-subject-requests`, `POST .../verify`,
  `GET .../status/:statusToken` com `dsrLimiter` dedicado; token de verificação
  de uso único (72h, só SHA-256 em repouso); execução do direito só após
  verificação; anti-enumeração (202 idêntico); e-mail do titular cifrado +
  blind index; auditoria `DSR_*` com `subjectHash` sem PII; direitos reusam
  `exportDataSubjectDossier`, `eraseContact` (revogação encadeada na
  `ConsentAuditChain`) e `revokeConsent`.
- **Frontend (Agente 02, PR #385 — APROVADO pelo 24):** formulário DSR embutido
  em `/privacy` (§5.1), páginas públicas `/privacidade/dsr/verificar` e
  `/privacidade/dsr/acompanhamento`, 10 testes.
- **Retenção landing (gap G5, PR #381):**
  `src/features/lgpd/jobs/landingLeadRetention.worker.ts` — sweep diário 04:15,
  critério 90d sem avanço, guarda de relacionamento ativo, idempotente.
- **Governança atualizada nesta branch:** `docs/lgpd/portal-titular-fluxo-e-gaps.md`
  (seção 4 — reclassificação G1–G7), `docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md`
  (novas linhas: leads de demonstração landing e canal público DSR),
  `docs/lgpd/consentimento-lead.md` (§3.4 — implementação do sweep),
  `docs/lgpd/INVENTARIO_CAMPOS_PII.md` (regenerado — 38 campos em 18 models,
  inclui `DataSubjectRequest`; `--check` verde).

**Pendências operacionais pós-merge (fora do escopo do Agente 21):**

1. Merge de PR #381 (antes/junto de PR #383 — dependência `company`) e PR #385;
   aplicar a migration DSR no deploy.
2. Testes de integração (`landing-lead-retention-sweep`, fluxo DSR E2E) exigem
   Postgres real — rodam no gate de CI.
3. Handoffs de saída `21-para-01-*` permanecem `em-andamento` até o merge;
   atualização de status é do fluxo de integração/24.

**Gaps residuais abertos (não bloqueadores):** G6 — cobertura do dossiê de
portabilidade (avaliar no próximo ROPA); G7 — texto de consentimento da landing
aguarda OK legal do Marcelo (`docs/lgpd/consentimento-lead.md` §4).
