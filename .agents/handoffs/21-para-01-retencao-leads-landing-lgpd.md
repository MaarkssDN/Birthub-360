# Handoff — Sweep de retenção dos leads da landing (LGPD)

De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: W7 (follow-up do handoff 00→21 portal do titular)
Status: aberto
Prioridade: normal
Sprint destino: próxima onda

## Problema

O Marcelo confirmou em 2026-11-11 (registrado em `docs/lgpd/consentimento-lead.md`
§3.4): leads capturados pela landing (`Lead.source = 'landing_360'`,
`src/shared/contracts/publicLead.constants.ts` L32) devem ser retidos por
**90 dias sem avanço, ou duração da demonstração + 30 dias, o que for maior**,
com destino anonimização/exclusão.

Existe `autoAnonymizeDisqualified.worker.ts`
(`src/features/crm/jobs/`) que anonimiza leads `Negocios_Perdidos` > 90 dias via
`eraseDataSubject`, mas **nenhum sweep cobre os leads `landing_360` em
`Lead_Recebido`** — eles não são "perdidos" e podem ficar retidos indefinidamente.

## Arquivo(s) envolvido(s)

- Novo worker/sweep (ou extensão do existente) para leads `source='landing_360'`.
- `prisma/schema.prisma` (se for preciso campo de "demo agendada em" para o
  cálculo demo+30d — avaliar se `Lead`/`customFields` já comportam).
- Reuso: `eraseDataSubject` (`src/shared/services/dataSubjectErasure.service.ts`)
  — já cria `OptOutRecord` de supressão antes de anonimizar (B-13).

## Alteração necessária

1. Varredura periódica de leads `landing_360` sem avanço (status não movido do
   funil) há > 90 dias → `eraseDataSubject` no tenant do lead.
2. Se houver marcação de "demonstração agendada", aplicar demo+30d; caso o campo
   não exista, o critério conservador é 90 dias sem avanço (documentar a decisão).
3. Idempotente e auditável (padrão do worker existente, incluindo o fix de
   contexto RLS cross-tenant já documentado nele).
4. `PublicLeadConsent` sobrevive à anonimização do lead (FK `SetNull`,
   schema.prisma L5663–5667) — confirmar que a prova de consentimento permanece
   pelo prazo legal (art. 8º, §2º) mesmo após expurgo dos dados.

## Teste esperado

- Lead `landing_360` parado > 90d é anonimizado; lead com avanço recente não.
- Opt-out/supressão gravado antes da anonimização; idempotência em reexecução.
- Bypass RLS apenas na descoberta cross-tenant (padrão já corrigido no worker de
  Negocios_Perdidos — replicar a mesma estrutura).

## Contexto adicional

- Decisão de retenção confirmada pelo Marcelo em 2026-11-11 — não reabrir prazo.
- ROPA (`docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md`) pode precisar de linha própria
  para "lead de demonstração landing" após implementação — alinhar com o 21.
