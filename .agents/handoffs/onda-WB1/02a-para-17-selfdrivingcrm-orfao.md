# Handoff — SelfDrivingCrmService órfão: decisão remover ou conectar (UX-06 residual / DEBT-0063)

```
De: 02A — UX Research & Usability
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: WB-1
Status: resolvido
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

## Resolução (Agente 17 — Onda 2)

- **Status**: Resolvido.
- **Decisão e Confirmação de Arquitetura**:
  - `SelfDrivingCrmService` mantido como serviço central de orquestração adaptativa e inteligência de cadência, integralmente desacoplado de dependências exclusivas em memória e conectado aos modelos Prisma reais com isolamento rigoroso por `organizationId`.
  - **Repositório de Opt-Out**: Construtor utiliza por padrão o `prismaOptOutRepository` durável (`private optOutRepo: OptOutRepository = prismaOptOutRepository`). `InMemoryOptOutRepository` é restrito a redefinição de mocks em ambientes de teste (`clear()`).
  - **Sinais de Conversa (Prisma `ConversationSignal`)**: `evaluateCadenceOptimization` consulta diretamente `prisma.conversationSignal.findMany({ where: { organizationId, leadId }, orderBy: { createdAt: 'desc' }, take: 10 })` quando não há sinais voláteis em memória, mapeando canais e intenções reais do banco.
  - **Leads Estagnados (Prisma `Lead`)**: `detectStagnatedLeads` busca diretamente no banco de dados via `prisma.lead.findMany({ where: { organizationId }, take: limit, ... })` em modo fail-closed, ignorando leads sem tenant e aplicando as travas canônicas de opt-out (Art. 18 LGPD) e status final (Ganho/Perdido).
- **Cobertura de Testes**:
  - `tests/unit/cadence/selfDrivingCrm.service.test.ts` (12 testes verdes) validando:
    - Consulta e mapeamento de `prisma.conversationSignal` via spy com filtro de `organizationId`.
    - Consulta e mapeamento de `prisma.lead` via spy com filtro de `organizationId`.
    - Trava fail-closed de opt-out formal bloqueando categoricamente reativações.
    - Isolamento de tenant impedindo vazamento entre organizações.
  - `tests/integration/onda03ComprehensiveFlow.integration.test.ts` cobrindo o fluxo integrado.
- **Validação**: Testes unitários do módulo de cadência 100% aprovados (`132/132 tests passed`), `npx tsc --noEmit` limpo.
