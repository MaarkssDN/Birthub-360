# Relatório de Auditoria de Dívidas Técnicas — Agente 16

## IDENTIFICAÇÃO
- **ID do agente:** 16
- **Nome oficial:** Runtime, Workers e Escala
- **Especialização:** Processamento assíncrono em segundo plano, workers dedicados (`worker.ts`), filas e mensageria (BullMQ, Redis, Temporal), controle de concorrência, idempotência de jobs, graceful shutdown e escalabilidade horizontal
- **Responsabilidades:** Arquitetura e estabilidade do processo de workers desacoplado da API web, gestão de filas de alta vazão (WhatsApp, e-mails, sincronizações), políticas de retentativa com backoff, monitoramento de conexões Redis e garantia de encerramento sem perda de mensagens em trânsito.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `worker.ts`, `src/lib/queue/**`, `src/features/temporal-workers/**`, `src/lib/redis/**`, procedimentos de shutdown e circuit breakers de infraestrutura.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Processo worker principal (`worker.ts`), orquestrador de filas BullMQ, cliente de conexão Redis com circuit guard, workers de disparo de cadência e rotinas temporizadas.
- **Arquivos relevantes:**
  - `worker.ts` (ponto de entrada do processo assíncrono)
  - `src/lib/queue/queueManager.ts`
  - `src/lib/queue/jobs/whatsappJob.ts`
  - `src/lib/redis/redisClient.ts`
  - `src/lib/redis/circuitGuard.ts`
  - `server.ts` (lógica de encerramento HTTP e SSE)
- **Serviços existentes:** `QueueManager`, `RedisCircuitGuard`, `WhatsAppWorker`, `CadenceExecutionWorker`, `TemporalWorkflowClient`.
- **APIs e integrações:** Redis 7 (ioredis), BullMQ, Temporal Server API, Server-Sent Events (SSE) connections.
- **Funcionalidades implementadas:** Enfileiramento de mensagens com agendamento temporal (delayed jobs), limite de concorrência por organização, retry com backoff exponencial, graceful shutdown com drenagem de tarefas ativas.
- **Testes encontrados:** `tests/integration/queue-resilience.test.ts`, `tests/unit/redis-guard.test.ts`.
- **Dependências externas:** `bullmq`, `ioredis`, `@temporalio/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-16-001 (DEBT-QUEUE-001)
- **Título:** Processo worker classificado como processo web e re-enfileiramento infinito de mensagens WhatsApp sem falha definitiva
- **Categoria:** Filas, Confiabilidade e Resiliência
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `worker.ts` (linhas 30-55), `src/lib/queue/jobs/whatsappJob.ts` (linhas 85-115)
- **Evidência:** No script de inicialização do worker, ele herda a porta HTTP do servidor web e responde a healthchecks de tráfego web. Além disso, o handler de envio de WhatsApp não marca o job como `FAILED` de forma definitiva quando o número de destino é inválido ou bloqueado pela API do Baileys/Meta; ele re-enfileira a mensagem no bloco `catch` indefinidamente sem limite de tentativas.
- **Problema:** Um único número de telefone inválido ou banido no WhatsApp entra em loop perpétuo de envio no BullMQ, consumindo recursos de conexão e sobrecarregando a fila de mensagens legítimas da organização.
- **Causa raiz:** Separação incompleta de papéis entre processo web e worker, e falta de classificação de erros recuperáveis (ex.: timeout de rede) versus erros permanentes (ex.: número inexistente).
- **Impacto:** Fila de disparos de WhatsApp travada com milhares de retentativas inúteis; risco de banimento de chips comerciais por disparos repetidos sobre números inválidos.
- **Correção necessária:** Classificar o erro de número inválido como não recuperável (`UnrecoverableError`), registrar falha definitiva na tabela `MessageDispatchHistory` e enviar a mensagem falha para uma Dead Letter Queue (DLQ) com alerta observável.
- **Agente proprietário:** 16
- **Agentes dependentes:** 06 (Integração WhatsApp), 17 (Cadência Comercial)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** Disparo sobre número inexistente é tentado no máximo 3 vezes com backoff e transferido para a DLQ com status `DEAD_LETTER`, liberando a fila para os demais envios.
- **Teste necessário:** Teste de integração de fila simulando rejeição definitiva do Baileys e confirmando a interrupção de retentativas.
- **Dependências:** Alinhamento com o Agente 06.

### ID: DIV-16-002 (DEBT-OPS-006)
- **Título:** Circuit guard classifica qualquer falha de conexão de forma genérica como indisponibilidade de Redis
- **Categoria:** Confiabilidade e Observabilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/lib/redis/circuitGuard.ts` (linhas 40-68)
- **Evidência:** O guard intercepta erros em operações de cache e fila e, ao capturar qualquer rejeição (inclusive erros de validação interna de dados ou timeouts do banco relacional associados), incrementa o contador de falhas do circuito do Redis e abre o disjuntor (`state = OPEN`).
- **Problema:** O circuito do Redis é aberto indevidamente em decorrência de problemas alheios ao próprio Redis (ex.: payload JSON mal formatado ou erro de banco), forçando a aplicação inteira a operar em modo degradado sem cache sem necessidade.
- **Causa raiz:** O guard captura `Error` genérico sem inspecionar se a instância de erro pertence a `ioredis` (`ReplyError`, `MaxRetriesPerRequestError`, `ECONNREFUSED`).
- **Impacto:** Queda desnecessária de performance em toda a plataforma e disparos falsos de alertas de indisponibilidade para a equipe de SRE.
- **Correção necessária:** Refinar a verificação do Circuit Guard para abrir o disjuntor exclusivamente em erros comprovados de conexão TCP e timeouts do cliente Redis (`err instanceof RedisError`).
- **Agente proprietário:** 16
- **Agentes dependentes:** 10 (SRE e Monitoramento)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Erros de validação ou de lógica de negócios não incrementam o contador de falhas do Redis Circuit Guard.
- **Teste necessário:** Teste unitário passando erros de diferentes origens e validando que o estado do circuito permanece `CLOSED`.
- **Dependências:** Nenhuma.

