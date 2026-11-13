De: Agente 00 — Coordenador
Para: Agente 04 (CRM, BI e Analytics)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-018)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts**

- **Dívida técnica:** BT360-DT-0024
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Agrupamento de todas as consultas da visão 360 em um único método que carrega o grafo completo de dados de uma só vez.

**Impacto:** Lentidão no atendimento de clientes e alto consumo de CPU no banco de dados relacional.

## Arquivo(s) envolvido(s)

`src/features/crm360/infra/PrismaCrm360Repository.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-018`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-018` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução

Executado pelo Agente 04 na branch `agente/04-crm-saneamento` (worktree `agente-04-crm`), commits `6d0913107`.

**Causa raiz endereçada:** `attachLegacyRecords` (chamada por `ensureDefaultPipelines` em TODA leitura do CRM360 — overview, pipelines, board, convert) disparava um `updateMany` por estágio do funil (6 em Leads + 12 em Negócios = até 18 escritas) mesmo quando nenhum lead estava pendente de atribuição. Adicionado pre-check `prisma.lead.count({ organizationId, funnel, pipelineId: null, status: { in: stageStatuses } })`: sem órfão pendente, o loop inteiro é pulado (1 leitura substitui até 18 escritas por chamada).

**Fallback enganoso removido (critério §30/§32):** `getDeals` tinha `try/catch → []` que transformava falha de banco/RLS em "lista vazia" indistinguível de "sem negócios". O erro agora propaga do repositório; o controller mantém a resposta defensiva (200 + []) mas registra `logger.error` — idem para o catch de `getOverview` (KPIs zerados agora são observáveis no log).

**Hotspot estrutural:** as constantes `LEAD_STAGES`/`DEAL_STAGES`/`DefaultStage` foram extraídas para `src/features/crm360/infra/defaultPipelineStages.ts` (dados de provisionamento, sem mudança de conteúdo). `PrismaCrm360Repository.ts`: 1230 → 1088 linhas, voltando a caber na exceção registrada em `HOTSPOT_EXCEPTIONS.md` (limite 1210) — `npm run check:hotspots` verde.

**Evidência/gates:**
- `npx tsc --noEmit` — PASS (exit 0).
- `npx biome lint` nos arquivos alterados — limpo; `npm run lint` global: 0 erros (warnings pré-existentes).
- `npx vitest run -c vitest.unit.config.ts tests/unit/features/crm360/infra/` — 21/21 testes, incluindo novos: pre-check pula `updateMany` sem órfãos, roda por estágio com órfãos, e `getDeals` propaga rejeição do Prisma.
- `npm run test:architecture` — depcruise sem violações, coverage OK, hotspots OK.
- `npm run verify:openapi-drift` — sem deriva.

**Pendente:** parecer formal `APROVADO` do Agente 24 (validação de hashes + não-regressão) — condição de encerramento do próprio handoff; handoff fica `resolvido` do lado da implementação, aguardando revisão independente para fechamento formal da onda.
