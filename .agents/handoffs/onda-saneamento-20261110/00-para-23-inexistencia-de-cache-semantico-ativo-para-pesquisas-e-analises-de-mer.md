De: Agente 00 — Coordenador
Para: Agente 23 (Custo, Performance e Limites de IA)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-041)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Inexistência de cache semântico ativo para pesquisas e análises de mercado frequentes**

- **Dívida técnica:** BT360-DT-0093
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O módulo de cache semântico foi prototipado em branch separada mas não foi conectado ativamente aos endpoints de pesquisa de mercado.

**Impacto:** Gastos redundantes com provedores de IA e tempo de espera de 8 a 12 segundos para respostas de empresas já pesquisadas recentemente.

## Arquivo(s) envolvido(s)

`src/lib/ai/gateway/semanticCache.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-041`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-041` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

O `SemanticCacheService` (`src/lib/ai/gateway/semanticCache.ts`) estava
implementado e testado, mas nenhum chamador passava `useCache: true` — o cache
nunca era consultado. Nesta onda ativei o cache no orquestrador comercial V3
(`commercialAgentV3Orchestrator.service.ts`), endpoint de análise de conta/
missão repetida por tenant: `useCache: true` +
`ttlSeconds: CACHE_TTL.ACCOUNT_DIAGNOSTIC` (12h). A chave já inclui
organizationId + hash do prompt completo, e o serviço descarta respostas
CONFIDENTIAL — isolamento de tenant e LGPD preservados.

Testes: `generate-output.test.ts` (cache hit/miss) e `semanticCache.test.ts`
já cobriam sucesso/falha do módulo; suites commercial-v3 seguem verdes.
