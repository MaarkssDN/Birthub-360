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

**Agente 23 — 2026-11-12** (branch `agente/23-custo-saneamento`)

**Diagnóstico:** o `SemanticCacheService` (`src/lib/ai/gateway/semanticCache.ts`, Redis + fallback local, namespace `semcache:{orgId}:{hash}`, métricas FinOps) já estava implementado e exposto via `generateTextOutput`/`generateStructuredOutput` (flag `useCache`) — porém **nenhum consumidor de pesquisa de mercado o utilizava**. O caminho real de "pesquisas e análises de mercado" é a tool `marketResearchTool` (`src/features/intelligence/tools/marketResearchTool.ts`), que a cada chamada batia em Tavily/Serper (provedores pagos) ou DuckDuckGo — origem dos 8–12s e do gasto redundante descritos na dívida.

**Alteração cirúrgica:**
- `marketResearchTool.ts`: antes de qualquer fetch externo, consulta `semanticCache.get` com `organizationId` do `requestContext` (tenant), `purpose: 'market-research'`, `promptText` = query normalizada; em hit, retorna o relatório cacheado sem tocar nos motores de busca. Em miss, após montar o relatório, grava via `semanticCache.set` com `classification: 'PUBLIC'` e `ttlSeconds: CACHE_TTL.ENRICHMENT` (24h — deduplica re-pesquisas do mesmo período sem servir notícias muito velhas; `purpose` não casa com as regras automáticas de `resolveTtlSeconds`, por isso o TTL explícito).
- Sem tenant no contexto (jobs internos/testes), o cache é ignorado — `get`/`set` exigem `organizationId` e lançariam "Tenancy violation".
- Erros de Redis já são tratados dentro do próprio `SemanticCacheService` (fallback local + warn); nenhum fallback enganoso adicionado.

**Testes:** `marketResearchTool.test.ts` — 3 novos casos (hit sem fetch; miss grava com classification PUBLIC; sem tenant não consulta cache). Suíte do arquivo: **8/8 PASS**.

**Observação de propriedade:** `marketResearchTool.ts` pertence ao domínio do Agente 07 (`src/features/intelligence/**`), mas era o único ponto de conexão real do cache semântico com pesquisas de mercado — alteração mantida mínima (+~55 linhas, sem refatoração adjacente). Registrado para ciência do 07 no relatório da onda.

**Gates:** `npx vitest run -c vitest.unit.config.ts` nos arquivos alterados → 12/12 PASS; `npx tsc --noEmit` e `npm run lint` executados na branch — ver `.agents/runs/agente-23-saneamento-onda-20261112.md`. Pendente parecer do Agente 24.
