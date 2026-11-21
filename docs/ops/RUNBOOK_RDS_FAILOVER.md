# Runbook — Failover de Banco no Amazon RDS (PostgreSQL)

**Dono:** Agente 90 (Hélio) · **Complementa:** [DISASTER_RECOVERY_PLAYBOOK.md](DISASTER_RECOVERY_PLAYBOOK.md)

> [!IMPORTANT]
> Este repositório não contém IaC (nenhum `.tf`) nem evidência de instância RDS provisionada; os
> deploys documentados são EC2/OCI/Railway. Este runbook só se aplica **se** o banco de produção for
> RDS Multi-AZ. Nenhum script automatizado de failover existe: os passos abaixo são manuais, usando
> comandos oficiais do AWS CLI. RTO real de failover **não foi medido** (ver playbook, `NOT_MEASURED`).

## Pré-requisitos
- Instância RDS com Multi-AZ habilitado (`aws rds describe-db-instances --db-instance-identifier <id> --query 'DBInstances[0].MultiAZ'` → `true`).
- Credenciais AWS com `rds:RebootDBInstance`, `rds:DescribeDBInstances`, `rds:DescribeEvents`.
- Aplicação conecta pelo **endpoint DNS** do RDS (nunca pelo IP).

## Failover forçado (simulação/drill ou falha da primária)
1. Registrar horário de início (T0) e estado atual:
   `aws rds describe-db-instances --db-instance-identifier <id> --query 'DBInstances[0].[DBInstanceStatus,AvailabilityZone,SecondaryAvailabilityZone]'`
2. Forçar failover (derruba conexões; a standby é promovida):
   `aws rds reboot-db-instance --db-instance-identifier <id> --force-failover`
3. Acompanhar até `available` e troca de AZ:
   `aws rds describe-events --source-type db-instance --source-identifier <id> --duration 30`
4. Validar a aplicação: `/health/ready` verde (API e worker); pods com `startupProbe` toleram reconexão.
5. Validar schema/dados: `npx prisma migrate status` contra o endpoint.
6. Registrar T1 − T0 como RTO observado em `.agents/handoffs/` ou `.agents/runs/`.

## Se o failover não ocorrer ou a instância estiver corrompida
Seguir a seção 2.3/3 do playbook (restore do backup criptografado) ou restaurar snapshot/PITR do RDS
(`aws rds restore-db-instance-to-point-in-time`) em nova instância e apontar `DATABASE_URL` para ela
via gestão de segredos (Agente 98).

## Critérios de drill
- Executar em homologação primeiro; em produção apenas com janela aprovada.
- Evidência esperada: eventos RDS de failover, RTO observado, `/health/ready` verde, `migrate status` limpo.
