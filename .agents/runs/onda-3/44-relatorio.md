# Relatório — Agente 44 (Lola) · Onda 3 · ONDA3-44-CADENCE + ONDA3-44-CADENCE-FIX

- **Branch:** `agente/44-cadence-onda3` (worktree `wt-44-cadence`)
- **Base:** `32d07c375` · **HEAD:** ver `git log` (commits `aeb9004f4`, `8cae07968`, `148133b6b` + docs)

## Decisão de ownership registrada (Coordenação → Agente 00)

O roster de 100 agentes (`.agents/MATRIZ_PROPRIEDADE.md`) dá ao Agente 44 apenas
`src/features/crm/cadences/**`. O `AGENTS.md` local de `src/features/cadence/**`
nomeia "Agente 17 — Cadência Multicanal e Ciclo de Receita", ID **inexistente**
no roster oficial (17 na matriz é `src/lib/cache/**`). Por decisão do
Coordenador nesta missão de follow-up, a ownership do Agente 44 foi **estendida
para incluir `src/features/cadence/**`** — o motor de cadências é a especialidade
de Lola (Motor de Cadências Comerciais). Recomenda-se ao 00 formalizar isso na
matriz (`44 → src/features/crm/cadences/** + src/features/cadence/**`) para que
futuros agentes não repitam a divergência de IDs legados vs. matriz.

## O que foi corrigido (commits `8cae07968`, `148133b6b`)

1. **`CadenceSequence` sem filtro de tenant no worker/webhook** —
   `jobs/cadenceRun.worker.ts`: lookup agora filtra `organizationId ∈ orgs dos
   runs` e exige par `(run.org === seq.org)`; mismatch → run `failed`/
   `policy-guardrail` (nunca despacha template de outro tenant).
   `infra/cadenceWebhookResolver.ts`: `findUnique` → `findFirst({id, org})`.
   Demais lookups auditados (`cadence.routes.ts`, repositories, rate-limit port,
   calendar port): já filtram por org — aprovado sem alteração.

2. **Opt-out com sujeito parcial** —
   `services/adaptiveMultichannelCadence.service.ts`: novo
   `resolveOptOutSubject` (lead contact via Prisma com fallback para dados do
   enrollment, `warn` + degradação segura); aplicado em `executeNextStep` e
   `isLeadOptedOut`.
   `services/selfDrivingCrm.service.ts`: `detectStagnatedLeads` seleciona
   `contact.{email,whatsapp,phone}` e monta sujeito completo por lead.
   Antes: opt-out gravado só por e-mail/telefone (sem leadId) não casava —
   `subjectsMatch` exige identificador compartilhado.

## O que foi documentado (sem caller de produção — stubs)

- `CadenceExecutionService.enqueueAction` retorna `accepted/queued` sem
  persistir/enfileirar: nenhum caller de produção existe (só reexport em
  `index.ts`). Decisão: contrato de porta aguardando consumidor real do Swarm;
  se um caller surgir, fila real é pré-requisito. **Não é bug ativo.**
- `services/multichannelDispatcher.service.ts`: stub que loga sucesso sem
  enviar. Sem caller de produção; se for ligado a envio real deve ser
  substituído por dispatcher honesto.

## Testes executados

- `npx vitest run -c vitest.unit.config.ts src/features/cadence
  tests/unit/cadence tests/unit/features/crm/onda3CrmSquad40.test.tsx`
  → **18 arquivos, 226/226 verde** (inclui 6 testes novos de regressão em
  `src/features/cadence/__tests__/optOutSubjectCompleteness.test.ts`).
- `npx tsc --noEmit` → verde.
- DB não foi necessário (testes unitários com stores/mocks em memória e
  `prismaMock`); prefixo `onda3_44b_` não aplicável.

## Handoffs

- `44-para-17-cadence-optout-sujeito-parcial.md` → **resolvido** (com seção de resolução).
- `44-para-17-cadence-worker-sequencia-sem-tenant.md` → **resolvido** (itens 1 corrigido; 2-3 documentados como stubs).
- Endereçados ao "Agente 17" legado — resolvidos pelo próprio 44 sob a
  ownership estendida; mantidos os arquivos para rastreabilidade.
