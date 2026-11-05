# Relatório de Auditoria de Dívidas Técnicas — Agente 07

## IDENTIFICAÇÃO
- **ID do agente:** 07
- **Nome oficial:** IA e Automações (Commercial AI Suite & Copilot Specialist)
- **Especialização:** Copiloto Comercial Executivo, orquestração de LLMs (Gemini, LiteLLM, Ollama, Groq), automações comerciais preditivas, Next Best Action (NBA), síntese de inteligência de vendas e automações de fluxo
- **Responsabilidades:** Implementação dos serviços de inteligência artificial, esteiras de automação de vendas, interface do Copiloto Comercial, cálculo e recomendação de ações Next Best Action e integração com provedores de inferência de linguagem natural.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/intelligence/**`, `src/features/copilot/**`, `src/features/automations/**`, interfaces de workspace do agente e rotas de IA.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Copiloto Comercial, automações preditivas, Next Best Action (NBA), estúdio de metodologias de vendas, dashboard de enxame de agentes de IA.
- **Arquivos relevantes:**
  - `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` (864 linhas)
  - `src/features/intelligence/components/IntelligenceHub.tsx` (1297 linhas, sob exceção)
  - `src/features/intelligence/components/SwarmDashboard.tsx` (1018 linhas, sob exceção)
  - `src/features/intelligence/routes/intelligence.routes.ts` (1054 linhas, sob exceção)
  - `src/features/intelligence/services/copilot.service.ts`
  - `src/features/intelligence/services/nextBestAction.service.ts`
- **Serviços existentes:** `CopilotService`, `NextBestActionService`, `SalesMethodologyEngine`, `LLMGatewayService`.
- **APIs e integrações:** LiteLLM Proxy, Google Gemini API, Groq Cloud API, Ollama Local Server.
- **Funcionalidades implementadas:** Chat com copiloto executivo, geração de planos diários de prospecção, análise de sentimentos em reuniões, recomendações táticas para fechamento de negócios.
- **Testes encontrados:** `tests/unit/copilot.service.test.ts`, `tests/integration/intelligence.routes.test.ts`, `tests/unit/nextBestAction.test.ts`.
- **Dependências externas:** `@google/genai`, `groq-sdk`, `openai` (compatível com LiteLLM), `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-07-001 (DEBT-AI-002)
- **Título:** Copiloto Comercial exibe métricas financeiras e de pipeline através de constantes fabricadas hardcoded
- **Categoria:** Integridade Funcional e Qualidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` (linhas 120-165)
- **Evidência:** No componente executivo, cards de "Receita Prevista", "Meta Mensal", "Pipeline Ativo" e "Probabilidade Média" renderizam valores fixos mockados (`receita: "R$ 485.000"`, `meta: "R$ 600.000"`, `forecast: "82%"`) hardcoded em um objeto de estado estático, sem consumir os dados reais consolidados pela camada de CRM/BI do Agente 04.
- **Problema:** O produto apresenta números fictícios como se fossem relatórios em tempo real da carteira do usuário, violando frontalmente a diretriz de "prevenção de dados cenográficos" (`AGENTS.md` §25 e Bloqueador B-06).
- **Causa raiz:** O componente foi desenvolvido para uma demonstração visual e a integração com as APIs de analytics e oportunidades não foi concluída antes do merge.
- **Impacto:** Perda de credibilidade do produto perante clientes; decisões tomadas por executivos baseadas em indicadores falsos exibidos na tela de IA.
- **Correção necessária:** Conectar o componente diretamente ao endpoint `/api/analytics/overview` do Agente 04, tratando estados reais de carregamento (`loading`), vazio (`empty`), erro (`error`) e dados atualizados.
- **Agente proprietário:** 07
- **Agentes dependentes:** 04 (APIs de BI e CRM), 22 (Verificação de realidade)
- **Complexidade:** Média (1 a 2 dias)
- **Prioridade:** P1
- **Critério de aceite:** O componente renderiza exclusivamente as métricas vindas do backend da organização logada; quando a organização é nova com 0 vendas, exibe R$ 0,00 e estado vazio contextualizado.
- **Teste necessário:** Teste E2E e unitário com verificação de props vindas do React Query e validação de 0 dados mockados em produção.
- **Dependências:** Alinhamento de DTOs com o Agente 04.

### ID: DIV-07-002 (DEBT-AI-003)
- **Título:** Botões de ação do Next Best Action (NBA) emitem feedback de sucesso sem execução ou persistência no backend
- **Categoria:** Funcionalidade e Persistência Real
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` (linhas 340-375), `src/features/intelligence/services/nextBestAction.service.ts`
- **Evidência:** Ao clicar nos botões "Executar Ação" ou "Adiar Ação" nos cards de recomendação inteligente do vendedor, o handler dispara apenas uma mutação de estado local React (`setCompleted(true)`) e exibe um toast informativo "Ação concluída com sucesso", sem disparar nenhuma mutation HTTP ou alteração no banco de dados relacional. Ao recarregar a página (F5), a ação recomendada volta ao estado original não executado.
- **Problema:** Interface cenográfica que promete execução de automação sem persistência real no sistema (violação do Bloqueador B-08 e regra de persistência do Agente 22).
- **Causa raiz:** Componente de interface entregue antes da criação das rotas de backend de resolução de tarefas do NBA.
- **Impacto:** Vendedores acreditam que enviaram follow-up ou alteraram a fase do lead quando na verdade nenhuma ação foi registrada no CRM.
- **Correção necessária:** Criar rota `/api/intelligence/nba/:id/execute` e persistir a decisão do vendedor na tabela `OpportunityActionHistory` no banco de dados relacional, despachando a automação configurada.
- **Agente proprietário:** 07
- **Agentes dependentes:** 01 (Schema Prisma), 22 (Verificação de Persistência Real)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** O clique em "Executar Ação" despacha requisição HTTP, persiste no banco e sobrevive a reload completo da página.
- **Teste necessário:** Teste E2E no Playwright simulando clique, recarregamento da página e consulta direta no banco comprovando a mutação.
- **Dependências:** Handoff para 01 caso seja necessário ajuste de schema.

### ID: DIV-07-003 (DEBT-AI-004)
- **Título:** Trace de missões autônomas de IA e consentimento LGPD retornados de forma sintética em rotas de inteligência
- **Categoria:** Observabilidade e Conformidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/routes/intelligence.routes.ts` (linhas 510-545)
- **Evidência:** Os endpoints de telemetria de missões executadas pelo Copiloto e checagem de consentimento respondem com estruturas de JSON geradas via helpers estáticos (ex.: `generateMockAuditTrace()`) contendo timestamps e hashes calculados na hora em vez de ler o histórico da cadeia criptográfica de auditoria.
- **Problema:** A auditoria de ações autônomas de IA não reflete a execução real dos agentes, impedindo a rastreabilidade exigida pela governança.
- **Causa raiz:** Implementação de mock para destravar desenvolvimento de telas de auditoria sem substituição pela consulta real.
- **Impacto:** Impossibilidade de rastrear decisões autônomas tomadas por LLMs em caso de incidentes com clientes.
- **Correção necessária:** Integrar a rota com a tabela real `AgentExecutionTrace` e com o serviço `ConsentAuditChainService` do Agente 21.
- **Agente proprietário:** 07
- **Agentes dependentes:** 21 (LGPD e Auditoria), 13 (Governança de Agentes)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** O endpoint de trace retorna eventos reais persistidos no PostgreSQL com assinaturas criptográficas verificáveis.
- **Teste necessário:** Teste de integração de gravação de missão autônoma e leitura de sua trilha de auditoria.
- **Dependências:** Integração com Agente 21 e 13.

### ID: DIV-07-004 (DEBT-UX-008)
- **Título:** Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito permanente
- **Categoria:** UX e Tratamento de Erros
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/copilot/components/ExecutiveCopilotDrawer.tsx` (linhas 85-112)
- **Evidência:** No hook de carregamento do Copiloto, se a primeira chamada a `/api/copilot/session` falhar com erro 500 ou timeout, o bloco `.catch()` não atualiza o estado `isLoading` para `false`, mantendo o componente em spinner infinito sem exibir mensagem de falha.
- **Problema:** O usuário fica bloqueado aguardando indefinidamente a interface de chat carregar sem saber que houve erro de conexão.
- **Causa raiz:** Omissão do reset de `isLoading: false` no bloco de captura de erro.
- **Impacto:** Frustração do usuário e percepção de que a plataforma travou por completo.
- **Correção necessária:** Adicionar `finally(() => setIsLoading(false))` e renderizar componente de fallback com mensagem de erro amigável e botão de "Tentar Novamente".
- **Agente proprietário:** 07
- **Agentes dependentes:** 02 (UX de componentes)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Ao simular erro 500 na API, o spinner encerra em menos de 1 segundo e o botão de "Tentar Novamente" é exibido.
- **Teste necessário:** Teste unitário de componente com MockedProvider simulando rejeição de requisição.
- **Dependências:** Nenhuma.

### ID: DIV-07-005 (DEBT-UX-007)
- **Título:** Busca textual na base de conhecimento do Copiloto engole falhas do banco e retorna lista vazia
- **Categoria:** Confiabilidade e Observabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/services/knowledgeBase.service.ts` (linhas 130-155)
- **Evidência:** Quando a busca vetorial ou textual por similaridade falha (por exemplo, indisponibilidade do banco de dados vetorial ou timeout), a função captura o erro e retorna `return []` silenciosamente.
- **Problema:** A LLM gera respostas alucinadas ou informa que "não encontrou documentos sobre o assunto" porque o serviço engoliu o erro de infraestrutura.
- **Causa raiz:** Falta de diferenciação entre "busca sem correspondências" e "erro de infraestrutura na busca".
- **Impacto:** Respostas degradadas da IA sem que a equipe de SRE perceba que o serviço de busca vetorial está inoperante.
- **Correção necessária:** Lançar erro específico e registrar métrica de falha de RAG, alertando o Copiloto de que a base de conhecimento está temporariamente inacessível.
- **Agente proprietário:** 07
- **Agentes dependentes:** 10 (SRE e Monitoramento)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Falha no repositório de conhecimento lança exceção observável e gera log estruturado com correlationId.
- **Teste necessário:** Teste unitário com mock de banco rejeitado validando propagação de erro.
- **Dependências:** Nenhuma.

### ID: DIV-07-006
- **Título:** Hotspots severos em componentes de painel de inteligência (IntelligenceHub e SwarmDashboard)
- **Categoria:** Arquitetura de Frontend e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/components/IntelligenceHub.tsx` (1297 linhas), `src/features/intelligence/components/SwarmDashboard.tsx` (1018 linhas)
- **Evidência:** Ambos os arquivos superam 1000 linhas de código e estão incluídos em `HOTSPOT_EXCEPTIONS.md` com prazo de expiração em 08/11/2026.
- **Problema:** Os componentes concentram telas completas com visualizações de grafos de conhecimento, tabelas de tarefas de agentes, editores de prompts, sliders de temperatura de modelos e logs de streaming de sockets.
- **Causa raiz:** Desenvolvimento acelerado de funcionalidades avançadas de enxame de IA em componentes monolíticos.
- **Impacto:** Lentidão na renderização de dashboards em tempo real; risco alto de regressões durante qualquer alteração visual.
- **Correção necessária:** Modularizar os dashboards extraindo sub-componentes especializados em `src/features/intelligence/components/subswarms/` e `src/features/intelligence/components/controls/`.
- **Agente proprietário:** 07
- **Agentes dependentes:** 03 (Design System)
- **Complexidade:** Grande (3 a 4 dias)
- **Prioridade:** P1
- **Critério de aceite:** Cada arquivo reduzido para menos de 450 linhas com testes unitários preservados e aprovados.
- **Teste necessário:** Testes de regressão de componentes com Vitest e Testing Library.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (integrações com LLMs, copiloto comercial e automações implementadas).
- **Cobertura automatizada de testes:** Média (testes de chamadas de LLM dependem de mocks; faltam testes de persistência real de ações).
- **Segurança:** Alta (tokens de IA e chaves de API nunca expostos no frontend).
- **Arquitetura:** Média (prejudicada por monólitos de frontend e dados cenográficos em cards executivos).
- **Confiabilidade:** Baixa (afetada pela ausência de persistência real no NBA e engolimento de erros em buscas de conhecimento).
- **Observabilidade:** Média (necessita substituir traces sintéticos por telemetria real).
- **Manutenibilidade:** Média (arquivos densos aumentam o tempo de manutenção).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Conectar cards de métricas do Copiloto a dados reais de CRM/BI, eliminando dados fabricados (DIV-07-001).
2. **Segurança e integridade de dados:** Integrar traces de missões autônomas à cadeia de auditoria real (DIV-07-003).
3. **Falhas funcionais:** Implementar persistência real de backend e despacho de automações no Next Best Action (DIV-07-002).
4. **Confiabilidade:** Corrigir o tratamento de erro e loading permanente no `ExecutiveCopilotDrawer.tsx` (DIV-07-004).
5. **Testes:** Criar testes E2E com persistência no banco para todas as ações do Copiloto.
6. **Arquitetura:** Modularizar `IntelligenceHub.tsx` e `SwarmDashboard.tsx` antes do prazo de 08/11/2026 (DIV-07-006).
7. **Melhorias estruturais:** Adicionar observabilidade de latência de inferência por modelo LLM.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 6
- **Quantidade por severidade:** 0 Críticas, 4 Altas, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 6
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 4 (DIV-07-002, DIV-07-004, DIV-07-005, DIV-07-006)
- **Problemas compartilhados:** 2 (DIV-07-001 com 04 e 22, DIV-07-003 com 21 e 13)
- **Handoffs necessários:**
  - Handoff para 04: Consumo dos contratos oficiais de métricas financeiras de CRM.
  - Handoff para 21: Validação do esquema de telemetria de consentimento em missões de IA.
- **Riscos mais importantes:** A presença de dados simulados em componentes executivos e botões que afirmam concluir ações sem persistência quebra a integridade fundamental do produto e a confiança dos usuários.
- **Recomendação final:** Eliminar imediatamente os mocks do `EliteCommercialAgentWorkspace.tsx` e implementar as rotas de persistência do Next Best Action.
