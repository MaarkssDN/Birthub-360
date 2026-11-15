# Handoff — Decisão formal k8s/Helm/ArgoCD

De: 00 — Coordenador
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: W7
Status: em-andamento
Prioridade: normal
Sprint destino: próxima onda

## Problema

k8s/, charts/birthhub-360/, argocd/, infrastructure/ contêm manifests sem
cluster ativo — "aspiracional". Produção real = EC2 manual (decisão do
operador). É preciso decisão formal: manter, arquivar ou completar.

## Arquivo(s) envolvido(s)

- `k8s/**`, `charts/**`, `argocd/**`, `infrastructure/**`
- `.github/workflows/**` (verificar referências)

## Evidência

- Worktree `agente-10-k8s-decisao` preservada para retomada.
- Precedente: `infrastructure/archive/render.yaml.disabled` (Render foi
  arquivado por decisão similar).

## Alteração necessária

1. Auditar se manifests estão atualizados vs Dockerfile/schema.
2. Decidir e documentar (docs/architecture ou ADR):
   - APOSENTAR → arquivar em infrastructure/archive/ + README;
   - MANTER → documentar checklist de ativação;
   - COMPLETAR → só se houver ambiente real que justifique.
3. Não implementar cluster — decisão + higiene de repositório.

## Teste esperado

- Nenhum workflow referenciando paths movidos sem atualização; docs coerentes.

## Resolução (Agente 10, Onda 4 — parcial, aguardando decisão humana)

Análise completa, opções com trade-offs e recomendação produzidas em
**`docs/ADR/ADR-011-k8s-helm-argocd-decisao.md`** (Status: PROPOSTO).

Resumo da auditoria:

- `k8s/` — manifests avulsos minikube-only e **desatualizados** (`containerPort`/probes `:3000`
  vs `ENV PORT=3024` do Dockerfile, `imagePullPolicy: Never`, secret legado `prospector-secrets`,
  ingress `prospector.local`). Redundantes com o chart.
- `charts/birthhub-360/` — **único artefato IaC-K8s correto e mantido** (corrigido na Onda 4:
  migration hook, HPA/Rollout, PDB, worker probes). Alimentado por `cd-homolog.yml`
  (`workflow_dispatch` apenas) que comita tag em `values.yaml` na branch `develop`.
- `argocd/` — dois `Application` aspiracionais, sem cluster registrado.
- `infrastructure/observability/` — **ativo** via `docker-compose.opensource.yml`;
  `infrastructure/security/` e `infrastructure/qdrant/` — ativos/contingentes.
- `RUNBOOK.md` estava factualmente desatualizado (citava Render/OCI como ativos) — corrigido
  neste handoff para refletir `docs/deploy/README.md` (Render arquivado, OCI retirado
  DEVOPS-010, produção = EC2 manual, canônico = Local-First).

Recomendação registrada no ADR: **Opção C** — arquivar `k8s/` e `argocd/` (resíduo quebrado/
recriável), manter `charts/` como IaC não-ativo alinhado ao ADR-009, manter `infrastructure/`.
Decisão final (inclusive destino de `charts/` e do `cd-homolog.yml`, que é do Agente 08) é do
operador/Agente 00.

**Nota de propriedade:** `docs/` pertence ao Agente 08 (`docs/AGENTS.md`). O ADR-011 foi criado
em `docs/ADR/` por ser o local indicado pelo handoff ("docs/architecture ou ADR") — registrar
para ciência/revisão do 08 ou ratificação do 00. Nenhum outro arquivo de `docs/` foi tocado.
