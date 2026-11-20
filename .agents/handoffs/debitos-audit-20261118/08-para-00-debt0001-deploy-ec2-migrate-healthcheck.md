De: 08 — QA e Release
Para: 00 — Coordenador
Onda: débitos da auditoria 2026-11-18 (DEBT-0001)
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DEBT-0001 (inventario-mestre.md, INF-01)
Sprint destino: saneamento de débitos P0
Resolução-ref: PR #427 (commit 2b748ad4a) / Parecer APROVADO .agents/reviews/debt0001-deploy-ec2-2b748ad4a-24.md

## Problema

`deploy-ec2.sh` (raiz do repo) fazia `scp` de `dist/`, `node_modules/`,
`package.json` e `server.ts` para `/home/ubuntu/birthhub-360` e executava
`docker restart birthhub-app` de forma cega: sem `prisma migrate deploy`,
sem healthcheck fail-closed e sem qualquer marcação de versão do deploy.

## Arquivo(s) envolvido(s)

- `deploy-ec2.sh` (raiz — script de ops; `infrastructure/**` pertence ao 10,
  mas este script vive na raiz e a missão foi delegada pelo 00 ao slot 08/10)
- `docs/operations/DEPLOY_EC2.md` (dono: 08)

## Evidência

- Versão anterior do script: `git show origin/main:deploy-ec2.sh` — restart
  direto após `mv dist-new dist`, sem migrate nem verificação.
- `docs/operations/DEPLOY_EC2.md` já documentava `docker exec birthhub-app
  npx prisma migrate status` como verificação manual, confirmando que o
  Prisma CLI funciona dentro do container `birthhub-app`.
- `src/bootstrap/healthchecks.ts` expõe `/health/live`, `/health/ready` e
  `/health/version`; `Dockerfile` usa `/health/live` como HEALTHCHECK.

## Alteração necessária (implementada)

1. `scp -r prisma/` adicionado ao pacote enviado (necessário para que
   `migrate deploy` enxergue as migrations novas — o script anterior nem
   copiava `prisma/`).
2. `docker exec birthhub-app npx prisma migrate deploy` executado **antes**
   do `docker restart`; `set -e` no bloco remoto aborta o deploy se a
   migração falhar (fail-closed).
3. Healthcheck pós-restart: loop de `curl -fsS http://127.0.0.1:3024/health/ready`
   com intervalo de 5s e timeout total de 90s (configuráveis via
   `HEALTHCHECK_INTERVAL`/`HEALTHCHECK_TIMEOUT` e `APP_PORT`). Em falha:
   imprime `docker logs birthhub-app --tail 50` e `exit 1`.
4. `DEPLOY_VERSION` = `git rev-parse --short HEAD` + timestamp UTC, gravado
   em `/home/ubuntu/birthhub-360/DEPLOY_VERSION`. Este fluxo não reconstrói
   imagem Docker (container monta o diretório e só é reiniciado), então não
   há tag de imagem — a versão de deploy registrada cobre auditoria/rollback.
5. `docs/operations/DEPLOY_EC2.md` atualizado com os novos passos e nota de
   pendência de paridade do `deploy-ec2.ps1`.

## Teste esperado

- `bash -n deploy-ec2.sh` → OK (executado).
- Ensaio real em staging/produção é ação humana: o script toca SSH real,
   Docker remoto e banco de produção — não executável neste ambiente.

## Contexto adicional / pendências

- **`deploy-ec2.ps1` e `deploy-aws.ps1` NÃO foram alterados** — permanecem
  sem migrate/healthcheck fail-closed. Recomendo handoff/decisão do 00 para
  paridade (posso executar em seguida se autorizado; fora do escopo literal
  desta missão, que citava `deploy-ec2.sh`).
- Suposição: o container `birthhub-app` monta `/home/ubuntu/birthhub-360`
  (bind mount) — é o que torna o fluxo scp+restart funcionar hoje. Se o
  Prisma CLI dentro do container não enxergar `DATABASE_URL`, o
  `migrate deploy` falhará de forma explícita (fail-closed) — validar no
  primeiro deploy real.
- Rollback automático em falha de healthcheck não foi implementado
  (escopo: abortar/alertar). O backup `dist-backup-*`/`prisma-backup-*`
  remoto continua permitindo rollback manual documentado.
