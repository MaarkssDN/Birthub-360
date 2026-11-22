# Relatório de Auditoria de Dívidas Técnicas — Agente 13

## IDENTIFICAÇÃO
- **ID do agente:** 13
- **Nome oficial:** Enxame Autônomo e Governança de Agentes de Runtime
- **Especialização:** Arquitetura de sub-enxames comerciais (SDR, Closer, CS, Marketing), orquestração hierárquica multi-agente, barramento de comunicação entre agentes (Agent Bus), controle de recursão e loops infinitos, e governança de catálogo de ferramentas (tool bindings)
- **Responsabilidades:** Governança dos agentes autônomos em tempo de execução, despacho e delegação de tarefas entre agentes especialistas, prevenção de loops recursivos, rastreabilidade de conversações entre agentes e resiliência de máquinas de estado autônomas.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/intelligence/agents/**`, `src/lib/agents-bus/**`, `src/features/hub/**`, catálogo de ferramentas de runtime.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Agente Supervisor de Enxame, barramento Agent Bus local, orquestradores de subswarms (LDR, SDR, Closer, BDR, CS), despachador de ferramentas de IA.
- **Arquivos relevantes:**
  - `src/features/intelligence/agents/supervisor.agent.ts` (1000 linhas, no limite exato de falha arquitetural)
  - `src/lib/agents-bus/agentBus.ts`
  - `src/lib/agents-bus/agentBusStore.ts`
  - `src/features/intelligence/agents/tools/toolCatalog.ts`
  - `src/features/hub/components/CommercialAgentCellPanel.tsx` (738 linhas)
- **Serviços existentes:** `SupervisorAgent`, `AgentBusLocal`, `ToolRegistry`, `SubswarmDispatcher`.
- **APIs e integrações:** LiteLLM / Gemini Function Calling, barramento de eventos interno em Node.js EventEmitter.
- **Funcionalidades implementadas:** Roteamento hierárquico de intenções comerciais, execução paralela de pesquisas de mercado e enriquecimento, console visual de monitoramento do enxame.
- **Testes encontrados:** `tests/unit/agents-bus.test.ts`, `tests/unit/supervisor.agent.test.ts`.
- **Dependências externas:** `@google/genai`, `zod`, `eventemitter3`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-13-001
- **Título:** Supervisor de enxame atinge o limite exato de 1000 linhas com acoplamento rígido a 8 agentes
- **Categoria:** Arquitetura e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/agents/supervisor.agent.ts` (1000 linhas)
- **Evidência:** O linter de arquitetura (`scripts/architecture/check-hotspots.ts`) acusa o arquivo com exatamente 1000 linhas (limite máximo tolerável antes de reprovação imediata de CI). O código instancia e importa estaticamente 8 agentes especialistas (LDR, SDR, Closer, FollowUp, Nurturing, CS, Voice, Compliance) no mesmo corpo de classe.
- **Problema:** Qualquer linha de código adicionada ao supervisor causará quebra imediata do gate arquitetural de hotspots no CI. O acoplamento estático impede que novos sub-enxames sejam adicionados sem modificar o arquivo mestre.
- **Causa raiz:** O supervisor foi desenvolvido acumulando a lógica de decisão, prompts específicos de cada sub-enxame e regras de fallback em um único arquivo.
- **Impacto:** Dificuldade de expansão do enxame de agentes; risco iminente de quebra de CI em qualquer refatoração.
- **Correção necessária:** Refatorar o supervisor para utilizar o padrão Strategy / Registry dinâmico, registrando os agentes através de um catálogo desacoplado (`AgentRegistry`), reduzindo o arquivo para menos de 400 linhas.
- **Agente proprietário:** 13
- **Agentes dependentes:** 07 (IA e Automações), 18 (Contratos e DTOs)
- **Complexidade:** Grande (3 a 4 dias)
- **Prioridade:** P1
- **Critério de aceite:** `supervisor.agent.ts` passa a ter menos de 400 linhas; `npm run test:architecture` executa com margem segura de mais de 600 linhas no limite de hotspots.
- **Teste necessário:** Testes de regressão de orquestração hierárquica cobrindo a delegação para todos os 8 agentes especialistas.
- **Dependências:** Nenhuma.

### ID: DIV-13-002
- **Título:** Ausência de detector de loop e limite estrito de recursão no barramento Agent Bus local
- **Categoria:** Confiabilidade e Resiliência
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/lib/agents-bus/agentBus.ts` (linhas 50-85)
- **Evidência:** O método `dispatchMessage` permite que o Agente A envie mensagem para o Agente B, e o Agente B envie de volta para o Agente A sem decrementar uma contagem de profundidade (`hopCount` ou `depthBudget`).
- **Problema:** Se duas LLMs entrarem em discordância sobre uma qualificação de lead ou se delegarem a mesma tarefa indefinidamente (ex.: SDR devolvendo lead incompleto para o LDR, e LDR devolvendo para o SDR), o sistema entra em loop infinito, consumindo milhares de dólares em tokens de API em poucos minutos e travando o servidor.
- **Causa raiz:** O barramento foi projetado para comunicação de um único passo sem consideração de grafos cíclicos de conversação autônoma.
- **Impacto:** Risco financeiro grave por consumo desenfreado de tokens de LLM e bloqueio de memória do processo Node.js.
- **Correção necessária:** Adicionar cabeçalho obrigatório de metadados em todas as mensagens do Agent Bus contendo `traceId`, `maxHops: 5` e contador incremental. Se `currentHop >= maxHops`, a execução é abortada imediatamente com erro observável `AGENT_RECURSION_DEPTH_EXCEEDED` e escalada para revisão humana.
- **Agente proprietário:** 13
- **Agentes dependentes:** 23 (Custo e Limites de IA), 07 (Agentes de IA)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Simulação de dois agentes em loop cíclico é interrompida com precisão no 5º salto com emissão de alerta.
- **Teste necessário:** Teste unitário no `agentBus.test.ts` com dois agentes configurados para responderem um ao outro ciclicamente.
- **Dependências:** Alinhamento de limites com o Agente 23.

### ID: DIV-13-003
- **Título:** Histórico de conversas e decisões do Agent Bus mantido apenas em memória volátil
- **Categoria:** Auditoria, Governança e Persistência
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/lib/agents-bus/agentBusStore.ts` (linhas 20-45)
- **Evidência:** O armazenamento de mensagens trocadas entre agentes do enxame utiliza uma classe com array em memória (`private messages: AgentMessage[] = []`). Reinicializações do servidor ou encerramento de workers apagam completamente o histórico de raciocínio e delegação das tarefas.
- **Problema:** Impossibilidade de auditar a causa raiz de alucinações ou decisões erradas tomadas pelos agentes comerciais em instâncias anteriores.
- **Causa raiz:** O módulo foi prototipado para testes locais rápidos sem integração com o banco relacional de auditoria.
- **Impacto:** Perda de rastreabilidade regulatória e governança de IA exigidas para clientes enterprise.
- **Correção necessária:** Persistir os eventos de comunicação do Agent Bus na tabela `AgentInteractionHistory` no PostgreSQL de forma assíncrona com buffer.
- **Agente proprietário:** 13
- **Agentes dependentes:** 01 (Schema Prisma), 21 (LGPD e Auditoria)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Toda mensagem trocada no Agent Bus é gravada no banco com `correlationId` e pode ser consultada no dashboard histórico.
- **Teste necessário:** Teste de integração de troca de mensagens e verificação de persistência no PostgreSQL.
- **Dependências:** Handoff para Agente 01 para validação de tabela no Prisma.

### ID: DIV-13-004
- **Título:** Ausência de timeout individual por execução de ferramenta de IA travando o runtime do agente
- **Categoria:** Resiliência e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/intelligence/agents/tools/toolCatalog.ts` (linhas 110-145)
- **Evidência:** Quando o agente autônomo aciona uma ferramenta (tool call) como busca de mercado ou consulta externa, a chamada é executada sem um `AbortSignal` ou timeout específico da ferramenta.
- **Problema:** Se a ferramenta externa demorar 2 minutos para responder ou travar a conexão TCP, o loop de raciocínio da LLM fica bloqueado aguardando indefinidamente, mantendo a sessão de chat presa.
- **Causa raiz:** Falta de wrapper defensivo com `Promise.race` ou timeout configurável por ferramenta.
- **Impacto:** Travamento de tarefas autônomas de enriquecimento e prospecção em background.
- **Correção necessária:** Envolver a execução de qualquer ferramenta em um wrapper com timeout estrito de 15 segundos (`timeout: 15000`), cancelando a operação e informando a LLM sobre a falha de tempo.
- **Agente proprietário:** 13
- **Agentes dependentes:** 07 (IA e Automações)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Ferramenta que simula delay de 20 segundos é abortada aos 15 segundos e a LLM recebe mensagem de timeout estruturada para tentar rota alternativa.
- **Teste necessário:** Teste unitário de execução de ferramenta com timeout induzido.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (comunicação entre agentes, supervisão e delegação de tarefas implementadas).
- **Cobertura automatizada de testes:** Média (testes de barramento existem, mas faltam testes de estresse de recursão e persistência).
- **Segurança:** Alta (ferramentas executam em sandbox sem acesso irrestrito ao sistema de arquivos).
- **Arquitetura:** Média (ameaçada pelo hotspot de 1000 linhas em `supervisor.agent.ts`).
- **Confiabilidade:** Baixa (ausência de limite estrito de recursão expõe a loops infinitos de custo e CPU).
- **Observabilidade:** Baixa (mensagens voláteis em memória dificultam investigação pós-morte).
- **Manutenibilidade:** Média (acoplamento estático no supervisor exige refatoração).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Implementar limite estrito de profundidade de saltos (`maxHops: 5`) no Agent Bus para eliminar loops infinitos (DIV-13-002).
2. **Segurança e integridade de dados:** Persistir histórico de mensagens no banco para auditoria (DIV-13-003).
3. **Falhas funcionais:** Adicionar timeout de 15 segundos em todas as tool calls do catálogo (DIV-13-004).
4. **Confiabilidade:** Decompor `supervisor.agent.ts` em catálogo dinâmico de agentes especialistas (DIV-13-001).
5. **Testes:** Criar testes automatizados de prevenção de recursão e detecção de ciclos.
6. **Arquitetura:** Desacoplar a dependência direta entre agentes através de interfaces de barramento.
7. **Melhorias estruturais:** Adicionar métricas de tempo de resposta por sub-enxame no dashboard executivo.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-13-001, DIV-13-002, DIV-13-004)
- **Problemas compartilhados:** 1 (DIV-13-003 compartilhado com 01 e 21)
- **Handoffs necessários:**
  - Handoff para 01: Criação da tabela `AgentInteractionHistory` no Prisma.
  - Handoff para 23: Monitoramento de custos por profundidade de enxame.
- **Riscos mais importantes:** A ausência de trava contra loops infinitos de mensagens entre agentes representa risco financeiro imediato em contas corporativas de LLM; o tamanho no limite máximo de `supervisor.agent.ts` coloca o CI em risco a qualquer nova edição.
- **Recomendação final:** Blindar o Agent Bus com controle de hops máximo e refatorar o supervisor de enxame.
