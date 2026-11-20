De: Agente 00 — Coordenador
Para: Agente 08 — QA e Release
Onda: handoffs-20261117 (follow-up)
Status: resolvido
Prioridade: alto
Bloqueador-ref: run 44374905634 (visual-baseline-update.yml em main)
Sprint destino: próxima onda de QA/CI

## Problema

`.github/workflows/visual-baseline-update.yml` falhou no push final:
`! [rejected] HEAD -> ci/visual-baselines-linux (fetch first)`. O job faz
`git checkout -B ci/visual-baselines-linux` localmente e push sem
`--force-with-lease` nem fetch prévio — quando a branch já existe no remoto
(com histórico divergente, ex.: resquício do PR #371 mergeado), o push é
rejeitado e as baselines geradas se perdem.

Evidência: run https://github.com/MaarkssDN/Birthub-360/actions/runs/44374905634
— commit `e847665d` criado localmente com as baselines corretas
(intelligence-light desktop+tablet linux), push rejeitado.

Contorno aplicado pelo 00: branch remota stale deletada (era do PR #371 já
mergeado) e workflow re-disparado (run 44388571938).

## Arquivo(s) envolvido(s)

- `.github/workflows/visual-baseline-update.yml` (dono: Agente 08)

## Alteração necessária

Antes do push, fazer `git fetch origin ci/visual-baselines-linux` e
`git rebase`/`merge` sobre a remota, ou usar `git push --force-with-lease`
(justificável: a branch é efêmera de baselines regeneradas), ou deletar a
branch remota no início do job se ela já foi mergeada.

## Teste esperado

Re-dispatch do workflow conclui com push bem-sucedido mesmo com a branch
remota existente.

## Contexto adicional

Hoje a branch remota só existe se um run anterior falhou após o push ou se o
PR de baselines não foi mergeado — o caso comum (PR mergeado + branch deletada)
não dispara o bug. Ainda assim, qualquer resquício bloqueia silenciosamente a
regen de baselines, que é o mecanismo de correção de VR flakes sistêmicos.

## Resolução (Agente 08)

Abordagem escolhida: `git push --force-with-lease` precedido de
`git fetch origin "+refs/heads/$BASELINE_BRANCH:refs/remotes/origin/$BASELINE_BRANCH"`.

Justificativa: a branch `ci/visual-baselines-linux` é efêmera e 100%
regenerada a cada run — todo o conteúdo de baseline é reescrito do zero, logo o
histórico remoto (resquício de run falho ou PR não mergeado) é sempre
descartável e um rebase/merge sobre ele só criaria conflitos artificiais.
O `--force-with-lease` (e não `--force` puro) mantém proteção contra push
concorrente: se outro processo alterar a branch remota depois do fetch, o push
falha em vez de sobrescrever cegamente. Se a branch remota não existir, o lease
espera ausência e o push a cria normalmente.

Alteração aplicada em `.github/workflows/visual-baseline-update.yml`, passo
"Commitar baselines na branch ci/visual-baselines-linux": fetch da ref remota
(erro suprimido com `|| true` quando a branch não existe) antes do
`git checkout -B`, e push com `--force-with-lease`. Sintaxe YAML validada com
`yaml.safe_load`. Comentário no próprio workflow documenta a decisão.
