# 00 — Baixa formal do handoff visual regression baseline defasada

Data: 2026-11-19
Agente: 00 — Coordenador (papel Agente 08 na execucao)
Handoff: `.agents/handoffs/devin-para-00-visual-regression-baseline-defasada.md`

## Veredito

**RESOLVIDO** — o debito esta quitado por resolucao externa (PR #419), com
evidencia de gate verde em `main`. Baixa formal registrada.

## Evidencias verificadas

1. `gh run list --branch main` + `gh run view`:
   - Workflow "Visual Regression Tests", run `44573014428`,
     headSha `30cdbdc28987da7e016a0551889ae09e0f501964`,
     createdAt 2026-11-19T17:03:39Z, conclusion=success.
   - Jobs: "Detectar escopo visual" success, "Visual Regression" success,
     "Visual Regression Gate" success.
2. Evidencia ja registrada no handoff (atualizacao Devin 2026-11-19):
   - PR #419 `ci/visual-baselines-linux` mergeado em main (`c93f9a4be`)
     — baselines regeneradas via job manual Linux.
   - PR #422 (SonarQube fix, sem relacao visual) verde no mesmo gate
     (run 44557156887).
3. origin/main confirmado em `30cdbdc28`+ pos-merge #422 — o headSha do
   run verde e o topo atual da main.

## Analise

O handoff pedia: (a) classificacao do diff do artefato, (b) rebaseline via
job manual Linux se render correto, (c) decisao humana antes de commitar
baseline. O caminho efetivo foi o PR #419, que executou a rebaseline — a
verificacao do 00 confirma que o gate voltou a ser sinal util em main.
Os runs de "Central Birth Hub 360 Release" na main seguem com falha em
"application gate"/"build" — debito separado, fora do escopo deste handoff
(registrado para a fila do 00/08).

## Risco residual

Baixo. Gate visual verde em main @ `30cdbdc28`. Episodio pode se repetir se
merges futuros de UI nao rebaselinarem — o handoff resolvido e este registro
servem de precedente. Criterio de aceite do handoff (run verde em gate de
controle) atendido.

## Licao registrada

Baseline visual precisa acompanhar merges de UI; o job manual
"Gerar baselines visuais Linux" e o caminho correto (nunca baseline local
em Windows). Se PR toca `src/features/intelligence/**` ou tokens globais,
rebaseline preventivo reduz ruido.

## Acoes

- Handoff `devin-para-00-visual-regression-baseline-defasada.md`
  atualizado para `Status: resolvido` com secao `## Resolucao` preenchida.
- Branch: `agente/00-integracao-skills` (governanca .agents).
