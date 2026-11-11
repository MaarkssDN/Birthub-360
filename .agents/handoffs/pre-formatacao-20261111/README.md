# Consolidação pré-formatação — 2026-11-11

**De:** Devin (sessão de consolidação)
**Para:** Agente 00 (Coordenador) e demais agentes
**Status:** resolvido (preservação) / em-andamento (integração)
**Prioridade:** bloqueador para formatação da estação

## Contexto

O usuário vai formatar a máquina. Todo o trabalho local foi commitado e
publicado no `origin` antes da formatação. Este documento é o mapa do que
existe e do que falta decidir.

## Estado preservado

### Branch de integração principal
- `integracao/onda-saneamento-20261110` — pushed. 25+ commits à frente de
  `origin/main`, 13 atrás (main recebeu commits que ainda não foram
  integrados — merge de main → integração pendente de decisão do 00).
- Commits adicionados nesta sessão:
  - `fix(auth)`: escopo de seller na gamificação + RequireRole nas rotas
    forecast/metas/pipeline_ponderado + testes.
  - `test(env)`: isolamento Redis DB /1 e Meilisearch dedicado :7701.
  - `test(integration)`: jornada comercial E2E reescrita com serviços reais.
  - `docs(handoffs)`: auditoria landing 360 + relatório de agentes.

### Branches de agentes publicadas (eram locais)
Todas com commits únicos agora em `origin/agente/*`:
`01-refatoracao-prisma`, `01a-tenancy-audit`, `02-asany-layout`,
`05-cache-enriquecimento-ttl`, `05-supressao-optout`,
`06-bitrix-dead-exports`, `07-duplicate-exports`,
`07-missoes-autonomas-lgpd`, `08-unit-failures`, `09-pwa-icons`,
`11-hotspot-characters`, `11-marca-assets`, `15-auth-import-fix`,
`15-tokens-autenticacao-log`, `17-optout-cadencia`, `18-asany-analytics`,
`23-n1-metricas-ia`, `markshzinhoo1-fix-github-actions`.

### Trabalho não commitado que foi commitado nos worktrees
- `agente/02-asany-layout`: tipagem TabMeta/LucideIcon + UniversalEcosystemPanel.
- `agente/08-unit-failures`: timeouts do teste Landing360.
- `agente/05-supressao-optout`: `sendColdEmailBatch` com filtro opt-out (LGPD).
- `agente/09-pwa-icons`: icon maskable + apple-touch-icon.
- `agente/17-optout-cadencia`: `cadenceEligibility.ts` (regra pura de
  elegibilidade, TAREFA-SANEAMENTO-035).
- copilot `markshzinhoo1-fix-github-actions`: ajustes visuais landing.

### Stashes preservados
- `stash@{1}` (wip-14-08-golden-dataset-evals) → já contido em
  `wip/stash-14-08-golden-dataset-evals` (local+origin).
- `stash@{0}` (orbit.svg, agente/16) → publicado como
  `origin/wip/stash-agente-16-orbit-svg-20261111`.

### Arquivos scratch preservados
- `origin/archive/local-scratch-20261111`: arch/knip/tsc/unit diag,
  `scripts/tmp-verify-user.ts`, `tmp-trivy/`.
- **PERDIDO na formatação:** `tmp-trivy-bin/` (~1.9 GB de binários Trivy —
  regenerável via download oficial, não commitado por tamanho).

## Pendente de decisão (NÃO executado — exige revisão do 24/00)

1. **Merge das branches de agentes → integração**: as branches acima contêm
   trabalho que pode ou não já estar integrado por commits equivalentes.
   Verificar duplicação antes de mergear (várias nasceram da mesma base
   `3e0f6f839`). Ordem de integração do AGENTS.md §19 se aplica.
2. **Merge main → integracao/onda-saneamento-20261110** (13 commits atrás).
3. **Merge integração → main / release**: exige gate + revisão 24.
4. **Worktrees locais** (~20 em `.claude/worktrees/` e
   `Birthub-360-worktrees/`): podem ser removidos após a formatação; os
   branches já estão seguros no origin. Copilot worktrees idem.
5. **`agente/15-auth-token-redaction`**: 0 commits únicos — verificar se
   ainda é necessária ou pode ser descartada.

## Verificação pós-formatação

```bash
git fetch origin --prune
git worktree list   # deve mostrar apenas o worktree principal
```
