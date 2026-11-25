De: 00 — Coordenador
Para: 07 — IA e Automações
Onda: pós-Onda 02 (decisão de produto registrada)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima onda de IA

## Problema

`src/features/roleplay/services/multimodalRoleplaySimulator.service.ts` existe com personas e scores fabricados em memória (`private sessions = new Map`), mas **não é importado por nenhuma rota ou código de produção** — apenas por testes unit/integration/load. O usuário decidiu (2026-11-15, decisão D2 em `.agents/runs/decisoes-produto-20261115.md`) **documentá-lo como test-only** em vez de removê-lo.

## Arquivo(s) envolvido(s)

- `src/features/roleplay/services/multimodalRoleplaySimulator.service.ts`

## Evidência

- `git grep MultimodalRoleplaySimulatorService`: só o próprio arquivo + `tests/unit/roleplay/multimodalRoleplaySimulator.service.test.ts` + `tests/integration/onda05ComprehensiveFlow.integration.test.ts` + `tests/load/k6-ai-voice-stress.js`.
- Personas hardcoded (`cfo_skeptical` etc.) e scores simulados — inofensivos em teste, perigosos se um dia forem roteados como "IA real".

## Alteração necessária

Adicionar cabeçalho docblock no topo do arquivo declarando explicitamente:

- que é um **simulador de teste** (não é IA real nem persistência real);
- que personas/scores são fabricados para exercitar o contrato `IMultimodalRoleplayPort`;
- que não deve ser exposto em rotas de produção sem substituir por implementação real.

## Teste esperado

- `npx tsc --noEmit` limpo (comentário não quebra nada); PR documenta a decisão D2.
