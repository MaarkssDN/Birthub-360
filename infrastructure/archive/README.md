# infrastructure/archive/ — Artefatos de infraestrutura arquivados (não-produtivos)

Este diretório contém **referência histórica**, não configuração ativa de deploy.
Nada aqui é consumido por CI, deploy ou runtime. Precedente: `render.yaml.disabled`
(blueprint Render arquivado por decisão similar).

## Conteúdo

| Caminho | Origem | Motivo do arquivamento |
|---|---|---|
| `k8s/` | Manifests Kubernetes avulsos (minikube-local) | Desatualizados e inseguros de aplicar (porta/secret divergentes do `Dockerfile` atual); redundantes com `charts/birthhub-360/`. Decisão: ADR-011 (2026-11, usuário). |
| `argocd/` | Applications ArgoCD (`application-{production,homolog}.yaml`) | Nenhum cluster ArgoCD registrado; recriáveis a partir de `charts/`. Decisão: ADR-011. |
| `render.yaml.disabled` | Blueprint Render | Render arquivado; produção atual = AWS EC2 manual. |

## O que continua ativo

- `charts/birthhub-360/` — chart Helm **mantido** (correto, Onda 4), alvo do
  `cd-homolog.yml` (workflow manual). Checklist de ativação em `charts/README.md`.
- `infrastructure/observability/`, `infrastructure/security/`, `infrastructure/qdrant/` — ativos.

## Como reativar (se um dia houver cluster Kubernetes real)

1. Ler `docs/ADR/ADR-011-k8s-helm-argocd-decisao.md` (decisão e consequências).
2. Usar `charts/birthhub-360/` como fonte — **não** os manifests avulsos de `k8s/`
   (estão quebrados: `imagePullPolicy: Never`, porta 3000 vs `ENV PORT=3024`,
   secret legado `prospector-secrets`).
3. Recriar os `Application` do ArgoCD a partir de `argocd/application-*.yaml`
   apontando para `path: charts/birthhub-360`.
4. Provisionar secrets via Sealed/External Secrets e registrar o cluster —
   ver checklist em `charts/README.md`.
