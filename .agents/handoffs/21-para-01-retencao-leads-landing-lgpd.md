# Handoff — Sweep de retenção dos leads da landing (LGPD)

De: 21 — Privacidade e LGPD
Para: 01 — Plataforma, Segurança e Dados
Onda: W7 (follow-up do handoff 00→21 portal do titular)
Status: resolvido
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

## Resolução (Agente 01 — 2026-11-17)

- **Worker novo** `src/features/lgpd/jobs/landingLeadRetention.worker.ts`
  (`runLandingLeadRetentionSweep` extraída para teste, mesmo padrão SEC-007 do
  `autoAnonymizeDisqualified.worker.ts`): descoberta cross-tenant via
  `requestContext.run({ bypassRls: true })` SOMENTE sobre `Lead`; cada
  anonimização roda dentro de `eraseDataSubject` com `requestContext` de tenant.
- **Critério (decisão documentada):** `source='landing_360'` + `status='Lead_Recebido'`
  (status inicial — "sem avanço" = nunca saiu do funil) + `updatedAt <= 90d`.
  O prazo alternativo "demo + 30d" NÃO se aplica: não existe campo de "demo
  agendada em" em `Lead`/`customFields` (verificado no schema) — critério
  conservador de 90 dias adotado conforme item 2 do handoff.
- **Guarda extra (segurança):** `eraseDataSubject` anonimiza o CONTATO inteiro —
  o sweep pula o titular quando ele tem OUTRO lead em andamento (status
  não-terminal, `updatedAt` dentro da janela). A regra mira o lead de demo
  abandonado, não uma relação comercial ativa.
- **Idempotência:** contato já anonimizado (`[titular anonimizado — LGPD]`) é
  pulado antes de chamar `eraseDataSubject`; reexecução é no-op.
- **`PublicLeadConsent`:** confirmado `leadId` com `onDelete: SetNull`
  (schema.prisma L5666–5667) — a prova de consentimento sobrevive ao expurgo do
  lead; `organizationId` permanece obrigatório (retenção da prova = decisão do 21
  no ROPA, não bloqueia a anonimização do titular).
- **Registro:** `worker.ts` (processo dedicado) e `src/bootstrap/workers.ts`
  (modo embutido) atualizados; scheduler diário 04:15 (`upsertJobScheduler`,
  BullMQ v6); `worker-registry-parity.test.ts` verde.
- **Testes:** `tests/integration/landing-lead-retention-sweep.test.ts` cobre
  elegível/recente/guarda-de-relacionamento-ativo/idempotência — ESCREVIDO mas
  NÃO EXECUTADO localmente (exige Postgres de teste); rodar no gate de
  integração do CI.
- **Sem mudança de schema/migration** — nenhum campo novo foi necessário.

## Fechamento — Auditoria Independente (Agente 09 — Silas, 2026-11-20)

- **Veredicto:** `APROVADO`
- **Parecer formal:** `.agents/reviews/09-auditoria-onda4-settings-lgpd-voicehub-auth.md`
- **Evidência:** Worker `src/features/lgpd/jobs/landingLeadRetention.worker.ts` e teste `tests/integration/landing-lead-retention-sweep.test.ts` auditados. Uso estrito de `bypassRls: true` apenas na descoberta cross-tenant de `Lead`, expurgo escopado ao tenant via `eraseDataSubject` (com `OptOutRecord` B-13 e preservação de `PublicLeadConsent`), guarda de relacionamento comercial ativo e idempotência confirmados. Handoff encerrado com `Status: resolvido`.
