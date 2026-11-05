# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 07
- **Nome oficial:** AI, RAG, Agents, Queues & Automation Reliability Specialist
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável pelos recursos de IA, knowledge/RAG, filas, agentes, roleplay e automações.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-AI-002
**Título:** Copiloto Executivo exibe receita, meta, pipeline e forecast fabricados por constantes
- **Categoria:** Inteligência artificial
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 35-85), src/bootstrap/routes.ts
- **Evidência:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 35-85), src/bootstrap/routes.ts (linhas 138-145), src/App.tsx (linhas 398-405)
- **Problema:** A rota GET /api/commercial-agent/workspace (em src/features/intelligence/routes/commercial-agent.routes.ts:40) busca apenas os 10 leads mais recentes sem filtrar por deletedAt ou mês comercial, e calcula métricas financeiras multiplicando contagens por valores fixos (wonLeads.length * 25000, openLeads.length * 30000, meta fixa 200000, forecasts 60%/75% e score default 85).
- **Causa raiz:** Implementação de rota do Copiloto Executivo com fórmulas demonstrativas hardcoded em vez de consumir o serviço canônico de Analytics e Metas (Bloqueador B-06 do AGENTS.md).
- **Impacto:** Apresenta indicadores financeiros fictícios como se fossem dados reais da organização, induzindo decisões comerciais incorretas.
- **Correção necessária:** Substituir os cálculos fixos em commercial-agent.routes.ts pelo consumo das agregações reais do tenant (respeitando deletedAt: null e calendário Brasília) e retornar contrato explícito de unavailable quando metas não estiverem configuradas.
- **Agente proprietário:** 07
- **Agentes dependentes:** 07, 04, 18, 22 Contrato de métricas com Agente 04 (CRM/BI) e Agente 18 (OpenAPI), Verificação de realidade pelo Agente 22
- **Complexidade:** M (1–3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Valores exibidos no Copiloto coincidem exatamente com os negócios reais do banco para o tenant, com >10 leads, respeitando soft-delete e mês comercial.
- **Teste necessário:** Teste de integração com base vazia, negócios reais de valores variados, >10 leads e leads soft-deleted
- **Dependências:** Contrato de métricas com Agente 04 (CRM/BI) e Agente 18 (OpenAPI), Verificação de realidade pelo Agente 22

### ID: DEBT-AI-003
**Título:** Botões de executar e adiar Next Best Action (NBA) afirmam ação concluída sem execução ou persistência
- **Categoria:** Inteligência artificial
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 210-245), src/features/intellige
- **Evidência:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 210-245), src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx (linhas 70-115)
- **Problema:** Os endpoints POST /api/commercial-agent/nba/:actionId/execute e /feedback retornam apenas JSON de sucesso sem acionar nenhum dispatcher de voz/cadência nem gravar estado no banco. No código de main, o componente EliteCommercialAgentWorkspace.tsx ainda exibia mensagem 'Discando para...' até mesmo no bloco catch de erro de rede e ignorava res.ok no feedback.
- **Causa raiz:** Endpoints stubbed e tratamento otimista incondicional na interface do Copiloto.
- **Impacto:** O operador acredita que disparou uma ligação ou adiou uma tarefa comercial, mas nenhuma ação é executada nem salva após recarregar a página.
- **Correção necessária:** Integrar os endpoints /execute e /feedback ao dispatcher/ledger real com escopo de tenant e idempotência, alinhar o contrato de payload (decision/feedbackType) e aplicar o tratamento de erro honesto na UI.
- **Agente proprietário:** 07
- **Agentes dependentes:** 07, 13, 17, 18, 22 Integração com ledger/dispatcher dos Agentes 13 e 17, Contrato OpenAPI Agente 18, Verificação Agente 22
- **Complexidade:** M (1–3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Ação executada/adiada persiste após reload da página e respeita isolamento de tenant; erro HTTP/rede exibe alerta de erro real.
- **Teste necessário:** verify-elite.mjs (sucesso HTTP, erro HTTP e falha de rede), Teste de integração validando persistência no banco após POST
- **Dependências:** Integração com ledger/dispatcher dos Agentes 13 e 17, Contrato OpenAPI Agente 18, Verificação Agente 22

### ID: DEBT-AI-004
**Título:** Trace de missão do Copiloto e aprovação de consentimento LGPD são retornados de forma sintética/fictícia
- **Categoria:** Inteligência artificial
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 140-208), src/features/intellige
- **Evidência:** src/features/intelligence/routes/commercial-agent.routes.ts (linhas 140-208), src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx (linhas 48-56)
- **Problema:** O endpoint GET /api/commercial-agent/mission/:missionId/trace retorna um objeto JSON estático com status COMPLETED e passos como 'Nenhum risco de consentimento detectado — Aprovado' para qualquer missionId informado, sem realizar consulta ao banco de dados, ao estado do enxame ou à tabela de consentimento LGPD.
- **Causa raiz:** Simulação de observabilidade de missão e compliance LGPD deixada em rota de produção.
- **Impacto:** Exibe falsa comprovação de auditoria LGPD e de execução de agentes autônomos para o usuário.
- **Correção necessária:** Consultar execuções reais de missão por organizationId, retornar 404 quando missionId não existir (ou estado vazio honesto quando nenhuma missão tiver rodado) e remover afirmações sintéticas de aprovação LGPD.
- **Agente proprietário:** 07
- **Agentes dependentes:** 07, 13, 18, 21, 22 Integração com estado real de missão do Agente 13, Contrato OpenAPI Agente 18
- **Complexidade:** M (1–3 dias)
- **Prioridade:** P1
- **Critério de aceite:** ID inexistente ou de outro tenant retorna 404; tela sem missão ativa exibe estado vazio honesto sem forjar aprovação LGPD.
- **Teste necessário:** Teste de integração para missionId inexistente, missionId de outro tenant e missão real persistida
- **Dependências:** Integração com estado real de missão do Agente 13, Contrato OpenAPI Agente 18

