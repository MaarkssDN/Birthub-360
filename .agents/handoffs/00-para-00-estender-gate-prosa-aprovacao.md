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

## Resolução executada — Agente 08 (2026-11-20)

- **Abordagem escolhida:** opção 1 — extensão determinística do gate (sem parsing de prosa).
  `scripts/governance/check-ownership-coverage.ts` agora aplica, além da sincronização
  matriz↔manifesto, o check de aprovação das regras em prosa do §15
  (`server.ts`, `package.json` e lockfiles — `package-lock.json`, `npm-shrinkwrap.json`,
  `yarn.lock`, `pnpm-lock.yaml`, `bun.lock(b)`, `composer.lock`, `Gemfile.lock`,
  `poetry.lock`, `Pipfile.lock`).
- **Mecânica:** o gate resolve a base do diff (`OWNERSHIP_GATE_BASE` > `origin/main` >
  `main` > `master`), coleta arquivos alterados (`git diff base...HEAD` + `git status
  --porcelain -uall`), e falha se um path protegido foi tocado sem registro de aprovação
  no mesmo diff: arquivo em `.agents/runs/**` ou `.agents/approvals/**` que cite o path
  literal, contenha "Agente 00" e "aprova"; para `server.ts` exige também menção ao
  orquestrador humano. Base não resolvível → aviso explícito e skip (nunca silencioso).
- **Evidência:**
  - `npm run verify:ownership-coverage` ✅ em branch limpa (23 escopos).
  - package.json modificado sem registro → ❌ exit 1 com violação citando o path.
  - package.json modificado + `.agents/approvals/tmp.md` com aprovação do Agente 00 → ✅.
  - `npx vitest run tests/unit/architecture/ownership-coverage.test.ts` → 32/32.
  - `npx tsc --noEmit` → limpo.
- **Bugs encontrados e corrigidos durante a implementação:** trim do stdout do git
  comia o espaço de status do porcelain; `git status` sem `-uall` colapsava diretórios
  não rastreados e escondia registros de aprovação novos.
- **Ressalva conhecida:** o check depende de refs git; em checkouts sem `.git` ele é
  ignorado com warning. O label-do-PR segue como salvaguarda complementar do Agente 24.
- **Status:** implementado e verificado; pendente apenas merge do PR.
