# Handoff — visual-baseline-update.yml: push para ci/visual-baselines-linux rejeitado (fetch first) em dispatch de PR

De: 03 — Design e Acessibilidade
Para: 08 — QA e Release
Onda: PR #368 (`agente/00-paleta-oficial-migracao`)
Status: aberto
Prioridade: bloqueador (gate `Visual Regression`/`Visual Regression Gate` do PR #368)
Bloqueador-ref: runs `44591238142` e `44602543989` (ambos `workflow_dispatch` no ref da branch do PR)

## Problema

O workflow `Visual Baseline Update` (`.github/workflows/visual-baseline-update.yml`)
falha **sempre na etapa de push**, depois de gerar as baselines com sucesso
(84–88 snapshots re-gerados, incluindo `tests/e2e/visual.spec.ts-snapshots/`).

Erro idêntico nas duas tentativas:

```
 ! [rejected]  HEAD -> ci/visual-baselines-linux (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not
      have locally locally.
```

## Evidência

- Run `44591238142` (ref `agente/00-paleta-oficial-migracao` @ ~`69b7948d7`):
  gerou baselines, commit `75c7eaac` criado, push rejeitado em 2026-11-19T19:04:26Z.
- Run `44602543989` (ref @ `187346c82`): mesma rejeição em 2026-11-19T20:23:57Z.
- Head remoto de `ci/visual-baselines-linux` = `701f0e57a`
  ("Merge branch 'main' into ci/visual-baselines-linux", 2026-11-19 13:32 UTC).
- Verificado localmente: `git merge-base --is-ancestor 701f0e57a <head-do-PR>`
  → **true** para `69b7948d7`, `63b3c79ee` e `187346c82`; `git push --dry-run`
  de um commit equivalente a partir de clone completo → **fast-forward aceito**
  (`701f0e57a..9139cbbf2`).
- Conclusão: o conteúdo é fast-forward; a rejeição só ocorre no runner, que usa
  `actions/checkout` **sem `fetch-depth`** → clone raso (depth 1). Push de um
  commit novo sobre HEAD raso para uma ref diferente da clonada é rejeitado
  pelo receive-pack como non-fast-forward (o cliente não consegue provar a
  ancestralidade do head remoto dentro do pack raso).
- O último run bem-sucedido (`44388571938`, dispatch em `main`, 2026-11-18)
  passou — provavelmente porque na época o head de `ci/visual-baselines-linux`
  era mais antigo/descendente direto do main; o merge `701f0e57a` (13:32 UTC de
  hoje) tornou o cenário atual distinto.

## Alteração necessária (arquivo do Agente 08)

Em `.github/workflows/visual-baseline-update.yml`, step "Checkout repository"
(~linha 95), adicionar `fetch-depth: 0`:

```yaml
      - name: Checkout repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
```

Alternativa equivalente: `git fetch --unshallow` ou
`git fetch origin "$BASELINE_BRANCH" && git rebase origin/$BASELINE_BRANCH`
antes do push no step "Commitar baselines". `fetch-depth: 0` é o fix mínimo.

## Teste esperado

- Re-dispatch do workflow em qualquer ref → step de push conclui com
  "Baselines publicadas em ci/visual-baselines-linux".

## Contexto adicional

- O PR #368 precisa das baselines **dentro da própria branch do PR** (a suíte
  `Visual Regression` compara contra `visual-regression/baselines/**` do head).
  Fluxo pretendido: workflow publica em `ci/visual-baselines-linux` → cherry-pick
  do commit de baselines para a branch do PR (posso executar essa parte).
- Não editei o workflow por ser propriedade do Agente 08 (§15/AGENTS.md de
  `.github/`).
- Relacionado: handoff `03-para-00-sonar-newcode-pr368-cobertura-duplicacao.md`
  cobre os demais gates vermelhos do mesmo PR.
