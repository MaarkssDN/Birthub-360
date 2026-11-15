# ADR-011: Decisão formal sobre a stack Kubernetes / Helm / ArgoCD (`k8s/`, `charts/`, `argocd/`)

**Data:** 2026-11-15 (decisão registrada em 2026-11, branch `agente/10-k8s-archive`)
**Status:** **DECIDIDO — Opção C (parcial): `k8s/` e `argocd/` ARQUIVADOS; `charts/` MANTIDO
ativo-não-deployado.** Decisão direta do usuário sobre este ADR (PR #348). Execução registrada
na seção 8 abaixo.
**Autor:** Agente 10 — Infraestrutura, Observabilidade e SRE
**Origem:** Handoff `.agents/handoffs/00-para-10-decisao-k8s-helm-argocd.md` (Onda W7)
**Escopo de propriedade:** `k8s/**`, `charts/**`, `argocd/**`, `infrastructure/**` (Agente 10);
`.github/workflows/**` pertence ao Agente 08 — qualquer ajuste de workflow decorrente desta
decisão exige handoff/aprovação do 00.

---

## 1. Contexto

O projeto migrou de um modelo de deploy em nuvem gerenciada (**Render**, depois candidato
**Oracle Cloud self-hosted**) para **Local-First** (decisão de produto, 2026-09-20 — ver
`docs/deploy/README.md` §1 e `docs/architecture/ADR-009-LOCAL-FIRST-OU-AWS.md`). O estado real
hoje:

- **Canônico:** Local-First via `docker-compose.yml`.
- **Produção:** instância **AWS EC2** (`3.143.251.44`) com deploy **manual**, controlado pelo
  operador via `deploy-ec2.sh` / `deploy-ec2.ps1` / `deploy-aws.ps1` — procedimento em
  `docs/operations/DEPLOY_EC2.md`. Nenhum workflow de deploy ativo.
- **Render:** blueprint arquivado em `infrastructure/archive/render.yaml.disabled`
  (`autoDeployTrigger: off`).
- **OCI self-hosted:** retirado (DEVOPS-010, 2026-09-18); `docker-compose.oci.yml` não existe mais
  na raiz.

Nesse cenário, `k8s/`, `charts/birthhub-360/` e `argocd/` são manifests **sem cluster real
registrado** — o handoff os classifica como "aspiracionais" e pede decisão formal:
manter, arquivar ou completar. Precedente direto: `infrastructure/archive/render.yaml.disabled`
foi arquivado por decisão similar.

## 2. Estado real auditado (o que existe e funciona vs. resíduo)

### 2.1 `k8s/` — manifests avulsos para minikube local

| Manifest | Estado | Evidência |
|---|---|---|
| `api-deployment.yaml` | **Desatualizado / quebrado se aplicado** | `imagePullPolicy: Never` + `image: birthhub-360:latest` (só existe via build local para minikube); `containerPort: 3000` e probes em `:3000`, mas o `Dockerfile` atual fixa `ENV PORT=3024` — a imagem publicada não escuta na porta que os probes/Service esperam; `envFrom` aponta para secret `prospector-secrets` (nome legado, não corresponde ao `secrets:` do chart); `replicas: 2` sem HPA/PDB |
| `postgres-statefulset.yaml` | Minikube-local | volume `emptyDir`/hostPath local, sem persistência real |
| `redis-deployment.yaml` | Minikube-local | idem |
| `ingress.yaml` | Minikube-local | `host: prospector.local` — nome legado do produto |
| `migration-job.yaml` | Parcialmente correto | `npx prisma migrate deploy` confere com o `startCommand` do Render arquivado; a CLI do prisma na imagem já foi resolvida (handoff `onda-4/10-para-08-prisma-cli-imagem-producao.md`, resolvido) |

O próprio `k8s/README.md` já se declara **[ARCHIVED / NOT ACTIVE]** e documenta que estes
manifests são caminho de desenvolvimento/teste contra minikube, não deploy real.

### 2.2 `charts/birthhub-360/` — chart Helm (caminho "oficial" k8s, se um dia houver cluster)

- **Bem mais mantido que `k8s/`**: corrigido na Onda 4 (Agente 10) — `migration-job.yaml` com
  hook `pre-install,pre-upgrade`, HPA corrigido para `Rollout` (Argo Rollouts), `pdb.yaml`,
  `worker-hpa.yaml` (desligado por padrão, sem métrica real de fila), `worker-deployment.yaml`
  com probes reais e `ENABLE_QUEUES`/`ENABLE_EMBEDDED_WORKERS` corretos, `securityContext`
  non-root.
- **Coerente com a imagem atual**: `values.yaml` define `PORT: '3000'` via env do container —
  funciona porque o app lê `PORT` do ambiente (o `ENV PORT=3024` do Dockerfile é só default).
- **Alimenta um workflow real**: `.github/workflows/cd-homolog.yml` (job `build-and-push`)
  publica imagem em `ghcr.io` e comita a tag em `charts/birthhub-360/values.yaml` na branch
  `develop` — **sob `workflow_dispatch` manual apenas** (header do workflow: "DESATIVADO POR
  ENQUANTO… LOCAL-FIRST"). `production.yaml` também é `workflow_dispatch` com gate de CI verde;
  não escreve no chart diretamente (verificado: nenhuma referência a `charts/` nele).
- `deploy-aws.yml.disabled` registra explicitamente: "K8s, ArgoCD, Helm charts, ECS estão
  marcados como ARCHIVED/LEGACY".
- `argocd/application-{production,homolog}.yaml` apontam `repoURL` para o repo, `path:
  charts/birthhub-360`, `targetRevision: main`/`develop`, namespaces `production`/`homolog` —
  **nenhum cluster ArgoCD registrado** consome isso hoje.

### 2.3 `infrastructure/` — parcialmente ativo, parcialmente resíduo

| Item | Estado real |
|---|---|
| `infrastructure/observability/**` | **ATIVO** — montado por `docker-compose.opensource.yml` (Prometheus, Grafana, Loki, Tempo, OTel Collector, Alertmanager). É a stack de observabilidade do ambiente local/opensource. **Porém `RUNBOOK.md` está factualmente desatualizado**: a tabela de status ainda diz "Render ativo, fallback" e "OCI destino definitivo de produção" — diverge de `docs/deploy/README.md`, que registra Render arquivado, OCI retirado (DEVOPS-010) e produção = EC2 manual. Correção cirúrgica aplicada neste handoff (ver §5). |
| `infrastructure/security/**` | **ATIVO/contingente** — `DOCKER-REMOTE-DAEMON.md` + `apply-docker-2375-allowlist.ps1` documentam exposição real do Docker daemon do host de dev `192.168.0.116:2375` sem auth (handoff `00-para-10-docker-2375-sem-autenticacao.md` aberto — mitigação pendente do operador no host). Não é resíduo de cloud. |
| `infrastructure/qdrant/README.md` | Guia de deploy do Qdrant via compose — consistente com o modo local-first (`docker-compose.qdrant.yml`, `docker-compose.services.yml`). Ativo como documentação operacional. |
| `infrastructure/archive/render.yaml.disabled` | Resíduo **proposital e correto** — precedente do arquivamento. |

### 2.4 Workflows que tocam a stack

- `.github/workflows/cd-homolog.yml`: único workflow que **escreve** em `charts/` (atualiza
  `values.yaml` com a tag da imagem ghcr). Só roda via `workflow_dispatch` + CI verde.
- `.github/workflows/production.yaml`: `workflow_dispatch`, publica imagem/SBOM, **não**
  referencia `charts/`/`k8s/`/`argocd/`.
- `.github/workflows/deploy-aws.yml.disabled`: desabilitado; comentário já marca k8s/Helm/ArgoCD
  como ARCHIVED/LEGACY.

## 3. Opções

### Opção A — APOSENTAR tudo (arquivar `k8s/`, `charts/`, `argocd/`)

Mover para `infrastructure/archive/` (ou marcar `[ARCHIVED]` in-place, como `render.yaml.disabled`)
e ajustar `cd-homolog.yml` para não escrever em path arquivado (ou desativá-lo também).

- **Prós:** higiene máxima; elimina a divergência "quatro caminhos de deploy documentados";
  coerente com a decisão de produto Local-First e com o comentário de `deploy-aws.yml.disabled`;
  zero custo de manutenção de manifests sem consumidor.
- **Contras:** perde o chart já corrigido na Onda 4 — se um dia houver cluster gerenciado
  (cliente enterprise exigindo K8s, ou retorno a cloud), seria preciso resgatar do histórico git
  e revalidar; `cd-homolog.yml` perde sua função de "staging de imagem" (hoje inócua, mas é o
  único pipeline de publicação de imagem pronto).
- **Pré-requisito:** ADR-009 prevê "capacidade hybrid-cloud ready via IaC" — arquivar tudo
  enfraquece esse compromisso, ainda que o ADR não exija K8s especificamente (fala em "templates
  modulares em `infrastructure/`", que o compose já cobre).

### Opção B — MANTER tudo como está (status quo)

Nada muda; os READMEs já dizem "aspiracional/não ativo".

- **Prós:** custo zero agora; chart permanece pronto.
- **Contras:** `k8s/` avulsos permanecem **quebrados** (porta 3000 vs 3024, secret legado) —
  um agente futuro pode aplicá-los sem perceber; drift continua acumulando; decisão formal
  pedida pelo handoff permanece pendente.

### Opção C — REESCOPAR (recomendado): arquivar o que é resíduo, manter o que é ativo

1. **`k8s/` → arquivar** (`infrastructure/archive/k8s-minikube/` ou deletar após revisão):
   manifests avulsos são minikube-only, **desatualizados e inseguros de aplicar** (porta errada,
   `imagePullPolicy: Never`, secret inexistente). São redundantes com o chart — o chart já cobre
   o mesmo caminho de forma correta. Custo de manter > benefício.
2. **`argocd/` → arquivar**: dois `Application` de ~20 linhas cada, recriáveis em minutos; sem
   cluster ArgoCD registrado, são só intenção. Arquivar com README apontando o caminho de
   reativação.
3. **`charts/birthhub-360/` → MANTER, explicitamente marcado não-ativo**: é o único artefato
   IaC-Kubernetes **correto e mantido** do repo (Onda 4). Alinha com ADR-009 (hybrid-cloud ready)
   e preserva o alvo do `cd-homolog.yml`. Adicionar checklist de ativação no `charts/README.md`
   (registrar cluster, provisionar secrets via Sealed/External Secrets, revisar `values.yaml`).
   Alternativa dentro desta opção: arquivar também se o operador decidir "zero cloud, ponto" —
   mas isso é decisão de produto, não de higiene.
4. **`infrastructure/observability` → MANTER** (ativo no compose opensource); corrigir
   `RUNBOOK.md` (feito neste handoff — §5).
5. **`cd-homolog.yml` → manter como está** se `charts/` ficar; se `charts/` for arquivado,
   desativar/arquivar o workflow (decisão do 08/00).

- **Prós:** remove resíduo quebrado (`k8s/`), preserva o ativo (`charts/`, observability,
  security), mantém a porta IaC aberta alinhada ao ADR-009, muda pouco e é reversível via git.
- **Contras:** mantém um caminho "quase ativo" que ainda pode confundir; exige disciplina de
  atualizar `charts/` quando a imagem/schema mudar (hoje já é assim via `cd-homolog.yml`).

## 4. Recomendação

**Opção C**, com o seguinte detalhe de decisão pendente:

- Se a posição do operador for **"não teremos K8s em nenhum cenário previsível"** → Opção A
  completa (arquivar `charts/` também) é defensável e mais simples; o chart volta pelo histórico
  git se necessário.
- Se houver **possibilidade real de cliente/ambiente exigindo K8s** (venda enterprise,
  soberania on-premise do cliente — cenário que o próprio ADR-009 contempla) → Opção C é a
  correta: o chart é o ativo IaC e já está pago (Onda 4).

Em ambos os casos, `k8s/` avulsos e `argocd/` devem ser arquivados: hoje são resíduo quebrado,
não caminho viável.

## 5. O que foi executado neste handoff (higiene, não decisão)

- Este ADR criado como documento de decisão (proposta).
- `infrastructure/observability/RUNBOOK.md`: corrigida a tabela de status de ambiente que ainda
  citava Render/OCI como ativos — agora reflete `docs/deploy/README.md` (Render arquivado, OCI
  retirado DEVOPS-010, produção = EC2 manual via `deploy-ec2.sh`, k8s/Helm/ArgoCD aspiracional).
- Handoff atualizado para `em-andamento` com seção de resolução.

**Nada foi movido, arquivado ou deletado** — aguarda decisão humana.

## 6. Decisões pendentes do humano/orquestrador

1. **Destino de `k8s/`**: arquivar (recomendado) vs manter rotulado vs deletar.
2. **Destino de `argocd/`**: idem.
3. **Destino de `charts/`**: manter como IaC não-ativo (recomendado se houver cenário K8s) vs
   arquivar junto com `k8s/`+`argocd/`.
4. **`cd-homolog.yml`** (propriedade do 08): se `charts/` for arquivado, o job que comita
   `values.yaml` precisa ser desativado/arquivado — exige handoff para o 08 e aprovação do 00.
5. **`infrastructure/observability/RUNBOOK.md`**: correção factual aplicada cobre só a tabela de
  status; as seções operacionais OCI/Render em profundidade permanecem como histórico — decidir
  se devem ganhar banner "HISTÓRICO" ou permanecer (recomendado: banner, já que OCI foi retirado
  e Render arquivado — decisão cosmética pendente).
6. **`k8s/AGENTS.md`, `charts/AGENTS.md`, `argocd/AGENTS.md`, `infrastructure/AGENTS.md`**:
   revisar após a decisão para refletir o novo status (hoje já declaram não-ativo na maioria).

## 7. Consequências da decisão (a registrar quando tomada)

- Se Opção A/C-com-arquivo: criar `infrastructure/archive/k8s-legacy/` + `argocd/` arquivado com
  README de "como reativar" (apontar para `charts/` + este ADR); atualizar
  `docs/deploy/README.md` §2 (tabela de caminhos) e `docs/operations/DEPLOY_EC2.md` se necessário.
- Se Opção C: adicionar em `charts/README.md` o checklist de ativação (cluster, ArgoCD, secrets
  externos, `helm lint`/`helm template` no CI — hoje **não há** job de lint do chart em nenhum
  workflow; lacuna a registrar se o chart for mantido como ativo).
- Registrar a decisão neste ADR (mudar Status para ACCEPTED/REJECTED) e no
  `docs/deploy/README.md` como fonte de verdade.

## 8. Decisão tomada e execução (2026-11, Agente 10 — worktree `Birthub-360-wt-k8s`)

**Decisão do usuário:** arquivar `k8s/` e `argocd/` — sem deletar histórico. `charts/`
**permanece ativo-inalterado**; `cd-homolog.yml` não muda (escreve em `charts/values.yaml`,
não em `k8s/`).

Executado nesta branch:

1. `git mv k8s/ infrastructure/archive/k8s/` e `git mv argocd/ infrastructure/archive/argocd/`
   (rename preserva histórico).
2. `infrastructure/archive/README.md` criado — índice do archive, precedente
   `render.yaml.disabled`, caminho de reativação.
3. Referências de path atualizadas: `docs/deploy/README.md`, `docs/deploy/producao.md`,
   `docs/operations/PRODUCTION_ARCHITECTURE.md`, `charts/README.md`,
   `infrastructure/observability/RUNBOOK.md`, `infrastructure/observability/alert.rules.yml`,
   links relativos dentro dos READMEs movidos, e os testes
   `tests/unit/infra/ingress-rate-limit.test.ts` e `tests/unit/brand/brand-hygiene.test.ts`
   (somente paths — asserts inalterados).
4. Nenhum workflow referencia `k8s/` ou `argocd/` — verificado em `.github/workflows/**`;
   não há job de kubeconform/checkov/helm-lint. Trivy fs scan cobre o repo inteiro
   genericamente (não por path); o archive não introduz findings novos — manifests YAML
   sem dependências. Se o orquestrador quiser excluir `infrastructure/archive/` do scan,
   cabe handoff ao Agente 08 (`.github/workflows/**` e `docker-compose.opensource.yml` são
   dele) para `skip-dirs`/`--skip-dirs`.
5. Itens 5 e 6 da seção 6 permanecem como decisões cosméticas pendentes do orquestrador
   (banner HISTÓRICO no RUNBOOK; revisão dos AGENTS.md movidos — já declaram não-ativo).

**Conflito conhecido:** este ADR também existe na branch `agente/10-onda4-k8s` (PR #348,
não mergeado) com status PROPOSTO. Esta versão (status DECIDIDO + seção 8) deve prevalecer;
o orquestrador resolve o merge.
