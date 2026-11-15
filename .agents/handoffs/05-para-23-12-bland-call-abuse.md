# Handoff 05 → 23/12 — POST /integrations/bland/call: chamada paga para número arbitrário

- **De:** 05 — Prospecção
- **Para:** 23 — Custo/Performance + 12 — Voz e Telefonia
- **Onda:** Onda 1 (pós-PR #323)
- **Status:** aberto
- **Prioridade:** normal (pré-existente; módulo atrás de 503)
- **Bloqueador-ref:** parecer 24 PR #323, achado [BAIXO]
- **Sprint destino:** próxima onda de voice/custo

## Problema

`POST /api/outbound/integrations/bland/call` dispara uma **chamada de voz paga**
para `phoneNumber` arbitrário do body, sem vínculo a lead/tenant e sem rate limit
específico. Qualquer usuário autenticado do tenant pode gerar custo de telefonia
com números arbitrários.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/integrations.routes.ts` (rota bland/call)

## Evidência

- Parecer 24 PR #323, achado [BAIXO] "POST /integrations/bland/call dispara
  chamada de voz paga para phoneNumber arbitrário do body, sem vínculo a
  lead/tenant. Pré-existente; consumo de custo por qualquer autenticado."

## Alteração necessária

Decidir antes da reabertura do módulo: (a) exigir `leadId` pertencente ao tenant
(o lead já valida company via LEAD_COMPANY_CLAUSE) e derivar o telefone do lead,
ou (b) rate limit + allowlist de números, ou (c) aposentar a rota em favor do
fluxo canônico de voz (Agente 12).

## Teste esperado

- Chamada sem leadId/telefone vinculado ao tenant → 4xx.
- Rate limit comprovado em teste.

## Contexto adicional

O escopo de tenant do router já está aplicado (requireTenantScope) — o risco
residual é de CUSTO/ABUSO dentro do próprio tenant, não de vazamento cross-tenant.
