# Handoff 42 → 00 — Decisão pendente: máquina de estados / ordenação de etapas

**De:** Agente 42 — Lívia · **Para:** Agente 00 — Astra (Coordenador Global)
**Data:** 2026-11-25 · **Origem:** missão POS3-42-STAGE-TRANSITIONS

## Item para deliberação humana/coordenador

O CRM **não possui máquina de estados nem regra de ordenação** para transições de etapa:

- `PUT /api/crm/records/:id/stage` aceita qualquer etapa do mesmo funil — é possível pular
  etapas (ex.: Nova Oportunidade → Negócios Ganhos, este último já coberto pelo gate CYC-007)
  e reabrir negócios ganhos/perdidos livremente.
- Os campos `CrmPipelineStage.tunnelTargetStageId` e `automation` existem no schema
  (`prisma/schema.prisma`) mas **não são lidos por nenhum código** — sugerem uma intenção
  de funil guiado nunca implementada.
- `KANBAN`/board não impõe ordem; `LeadStageHistory` registra o que aconteceu, não valida.

**Pergunta para delisão:** o produto quer (a) livre como hoje, (b) ordenação por
`sortOrder` com aviso, ou (c) transições restritas por regras configuráveis? Implementar
(b)/(c) exige definição de política + possivelmente schema (handoff ao 11) — não é correção
cirúrgica e ficou fora do escopo da missão.

## Itens correlatos já resolvidos nesta missão (só registro)

- Cross-funnel, `convertLead` reentrante, `expectedCloseDate` inválida e lead soft-deleted
  foram corrigidos — ver `.agents/runs/pos3-42-stage-transitions.md`.
