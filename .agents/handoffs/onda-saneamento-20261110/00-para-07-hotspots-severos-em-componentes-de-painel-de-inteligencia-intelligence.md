De: Agente 00 — Coordenador
Para: Agente 07 (IA, Copiloto e Automações)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-006)
Status: em-andamento
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Hotspots severos em componentes de painel de inteligência (IntelligenceHub e SwarmDashboard)**

- **Dívida técnica:** BT360-DT-0042
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Desenvolvimento acelerado de funcionalidades avançadas de enxame de IA em componentes monolíticos.

**Impacto:** Lentidão na renderização de dashboards em tempo real; risco alto de regressões durante qualquer alteração visual.

## Arquivo(s) envolvido(s)

`src/features/intelligence/components/IntelligenceHub.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-006`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-006` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 07 — W4, 2026-11-12)

`IntelligenceHub.tsx` modularizado: 1296 → ~200 linhas (coordenador de estado). Extraídos:
`intelligenceHub.catalog.ts` (catálogo/tipos/pilares), `IntelligenceHubOverview.tsx` (header,
status, busca, grid/matrix, estado RAG) e `IntelligenceHubToolView.tsx` (render do tool ativo +
navegação/Escape). Comportamento preservado: filtros, busca, pins (localStorage), modos de
visualização, badges de status, RAG loading/error com retry, Escape→overview. Exceção de hotspot
removida de `docs/architecture/HOTSPOT_EXCEPTIONS.md` (arquivo agora abaixo do teto).

Evidência: teste de regressão movido de `src/.../__tests__/` (não descoberto pelo vitest) para
`tests/unit/features/intelligence/components/IntelligenceHub.test.tsx` — 7/7 passando e agora
efetivamente executado no CI. Suíte completa intelligence+market-intelligence+knowledge:
52 arquivos / 327 testes verdes. Pendente: parecer do Agente 24.
