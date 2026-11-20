# Parecer do Agente 24 — PR #427 DEBT-0001 deploy-ec2.sh fail-closed

- **Missão:** revisão independente dos débitos P0 do release-readiness audit — PR #427 (`deploy-ec2.sh` fail-closed: migrate deploy + healthcheck `/health/ready` + `DEPLOY_VERSION`).
- **Autor:** Agente 08 (QA e Release). **Auditor:** Agente 24 (Revisão Independente).
- **Base:** `main`. **Revisão exata:** head `2b748ad4a50c5821adc5b00b232c040a47d22396` (branch `agente/08-debt0001-deploy-ec2`, commit único `2b748ad4a` — confirmado via `gh pr view 427` e `git rev-parse pr427`).
- **Arquivos do diff (3):** `deploy-ec2.sh`, `docs/operations/DEPLOY_EC2.md`, `.agents/handoffs/debitos-audit-20261118/08-para-00-debt0001-deploy-ec2-migrate-healthcheck.md` (novo).

## Diff auditado vs escopo declarado

O diff corresponde exatamente ao declarado no corpo do PR e no handoff:

1. `scp -r prisma/` adicionado ao pacote (`deploy-ec2.sh`, bloco "Copiando arquivos") — necessário porque o fluxo não rebuilda imagem e o container monta o diretório; sem `prisma/` o `migrate deploy` não veria as migrations novas.
2. `docker exec birthhub-app npx prisma migrate deploy` executado **antes** de `docker restart`, dentro do bloco remoto que começa com `set -e` → falha de migração aborta o SSH com exit ≠ 0 e o restart nunca acontece. **Fail-closed confirmado.**
3. Healthcheck pós-restart: loop `curl -fsS --max-time 5 http://127.0.0.1:${APP_PORT}/health/ready` com `HEALTHCHECK_INTERVAL` (5s) e `HEALTHCHECK_TIMEOUT` (90s) configuráveis; em timeout imprime `docker logs birthhub-app --tail 50` e `exit 1`. **Falha real, não cosmética.**
4. `docker ps | grep birthhub-app || { ...; exit 1; }` — container ausente também aborta.
5. `DEPLOY_VERSION` = `git rev-parse --short HEAD` + timestamp UTC, gravado em `/home/ubuntu/birthhub-360/DEPLOY_VERSION` — auditável para rollback manual.
6. `docs/operations/DEPLOY_EC2.md` atualizado com os novos passos e nota explícita de que `deploy-ec2.ps1`/`deploy-aws.ps1` não têm paridade (pendência honesta, fora do escopo literal).

## Verificações executadas por mim

- `gh pr view 427` / `gh pr diff 427` — diff lido integralmente (216 linhas).
- `git fetch origin pull/427/head:pr427` + `bash -n` no `deploy-ec2.sh` da revisão exata → **sintaxe OK**.
- `/health/ready` existe: `src/bootstrap/healthchecks.ts:97` (`app.get('/health/ready', handleReadiness)`).
- Porta 3024 consistente: `Dockerfile:64` `ENV PORT=3024`, `Dockerfile:123` HEALTHCHECK usa `/health/live` na mesma porta; `docs/operations/DEPLOY_EC2.md` documenta `curl http://localhost:3024/health/ready` — ou seja, a porta está publicada/esperada no host.
- Segredos: nenhum segredo novo no diff. `KEY_PATH` default aponta para caminho local de `.pem` (pré-existente, não é segredo embutido). `DEPLOY_VERSION` é interpolado via `ssh "... DEPLOY_VERSION='$DEPLOY_VERSION' bash -s"` — conteúdo restrito a `[0-9a-f-]`+timestamp, sem risco de injeção. A connection string/senha não trafega no script.
- `scp prisma/` usa o mesmo padrão `dir/` → `dir-new/` + `mv` já usado para `dist/` e `node_modules/` (fluxo que funciona em produção hoje); `mv prisma prisma-backup-<ts>` preserva rollback manual com `|| true` quando não há `prisma/` anterior.

## Propriedade e governança

- `docs/operations/DEPLOY_EC2.md` → domínio 08 (docs de operação). Handoff criado pelo próprio 08 em `.agents/handoffs/` — permitido por §18.
- `deploy-ec2.sh` na raiz não está nominalmente listado em §15 (`infrastructure/**` é do 10; `.github/workflows/**` e `Dockerfile` do 08). O handoff registra que a missão foi delegada pelo 00 ao slot 08/10. **Observação para o 00:** convém registrar a propriedade efetiva de scripts de deploy na raiz para evitar disputa futura com o 10.
- `package.json`, lockfile, schema, workflows: **não tocados**. Escopo cirúrgico (P3): nenhuma linha fora da missão.

## Achados

| # | Prioridade | Descrição | Ação sugerida |
|---|---|---|---|
| 1 | P3 | O contador `elapsed` do healthcheck só soma `HEALTHCHECK_INTERVAL`, ignorando o tempo do próprio `curl --max-time 5` — o timeout real pode exceder `HEALTHCHECK_TIMEOUT` em até ~5s por iteração. Cosmético; o fail-closed não é afetado. | Nenhuma obrigatória; documentar se quiser precisão. |
| 2 | P3 | Janela de inconsistência inerente à ordem exigida: `migrate deploy` roda contra o container **antigo** ainda no ar — schema novo aplicado enquanto código velho serve até o restart. É a ordem mandatada pela missão e é a prática usual; migrations devem ser backward-compatible. | Manter disciplina de migrations compatíveis (já é norma do repo). |
| 3 | P3 | Rollback automático não implementado (escopo era abortar/alertar) e `deploy-ec2.ps1`/`deploy-aws.ps1` sem paridade — ambos documentados no handoff como pendências. | 00 decidir handoff de paridade para os scripts `.ps1`. |
| 4 | P3 | Ensaio real em staging/produção não executável neste ambiente (script toca SSH/Docker/banco reais) — `bash -n` é a única evidência executável local. O primeiro deploy real é o teste de verdade. | Agendar deploy controlado com observação; o fail-closed limita o blast radius. |

Nenhum achado bloqueador. Não há tenancy/LGPD aplicável (script de infra, sem dados de titular).

## Veredito

**APROVADO** — revisão exata `2b748ad4a`. Todos os critérios da missão verificados estaticamente: migrate antes do restart sob `set -e`, healthcheck `/health/ready` com exit ≠ 0 real em falha, `prisma/` incluído no pacote, `DEPLOY_VERSION` gravado, sem segredo exposto. Ressalva não bloqueante: validação ponta a ponta depende do primeiro deploy real (ação humana já registrada no handoff).
