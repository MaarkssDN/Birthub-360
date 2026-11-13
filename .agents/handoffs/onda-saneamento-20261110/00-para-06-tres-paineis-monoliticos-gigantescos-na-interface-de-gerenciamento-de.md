De: Agente 00 — Coordenador
Para: Agente 06 (Integrações e Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-004)
Status: em-andamento
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Três painéis monolíticos gigantescos na interface de gerenciamento de integrações**

- **Dívida técnica:** BT360-DT-0030
- **Esforço estimado:** Grande
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** O módulo de integrações foi evoluído incrementalmente para suportar múltiplos CRMs (Bitrix, HubSpot, Pipedrive) sem criação de um framework desacoplado de componentes reutilizáveis.

**Impacto:** Dificuldade extrema em aplicar melhorias de acessibilidade; alto custo de manutenção; lentidão em formulários de mapeamento devido a renderizações em cascata.

## Arquivo(s) envolvido(s)

`src/features/integrations/components/BitrixImportPanel.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-004`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-004` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 06 — implementação concluída, aguardando revisão do Agente 24)

Branch `agente/06-integracoes-saneamento`, worktree `C:/Github/Birthub-360-worktrees/agente-06-integracoes`, commit `ffab742d3`.

- `src/features/integrations/components/BitrixImportPanel.tsx` decomposto de monólito (1251 linhas) em container (~630 linhas) + componentes presentacionais reutilizáveis em `src/features/integrations/components/bitrixImport/`:
  - `types.ts` — interfaces (`BitrixLeadSummary`, `BitrixDealSummary`, `BitrixDealPipeline`, `BitrixDealStage`, `BitrixUserOption`, `BitrixFieldOption`), tipos de modo/filtro/ordenação, `BitrixImportResult`, `MONTHS`, classes CSS compartilhadas.
  - `BitrixImportHeader.tsx` — cabeçalho + botão Atualizar Portal.
  - `BitrixImportToolbar.tsx` — alternador Negócios/Leads + métricas de seleção + ações de importação.
  - `BitrixImportFilters.tsx` — busca com debounce visual, pills de filtro rápido, filtros de pipeline/etapa/vendedor/mês/ano, ordenação e campo personalizado.
  - `BitrixImportDealCard.tsx` / `BitrixImportLeadCard.tsx` — cards de registro (checkbox, badges, ações de 1 clique).
  - `BitrixImportBulkEditModal.tsx` — Dialog de edição em lote (temperatura inicial; controle de voz permanece desabilitado/honesto conforme comentário SEC/UX preservado).
- Markup, classes e comportamento preservados 1:1; todo o estado, loaders (`loadDeals`/`loadLeads`), processamento (quick filter + sort), seleção em massa, importação individual/em lote e paginação permanecem no container.
- Tratamento de erro explícito inalterado (mensagens de erro por falha de carga/importação mantidas).
- Teste novo `tests/unit/features/integrations/BitrixImportPanel.test.tsx` (4 casos): listagem + seleção, importação em lote com sucesso (verifica payload/endpoint), falha de importação com erro explícito, falha de carga inicial.
- **Gates:** `npx tsc --noEmit` limpo; `npx biome lint` no escopo limpo; `vitest run` no novo teste — 4/4; suites focadas de Bitrix (`src/features/integrations/bitrix/**/__tests__`, `tests/unit/{services,integrations}`) — 208 testes verdes, sem regressão.
- **Pendente:** parecer formal `APROVADO` do Agente 24 (condição de encerramento do handoff). Observação: os demais "painéis monolíticos" citados no título da dívida (`BitrixExtractionPanel.tsx`, `BitrixSyncRulesPanel.tsx`) não constam do escopo de arquivos do handoff — se a intenção for decompor os três, peço ao 00 confirmar escopo estendido.
