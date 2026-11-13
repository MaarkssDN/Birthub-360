De: Agente 09 — Mobile (Capacitor/Android)
Para: Agente 08 — QA e Release
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-028)
Status: aberto
Prioridade: normal
Bloqueador-ref: BT360-DT-0053 (resolvido na branch `agente/09-mobile-saneamento`)
Sprint destino: Onda 5

## Problema

`VALID_TABS` em `android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java` é um
espelho manual (Java não importa TypeScript) de `ACTIVE_NAV_TABS` em `src/lib/navigationBus.ts`
(`TAB_ROUTE_SET` − `NAV_HIDDEN_TABS`). O comentário no próprio `MainActivity.java` afirma que a
paridade é "validada por teste automatizado de paridade", mas nenhum teste existente faz esse
parse — a divergência real (`gamification` ausente) passou despercebida até a auditoria da
TAREFA-SANEAMENTO-028. O teste `DEBT-UX-005` em
`tests/unit/audit/wave2-out-of-scope-remediations.test.ts` cobre apenas uma amostra fixa de tabs
e não compara os conjuntos.

## Arquivo(s) envolvido(s)

- `android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java` (leitura)
- `src/lib/navigationBus.ts` (`ACTIVE_NAV_TABS`, leitura)
- `tests/**` — novo teste de paridade (propriedade do Agente 08)

## Evidência

- Diff programático executado em 2026-11-12 (worktree `agente-09-mobile`): antes da correção,
  `ts-only: ['gamification']`; depois, conjuntos idênticos com 53 destinos.
- `gamification` tem `<Route path="gamification">` real em `src/App.tsx` sob `/app/*`.

## Alteração necessária

Adicionar teste (vitest, padrão dos testes em `tests/unit/`) que:

1. Leia `MainActivity.java` como texto e extraia as strings de `VALID_TABS`.
2. Importe `ACTIVE_NAV_TABS` de `src/lib/navigationBus.ts`.
3. Assert de igualdade de conjuntos (sucesso) — e, idealmente, um caso de falha documentando o
   comportamento quando um destino existe só de um lado (ex.: assert que `gamification` consta
   em ambos).

## Teste esperado

`npm run test:unit` verde com o novo teste; falha intencional ao remover um item de qualquer um
dos lados deve ser detectada.

## Contexto adicional

Não bloqueia o encerramento do handoff BT360-DT-0053 (correção já aplicada e verificada por diff
programático). Este handoff evita regressão futura quando o Agente 02 alterar `TabType`/
`TAB_ROUTE_SET`/`NAV_HIDDEN_TABS`. Manter também o teste existente `DEBT-UX-005` intacto.
