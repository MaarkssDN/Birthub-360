De: Agente 00 — Coordenador
Para: Agente 02 (Produto e UX)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-002)
Status: aberto
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Hotspot estrutural no componente central CrmBoard.tsx acumulando múltiplas responsabilidades**

- **Dívida técnica:** BT360-DT-0015
- **Esforço estimado:** Médio
- **Status atual da dívida:** PARCIALMENTE IMPLEMENTADO

**Causa raiz:** O crescimento orgânico das funcionalidades do CRM foi concentrado no componente de entrada do Kanban sem extração de hooks de controle e sub-componentes especializados.

**Impacto:** Dificuldade em debugar problemas de renderização e re-renders desnecessários em toda a tela ao arrastar um único lead; risco permanente de regressões visuais e quebra de testes unitários.

## Arquivo(s) envolvido(s)

`src/components/CrmBoard.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-002`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-002` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 02 — W4, 2026-11-12)

`src/components/CrmBoard.tsx`: 1257 → 501 linhas. Extrações em `src/components/crm-board/` (novo diretório, domínio 02):

- `useCrmBoardDnD.ts` — todo o bloco DnD (sensors, coordinateGetter de teclado, announcements acessíveis, drag start/end/cancel, confete/som). JSX/comportamento preservados verbatim.
- `useCrmBoardBulkActions.ts` — seleção múltipla, usuários atribuíveis, ações em lote (etapa/dono/Bitrix/enriquecimento IA).
- `CrmBoardHeader.tsx`, `CrmBoardMetricsBar.tsx`, `CrmBoardFiltersBar.tsx`, `CrmBoardBatchBar.tsx` — seções de JSX extraídas com props explícitas.
- `stageLabels.ts` — `STAGE_DISPLAY_LABELS`/`formatStageLabel` movidos; re-exportados por `CrmBoard.tsx` (API pública preservada).

### Gates executados

- `npx tsc --noEmit`: PASS.
- `npx biome check` nos 8 arquivos: PASS.
- `vitest tests/unit/features/crm/ + useCrmBoardController`: 44/44 PASS.
- `check:hotspots`: exit 0 — arquivo abaixo de 1000; exceção em `HOTSPOT_EXCEPTIONS.md` ficou obsoleta (warning do gate) — remoção pertence ao Agente 08 (dono de docs/).

### Pendências

- Parecer Agente 24; integração pelo Agente 00. E2E do board (drag-and-drop, crm.spec.ts) não executado — sem Docker.