### ID: DEBT-UX-008
**Título:** Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito (spinner permanente)
- **Categoria:** Frontend e UX
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx (linhas 124-145)
- **Evidência:** src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx (linhas 124-145)
- **Problema:** Em EliteCommercialAgentWorkspace.tsx:127, a guarda de carregamento 'if (loading || !overview)' é avaliada antes do bloco 'if (error)'. Quando a carga inicial da API falha, loading passa para false, error recebe a mensagem de falha e overview permanece null — fazendo o componente renderizar o spinner eternamente e tornando o bloco de erro/retry inalcançável.
- **Causa raiz:** Condição booleana disjuntiva (!overview) colocada no guard de loading em vez de ficar após o tratamento de erro.
- **Impacto:** Qualquer erro transitório de rede ou HTTP 500 na abertura da tela trava a interface em loading infinito sem opção de retry.
- **Correção necessária:** Alterar a primeira guarda na linha 127 para 'if (loading)' para que o bloco seguinte 'if (error || !overview)' seja alcançado e exiba o botão de retry.
- **Agente proprietário:** 07
- **Agentes dependentes:** 07, 02 Revisão independente Agente 24
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Simulação de erro 500 na carga inicial renderiza a mensagem de erro e permite acionar retry com sucesso.
- **Teste necessário:** Asserção em verify-elite.mjs e teste de componente React com falha inicial da API
- **Dependências:** Revisão independente Agente 24

### ID: DEBT-UX-007
**Título:** Busca textual da base retorna lista vazia quando banco falha
- **Categoria:** Busca
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/knowledge/search.service.ts (linhas 178-180), src/features/knowledge/search.service.ts
- **Evidência:** src/features/knowledge/search.service.ts (linhas 178-180), src/features/knowledge/search.service.ts (linhas 54-64)
- **Problema:** Se FTS falha, tenta ILIKE; se fallback falha, retorna []. Quando busca semântica também indisponível, hybridSearch retorna hits[] indistinguíveis de nenhum documento encontrado.
- **Causa raiz:** Contrato só distingue indisponibilidade semântica; não distingue erro da busca textual.
- **Impacto:** Falha de banco é apresentada como ausência de conhecimento; usuário pode concluir que documento não existe.
- **Correção necessária:** Propagar falha da busca textual ou declarar disponibilidade de ambas estratégias e sinalizar erro quando nenhuma executou.
- **Agente proprietário:** 07
- **Agentes dependentes:** 02, 07 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** Banco indisponível não gera falso empty; semântica indisponível com textual funcional mantém fallback claro.
- **Teste necessário:** FTS falha/ILIKE sucesso; ambos falham; embeddings falham e keywords sucesso; ambas estratégias indisponíveis.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 5
- **Quantidade confirmada:** 5
- **Riscos mais importantes:** Copiloto Executivo exibe receita, meta, pipeline e forecast fabricados por constantes; Botões de executar e adiar Next Best Action (NBA) afirmam ação concluída sem execução ou persistência; Trace de missão do Copiloto e aprovação de consentimento LGPD são retornados de forma sintética/fictícia; Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito (spinner permanente); Busca textual da base retorna lista vazia quando banco falha
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
