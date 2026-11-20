# Triagem Agente 00 — baseline visual defasada (2026-11-19)

## Decisao

Handoff triangular: `.agents/handoffs/devin-para-00-visual-regression-baseline-defasada.md`
- **Status:** em-andamento
- **Executor:** Agente 08 — investigacao (download do artefato do run
  44390872266, comparacao diff vs baseline, classificacao da causa).
- **Condicional:** apos classificacao "render atual correto", dispatch do job
  manual "Gerar baselines visuais Linux" + commit de baseline passa para o
  Agente 08A (mesmo slot 08/08A — nunca simultaneo).
- **Revisor obrigatorio:** Agente 24 antes do merge do commit de baseline.

## Gate pendente — decisao humana

Antes de commitar qualquer baseline, confirmar que o render atual e o
esperado. O 08 deve preparar a comparacao artefato-vs-baseline e escalar a
evidencia visual ao 00/usuario.

## Verificacoes feitas na triagem

- Nao ha handoff duplicado aberto sobre baseline visual.
- Handoffs anteriores de baseline (`onda-6/14-para-08-baselines-visuais-linux.md`,
  `main-ci-recovery-20261027/14-para-00-visual.md`,
  `ci-recovery-final-20261101/02-VISUAL-REGRESSION.md`) estao `resolvido` —
  este e um novo episodio pos-merges #390/#412.
- Base de referencia: `origin/main` @ `e0446cef0`.

## Contexto

- Falha estavel ~0,01% em `intelligence-light.png` em todos os PRs
  (#390, #412, #418) — baseline defasada, nao regressao dos diffs.
- PRs #412 e #390 foram mergeados em 2026-11-19 via --admin (decisao do
  usuario); o gate visual segue vermelho e este debito e a quitacao.
- Registrado na branch `agente/00-integracao-skills` (commit 11d2ded0d).

## Proximo passo

Agente 08 inicia a investigacao quando houver slot; evidencia visual vai ao
usuario para o gate humano antes de qualquer rebaseline.
