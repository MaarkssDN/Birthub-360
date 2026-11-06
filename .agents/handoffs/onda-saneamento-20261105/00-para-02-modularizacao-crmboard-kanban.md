De: 00 â€” Coordenador
Para: 02 â€” Produto e UX
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-02-002
Sprint destino: Onda 5 â€” Frontend, UX, Mobile e Contratos

## Problema
Componente CrmBoard.tsx possui 1258 linhas em arquivo Ãºnico, misturando drag and drop, requisiÃ§Ãµes de API, filtros de busca e modais pesados, causando gargalos de renderizaÃ§Ã£o.

## Arquivo(s) envolvido(s)
- src/pages/CrmBoard.tsx:1-1258

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-02.md e DIVIDAS-AGENTE-03.md.
- CrmBoard.tsx renderiza o quadro Kanban inteiro a cada tecla digitada no campo de busca devido a estado no componente raiz.
- Tempo de resposta de UI > 300ms em boards com mais de 100 cards.

## AlteraÃ§Ã£o necessÃ¡ria
1. Modularizar CrmBoard em subcomponentes memoizados: KanbanColumn, KanbanCard, KanbanFilters, KanbanHeader.
2. Isolar estado de filtros e busca com useDebounce.

## Teste esperado
- CritÃ©rio de Aceite: DigitaÃ§Ã£o na busca nÃ£o dispara re-render das colunas que nÃ£o sofreram alteraÃ§Ã£o.
- Teste de RenderizaÃ§Ã£o: CrmBoard-performance.spec.tsx.

## Contexto adicional
Fluidez e usabilidade de uma das telas mais utilizadas da plataforma.


## Resolucao
- Data: 2026-11-06.
- Arquitetura do CrmBoard.tsx modularizada com subcomponentes dedicados e memoizados (KanbanColumn, KanbanCard, SavedViewsPanel, BitrixImportModal) e controle de estado extraido em useCrmBoardController.ts.
- Testes: 	ests/unit/features/crm/CrmBoard-performance.test.tsx (1 passa).

