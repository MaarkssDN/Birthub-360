# Relatório de Auditoria de Dívidas Técnicas — Agente 06

## IDENTIFICAÇÃO
- **ID do agente:** 06
- **Nome oficial:** Integrações e Bitrix
- **Especialização:** Conectividade com sistemas externos, sincronização bidirecional com Bitrix24 CRM, integração com central telefônica 3CX, WhatsApp/Baileys, Google Workspace, ingestão de webhooks e conectores de terceiros
- **Responsabilidades:** Gestão dos adaptadores de integração, resiliência na comunicação com a API do Bitrix24, ingestão assíncrona de eventos de chamada do 3CX, segurança de webhooks e componentes de UI para configuração de integrações.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/integrations/**`, rotas de webhook do Bitrix e 3CX, clientes HTTP de integração, painéis visuais de importação e mapeamento de campos.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Conectores Bitrix24, ThreeCX telephony gateway, WhatsApp integration bridge, painéis de gerenciamento de integrações externas.
- **Arquivos relevantes:**
  - `src/features/integrations/bitrix/bitrix.routes.ts` (842 linhas)
  - `src/features/integrations/bitrix/service/dailyPlan.service.ts` (853 linhas)
  - `src/features/integrations/bitrix/client/bitrixApiClient.ts`
  - `src/features/integrations/threecx/threecx.service.ts` (956 linhas)
  - `src/features/integrations/components/BitrixImportPanel.tsx` (1252 linhas, sob exceção)
  - `src/features/integrations/components/ExternalCrmPanel.tsx` (1079 linhas, sob exceção)
  - `src/features/integrations/components/Integrations.tsx` (1096 linhas, sob exceção)
- **Serviços existentes:** `BitrixSyncService`, `ThreeCXService`, `WhatsAppService`, `ExternalCrmAdapter`.
- **APIs e integrações:** Bitrix24 REST API (webhooks de entrada e saída), 3CX Call Control API / Webhooks, WhatsApp Webhooks.
- **Funcionalidades implementadas:** Sincronização automática de negócios e leads do Bitrix, mapeamento visual de pipelines e campos, registro de eventos de chamada telefônica em tempo real.
- **Testes encontrados:** `tests/integration/bitrix.routes.test.ts`, `tests/unit/threecx.service.test.ts`, `tests/unit/bitrix-client.test.ts`.
- **Dependências externas:** Bitrix24 REST, 3CX PBX, `axios`, `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-06-001 (DEBT-INT-001)
- **Título:** Cliente HTTP do Bitrix aborta precocemente a leitura de socket em respostas com latência parcial
- **Categoria:** Integrações e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/integrations/bitrix/client/bitrixApiClient.ts` (linhas 90-115)
- **Evidência:** O cliente HTTP configura um timeout agressivo de socket que destrói a conexão (`socket.destroy()`) se o cabeçalho for recebido mas o streaming do corpo JSON demorar mais de 5 segundos para ser concluído durante sincronizações volumosas.
- **Problema:** Em conexões com a API em nuvem do Bitrix24 que possuem oscilações temporárias de throughput, a requisição é abortada com erro de socket fechado (`ECONNRESET`), gerando falhas intermitentes na sincronização diária de negócios e leads.
- **Causa raiz:** Configuração inadequada de timeout de inatividade de socket (`socket timeout`) confundida com timeout de conexão inicial (`connect timeout`).
- **Impacto:** Sincronizações de portais Bitrix com milhares de registros falham com frequência no meio do processo, exigindo reinício manual do trabalho.
- **Correção necessária:** Ajustar o cliente HTTP para utilizar timeouts diferenciados: timeout de conexão (10s), timeout de resposta (60s com buffer) e adicionar política de retry com backoff exponencial para erros de leitura parcial.
- **Agente proprietário:** 06
- **Agentes dependentes:** 16 (Workers e Escala), 08 (Testes de integração)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Cliente HTTP completa a leitura com sucesso de payloads JSON de 10MB mesmo quando o servidor Bitrix simula latência de rede de 100ms por chunk.
- **Teste necessário:** Teste unitário com servidor mock simulando resposta HTTP em chunks lentos sem disparar cancelamento indevido.
- **Dependências:** Nenhuma.

### ID: DIV-06-002
- **Título:** Três painéis monolíticos gigantescos na interface de gerenciamento de integrações
- **Categoria:** Arquitetura de Frontend e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/integrations/components/BitrixImportPanel.tsx` (1252 linhas), `src/features/integrations/components/ExternalCrmPanel.tsx` (1079 linhas), `src/features/integrations/components/Integrations.tsx` (1096 linhas)
- **Evidência:** Todos os três arquivos ultrapassam 1000 linhas de código e estão incluídos em `HOTSPOT_EXCEPTIONS.md` com prazo de expiração em 30/11/2026.
- **Problema:** Os componentes acumulam estado de formulário, criptografia/mascaramento de chaves no cliente, tabelas de mapeamento de centenas de campos personalizados, visualização de progresso e histórico de sincronizações em componentes únicos.
- **Causa raiz:** O módulo de integrações foi evoluído incrementalmente para suportar múltiplos CRMs (Bitrix, HubSpot, Pipedrive) sem criação de um framework desacoplado de componentes reutilizáveis.
- **Impacto:** Dificuldade extrema em aplicar melhorias de acessibilidade; alto custo de manutenção; lentidão em formulários de mapeamento devido a renderizações em cascata.
- **Correção necessária:** Criar um módulo compartilhado `src/features/integrations/shared/` extraindo:
  - `FieldMappingTable.tsx` (tabela de de-para de campos);
  - `WebhookConfigCard.tsx` (configuração e teste de credenciais);
  - `SyncProgressIndicator.tsx` (barra de progresso e logs).
- **Agente proprietário:** 06
- **Agentes dependentes:** 02 (UX de Integrações), 03 (Design System)
- **Complexidade:** Grande (4 a 5 dias)
- **Prioridade:** P1
- **Critério de aceite:** Cada um dos três arquivos de tela reduzido para menos de 400 linhas; 100% das funcionalidades de teste de conexão e mapeamento de campos preservadas e testadas.
- **Teste necessário:** Testes de componentes com React Testing Library validando o fluxo de configuração de ponta a ponta.
- **Dependências:** Nenhuma.

### ID: DIV-06-003
- **Título:** Ingestão de webhooks telefônicos do 3CX síncrona e sem garantia transacional de outbox
- **Categoria:** Arquitetura de Backend e Resiliência
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/integrations/threecx/threecx.service.ts` (linhas 956+), `threecx.routes.ts`
- **Evidência:** Quando a central telefônica 3CX dispara eventos de chamadas (`CallStarted`, `CallConnected`, `CallEnded`), o endpoint HTTP executa diretamente operações de consulta de contato, criação de atividade no CRM e cálculo de duração de chamada na mesma requisição síncrona.
- **Problema:** Em picos de discagem simultânea por dezenas de ramais comerciais, a API pode responder com lentidão ou timeout ao 3CX, levando o servidor PBX a descartar o webhook e causando a perda do registro de ligações e métricas de produtividade.
- **Causa raiz:** Processamento direto e síncrono de eventos de alta frequência sem intermediação por fila assíncrona.
- **Impacto:** Ligações reais de vendedores deixam de ser registradas no CRM; perda de métricas de ligações por SDR em horários de pico.
- **Correção necessária:** Ingerir o payload do 3CX imediatamente respondendo HTTP 202 Accepted e enfileirar o evento no Redis/BullMQ (ou persistir em tabela de outbox transacional) para processamento em background pelo worker.
- **Agente proprietário:** 06
- **Agentes dependentes:** 16 (Workers e Filas), 12 (Voz e Telefonia)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Endpoint do 3CX responde com latência < 30ms sob taxa de 100 webhooks/segundo, garantindo 100% de persistência final no CRM.
- **Teste necessário:** Teste de estresse com simulação de 500 webhooks concorrentes de chamadas telefônicas.
- **Dependências:** Alinhamento de infraestrutura de fila com o Agente 16.

### ID: DIV-06-004
- **Título:** Tratamento incompleto de promessas assíncronas em componentes de importação externa (Sonar S9383)
- **Categoria:** Qualidade de Código e Confiabilidade
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `src/features/integrations/components/ExternalCrmPanel.tsx` (linhas 340-365)
- **Evidência:** Chamadas assíncronas de busca de metadados de entidades externas são executadas em `useEffect` sem manipulação explícita de erro ou cleanup no caso de desmontagem rápida do componente (código de diagnóstico SonarQube S9383).
- **Problema:** Se o usuário trocar de aba enquanto a listagem de pipelines está sendo carregada, a Promise tenta atualizar o estado em componente desmontado (warning de vazamento de memória).
- **Causa raiz:** Omissão de `AbortController` na requisição disparada pelo hook.
- **Impacto:** Alertas de linter e pequenas degradações de memória em clientes web de baixa performance.
- **Correção necessária:** Adicionar `AbortController` com sinal de cancelamento no retorno de cleanup do `useEffect`.
- **Agente proprietário:** 06
- **Agentes dependentes:** 08 (Gates de SonarQube)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Diagnóstico SonarQube S9383 eliminado completamente em `ExternalCrmPanel.tsx`.
- **Teste necessário:** Teste unitário de montagem/desmontagem rápida do componente com requisição pendente.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (integrações com Bitrix24, 3CX e webhooks comerciais plenamente mapeadas).
- **Cobertura automatizada de testes:** Média (testes de rotas existem, mas testes de estresse de webhooks e simulação de instabilidade são escassos).
- **Segurança:** Alta (webhooks e chaves privadas criptografadas com AES-256-GCM em repouso).
- **Arquitetura:** Média (degradada por 3 monólitos de frontend e ingestão síncrona no 3CX).
- **Confiabilidade:** Média (suscetível a perda de eventos em picos de discagem).
- **Observabilidade:** Alta (tabelas de histórico de sincronização com status e contadores de entidades).
- **Manutenibilidade:** Média (alto número de linhas concentradas em poucos arquivos).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado no domínio.
2. **Segurança e integridade de dados:** Desacoplar webhooks do 3CX para buffer assíncrono garantindo 0 perda de dados (DIV-06-003).
3. **Falhas funcionais:** Corrigir timeout de socket no `bitrixApiClient.ts` (DIV-06-001).
4. **Confiabilidade:** Adicionar `AbortController` em `ExternalCrmPanel.tsx` para eliminar warning S9383 (DIV-06-004).
5. **Testes:** Criar testes de simulação de alta carga para ingestão de eventos PBX.
6. **Arquitetura:** Modularizar `BitrixImportPanel`, `ExternalCrmPanel` e `Integrations.tsx` (DIV-06-002).
7. **Melhorias estruturais:** Adicionar painel de saúde em tempo real das conexões Bitrix.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-06-001, DIV-06-002, DIV-06-004)
- **Problemas compartilhados:** 1 (DIV-06-003 compartilhado com 16 e 12)
- **Handoffs necessários:**
  - Handoff para 16: Definição de fila BullMQ para processamento em background de webhooks 3CX.
- **Riscos mais importantes:** A perda potencial de webhooks de ligação em picos de telefonia afeta o registro de produtividade de vendas; monólitos de UI com mais de 1000 linhas tornam o frontend de integrações frágil.
- **Recomendação final:** Migrar imediatamente a ingestão do 3CX para fila assíncrona e iniciar a refatoração dos três painéis visuais de integrações.
