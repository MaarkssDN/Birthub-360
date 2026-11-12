De: Agente 00 — Coordenador
Para: Agente 07 (IA, Copiloto e Automações)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-023)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Busca textual na base de conhecimento do Copiloto engole falhas do banco e retorna lista vazia**

- **Dívida técnica:** BT360-DT-0041
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Falta de diferenciação entre "busca sem correspondências" e "erro de infraestrutura na busca".

**Impacto:** Respostas degradadas da IA sem que a equipe de SRE perceba que o serviço de busca vetorial está inoperante.

## Arquivo(s) envolvido(s)

`src/features/knowledge/services/knowledgeBase.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-023`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-023` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

`SearchService.hybridSearch` já distinguia indisponibilidade total de "sem resultados": quando AMBAS
as estratégias (semântica pgvector + textual FTS→ILIKE) falham, lança
`Base de Conhecimento temporariamente indisponível: falha nas buscas semântica e textual.`;
falha parcial retorna resultados da estratégia sobrevivente com flags de disponibilidade.
Tenant isolation (`organizationId` + `withRlsContext`) preservada nos dois caminhos.

Evidência: `tests/unit/features/knowledge/KnowledgeSearchService.test.ts` — 5/5 testes
(consulta vazia, fallback FTS→ILIKE, sucesso só-semântico, sucesso só-textual, falha total
explícita). Commit da implementação na branch `agente/07-w4-ia`. Pendente: parecer do Agente 24.
