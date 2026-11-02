# WF5 — Prontidão de Deploy e Operação (auditoria 02/11/2026)

Escopo: `production.yaml`, `cd-homolog.yml`, `backup-production.yml`,
`docker-publish.yml`, `ios-build.yml`, `android-build.yml` (+ `deploy-aws.yml.disabled`, só documentado).
Método: actionlint 1.7.7 + shellcheck 0.10.0; `gh secret list`, `gh variable list`,
`gh api .../environments`, `gh run list` — **somente leitura**. Nenhum workflow foi disparado.

Fora do escopo: `deploy-pages.yml` — o Marcelo decidiu não usar GitHub Pages; a remoção do workflow vai em PR separado.

## Achados transversais
- **Pins por SHA:** todas as 11 actions externas usadas estão fixadas por SHA completo com comentário de versão; cada SHA foi conferido contra a tag via `gh api repos/<owner>/<repo>/commits/<tag>` — 11/11 OK.
- **Environments:** o repositório **não tem nenhum environment** cadastrado (`production` inexistente). Ao rodar, o GitHub cria o environment automaticamente **sem required reviewers** → o "OK humano" não é imposto pela plataforma.
- **Secrets/vars de repo:** nenhum dos secrets de backup (`BACKUP_*`, `R2_*`) nem de AWS existe. Production/Homolog/docker-publish usam só `GITHUB_TOKEN`.
- **Gatilhos:** os 6 workflows são `workflow_dispatch` somente (Android também roda o job `gate` em `pull_request`), coerente com LOCAL-FIRST.

## Correções feitas neste PR (sem mudar comportamento de deploy)
1. `.github/actions/require-ci-green/action.yml`: `inputs.sha` não é mais interpolado direto no shell (risco de injeção) → passado via `env`.
2. `docker-publish.yml`: idem para `inputs.sha`, validado (`^[0-9a-f]{40}$`, `::error::` + falha) antes de gravar em `GITHUB_OUTPUT` (P3 do Agente 24; a action `require-ci-green` já valida o mesmo regex antes de qualquer uso e não grava outputs com o valor); removidos o `if:` e o ramo `workflow_run` mortos (gatilho `workflow_run` já removido no commit 957710ce).
3. `backup-production.yml`: SC2129 (redirecionamentos agrupados no step summary).
Resultado: actionlint limpo nos 6 workflows do escopo.

## Por workflow

| Workflow | Status | Bloqueios |
|---|---|---|
| Production CI/CD (`production.yaml`) | **Bloqueado (decisão)** | Nunca rodou. Desativado por LOCAL-FIRST. Environment `production` não existe → criar com required reviewers antes do 1º uso. Exige SHA com `build` verde em ci.yml. |
| CD Homologation (`cd-homolog.yml`) | **Bloqueado** | Nunca rodou. Faz `git push origin develop`, mas **a branch `develop` não existe**; edita `charts/prospector-atlas/values.yaml`, **caminho inexistente** (existe `charts/birthhub-360`). Baixa `yq` de `releases/latest` (sem pin). Sem `environment:` (sem aprovação). Precisa de decisão de infra (Agente 10) — não alterado aqui. |
| Backup de produção | **Bloqueado** | Nunca rodou. Faltam os secrets `BACKUP_DATABASE_URL`, `BACKUP_ENCRYPTION_PASSPHRASE`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`; R2 desabilitado (403). Sem `concurrency`/`environment`. O step de pré-requisitos falha cedo e de forma segura. Reativar o cron só depois de 1 execução manual verde. |
| docker-publish | **Pronto (sob demanda)** | Skips de 18/10 (00:03–00:34 UTC = 17/10 21:03–21:34 BRT): eventos `workflow_run` em que o CI upstream não concluiu `success`, então o `if:` do job pulou tudo. O gatilho foi removido em 957710ce (17/10 21:35 BRT). Hoje só roda por dispatch com SHA verde. Publicar no GHCR exige OK do Marcelo. |
| Build iOS | **Pronto (artefato sob demanda)** | Nunca rodou; sem secrets de assinatura (artefato não assinado). O 1º dispatch exige OK. |
| Build Android | **Pronto** | Gate em PR verde (16/10); job de build só por dispatch, nunca exercitado. |
| deploy-aws.yml.disabled | Desativado (não reativado) | Exigiria `AWS_ROLE_TO_ASSUME`, `AWS_S3_FRONTEND_BUCKET`, `AWS_CLOUDFRONT_DIST_ID` — nenhum existe. Também interpola secrets direto no shell; corrigir se um dia for reativado. |

## Ações que só o Marcelo pode fazer
1. Criar os environments `production` (required reviewers + branch policy `main`) e, se quiser, `homologation`.
2. Se o backup for ativado: habilitar R2 e cadastrar os 6 secrets acima.
3. Decidir o alvo de homologação (criar `develop`? qual chart?) antes de qualquer dry-run.
4. Autorizar qualquer primeiro `workflow_dispatch` (dry-run). Este agente não executou nenhum.
