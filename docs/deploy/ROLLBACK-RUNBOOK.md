# Runbook de Rollback — Deploy EC2 (Birth Hub 360)

> DEBT-0037: antes não existia caminho reproduzível de rollback. Este runbook é o caminho único.
> Todo deploy via `deploy-ec2.sh`/`deploy-ec2.ps1` grava o SHA em `deploy-history.log` no servidor.

## Quando acionar

- Healthcheck `/health/ready` falhou após deploy (o script já aborta com exit 1 — verifique `docker logs birthhub-app`).
- Erro 5xx em produção pós-deploy.
- Migration aplicata corrompeu dados (avaliar com 01 antes — rollback de código ≠ rollback de banco).

## Pré-requisitos

- Acesso SSH à EC2 (`ubuntu@3.143.251.44`, chave `.pem`).
- SHA anterior conhecido: `tail -5 /home/ubuntu/birthhub-360/deploy-history.log`.

## Passos

```bash
ssh -i <chave.pem> ubuntu@3.143.251.44
cd /home/ubuntu/birthhub-360

# 1. Identificar o backup de dist do deploy anterior
ls -dt dist-backup-* | head -3

# 2. Restaurar dist anterior
mv dist dist-failed-$(date +%Y%m%d-%H%M%S)
cp -r "$(ls -dt dist-backup-* | head -1)" dist
# (node_modules raramente muda; se o deploy falho atualizou package.json,
#  restaure também: cp dist-backup-<ts>/../package.json-backup se existir —
#  o script não versiona package.json; para mudanças de deps, rebuild da tag anterior)

# 3. Rollback de MIGRATION (se a migration nova quebrou o app)
#    NÃO reverta schema no escuro — acionar Agente 01.
#    Migrations Prisma são forward-only; correção = nova migration de fix.

# 4. Reiniciar e verificar
docker restart birthhub-app
for i in $(seq 1 12); do
  curl -fsS --max-time 5 http://localhost:3000/health/ready && break
  sleep 5
done
docker logs --tail 50 birthhub-app
```

## Critério de sucesso

`curl http://localhost:3000/health/ready` responde 200 e `docker ps` mostra `birthhub-app` healthy.
Registrar no `deploy-history.log`: `ROLLBACK-TO <sha> <timestamp> <motivo>`.

## Limitações conhecidas

- `deploy-history.log` só existe em deploys feitos após 2026-11-19 (este runbook).
- Não há tag de imagem Docker versionada — rollback é por `dist-backup-*`, que cobre código
  mas não `node_modules`/`package.json`. Mudanças de dependência exigem rebuild da tag anterior.
- Rollback de banco depende de backup (`scripts/db/backup-encrypted.sh` + `restore-test.sh`).

## Observabilidade (DEBT-0038 — pendente de D-01)

- `EXPOSE_METRICS` off em produção; Prometheus não scrapeia o EC2; sem Alertmanager com receptor real.
- Ação necessária no host (depende de D-01): habilitar `EXPOSE_METRICS=true`, apontar
  Prometheus para `/metrics`, configurar Alertmanager com webhook Slack/Discord.
- Até lá, monitoramento = healthcheck do deploy + `docker logs`.
