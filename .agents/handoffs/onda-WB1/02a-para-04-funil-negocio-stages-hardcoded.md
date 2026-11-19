# Handoff — Funil "Negócio" com estágios hardcoded de pilotos (UX-10 / DEBT-0032)

```
De: 02A — UX Research & Usability
Para: 04 — CRM e BI
Onda: WB-1
Status: resolvido
Prioridade: normal
Bloqueador-ref: DEBT-0032
Sprint destino: a definir pelo 00
```

## Problema

O funil "Negócio" do CrmBoard exibe colunas fixas com nomes de pilotos de clientes específicos: `'Piloto VTECH'`, `'Piloto Birthub 360 Profile'` (+ Concluído/Cancelado), `'Piloto Logística'` (+ Concluído/Cancelado) — `src/components/CrmBoard.tsx:62-75`. `STAGE_DISPLAY_LABELS` (`:81-89`) apenas traduz o rótulo; as chaves internas continuam nomes de pilotos. Um tenant novo herda estágios de outro cliente, contradizendo o ICP genérico.

O schema já suporta funis dinâmicos por organização: `CrmPipeline`/`CrmPipelineStage` (`prisma/schema.prisma:1536-1578`, `@@unique([organizationId, name])`, `leadStatus LeadStatus?`, `isWon/isLost`), e `Lead.pipelineStageId` existe (`schema.prisma:677-678`) — mas o board agrupa por `lead.status` (enum `LeadStatus`, `schema.prisma:48-69`) e ignora `pipelineStageId`.

## Arquivo(s) envolvido(s)

- `src/components/CrmBoard.tsx` (`DEAL_COLUMNS`, `STAGE_DISPLAY_LABELS`, `columns` em `:105`) — **dono confirmado pelo usuário (2026-11-18): Agente 04** — declarado em `src/components/AGENTS.md` (raiz)
- `src/hooks/useCrmBoardController.ts` / `useCrmBoardUrlParams.ts` (se colunas passarem a vir de API)
- `src/features/crm360/routes/crm360.routes.ts:22-25` + `src/features/crm360/presentation/Crm360Controller.ts:86-89` (endpoint existente — leitura; dono conforme AGENTS.md local do módulo)

## Evidência

Revisão completa: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 (UX-10, CONFIRMADO, P2). **Correção v2:** o endpoint **já existe** — `GET /api/crm/pipelines` (`crm360.routes.ts:22-25`, montado em `/api/crm` via `src/bootstrap/routes.ts:111`), tenant-scoped via `organizationId` (`Crm360Controller.ts:86-89`, `PrismaCrm360Repository.getPipelines:329-338`). **Nuance:** `getPipelines` chama `ensureDefaultPipelines(organizationId)` — auto-semeia pipelines default por tenant, então a correção **não depende de schema novo**.

## Alteração necessária

Curto prazo (mínimo): derivar colunas de `CrmPipelineStage` ativos do tenant consumindo `GET /api/crm/pipelines` (já existente — sem handoff de schema) com fallback para empty state honesto quando o tenant não tiver pipeline configurado — em vez de exibir estágios de pilotos. Atenção à semântica: `getPipelines` retorna pipelines de entity `lead`/`deal` e estágios com `leadStatus`/`isWon`/`isLost` — mapear para as colunas do board mantendo `LeadStatus` como chave interna durante a transição; rótulo/ordem devem vir do stage do pipeline. Execução: Agente 04 (dono de CrmBoard confirmado); coordenar leitura do endpoint com o dono do módulo crm360.

## Teste esperado

Tenant sem pipeline de pilotos: funil Negócio mostra estágios do próprio tenant ou empty state; `npx tsc --noEmit`; teste de unidade do mapeamento colunas←stages.

## Contexto adicional

Relacionado a UX-01 (mesma tela, handoff paralelo) e DEBT-0017 (Mesa de Tratamento altera `Lead.status` fora do fluxo canônico — mesma família de divergência status↔pipelineStageId).

**Nota v2:** dono de `CrmBoard.tsx` confirmado como Agente 04 em 2026-11-18 (`src/components/AGENTS.md`).

## Resolução

- **Agente / Onda:** 04 — CRM e BI / WB-1
- **Arquivo alterado:** `src/components/CrmBoard.tsx`
- **Implementação:**
  1. Adicionado `resolveDealPipelineColumns(pipelines, activeLeads)` e consumo de `GET /api/crm/pipelines` (`api.get<CrmPipeline[]>('/api/crm/pipelines')`) quando `funnel === 'Negocio'`.
  2. As colunas do funil de Negócios e o mapa `stageLabelsByStatus` agora são derivados dinamicamente dos estágios (`CrmPipelineStage`) configurados para a organização (ordenados por `sortOrder` e convertidos de `leadStatus` Prisma via `fromPrismaLeadStatus`), preservando rótulos customizados do tenant.
  3. Quando o nome do estágio no banco ainda for o literal legado de piloto (`'Piloto VTECH'`, `'Piloto Birthub 360 Profile'`, `'Piloto Logística'`, etc.) ou enquanto a API estiver carregando/offline/vazia, aplica o fallback imediato `DEAL_COLUMNS` + `STAGE_DISPLAY_LABELS` (`'Piloto Técnico (PoC)'`, `'Piloto Hub 360° — Em Curso'`, `'Piloto Operacional — Em Curso'`), garantindo que **nenhum rótulo visível exiba nomes de clientes legados** nos cabeçalhos das colunas (`KanbanColumn`), nos anúncios de acessibilidade do `dnd-kit` ou no seletor de movimentação em lote (`CrmBoardBatchBar`).
  4. Qualquer `LeadStatus` presente em leads ativos da organização é preservado nas colunas visíveis mesmo se ausente do pipeline customizado, evitando ocultação silenciosa de negócios.
  5. `resolveStatusFromOverId` e `columnKeyboardCoordinateGetter` aceitam tanto a chave `LeadStatus` quanto o rótulo traduzido da coluna, mantendo compatibilidade total com drag-and-drop por mouse e teclado.