### ID: DIV-16-003 (DEBT-OPS-007)
- **Título:** Shutdown do servidor HTTP aguarda conexões SSE ativas sem encerramento coordenado
- **Categoria:** Runtime e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `server.ts` (linhas 280-310), rotas de SSE
- **Evidência:** Durante o encerramento do processo (`SIGTERM`), o servidor HTTP executa `httpServer.close()`. No entanto, como as conexões de Server-Sent Events (usadas para streaming de IA e notificações em tempo real) mantêm o socket TCP aberto permanentemente, o método `close()` fica travado aguardando o fechamento natural das conexões até o timeout forçado do Docker/Kubernetes (30s) que dispara `SIGKILL`.
- **Problema:** O encerramento da aplicação em deploys é sempre abrupto e demorado, matando conexões ativas de forma violenta em vez de suave.
- **Causa raiz:** As conexões SSE não são registradas em um conjunto de rastreamento para fechamento ativo durante o sinal de desligamento.
- **Impacto:** Deploys lentos e desconexões com erro de rede na interface do usuário durante atualizações de versão.
- **Correção necessária:** Manter registro ativo de todos os streams SSE abertos e, no recebimento de `SIGTERM`, enviar evento de encerramento (`event: shutdown\ndata: closing\n\n`) e fechar as respostas imediatamente com `res.end()` antes de fechar o servidor HTTP.
- **Agente proprietário:** 16
- **Agentes dependentes:** 00 (Aprovação em `server.ts`), 10 (SRE)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O comando de encerramento do servidor finaliza todas as conexões SSE e libera o processo Node em menos de 2 segundos.
- **Teste necessário:** Teste de integração de shutdown com 10 conexões SSE ativas simuladas.
- **Dependências:** Autorização do Agente 00 para edição do `server.ts`.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (workers com BullMQ e integração Temporal para workflows de longa duração).
- **Cobertura automatizada de testes:** Média (testes de enfileiramento presentes, mas faltam testes de simulação de queda de Redis).
- **Segurança:** Alta (comunicação com Redis protegida por senha e isolada em rede privada).
- **Arquitetura:** Alta (separação limpa entre o processo web e o processo de worker).
- **Confiabilidade:** Média (ameaçada pelo re-enfileiramento infinito de WhatsApp e graceful shutdown incompleto).
- **Observabilidade:** Alta (eventos de fila monitorados com contadores de jobs concluídos e falhos).
- **Manutenibilidade:** Alta (código modularizado em `src/lib/queue/`).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Corrigir a lógica de descarte e envio para Dead Letter Queue no worker de WhatsApp (DIV-16-001).
2. **Segurança e integridade de dados:** Não aplicável diretamente ao domínio de workers.
3. **Falhas funcionais:** Refatorar o `circuitGuard.ts` para capturar apenas erros reais de Redis (DIV-16-002).
4. **Confiabilidade:** Implementar encerramento coordenado de streams SSE no `server.ts` (DIV-16-003).
5. **Testes:** Criar testes de estresse de drenagem de fila durante paradas simuladas de container.
6. **Arquitetura:** Parametrizar a concorrência máxima de workers por tipo de job via variáveis de ambiente.
7. **Melhorias estruturais:** Adicionar painel Bull-Board autenticado para monitoramento de filas em tempo real.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-16-001, DIV-16-002)
- **Problemas compartilhados:** 1 (DIV-16-003 compartilhado com 00 e 10)
- **Handoffs necessários:**
  - Handoff para 00: Autorização para implementar encerramento de SSE no `server.ts`.
  - Handoff para 06: Mapeamento de códigos de erro definitivos do Baileys/WhatsApp.
- **Riscos mais importantes:** Loops infinitos de mensagens na fila de WhatsApp podem causar bloqueio da conta empresarial do cliente; shutdowns lentos e forçados com SIGKILL podem interromper transações em andamento.
- **Recomendação final:** Blindar o processamento de mensagens com Dead Letter Queue e ajustar a especificidade de erros no `circuitGuard.ts`.
