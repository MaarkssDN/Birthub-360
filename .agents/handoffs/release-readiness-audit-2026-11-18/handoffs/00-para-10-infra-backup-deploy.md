- De: 00 (Coordenador)
- Para: 10 (Infra/SRE) + 08 (QA)
- Status: ABERTO — bloqueador de lançamento
- Prioridade: P0

## Achados

### DEBT-0001 — Deploy EC2 sem migrate deploy nem healthcheck — P0
`deploy-ec2.sh:24-48`: scp dist+node_modules + `docker restart birthhub-app`. Sem `prisma migrate deploy`, sem healthcheck, sem tag de imagem. Viola B-05. Doc `DEPLOY_EC2.md` afirma healthcheck que não existe.
**Correção:** `docker exec birthhub-app npx prisma migrate deploy` antes do restart; curl `/health/ready` fail-closed; versionar `birthhub-app:<sha>`.
**Aceite:** deploy de teste aplica migration e falha o script se healthcheck não responder.
**Dono:** 10 (script) + 08 (verificação CI). Relatório: `auditoria/infra-ci-mobile-marca.md` INF-01/03.

### DEBT-0002 — Zero backup real; stubs reportam sucesso falso — P0
`PRODUCTION_ARCHITECTURE.md` admite sem backup. `backup-encrypted.sh` escreve placeholder; `restore-test.sh` só imprime sucesso; `dr-simulation.sh`/`rollback-drill.sh` constantes hardcoded.
**Correção:** pg_dump real agendado → destino externo criptografado; restore testado com evidência versionada; remover/rewrite stubs.
**Aceite:** `BACKUP-RESTORE-DRILL-RESULT.json` datado com restore real.
**Relatório:** INF-02, DB-07.

### DEBT-0037/0038 — Rollback sem caminho reproduzível; observabilidade cega — P1/P2
INF-03 (tag previous inexistente), INF-04 (Prometheus não scrapea prod, sem Alertmanager, EXPOSE_METRICS off).
**Aceite:** runbook único de rollback + métricas/alertas com receptor real no EC2.

### INF-08/09 — `.env.example` e-mail pessoal + bloco STORAGE duplicado — P3
Remover e-mail real; placeholders `change-me`; deduplicar bloco.

## Observação
Verificar `deploy-ec2.ps1`/`deploy-aws.ps1` (não auditados — podem divergir do .sh).
