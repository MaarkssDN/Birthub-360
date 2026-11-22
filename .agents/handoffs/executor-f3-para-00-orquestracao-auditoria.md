# Handoff — Auditoria F3: Orquestração de Vendas sem dados demo

De: Executor Onda F3 (auditoria P03)
Para: 00 — Coordenador
Onda: F3
Status: resolvido (auditoria) — lacunas de backend ficam como itens abertos
Prioridade: normal
Referência: `.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md`, `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §2 (P03)

## Resultado da auditoria

O serviço `src/features/sales-orchestration/server/SalesOrchestrationService.ts`
JÁ está honesto (entregue no commit `79e8ecdfb` / contrato #696 do Agente 04):
nenhuma seed/template hardcoded, todas as queries filtram `organizationId`
via `authReq.db` (tenant Prisma, RLS), métricas sem cálculo vêm `null` e são
listadas em `meta.unavailableMetrics`.

### Fonte real por entidade

| Entidade | Fonte hoje | Status |
|---|---|---|
| `playbooks` | `PlaybookInsight` (organizationId, status, evidenceCount, updatedAt) | REAL |
| `kpis.playbooksAtivos` | `PlaybookInsight.count(status=BROADCAST)` | REAL |
| `kpis.cadenciasAtivas` | `CadenceSequence.count(active, deletedAt null)` | REAL |
| `jornadas` | nenhuma | SEM BACKEND — retorna `[]` |
| `processos` | nenhuma | SEM BACKEND — retorna `[]` |
| `roteiros` | nenhuma persistida | SEM BACKEND — retorna `[]` |
| `kpis.aderenciaPlaybook`, `speedToLeadMin`, `playbooks.complianceRate/category/targetRole/stagesCount` | sem cálculo real | `null` + `unavailableMetrics` |

### Por que jornadas/processos/roteiros NÃO foram conectados

Não existe modelo Prisma nem endpoint com os campos do contrato
(`JornadaEtapa`: personaStage/touchpoints/ownerRole/slaHours/avgTimeDays;
`ProcessoVendaItem`: codigo/gatilho/slaMaximo/responsavel/status;
`RoteiroItem`: canal/fase/taxaSucesso/corpoTexto/variaveis). Fontes
candidatas avaliadas e descartadas por não haver mapeamento honesto:

- `CadenceSequence`/`touches` (JSON) e `CADENCE_JOURNEY_TEMPLATES`
  (`src/features/cadence/domain/cadenceTemplates.ts`) — templates globais,
  não dados por tenant, e shape incompatível com `JornadaEtapa`.
- `CrmPipeline`/`CrmPipelineStage` — pipeline real por tenant, mas sem
  personaStage/touchpoints/ownerRole/slaHours; forçar o DTO inventaria campos.
- `Workflow`/`WorkflowVersion` — workflows de agentes, não processos de venda.
- Geradores de IA do studio (`callScript.ts`, `script.ts`, `b2bMatrix.ts`,
  `src/features/intelligence/services/studio/generators/`) — saída efêmera,
  nunca persistida por tenant; não há tabela de roteiros.

## Lacunas documentadas (precisam de decisão do 00)

1. **Jornadas Comerciais**: exige model novo (ex.: etapas de jornada por
   tenant) → handoff ao Agente 01 para schema; ou redefinir a superfície
   para consumir `CadenceSequence` real (decisão de produto com 02/17).
2. **Processos de Vendas**: sem fonte; idem — schema novo ou ocultar.
3. **Roteiros**: exige persistência de scripts/roteiros por tenant
   (schema novo → 01) e, se quiser IA, integração com os generators do
   studio (07) com gravação — fora do escopo desta onda.
4. **Roleplay e matrizes**: verificado — `roleplay-ai.service.ts` usa LLM
   real via `lib/ai/gateway.getAiModel` (local-llama3), falhas propagam
   erro (sem réplica fabricada); `objectionGenerator.service.ts` gera
   sugestões a partir de negócios perdidos reais via LLM. NÃO é mock.
   Nenhuma ação necessária nesta onda.

## Gates executados

- `npx tsc --noEmit` → exit 0.
- `npx vitest run tests/unit/features/sales-orchestration tests/unit/sales-orchestration`
  → 3 arquivos, 11 testes, todos verdes.

## Arquivos modificados nesta auditoria

- Nenhum arquivo de código alterado — o estado já era o correto.
- Criado apenas este handoff.

## Observação menor (não bloqueante)

`tests/unit/features/sales-orchestration/SalesOrchestrationService.test.ts`
ainda mocka `qualificationMatrixItem.findMany` (chave morta desde a remoção
da query de matriz); o teste inclusive asserta que ela NÃO é chamada. Sem
impacto funcional — limpeza opcional pelo dono de testes (08).
