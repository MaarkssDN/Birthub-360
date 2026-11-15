- De: Agente 08 (QA e Release)
- Para: Agente 00 (Coordenador)
- Onda: 4
- Status: aberto
- Prioridade: alto
- Bloqueador-ref: DEM-20261114-003 / MEL-29
- Sprint destino: Onda 4

## Problema

MEL-29 pede visual regression como gate bloqueante. Implementei em
`.github/workflows/visual-regression.yml` (branch `agente/08-onda4-visual`):
detecção de escopo (`changes`), suíte condicional (`visual-regression`) e agregador
fail-closed `Visual Regression Gate`. Porém, tornar o check **required** exige alterar a
branch protection de `main`/`master` — configuração do GitHub fora do repositório, que
não posso editar.

## Arquivo(s) envolvido(s)

- `.github/workflows/visual-regression.yml` (job `visual-gate`, name `Visual Regression Gate`)
- `.agents/runs/onda-4/08-relatorio.md` (relatório completo da entrega)

## Evidência

- Check context emitido pelo workflow: **`Visual Regression Gate`** (job `visual-gate`,
  `if: always()` — reporta em todo PR, inclusive os fora de escopo, para não ficar
  pendente como required check).
- O agregador reprova quando: detecção de escopo falha; PR relevante e suíte visual
  falha/cancela; suíte rodou e falhou fora de escopo.
- Baselines Linux já commitadas (88 PNGs) — pré-requisito do handoff onda-6 do Agente 14
  está resolvido.

## Alteração necessária

Em Settings → Branches → branch protection de `main` (e `master`, se aplicável),
adicionar o required status check **`Visual Regression Gate`**.

Atenção: o nome do check é o `name:` do job (`Visual Regression Gate`), não o nome do
workflow. Se a branch protection hoje exige o contexto antigo `Visual Regression`
(job pesado, que agora fica `skipped` fora de escopo — e `skipped` pode não satisfazer
required check dependendo da configuração), substituir pelo novo contexto.

Alternativa, se o 00 preferir manter um único required check: integrar o job visual ao
`ci.yml` como `needs` do agregador `build` — mas isso acopla ~30 min de stack visual ao
gate de todo PR relevante; recomendo o required check dedicado.

## Teste esperado

Após o merge e a configuração da branch protection:

1. PR tocando `src/**` → checks `Detectar escopo visual`, `Visual Regression`,
   `Visual Regression Gate` todos verdes (suíte real roda).
2. PR tocando só `docs/**` → `Visual Regression` skipped, `Visual Regression Gate` verde.
3. Regressão visual proposital → `Visual Regression` vermelho e `Visual Regression Gate`
   vermelho, bloqueando merge.

## Contexto adicional

- `workflow_dispatch` no workflow roda a suíte completa (relevante=true) — caminho manual
  de validação de baselines.
- Não enfraqueci nenhum gate existente; o `continue-on-error` citado na missão já havia
  sido removido do workflow no commit `e9578780b`.
