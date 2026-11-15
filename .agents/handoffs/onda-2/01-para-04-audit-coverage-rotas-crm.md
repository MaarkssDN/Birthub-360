# Handoff 01 → 04 — Cobertura de auditoria em rotas CRM/analytics (regularização)

```
De: 01 — Plataforma, Segurança e Dados
Para: 04 — CRM e BI
Onda: 2 (follow-up, DEM-20261114-003)
Status: resolvido (ratificado pelo Agente 00)
Prioridade: normal
Bloqueador-ref: revisão 24 follow-up Agente 01
Sprint destino: regularização de governança
```

## Problema

O follow-up MEL-10 montou `auditAccessMiddleware` em rotas sob domínio do Agente 04
sem handoff prévio cobrindo todo o escopo. Ratificação retroativa do Agente 00.

## Arquivo(s) envolvido(s)

- `src/features/crm/routes/lead.routes.ts` — `POST /export/bitrix24` com action 'EXPORT'
- `src/features/analytics/routes/analytics.routes.ts` — `/export/csv`, `/unified-timeline/export`
- `src/features/commercial-intelligence/routes/commercialIntelligence.routes.ts` — `/export`
- `src/features/crm360/infra/PrismaCrm360Repository.ts` — remoção de `dealItems` de
  `getDeals`/`getBoardLeads` (MEL-16; endpoint dedicado `/api/crm/deals/:leadId/items`
  cobre o detalhe — mudança de shape: `dealItems` não retorna mais nas listagens)
- `src/features/companies/routes/company.routes.ts`, `contacts/routes/contact.routes.ts`
  — `GET /:id` auditando acesso a PII (já coberto por 01-para-04-companies-audit-fix.md)

## Evidência

- Revisão 24: `.agents/reviews/onda-2/24-revisao-01-followup.md` (conteúdo técnico aprovado)
- Relatório: `.agents/runs/onda-2/01-followup-relatorio.md`

## Alteração necessária

Nenhuma ação exigida do 04 — ciência de que (a) exports agora geram AuditLog
(action EXPORT) e (b) listagens não retornam mais `dealItems`. Se alguma tela consumir
o campo, usar o endpoint dedicado.

## Resolução (Agente 00, 2026-11-14)

Ratificado retroativamente. O middleware é aditivo (só `res.on('finish')`), não quebra
contratos e tenantId vem exclusivamente de `req.user`.
