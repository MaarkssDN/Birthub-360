# Parecer Agente 24 — PR #155 (WF5, prontidão de deploy)

- **SHA:** a2f396733a7267c6f777117491aa23c505577c64 (base 34ca6493516ff9c2c893fc49f16971e0972cf82d)
- **Veredito: APROVADO.** O merge depende do OK explícito do Marcelo para qualquer deploy/dispatch e para settings do repo (environments, secrets). Este parecer não aprova nenhum dos dois.
- Superados (sem parecer emitido): 92d2b856, 70dae429, 673ac579, e41c1880. Este SHA também substitui o APROVADO condicionado em 54db5545.

## Escopo (diff vs main)
- `.github/actions/require-ci-green/action.yml` (+3 -1): `inputs.sha` passa a ser lido via `env`, sem interpolar no shell. Já revisado no 54db5545.
- `.github/workflows/docker-publish.yml` (+7 -5): valida o SHA (`^[0-9a-f]{40}$`) antes de `GITHUB_OUTPUT` e remove o ramo `workflow_run` morto.
- `docs/ops/wf5-prontidao-deploy.md` (+47): relatório.
- **Não toca** `backup-production.yml` (o SC2129 foi revertido; o arquivo sai no #181) nem `deploy-pages.yml` (sai no #178). Não sobram restos de Pages: a única menção é "fora do escopo".

## Alinhamento com a infraestrutura real (verificado no repo)
- `production.yaml` e `cd-homolog.yml` não fazem deploy na AWS. Só publicam a imagem no GHCR, e o cd-homolog também atualiza Helm em `charts/prospector-atlas`, caminho que não existe.
- O deploy real é manual, por scp/ssh na EC2 (`deploy-ec2.sh`, `deploy-ec2.ps1`, `deploy-aws.ps1`), como o Marcelo decidiu ("O aws não precisa configurar…"). O relatório registra isso corretamente.
- Backup: o Marcelo decidiu "Não quero backup por enquanto", e o R2 não é usado. O workflow está fora do escopo deste PR e é removido pelo #181 (APROVADO).
- P3, risco fora do PR (dono: Agente 10): os scripts EC2 têm o IP público `3.143.251.44` fixo no código.
- P3: WF1 deve registrar que aceita a mudança em `require-ci-green` (pendência que vem do 54db5545).

## CI @a2f39673
- Release 41452669916 (attempt 1) com success. Unit, Golden Dataset, Integration, Build, Smoke e E2E rodaram com success.
- Sonar 41452670140, VR 41452669989, CodeQL 41452669920, Trivy 41452670005 e Dependency Review 41452670014 com success.
- Bundle Budget não roda (filtro de path).
- Sem falhas novas em relação à main: o Release da base 645cb6cb (41452140101) terminou com success.

## Defasagem em relação à main
- O branch está 8 à frente e 22 atrás de main 70cba669.
- Nenhum arquivo alterado na main desde a base 34ca6493 se sobrepõe aos 3 arquivos do PR, e o merge-tree contra a main deu limpo. Então o merge da main **não é necessário por conflito**.
- Só é necessário se a branch protection exigir o branch atualizado. Se isso acontecer, o head muda e é preciso uma re-revisão rápida do novo SHA, com CI verde.
- Este agente não fez merge nem rebase.
