# Relatório de Auditoria de Dívidas Técnicas — Agente 17

## IDENTIFICAÇÃO
- **ID do agente:** 17
- **Nome oficial:** Cadência Multicanal e Ciclo de Receita
- **Especialização:** Máquina de cadência de vendas multicanal (E-mail, WhatsApp, Chamadas Telefônicas, Tarefas de SDR), esteiras de nutrição comercial, esteira de RevOps, dispatchers de execução de mensagens e orquestração de follow-up
- **Responsabilidades:** Automação de réguas de relacionamento com leads, agendamento de passos de contato, controle de cadências ativas/pausadas, resolução de variáveis de template (`{{nome}}`, `{{empresa}}`) e garantia de que mensagens sejam enviadas apenas dentro de horários comerciais adequados e respeitando preferências de contato.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/cadence/**`, `src/features/sales-orchestration/**`, dispatchers de mensagens automáticas e regras de transição de status de lead.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Motor de cadência, construtor de réguas de contato (`CadenceBuilder`), despachador de mensagens (`CadenceDispatcher`), resolvedor de templates de mensagem e histórico de execuções.
- **Arquivos relevantes:**
  - `src/features/cadence/services/cadenceExecution.service.ts`
  - `src/features/cadence/services/cadenceDispatcher.ts`
  - `src/features/cadence/routes/cadence.routes.ts`
  - `src/features/sales-orchestration/services/salesOrchestration.service.ts`
  - `src/features/cadence/dialer/application/services/dialerService.ts`
- **Serviços existentes:** `CadenceExecutionService`, `TemplateCompilerService`, `CadenceScheduler`, `SalesOrchestrator`.
- **APIs e integrações:** Conectores de envio com WhatsApp (Agente 06), E-mail (Agente 05) e Discador (Agente 12).
- **Funcionalidades implementadas:** Criação de sequências multi-etapas com intervalos de dias/horas, transição automática para fase seguinte após resposta do lead, cancelamento de cadência quando o negócio é ganho ou perdido.
- **Testes encontrados:** `tests/integration/cadence-dispatcher.test.ts`, `tests/unit/cadence.service.test.ts`.
- **Dependências externas:** BullMQ (filas de agendamento), `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-17-001 (DEBT-CAD-001)
- **Título:** API permite cadastrar passos de cadência sem corpo de mensagem e dispatcher envia placeholders cruas para leads reais
- **Categoria:** Regra de Negócio e Qualidade Comercial
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/cadence/routes/cadence.routes.ts` (linhas 85-115), `src/features/cadence/services/cadenceDispatcher.ts` (linhas 130-155)
- **Evidência:** O schema Zod de validação de criação de passos de cadência define o campo `templateBody` como opcional (`z.string().optional()`). Quando um usuário salva um passo sem preencher o texto da mensagem, o despachador assíncrono utiliza um texto de fallback genérico:
  `"Olá {{lead.name}}, temos uma oportunidade para sua empresa."`
  Caso o lead não possua nome cadastrado, a mensagem enviada pelo WhatsApp/E-mail sai literalmente com a string de template não resolvida: `"Olá {{lead.name}}..."`.
- **Problema:** Disparo de mensagens amadoras contendo tags de template não substituídas para clientes e prospects reais da empresa.
- **Causa raiz:** Validação frouxa no endpoint de cadastro de cadência e fallback inadequado no compilador de templates.
- **Impacto:** Dano severo à imagem profissional da organização cliente; quebra de confiança no produto; taxa de resposta negativa de prospects.
- **Correção necessária:** Tornar o corpo da mensagem (`templateBody`) estritamente obrigatório com validação de tamanho mínimo (pelo menos 10 caracteres) e implementar validação rígida no dispatcher abortando o envio com erro observável `TEMPLATE_VARIABLES_UNRESOLVED` se alguma variável não puder ser substituída por dados reais.
- **Agente proprietário:** 17
- **Agentes dependentes:** 18 (Contratos de API), 02 (UX de Construtor de Cadência)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Tentativa de criar passo sem texto de mensagem é rejeitada com HTTP 400; mensagem com variável ausente é pausada para revisão manual do SDR sem ser enviada com chaves cruas.
- **Teste necessário:** Teste unitário de compilação de template com variáveis ausentes e teste de validação de rota Zod.
- **Dependências:** Nenhuma.

### ID: DIV-17-002
- **Título:** Ausência de controle de janela de horário comercial permitido em dispatchers automáticos de cadência
- **Categoria:** Conformidade e Regra de Negócio
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/cadence/services/cadenceDispatcher.ts` (linhas 60-90)
- **Evidência:** O processador de tarefas da fila de cadência despacha mensagens de WhatsApp e e-mails imediatamente no momento em que o job vence (ex.: agendado para 2 horas após a última interação). Se um lead respondeu às 22h00, o passo seguinte pode ser disparado às 00h00 da madrugada.
- **Problema:** Envio de mensagens comerciais de prospecção durante a noite, madrugada ou finais de semana, gerando revolta nos prospects e violação das diretrizes de uso do WhatsApp Business.
- **Causa raiz:** O agendador calcula o delay puramente em horas corridas sem considerar horário comercial (`workingHoursWindow`) e timezone local do lead.
- **Impacto:** Risco iminente de denúncias de spam por usuários, com consequente banimento de números de telefone e contas de e-mail da empresa.
- **Correção necessária:** Adicionar trava de horário comercial configurável por organização (padrão: 08:30 às 18:30 em dias úteis, fuso do lead ou da empresa). Se a mensagem vencer fora dessa janela, o job é automaticamente re-agendado para o próximo horário comercial útil (ex.: 08:30 do próximo dia útil).
- **Agente proprietário:** 17
- **Agentes dependentes:** 16 (Workers e Filas), 06 (Integração WhatsApp)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** Mensagem cujo passo vença às 23h00 é re-agendada e só despachada às 08:30 do dia seguinte.
- **Teste necessário:** Teste unitário do agendador com simulação de horários noturnos, finais de semana e feriados.
- **Dependências:** Nenhuma.

### ID: DIV-17-003
- **Título:** Ausência de verificação em lote de opt-out no momento do início da cadência
- **Categoria:** Privacidade e LGPD
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/cadence/services/cadenceExecution.service.ts` (linhas 110-140)
- **Evidência:** A verificação de se o contato pediu exclusão (opt-out) só é executada no instante final de cada envio individual. Ao associar 500 leads a uma cadência, todos são enfileirados indiscriminadamente.
- **Problema:** Desperdício de recursos de banco e fila com milhares de jobs agendados para contatos que já estão suprimidos na plataforma.
- **Causa raiz:** Falta de filtro prévio na etapa de associação de leads à régua comercial.
- **Impacto:** Sobrecarga desnecessária na fila do BullMQ e relatórios de cadência distorcidos com leads inelegíveis.
- **Correção necessária:** Filtrar os leads através de query `WHERE NOT EXISTS (SELECT 1 FROM OptOutRecord ...)` antes de criar a esteira de passos no banco de dados.
- **Agente proprietário:** 17
- **Agentes dependentes:** 21 (LGPD), 01 (Banco de Dados)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Associação de lista contendo contatos em opt-out cadastra estritamente apenas os contatos elegíveis, notificando o usuário sobre os registros suprimidos.
- **Teste necessário:** Teste de integração de início de cadência com lista mista de leads válidos e suprimidos.
- **Dependências:** Alinhamento com Agente 21.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (construtor de réguas de cadência, disparo multicanal e métricas implementados).
- **Cobertura automatizada de testes:** Média (testes de fluxo feliz existem, mas faltam testes de horários e templates com falha).
- **Segurança:** Alta (respeita isolamento de tenant em todos os envios).
- **Arquitetura:** Alta (modularização clara entre definição de cadência e despacho assíncrono).
- **Confiabilidade:** Média (ameaçada pelo envio de mensagens fora de horário comercial e variáveis cruas).
- **Observabilidade:** Alta (histórico de envios e status de entrega por passo registrados).
- **Manutenibilidade:** Alta (código de serviços bem estruturado).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Impedir passos com corpo vazio e bloquear envio de templates com variáveis não resolvidas (DIV-17-001).
2. **Segurança e integridade de dados:** Não aplicável.
3. **Falhas funcionais:** Implementar janela de horário comercial obrigatória para mensagens de cadência (DIV-17-002).
4. **Confiabilidade:** Filtrar leads em opt-out no momento de início da cadência (DIV-17-003).
5. **Testes:** Criar testes parametrizados para o calculador de janelas de horário útil.
6. **Arquitetura:** Padronizar templates em componentes reutilizáveis.
7. **Melhorias estruturais:** Adicionar métricas de taxa de abertura e resposta por passo no funil de vendas.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-17-001, DIV-17-002)
- **Problemas compartilhados:** 1 (DIV-17-003 compartilhado com 21 e 01)
- **Handoffs necessários:**
  - Handoff para 21: Validação das regras de supressão no agendamento de cadências.
- **Riscos mais importantes:** O envio de mensagens com tags de variáveis cruas destrói a reputação comercial da marca; o acionamento de prospects na madrugada por falta de trava de horário comercial pode levar a banimento de números no WhatsApp.
- **Recomendação final:** Blindar o compilador de templates e implementar o filtro de horário comercial imediatamente.
