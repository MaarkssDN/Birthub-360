# Handoff — Aprovação de `.github/workflows/schemathesis-fuzzing.yml` (MEL-39)

```
De: 08 — QA e Release
Para: 08A — Operações Git e Deploy AWS / 00 — Coordenador
Onda: saneamento-handoffs-20261117
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-39
Sprint destino: a definir
```

## Problema

O handoff `backlog-5/18-para-08-schemathesis-ci.md` pedia ao Agente 08 para
decidir e implementar Schemathesis como gate de CI. O Agente 08 implementou na
branch `agente/08-handoffs-20261117` (commit `e82f76d4b`) o workflow
`.github/workflows/schemathesis-fuzzing.yml` — PR-triggered (smoke, 20
exemplos) + cron noturno/manual com artefato JUnit.

Porém, pela governança global (AGENTS.md §15 e prompt do 08),
`.github/workflows/**` pertence ao Agente 08A/00 e exige aprovação explícita.
O workflow foi criado antes desta regra ser explicitada na missão atual;
registro aqui para aprovação formal em vez de edição unilateral adicional.

## Arquivo(s) envolvido(s)

- `.github/workflows/schemathesis-fuzzing.yml` (novo, 180 linhas, commit `e82f76d4b`)
- `.agents/handoffs/backlog-5/18-para-08-schemathesis-ci.md` (resolução do 08)

## Evidência

- `git show e82f76d4b` — workflow completo na branch.
- Handoff 18→08 marcado `resolvido` com descrição da estratégia (PR smoke +
  cron `0 4 * * *` + `workflow_dispatch`).

## Alteração necessária

- **08A/00:** revisar e aprovar (ou pedir ajustes em) o workflow antes do merge
  do PR `test(08): saneamento handoffs QA`. Pontos de atenção: permissões do
  GITHUB_TOKEN, billing de minutos do cron noturno, e se o job deve rodar em
  `pull_request` (custo) ou apenas `workflow_dispatch`/schedule.
- Se reprovado, o Agente 08 remove o arquivo no mesmo PR ou abre correção.

## Teste esperado

- Workflow válido (`actionlint`/execução real no GitHub) sem secrets expostos;
  smoke em PR não infla tempo do pipeline principal.

## Contexto adicional

- Alternativa documentada no handoff original: manter `verify:openapi-drift`
  (já verde, 0 deriva) como gate e Schemathesis como job noturno/manual — foi a
  opção implementada.
- Nenhum outro arquivo de `.github/workflows/**` foi tocado nesta branch.
