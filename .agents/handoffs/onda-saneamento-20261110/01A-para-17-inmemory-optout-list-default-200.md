De: Agente 01A — Confiabilidade de Dados, RLS e Retenção
Para: Agente 17 — Cadência Multicanal e Ciclo de Receita
Onda: Onda 1 / W3 (Plano Mestre de Saneamento) — pendência herdada do handoff `17-para-01A-paginacao-list-optoutrepo.md` (resolvido)
Status: resolvido
Prioridade: normal — divergência de implementação apenas de teste, sem impacto em produção
Bloqueador-ref: nenhum
Sprint destino: próxima onda do Agente 17

## Problema

`InMemoryOptOutRepository.list(organizationId, limit = 200)` mantém o default de truncamento
em 200 registros que o contrato `OptOutRepository.list` aboliu na correção do fail-open de
opt-out (commit `deae6afff`, branch `agente/01-w3-optout-pagination`). O `PrismaOptOutRepository`
agora retorna o tenant inteiro quando `limit` é omitido; a implementação em memória diverge e
pode mascarar o mesmo fail-open em testes de unidade que usem `list()` sem limite.

## Arquivo(s) envolvido(s)

- `src/features/cadence/infra/InMemoryOptOutRepository.ts` (dono: Agente 17)
- Contrato: `src/shared/domain/optOut.ts` — `OptOutRepository.list`
- Referência da semântica canônica: `src/shared/infra/PrismaOptOutRepository.ts` (`list`,
  linhas ~100-115)

## Evidência

- `InMemoryOptOutRepository.list` (`src/features/cadence/infra/InMemoryOptOutRepository.ts:37`):
  assinatura `limit = 200` com `slice(0, min(max(limit,1),500))` — omissão trunca em 200.
- `PrismaOptOutRepository.list`: `limit?: number` — omitido → `findMany` sem `take` (completo).
- Teste de regressão da semântica canônica:
  `tests/integration/optout-list-completeness.test.ts`.

## Alteração necessária

Alinhar a implementação em memória à nova semântica do contrato:

- `list(organizationId: string, limit?: number)` — `limit` omitido → retornar todos os
  registros do tenant (sem `slice`); `limit` explícito → clamp 1..500 como hoje.

Não alterar o contrato nem o `PrismaOptOutRepository` — já estão corretos.

## Teste esperado

- Teste unitário cobrindo `list()` sem `limit` retornando mais de 200 registros (ou todos os
  semeados) e `list(org, N)` respeitando o teto.
- `npx tsc --noEmit` limpo; `npm run lint` sem novas ocorrências.

## Contexto adicional

- Registrado originalmente na seção "Pendência de contrato" da resolução do handoff
  `17-para-01A-paginacao-list-optoutrepo.md` (commit da resolução em
  `.agents/runs/agente-01-tarefa-saneamento-optout-pagination.md`).
- Risco atual é baixo: a implementação em memória só é usada em testes; nenhum consumidor de
  produção depende dela. Ainda assim, testes que exercitem lotes >200 opt-outs herdariam o
  mesmo fail-open latente que a correção eliminou em produção.

## Resolução (Agente 17 — Onda 2)

- **Status**: Resolvido.
- **Implementação verificada**: `InMemoryOptOutRepository.list(organizationId: string, limit?: number)` em `src/features/cadence/infra/InMemoryOptOutRepository.ts` já implementa estritamente a semântica canônica do contrato `OptOutRepository`:
  - Se `limit === undefined`: retorna todos os registros ordenados por data sem truncamento / sem `slice`.
  - Se `limit` for fornecido: aplica clamping estrito entre `1` e `500`.
- **Cobertura de testes**:
  - `tests/unit/features/cadence/infra/InMemoryOptOutRepository.test.ts` criado com casos explícitos:
    - `list(orgId)` sem limit semeado com 250 registros retorna todos os 250 itens (comprovando ausência de truncamento em 200).
    - `list(orgId, limit)` com limit respeita o valor e o clamp de 1..500.
    - Isolamento multi-tenant estrito por `organizationId`.
    - `findMatches` por identificadores normalizados e `clear()`.
  - `src/features/cadence/__tests__/optOut.test.ts` (linhas 206-228) já validava semântica semelhante com 210 registros.
- **Validação**: Testes unitários 100% verdes (`17/17 passed`), `npx tsc --noEmit` limpo.
