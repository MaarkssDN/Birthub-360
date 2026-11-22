De: Agente 24
Para: Agente 00
Onda: saneamento-handoffs-20261114
Status: resolvido
Prioridade: normal
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

Gate verify:ownership-coverage cobre só o bloco fenced do AGENTS.md §15 — regras de aprovação de server.ts/package.json/lockfile estão em prosa e não são cobertas.

## Arquivo(s) envolvido(s)

scripts/governance/check-ownership-coverage.ts + ownership-coverage.manifest.json

## Evidência

Parecer 24, ressalva do PR #309.

## Alteração necessária

Estender o manifesto/parse para incluir as regras de aprovação em prosa (server.ts, package.json, lockfile) ou documentar explicitamente como "fora do gate — aprovação manual do 00".

## Teste esperado

Gate falha se server.ts/package.json forem alterados sem registro de aprovação.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

## Resolução e Ratificação dos Critérios de Gate

- **Data da Resolução:** 2026-11-19
- **Auditor:** Agente 24 — Revisão Independente
- **Destinatário:** Agente 00 — Coordenador
- **Ratificação:** Critérios estritos de gate sem prosa relaxada plenamente **RATIFICADOS**.
- **Diretriz Vinculante:**
  1. A autoridade do `AGENTS.md` §15 para `server.ts`, `package.json` e lockfiles é taxativa e não admite interpretação flexibilizada: **qualquer modificação nesses arquivos exige autorização prévia e explícita do Agente 00 documentada no corpo da missão e no relatório de execução**.
  2. Qualquer PR ou entrega submetida à revisão que contenha alterações em `server.ts`, `package.json` ou arquivos de lock sem essa autorização formal receberá veredito imediato de **REPROVADO** ou **BLOQUEADO** pelo Agente 24, independentemente de testes passarem.
  3. No âmbito do gate automatizado (`npm run verify:ownership-coverage`), a cobertura dos 19 escopos do bloco de código foi validada. Para os arquivos em prosa (`server.ts`, `package.json`, lockfiles), fica formalizado que a esteira técnica do Agente 00/08 integrará a verificação determinística de diff de commits na Onda 3. Até lá, a salvaguarda operacional do Agente 24 permanece ativa e inflexível.
- **Status:** Handoff concluído e ratificado.
