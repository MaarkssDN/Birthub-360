# Relatório de Auditoria de Dívidas Técnicas — Agente 23

## IDENTIFICAÇÃO
- **ID do agente:** 23
- **Nome oficial:** Custo, Performance e Limites de IA
- **Especialização:** Gestão de custos de inferência de inteligência artificial, orçamento de tokens de LLMs, controle de latência, rate limits de IA, prevenção de consultas N+1 em logs analíticos e eficiência de cache semântico
- **Responsabilidades:** Monitorar e auditar o custo financeiro das chamadas a provedores de LLM (Gemini, LiteLLM, Groq), garantir a aplicação de quotas e limites de consumo por tier de organização, otimizar o tempo de resposta das esteiras de IA e evitar desperdício de tokens em tarefas repetitivas.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/intelligence/**`, `src/features/analytics/**`, rotas de streaming de IA, caches e métricas de consumo de tokens.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Monitor de consumo de tokens, limitador de cota de IA por tenant (`TokenRateLimiter`), agregador de custos financeiros, cache semântico de respostas de IA.
- **Arquivos relevantes:**
  - `src/features/intelligence/services/aiUsageTracker.service.ts`
  - `src/features/intelligence/routes/copilot.routes.ts`
  - `src/features/analytics/services/aiCostCalculator.service.ts`
  - `src/lib/cache/semanticCache.ts`
- **Serviços existentes:** `AiUsageTrackerService`, `AiCostCalculatorService`, `TokenQuotaGuard`.
- **APIs e integrações:** LiteLLM Proxy Metrics API, Google Gemini Usage Metadata, Groq Rate Limit Headers.
- **Funcionalidades implementadas:** Rastreamento de tokens de entrada e saída por requisição, registro de custo estimado por modelo, limites diários configuráveis por organização.
- **Testes encontrados:** `tests/unit/ai-usage-tracker.test.ts`, `tests/unit/cost-calculator.test.ts`.
- **Dependências externas:** Provedores de LLM, Redis (para rate limiting em memória distribuída), `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-23-001 (DEBT-AI-001)
- **Título:** Streaming de tokens de IA via SSE não aplica controle de cota máxima em tempo real durante a transmissão
- **Categoria:** Custos, Limites e Segurança
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/routes/copilot.routes.ts` (linhas 110-145)
- **Evidência:** O endpoint de streaming do Copiloto verifica a cota da organização apenas antes de abrir a conexão Server-Sent Events. Se o tenant possui 50 tokens restantes em seu limite diário e dispara um prompt complexo que gera uma resposta longa de 4.000 tokens, o streaming transmite a resposta completa sem interrupção. O registro de consumo só ocorre ao término do stream.
- **Problema:** Usuários e contas no plano básico podem gerar respostas gigantescas que ultrapassam amplamente a cota contratada, gerando prejuízo financeiro direto para a plataforma.
- **Causa raiz:** O contador de tokens não é incrementado progressivamente durante os chunks de streaming e o loop de transmissão não possui condição de corte (early abort).
- **Impacto:** Estouro sistemático de orçamentos de LLM; incapacidade de fazer cumprir os limites comerciais de planos e franquias contratadas.
- **Correção necessária:** Implementar contador de tokens aproximado por chunk no stream; se a soma acumulada atingir a cota máxima disponível para o tenant, abortar a conexão imediatamente com mensagem informativa `QUOTA_EXCEEDED_STREAM_ABORTED` e persistir o log parcial.
- **Agente proprietário:** 23
- **Agentes dependentes:** 07 (Copiloto e IA), 01 (Banco de Dados de Logs)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** Streaming para organização com cota restante de 100 tokens é interrompido com precisão assim que a contagem atinge o teto estipulado.
- **Teste necessário:** Teste unitário de streaming com mock de cota residual baixa comprovando o encerramento do stream no limiar exato.
- **Dependências:** Alinhamento com Agente 07.

### ID: DIV-23-002 (DEBT-FIN-001)
- **Título:** Alerta de consumo de orçamento de IA compara grandezas incompatíveis gerando falsos alarmes
- **Categoria:** Regra de Negócio e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/analytics/services/aiCostCalculator.service.ts` (linhas 65-88)
- **Evidência:** A lógica de disparo de alerta de estouro de orçamento compara a contagem inteira de requisições de IA (`requestCount`, ex.: 500 chamadas) diretamente contra o valor limite monetário do plano (`budgetLimitUsd`, ex.: US$ 50.00), disparando aviso de "Orçamento de IA esgotado em 1000%" assim que a empresa atinge 51 chamadas.
- **Problema:** Falsos alarmes de cobrança exibidos no dashboard financeiro da empresa, gerando pânico nos administradores e chamados desnecessários no suporte.
- **Causa raiz:** Comparação direta de grandezas heterogêneas (quantidade de requisições inteiras versus valor monetário decimal de custo).
- **Impacto:** Inconsistência nos alertas de consumo e desconfiança dos clientes nos relatórios financeiros do sistema.
- **Correção necessária:** Corrigir a asserção para comparar o custo total acumulado em dólares (`currentCostUsd`) contra o teto monetário (`budgetLimitUsd`), e criar uma regra separada para limite de requisições se aplicável.
- **Agente proprietário:** 23
- **Agentes dependentes:** 04 (BI e Analytics), 02 (UX de Alertas)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Alerta de orçamento só é disparado quando `currentCostUsd >= budgetLimitUsd * 0.9` (90% do limite monetário).
- **Teste necessário:** Testes unitários cobrindo cenários com muitas requisições de baixo custo e poucas requisições de alto custo.
- **Dependências:** Nenhuma.

### ID: DIV-23-003
- **Título:** Inexistência de cache semântico ativo para pesquisas e análises de mercado frequentes
- **Categoria:** Performance e Custos
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/lib/cache/semanticCache.ts`, `src/features/market-intelligence/**`
- **Evidência:** Múltiplos vendedores da mesma organização realizam consultas de inteligência de mercado sobre os mesmos concorrentes e empresas do setor. O sistema despacha chamadas repetidas de LLM para o Gemini/LiteLLM gerando custos idênticos a cada consulta.
- **Problema:** Desperdício de tokens e aumento da latência de resposta em análises comerciais que poderiam ser atendidas instantaneamente por cache semântico de embeddings.
- **Causa raiz:** O módulo de cache semântico foi prototipado em branch separada mas não foi conectado ativamente aos endpoints de pesquisa de mercado.
- **Impacto:** Gastos redundantes com provedores de IA e tempo de espera de 8 a 12 segundos para respostas de empresas já pesquisadas recentemente.
- **Correção necessária:** Integrar o `SemanticCacheService` com limiar de similaridade de cosseno de 0.92 e TTL de 72 horas para análises de inteligência de empresas.
- **Agente proprietário:** 23
- **Agentes dependentes:** 05 (Prospecção), 16 (Redis e Cache)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Consulta sobre empresa já analisada nas últimas 24 horas responde em menos de 100ms via cache sem consumir tokens na API externa.
- **Teste necessário:** Teste de integração de cache semântico com duas requisições idênticas consecutivas.
- **Dependências:** Alinhamento com Agente 05.

### ID: DIV-23-004
- **Título:** Consulta N+1 no cálculo de métricas de uso de IA por vendedor no painel gerencial
- **Categoria:** Performance e Banco de Dados
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/services/aiUsageTracker.service.ts` (linhas 140-175)
- **Evidência:** Para listar a tabela de consumo de tokens por membro da equipe, o serviço busca a lista de 30 usuários e, em seguida, executa um loop `for (const user of users)` realizando um `prisma.aILog.aggregate` individual para cada usuário separadamente.
- **Problema:** Padrão N+1 que gera dezenas de consultas consecutivas ao PostgreSQL para renderizar uma única tabela de consumo de IA.
- **Causa raiz:** Falta de agrupamento em query única via `groupBy`.
- **Impacto:** Lentidão no painel de gestão de equipe e sobrecarga desnecessária no pool de conexões do banco de dados.
- **Correção necessária:** Substituir o loop por uma única consulta com `prisma.aILog.groupBy({ by: ['userId'], where: { organizationId }, _sum: { totalTokens: true, costUsd: true } })`.
- **Agente proprietário:** 23
- **Agentes dependentes:** 01 (Banco de Dados), 04 (BI)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O cálculo de consumo para 50 vendedores é executado em exatamente 1 consulta SQL com tempo de execução inferior a 50ms.
- **Teste necessário:** Teste de integração monitorando a contagem de queries SQL disparadas no Prisma.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (rastreamento de tokens e cálculo de custo por modelo implementados).
- **Cobertura automatizada de testes:** Média (testes de tracker presentes, mas faltam testes de corte de streaming em tempo real).
- **Segurança:** Alta (limites de cota isolados por organização).
- **Arquitetura:** Média (degradada por consultas N+1 e falta de cache semântico ativo).
- **Confiabilidade:** Média (comprometida pelo comparador de grandezas heterogêneas no alerta de orçamento).
- **Observabilidade:** Alta (tabelas de log com contagem de prompt tokens e completion tokens).
- **Manutenibilidade:** Alta (serviços de cálculo de custo bem delimitados).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Implementar corte em tempo real em streams SSE quando o tenant esgota sua cota (DIV-23-001).
2. **Segurança e integridade de dados:** Não aplicável.
3. **Falhas funcionais:** Corrigir a comparação de orçamento monetário em `aiCostCalculator.service.ts` (DIV-23-002).
4. **Confiabilidade:** Substituir consulta N+1 de métricas de IA por `groupBy` em lote (DIV-23-004).
5. **Testes:** Criar testes de benchmark de latência e consumo de tokens para todos os modelos LLM.
6. **Arquitetura:** Ativar o cache semântico para consultas de mercado (DIV-23-003).
7. **Melhorias estruturais:** Implementar painel de controle de custos de tokens em tempo real para gestores.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 3 Médias, 0 Baixas
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-23-001, DIV-23-002, DIV-23-004)
- **Problemas compartilhados:** 1 (DIV-23-003 compartilhado com 05 e 16)
- **Handoffs necessários:**
  - Handoff para 07: Inclusão do abort de cota no loop de streaming SSE.
  - Handoff para 05: Ativação do cache semântico nas rotas de pesquisa de mercado.
- **Riscos mais importantes:** A ausência de corte de cota em tempo real durante streaming de IA permite que usuários consumam valores muito superiores à franquia contratada; falsos alarmes de estouro de orçamento geram desconfiança na plataforma.
- **Recomendação final:** Blindar os endpoints de streaming com controle de cota dinâmico e corrigir a asserção monetária do alerta de orçamento.
