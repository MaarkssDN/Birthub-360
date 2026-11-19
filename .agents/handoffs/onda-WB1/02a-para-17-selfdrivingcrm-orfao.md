# Handoff — SelfDrivingCrmService órfão: decisão remover ou conectar (UX-06 residual / DEBT-0063)

```
De: 02A — UX Research & Usability
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: WB-1
Status: aberto
Prioridade: normal
Bloqueador-ref: DEBT-0063, DEBT-0008…0011
Sprint destino: APÓS desbloqueio do NO-GO de cadência
```

## Problema

O achado original (opt-out fail-open via `InMemoryOptOutRepository`) está **refutado**: `src/features/cadence/services/selfDrivingCrm.service.ts:36` agora usa `prismaOptOutRepository` como default; `InMemoryOptOutRepository` só aparece em `clear()` para reset de testes (`:489`).

Residual de higiene: `selfDrivingCrmService` (`:493`) e o contrato `src/shared/contracts/selfDrivingCrm.contract.ts` **não têm consumidor de produção** — mas são consumidos por 2 arquivos de teste: `tests/unit/cadence/selfDrivingCrm.service.test.ts:3,21` e `tests/integration/onda03ComprehensiveFlow.integration.test.ts:3,25` (importam o serviço e chamam `clear()`/`seedLead`/etc.). Correção v2: a afirmação "zero imports" da v1 estava incompleta (ignora tests/**). É código morto que, se um dia for ligado, precisará de revisão (stores em `Map` em memória para signals/recommendations, `mockLeadsStore`).

## Arquivo(s) envolvido(s)

- `src/features/cadence/services/selfDrivingCrm.service.ts`
- `src/features/cadence/selfDrivingCrm.service.ts` (barrel de 1 linha)
- `src/shared/contracts/selfDrivingCrm.contract.ts`
- `tests/unit/cadence/selfDrivingCrm.service.test.ts` e `tests/integration/onda03ComprehensiveFlow.integration.test.ts` (consumidores de teste — remoção/atualização coordenada com **Agente 08**)

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-06, REFUTADO + residual).

## Alteração necessária

Decisão do dono do módulo (Agente 17 — sales-orchestration/AGENTS.md confirma cadência como seu domínio): (a) remover serviço+contrato+barrel se a feature não está no roadmap; ou (b) manter e abrir missões de integração **somente após** o desbloqueio do NO-GO de cadência (DEBT-0008…0011) — incluindo persistência real de signals/recommendations (hoje `Map` em memória) e opt-out já coberto por Prisma.

## Teste esperado

Se remoção: `npx tsc --noEmit` + `npm run build` verdes; grep sem referências. Se conexão: opt-outs verificados via `PrismaOptOutRepository` em teste de integração.

## Contexto adicional

**NÃO executar antes do desbloqueio da cadência** — o módulo está em NO-GO (DEBT-0008…0011). Este handoff é registro de decisão, não autorização de implementação.
