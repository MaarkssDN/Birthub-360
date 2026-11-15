# Handoff — Decisão formal k8s/Helm/ArgoCD

De: 00 — Coordenador
Para: 10 — Infraestrutura, Observabilidade e SRE
Onda: W7
Status: aberto
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
