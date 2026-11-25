# Handoff final — Agente 44 (Lola) → Agente 00 (Coordenador)

- **De:** 44 — Motor de Cadências Comerciais (Squad 40)
- **Para:** 00 — Coordenador
- **Onda:** Onda 4 — `ONDA4-44-CADENCES`
- **Status:** concluído (com 1 handoff dependente aberto para o Agente 17)
- **Prioridade:** normal
- **Branch:** `agente/44-cadences-onda4` · worktree `wt-44-cadences`
- **Base:** `32d07c3750c370b63da8b720019413c9a40e0e68`

## Escopo executado

Ownership exclusivo: `src/features/crm/cadences/**`. O motor real de cadências
(`src/features/cadence/**`, incl. `jobs/cadenceRun.worker.ts`) pertence ao **Agente 17** —
auditei por leitura e registrei achados em
`.agents/handoffs/onda4/44-para-17-cadence-janelas-e-scan.md` (não editei arquivos alheios).

## Arquivos modificados/criados (todos dentro do ownership)

1. `src/features/crm/cadences/__tests__/cadence.worker.test.ts` — **novo**, 7 testes de borda
   do avaliador de janela comercial (início/fim exato da janela, precisão de minuto,
   sexta→segunda pulando fim de semana, `allowedWeekdays` customizado, fallback de timezone
   inválido, piso de 60s de reavaliação).
2. `cadence.worker.ts` — **sem alteração**: auditoria + sonda executável comprovaram a lógica
   correta (ver abaixo). Nenhum defeito comprovado dentro do ownership → nada a corrigir (P3).

## Auditoria do `evaluateCadenceBusinessWindow` / `resolveLocalTimeParts`

Verificado por leitura + execução (`npx tsx` com 7 cenários) + os 7 novos testes:

- `delayMsUntilNextWindow` correto em todos os ramos: manhã do mesmo dia útil, pós-`endHour`
  em dia útil (pula para próximo dia útil), fim de semana/noturno (pula para segunda 08:00),
  `allowedWeekdays` customizado e precisão de minuto (`- minute` na fórmula).
- `hour12:false` + quirk `"24"` da ICU tratado (`rawHour === 24 → 0`); timezone inválido/vazio
  faz fallback determinístico para `America/Sao_Paulo`.
- Piso de `Math.max(60_000, …)` evita delay zero/negativo.
- **Limitação conhecida (não corrigida, fora de escopo de defeito):** o delay é calculado em
  minutos de relógio de parede e não considera transição de DST — erro de até ±1h apenas em
  datas de mudança de horário de verão (hoje inexistente no fuso default; relevante só se um
  lead usar fuso com DST, ex.: `America/New_York`).

## Auditoria do motor real (Agente 17) — resumo

- **Idempotência/duplicidade:** sadia — lock Redis por runId, `saveWithRetry` com log de risco
  de reenvio, re-verificação pré-envio de status + `hasLeadReplied`, sweeper de `pending` com
  TTL, opt-out em lote no start e por toque no worker.
- **Transições:** pause/resume/stop idempotentes; worker re-lê o run antes de despachar.
- **Tenancy:** bypass de RLS apenas na descoberta; cada run processado com
  `requestContext.run({ tenantId })`. Writes sempre escopados por `organizationId`.
- **Achados para o 17** (handoff dedicado): janela global fix SP 9–18 vs. utilitário
  por-timezone-do-lead órfão; lookup de sequência sem `organizationId`/`deletedAt`/`active`;
  `take:500` sem `orderBy` (starvation teórica).

## Evidências de teste

Comandos executados no worktree:

```
npx vitest run -c vitest.unit.config.ts \
  src/features/crm/cadences/__tests__/cadence.worker.test.ts \
  tests/unit/features/crm/onda3CrmSquad40.test.tsx
→ Test Files 2 passed (2) · Tests 12 passed (12)

npx tsc --noEmit
→ exit 0, sem erros
```

Sonda manual (`npx tsx`) com 7 timestamps em `America/Sao_Paulo` — delays conferidos à mão
(ex.: sex 20:30 BRT → +59h30 = seg 08:00; sáb 09:00 → +47h).

## SHAs dos commits

- Commit único de entrega nesta branch (ver `git log -1 agente/44-cadences-onda4`):
  `test(crm-cadences): cobre bordas da janela comercial + handoffs Onda4 (Agente 44)` —
  3 arquivos, 254 inserções, sem alterações em código de produção.

## O que exige teste real (não coberto por mocks)

- Concorrência real do lock Redis e comportamento sob Redis offline no worker BullMQ
  (`tests/integration/cadenceRun.worker.test.ts` cobre com Postgres+Redis reais — do Agente 17).
- Disparo real dos canais (e-mail/WhatsApp/voz) e confirmação via webhook — fora do meu
  ownership e já coberto pelos testes de integração do domínio cadence.
- Comportamento do scan sob >500 runs ativos (achado 3 do handoff ao 17).

## Bloqueios / pendências

- Nenhum bloqueio de execução. Pendência de governança: handoff `44-para-17-cadence-janelas-e-scan.md`
  aguarda decisão do Agente 17 (ou 00) sobre os 3 achados do motor real.
