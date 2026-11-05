De: 00 — Coordenador
Para: 02 — Produto e UX
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-02-002
Sprint destino: Onda 5 — Frontend, UX, Mobile e Contratos

## Problema
Componente CrmBoard.tsx possui 1258 linhas em arquivo único, misturando drag and drop, requisições de API, filtros de busca e modais pesados, causando gargalos de renderização.

## Arquivo(s) envolvido(s)
- src/pages/CrmBoard.tsx:1-1258

## Evidência
Base de auditoria: DIVIDAS-AGENTE-02.md e DIVIDAS-AGENTE-03.md.
- CrmBoard.tsx renderiza o quadro Kanban inteiro a cada tecla digitada no campo de busca devido a estado no componente raiz.
- Tempo de resposta de UI > 300ms em boards com mais de 100 cards.

## Alteração necessária
1. Modularizar CrmBoard em subcomponentes memoizados: KanbanColumn, KanbanCard, KanbanFilters, KanbanHeader.
2. Isolar estado de filtros e busca com useDebounce.

## Teste esperado
- Critério de Aceite: Digitação na busca não dispara re-render das colunas que não sofreram alteração.
- Teste de Renderização: CrmBoard-performance.spec.tsx.

## Contexto adicional
Fluidez e usabilidade de uma das telas mais utilizadas da plataforma.
