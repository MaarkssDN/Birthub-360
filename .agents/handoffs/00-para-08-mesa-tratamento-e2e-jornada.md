# Handoff — Jornada E2E completa da Mesa de Tratamento

De: 00 — Coordenador
Para: 08 — QA e Release
Onda: W7
Status: aberto
Prioridade: normal
Sprint destino: próxima onda

## Problema

A spec `tests/e2e/mesa-tratamento.spec.ts` cobre empty-state, dashboard e
RBAC. Falta a jornada completa de triagem inbound: fila → claim/atribuir →
registrar resultado → timeline/CRM. Exige `BitrixConnection` + HTTP de saída
ao Bitrix24.

## Arquivo(s) envolvido(s)

- `tests/e2e/mesa-tratamento.spec.ts`
- Possível stub: MSW handlers ou fixture de BitrixConnection apontando para
  mock local (ver padrão já usado em tests/e2e e tests/mocks).

## Evidência

- Relatório do Agente 08 (specs criados em merge anterior).
- Worktree `agente-08-mesa-e2e` preservada para retomada.

## Alteração necessária

Criar spec cobrindo a jornada feliz + caminhos de erro com Bitrix stubado.
Se inviável sem infra nova, entregar melhor cobertura intermediária e
documentar o gap.

## Teste esperado

- Spec roda no CI (Playwright + Postgres/Redis de teste).

## Contexto adicional

Execução local de Playwright exige browsers + DB — verificar se o ambiente
suporta antes de prometer execução local.
