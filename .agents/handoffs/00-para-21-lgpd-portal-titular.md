# Handoff — Portal/direitos do titular LGPD

De: 00 — Coordenador
Para: 21 — Privacidade e LGPD
Onda: W7
Status: em-andamento (inventário concluído; gaps delegados — ver Resolução)
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
