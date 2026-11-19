De: Devin (Coordenacao)
Para: Agente 08 (QA e Release) — executor da investigacao; Agente 08A condicionado para dispatch/commit de baseline; Agente 24 revisor obrigatorio antes do merge
Onda: release-readiness / saneamento CI
Status: em-andamento
Prioridade: alto
Bloqueador-ref: nenhum (nao bloqueia merge funcionalmente, mas deixa todo PR vermelho)
Sprint destino: proximo ciclo de saneamento, na reconciliacao PR x achados do audit

### Triagem do 00 (2026-11-19)

- Verificado: nao ha handoff duplicado aberto. Os handoffs anteriores de
  baseline visual (`onda-6/14-para-08-baselines-visuais-linux.md`,
  `main-ci-recovery-20261027/14-para-00-visual.md`,
  `ci-recovery-final-20261101/02-VISUAL-REGRESSION.md`) estao `resolvido`;
  o incidente atual e um novo episodio (baseline defasada apos merges #390/#412).
- Roteamento decidido: **Agente 08** executa a investigacao (download do
  artefato do run 44390872266, comparacao do diff, classificacao da causa).
  Somente apos classificacao como "render atual correto", o dispatch do job
  manual "Gerar baselines visuais Linux" + commit de baseline passa para o
  **Agente 08A** (mesmo slot — nunca simultaneo com o 08 em sobreposicao).
  Revisao do commit de baseline: **Agente 24** obrigatorio.
- **GATE PENDENTE — decisao humana:** antes de commitar qualquer baseline,
  confirmar que o render atual e o esperado. O 08 deve preparar a comparacao
  artefato-vs-baseline e escalar ao 00/usuario a evidencia visual para decisao.
- Base de referencia: `origin/main` @ `e0446cef0` (pos-merges #412 e #390).
- Registro da decisao: `.agents/runs/00-triagem-visual-baseline-20261119.md`.

## Problema

O gate "Visual Regression" + "Visual Regression Gate" falha em todos os PRs
abertos com diff estavel de ~0,01% (~5.996 pixels) em `intelligence-light.png`
(area de Inteligencia, variantes light/tablet/desktop). A baseline commitada
esta defasada em relacao ao render atual.

Evidencias:
- PR #418 (diff de 2 linhas em cadence) falhou com o mesmo diff — impossivel ser
  causado pelo diff.
- PRs #390 e #412 (login/CRM, sem relacao com Intelligence) falham identico.
- `main` apresenta a mesma falha nos runs de merge recentes.
- Existe job manual "Gerar baselines visuais Linux" no workflow — indicio de que
  baselines confiaveis sao Linux e a atual pode ter sido gerada em outro ambiente
  ou estar desatualizada apos merges de UI.

## Arquivo(s) envolvido(s)

- Baselines visuais (localizar via workflow de visual regression em
  `.github/workflows/`; provavelmente snapshots Playwright).
- Pagina afetada: Inteligencia (`src/features/intelligence/**` —
  IntelligenceHub, PredictiveScoringNbaCard, RobustScriptGenerator).
- Workflows: `.github/workflows/` (propriedade do Agente 08).

## Evidencia

- Runs de CI: #390 (44351144097), #412 (44333280698), #418 (44390872266) —
  todas falham exclusivamente em Visual Regression com ~0,01% em
  `intelligence-light.png`.
- Todos os demais gates (application gate, SonarQube, build, CodeQL, Trivy,
  RLS, SBOM, bundle budget) passam.

## Alteracao necessaria

1. Baixar o artefato do run 44390872266 e comparar `intelligence-light.png`
   atual vs baseline para classificar o diff.
2. Se o render atual for o correto (mudanca visual legitima recente sem
   rebaseline): executar o job manual "Gerar baselines visuais Linux" no
   GitHub Actions e commitar as baselines em branch propria.
3. Se o diff for regressao real: identificar o commit causador via `git log`
   em `src/features/intelligence/**` / tokens de tema, corrigir na branch do
   dono e so entao rebaselinar.
4. Agente 24 deve revisar o commit de baseline antes do merge.

## Teste esperado

- `Visual Regression` + `Visual Regression Gate` verdes em um PR de controle.
- `main` volta a ter gate visual verde.
- Observar os proximos 3 PRs para confirmar que o gate voltou a ser sinal util.

## Contexto adicional

- Hipoteses a verificar primeiro: (a) baseline gerada em ambiente divergente
  (fonte/render) — o job manual Linux existe para isso; (b) mudanca visual
  legitima recente sem rebaseline; (c) regressao real de UI.
- Nao usar baseline gerada localmente em Windows — reproduzir via job do
  proprio workflow.
- Threshold do gate: nao ajustar sem decisao do 00/08 — este handoff nao
  autoriza mudanca de threshold.
- Decisao humana necessaria ANTES de commitar baselines: confirmar que o
  render atual e o esperado.
- Relacionado: release-readiness audit NO-GO; este item e higiene de CI
  (nao P0/P1), mas e o debito mais barato de quitar e o que mais reduz ruido.
- Ate la, revisores devem tratar Visual Regression como falha conhecida nos
  PRs #381-#393, #390 e #412 — nao e bloqueio dos diffs.
- Licao a registrar ao concluir: baseline visual precisa acompanhar merges de
  UI; considerar obrigatoriedade de rebaseline quando PR toca
  `src/features/intelligence/**` ou tokens globais.

## Resolucao

(preencher pelo agente executor)
Status: aberto
Responsavel:
Commit/Evidencia:
Data:
Risco residual:
Handoff reverso:
Proximo passo:
Handoff aberto em: 2026-11-18 por Devin, a pedido do usuario (item 3 do ciclo
pos-#418: "1, 2 e 3" — fechar PR redundante, monitorar CI, registrar debito
visual).
Protocolo aplicavel: docs/orchestration/PROTOCOLO_QUALIDADE_E_ACEITE.md.
Agente executor sugerido: 08 (triagem/investigacao) ou 08A (dispatch do job
manual + commit de baseline, se for so rebaseline).
Agente revisor: 24 (obrigatorio antes do merge do commit de baseline).
Dependencias: acesso ao artefato do workflow; permissao de dispatch do job
manual; decisao humana sobre o diff visual.
Riscos: rebaselinar uma regressao real e esconder o problema — por isso a
comparacao do artefato e o gate de entrada.
Criterio de aceite: run de CI com Visual Regression verde em PR de controle.
Nao escopo: corrigir o conteudo visual da pagina Inteligencia em si (se for
regressao, abrir handoff ao dono do modulo).
Rollback: git revert do commit de baseline.
Ao concluir: atualizar Status para resolvido, preencher esta secao, e registrar
em `.agents/runs/` referenciando este handoff.
Fim do handoff.
## Atualizacao (2026-11-19, Devin)

Evidencia de que o debito pode estar resolvido sem execucao do 08:
- PR #419 `ci/visual-baselines-linux` foi mergeado em `main` — baselines
  aparentemente regeneradas.
- PR #422 (fix SonarQube floating promise, sem relacao visual) passou
  Visual Regression + Gate verdes (run 44557156887, 2026-11-19).
- Recomendacao: 08/00 verificam se main segue verde no gate visual e, se
  sim, encerram este handoff como resolvido-por-#419 com a evidencia acima.
