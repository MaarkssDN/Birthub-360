De: Agente 00 — Coordenador
Para: Agente 08 — QA e Release
Onda: handoffs-20261117 (follow-up)
Status: aberto
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
