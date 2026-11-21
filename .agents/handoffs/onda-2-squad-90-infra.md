# Relatório e Handoff — Squad 90 · Onda 2

**Coordenador:** Agente 90 (Hélio) · **Branch:** `agente/90-onda2-infra` (base `integracao/onda-2`)

## Itens entregues e verificados

- **[92 · Kora] `startupProbe` no Kubernetes:** adicionado `startupProbe` (`/health/live`, porta `http`, `periodSeconds: 5`, `timeoutSeconds: 4`, `failureThreshold: 30` = janela de 150s para cobrir `prisma migrate deploy` no boot) em `charts/birthhub-360/templates/deployment.yaml` e `rollout.yaml`. `worker-deployment.yaml` já possuía `startupProbe`. Nota: `helm` não está instalado no ambiente local; YAML validado e templates revisados.
- **[93 · Max] Usuário `node` no `Dockerfile`:** removido `groupadd`/`useradd` de `nodejs` (uid 1001) e substituído por `chown -R node:node /app` + `USER node` (uid 1000, já existente em `node:22-slim`). `charts/birthhub-360/values.yaml` alinhado (`runAsUser: 1000`, `fsGroup: 1000`).
- **[99 · Vito] Gate Semgrep e npm audit:** `npm audit` já era gate bloqueante em `.github/workflows/ci.yml` (`npm run security:audit-waivers`) e `.github/workflows/dependency-review.yml` (mantido sem duplicar). Adicionado `.github/workflows/security-semgrep.yml` com `semgrep scan --error` em PRs para `main`/`master`. *Pendência externa:* registrar o check `Semgrep SAST` como obrigatório na branch protection do GitHub.
- **[90 · Hélio] Runbook de DR (RDS failover):** criado `docs/ops/RUNBOOK_RDS_FAILOVER.md` complementando `docs/ops/DISASTER_RECOVERY_PLAYBOOK.md`, apenas com comandos reais do AWS CLI e avisando que não há evidência de RDS provisionado nem RTO medido (item do checklist mantido `[ ]` na parte de automação/simulação executada).

## [91 · Terra] Handoff — DynamoDB state lock no Terraform (NÃO APLICÁVEL / BLOQUEADO)

- **Situação:** o item *"Ativação de DynamoDB state lock no backend Terraform S3"* não pôde ser aplicado porque **não existe nenhum arquivo `.tf` (Terraform) no repositório**.
- **Decisão (P2/P3):** não foram criados arquivos Terraform fictícios. O item permanece `[ ]` no checklist até que a base de IaC real do projeto seja incorporada ao repositório (ou que a Squad 00/humana indique o repositório externo de IaC).
- **Ação quando IaC existir:** no bloco `terraform { backend "s3" { ... } }`, configurar `dynamodb_table = "<tabela-lock>"` (ou `use_lockfile = true` no Terraform >= 1.10) com `encrypt = true`.
