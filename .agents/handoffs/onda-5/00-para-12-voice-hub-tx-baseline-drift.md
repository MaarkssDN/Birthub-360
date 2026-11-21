De: 00 — Coordenador
Para: 12 — Voz e Telefonia (voice-hub)
Cópia: 14 — Ambiente de Execução e Test Harness (dono do baseline gate)
Onda: 5
Status: aberto
Prioridade: normal
Bloqueador-ref: relatado pelo Agente 14 na correção pós-revisão 24 (commit 85dbbc25d)
Sprint destino: Onda 6 ou hotfix

## Problema

O gate `prisma-tx-escape-baseline.test.ts` (tests/unit/architecture/) falha na base
`integracao/onda-5` com drift de baseline: 3 usos novos de `$transaction` em
`src/lib/voice-hub/repositories/sessionRepository.ts` e `userRepository.ts` que não
constam no baseline registrado.

## Arquivo(s) envolvido(s)

- `src/lib/voice-hub/repositories/sessionRepository.ts`
- `src/lib/voice-hub/repositories/userRepository.ts`
- `tests/unit/architecture/prisma-tx-escape-baseline.test.ts` (baseline — dono provável 14/08)

## Evidência

Relato do Agente 14 em `.agents/runs/onda-5/14-relatorio.md` (seção "Correção pós-revisão 24"):
`npx vitest run tests/unit/architecture/` completo → 2 falhas pré-existentes, fora do escopo do 14.
Nenhum arquivo de `src/` foi tocado pelo Agente 14 — drift já existia na base b69e586ba.

## Alteração necessária

O dono do voice-hub (12) deve:
1. Verificar se os 3 `$transaction` novos são legítimos (transações curtas, sem escape de RLS).
2. Se legítimos: atualizar o baseline do teste (com justificativa no commit).
3. Se não legítimos: refatorar para o padrão aprovado.

O Agente 14 deve revisar a atualização do baseline quando o handoff for resolvido.

## Teste esperado

`npx vitest run tests/unit/architecture/` verde na branch de integração.

## Contexto adicional

Falha pré-existente detectada durante Onda 5 — não bloqueia os merges da onda
(os testes do verify-file-ownership passam isoladamente), mas deve ser resolvida
antes do release gate da onda.
