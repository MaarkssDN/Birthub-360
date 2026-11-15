# Handoff — Decisão formal k8s/Helm/ArgoCD

De: 00 — Coordenador
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: W7
Status: resolvido (execução na branch `agente/10-k8s-archive`, worktree `Birthub-360-wt-k8s`)
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

## Resolução

**Decisão do usuário (sobre ADR-011, PR #348): Opção C parcial — `k8s/` e `argocd/`
arquivados; `charts/` mantido ativo-inalterado.** Executado em 2026-11 pelo Agente 10:

- `git mv k8s/ → infrastructure/archive/k8s/` e `git mv argocd/ → infrastructure/archive/argocd/`
  (histórico preservado via rename).
- `infrastructure/archive/README.md` criado (índice + precedente `render.yaml.disabled` +
  caminho de reativação).
- ADR-011 criado/atualizado nesta branch com **Status: DECIDIDO** e seção 8 de execução —
  ATENÇÃO: o mesmo arquivo existe na branch `agente/10-onda4-k8s` (PR #348) com status
  PROPOSTO; esta versão deve prevalecer, merge fica com o orquestrador.
- Referências de path atualizadas: `docs/deploy/README.md`, `docs/deploy/producao.md`,
  `docs/operations/PRODUCTION_ARCHITECTURE.md`, `charts/README.md`,
  `charts/birthhub-360/{templates/migration-job.yaml,values.yaml}` (só comentários),
  `infrastructure/observability/{RUNBOOK.md,alert.rules.yml}`, READMEs movidos
  (links relativos corrigidos) e testes `tests/unit/infra/ingress-rate-limit.test.ts` +
  `tests/unit/brand/brand-hygiene.test.ts` (somente paths; asserts inalterados).
- Workflows: **nenhum** referencia `k8s/`/`argocd/`; `cd-homolog.yml` intacto (só toca
  `charts/`). Não existe job kubeconform/checkov/helm-lint. Trivy fs scan é genérico por
  repo — se o 00 quiser excluir `infrastructure/archive/` do scan, abrir handoff ao 08
  (`skip-dirs` é propriedade de `.github/workflows/**`/`docker-compose.opensource.yml`).

### Pendências para o orquestrador

1. **Merge/conflito ADR-011**: PR #348 (branch `agente/10-onda4-k8s`) traz a versão
   PROPOSTO; esta branch traz DECIDIDO. Resolver mantendo a versão DECIDIDO.
2. **`Dockerfile` (dono: 08)**: comentários nas linhas ~44-48 citam `k8s/migration-job.yaml`
   — path agora é `infrastructure/archive/k8s/migration-job.yaml`. Não editado por
   propriedade; ajuste cosmético de comentário fica para o 08 se desejado.
3. **Testes (dono: 08)**: paths atualizados por necessidade do rename; revisar no gate.
4. Itens cosméticos pendentes do ADR §6.5-6.6 (banner HISTÓRICO no RUNBOOK; AGENTS.md
   movidos já declaram não-ativo — opcional revisar texto "deploy"→"arquivo").
