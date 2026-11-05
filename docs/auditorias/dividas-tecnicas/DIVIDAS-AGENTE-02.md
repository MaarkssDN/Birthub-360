# Relatório de Auditoria de Dívidas Técnicas — Agente 02

## IDENTIFICAÇÃO
- **ID do agente:** 02
- **Nome oficial:** Produto e UX
- **Especialização:** Experiência do usuário (UX), fluxos funcionais de CRM, hierarquia de telas, navegação principal, integridade de componentes de apresentação e prevenção de dados cenográficos
- **Responsabilidades:** Propriedade exclusiva de `src/App.tsx`, navegação principal e `Sidebar` (`AGENTS.md` §15), garantia de que todos os elementos visuais representem dados reais e persistentes, alinhamento de fluxos de jornada do usuário e consistência funcional no CRM.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/App.tsx`, `src/components/layout/**`, `src/components/CrmBoard.tsx`, `src/features/crm/**`, `src/features/dashboard/**`, `src/features/notifications/**`.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Shell de aplicação, navegação global (`Sidebar`, `Header`), painéis do CRM (Kanban, Listas de Negócios e Leads), drawer de detalhes do lead, centrais de notificações.
- **Arquivos relevantes:**
  - `src/App.tsx` (716 linhas, hotspot monitorado)
  - `src/components/CrmBoard.tsx` (1258 linhas, sob exceção em `HOTSPOT_EXCEPTIONS.md`)
  - `src/components/layout/Sidebar.tsx`
  - `src/features/crm/components/LeadDetailDrawer.tsx` (1024 linhas)
  - `src/features/dashboard/components/SinglePageDashboard.tsx` (961 linhas)
  - `src/features/notifications/components/NotificationCenter.tsx`
- **Serviços existentes:** Gerenciamento de rotas e providers, sincronização de estado do Kanban via React Query, handlers de drag-and-drop.
- **APIs e integrações:** Consumo de APIs REST de Leads, Oportunidades, Notificações e Configurações de Usuário.
- **Funcionalidades implementadas:** Gestão visual de pipelines de vendas, drag-and-drop de estágios no Kanban, filtros avançados de equipe, painel de notificações in-app.
- **Testes encontrados:** `tests/unit/components/CrmBoard.test.tsx`, `tests/e2e/crm-navigation.spec.ts`, `tests/unit/components/Sidebar.test.tsx`.
- **Dependências externas:** `@tanstack/react-query`, `lucide-react`, `framer-motion`, `@hello-pangea/dnd` ou similar.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-02-001 (DEBT-NOT-001)
- **Título:** Leitura de notificação broadcast em entidade compartilhada silencia unread para colegas de equipe
- **Categoria:** Funcionalidade e UX
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/notifications/**`, `src/features/notifications/services/notification.service.ts`
- **Evidência:** Quando um alerta global de sistema é enviado para a organização, ele é registrado em uma linha compartilhada na tabela de notificações com a flag `read: boolean`. Quando o primeiro usuário da empresa clica para abrir a notificação, a flag `read` é alterada para `true`, fazendo com que a notificação desapareça do badge de alertas não lidos de todos os outros colaboradores da equipe.
- **Problema:** Modelo de notificação trata alertas broadcast com estado de leitura global em vez de estado de leitura individual por usuário (`NotificationReadReceipt`).
- **Causa raiz:** Simplificação de modelagem inicial onde notificações organizacionais não foram desacopladas do status de leitura por usuário.
- **Impacto:** Usuários e vendedores perdem avisos importantes da plataforma (manutenções, metas atingidas, novos leads compartilhados) porque outro colega já visualizou a notificação previamente.
- **Correção necessária:** Criar tabela/relação `NotificationReceipt (notificationId, userId, readAt)` para que a leitura de um alerta organizacional seja rastreada estritamente por usuário individual.
- **Agente proprietário:** 02
- **Agentes dependentes:** 01 (Schema Prisma), 18 (Contratos de API)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Usuário A marca notificação como lida; usuário B acessa a plataforma e a notificação permanece indicada com badge e status "não lida".
- **Teste necessário:** Teste E2E multi-usuário simulando dois colaboradores da mesma organização visualizando alertas simultaneamente.
- **Dependências:** Alinhamento de schema com Agente 01.

### ID: DIV-02-002
- **Título:** Hotspot estrutural no componente central CrmBoard.tsx acumulando múltiplas responsabilidades
- **Categoria:** Arquitetura de Frontend e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/components/CrmBoard.tsx` (1258 linhas)
- **Evidência:** O arquivo `src/components/CrmBoard.tsx` possui 1258 linhas de código, mantido sob exceção temporária em `HOTSPOT_EXCEPTIONS.md` (limite máximo 1300 linhas, com prazo de reavaliação até 30/11/2026).
- **Problema:** O componente acumula lógica de renderização do quadro Kanban, cálculo em tempo real de totais de receita por coluna, modais de criação rápida de oportunidades, polling de atualização, filtros de data e regras de permissão de arrastar cards.
- **Causa raiz:** O crescimento orgânico das funcionalidades do CRM foi concentrado no componente de entrada do Kanban sem extração de hooks de controle e sub-componentes especializados.
- **Impacto:** Dificuldade em debugar problemas de renderização e re-renders desnecessários em toda a tela ao arrastar um único lead; risco permanente de regressões visuais e quebra de testes unitários.
- **Correção necessária:** Decompor `CrmBoard.tsx` em:
  - `useCrmKanban.ts` (lógica de estado e mutações de drag-and-drop);
  - `KanbanColumn.tsx` (renderização e totalizadores de cada coluna);
  - `KanbanCard.tsx` (cartão de oportunidade com tags e avatares);
  - `KanbanFilterBar.tsx` (barra de filtros e ações rápidas).
- **Agente proprietário:** 02
- **Agentes dependentes:** 03 (Design System), 08 (Testes visuais)
- **Complexidade:** Grande (3 a 4 dias)
- **Prioridade:** P1
- **Critério de aceite:** `CrmBoard.tsx` passa a ter menos de 300 linhas e atua exclusivamente como orquestrador visual dos sub-componentes; 100% dos testes unitários e E2E de CRM continuam verdes.
- **Teste necessário:** Execução de testes de integração do Kanban (`tests/unit/components/CrmBoard.test.tsx`) e Playwright E2E.
- **Dependências:** Nenhuma.

### ID: DIV-02-003
- **Título:** Acoplamento excessivo e orquestração de side-effects em src/App.tsx
- **Categoria:** Arquitetura de Frontend
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/App.tsx` (716 linhas)
- **Evidência:** `src/App.tsx` ultrapassa o limite de 700 linhas, contendo registro manual de mais de 40 rotas, listeners de deep link do Capacitor mobile, interceptores de erros globais e instâncias de clientes WebSocket.
- **Problema:** O ponto de montagem do React está sobrecarregado com regras de negócios específicas de mobile e notificações em tempo real.
- **Causa raiz:** Falta de um router dedicado desacoplado do arquivo principal de montagem da aplicação.
- **Impacto:** Lentidão no carregamento inicial da aplicação (cold boot) e dificuldade de gerenciar code-splitting / lazy loading de páginas menos utilizadas.
- **Correção necessária:** Extrair o roteamento para `src/routes/AppRoutes.tsx` com `React.lazy` e mover inicializadores de sockets e mobile para providers específicos em `src/bootstrap/`.
- **Agente proprietário:** 02
- **Agentes dependentes:** 09 (Mobile), 08 (QA de carregamento)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** `src/App.tsx` reduzido para menos de 150 linhas; rotas carregadas sob demanda via chunks otimizados.
- **Teste necessário:** Teste de regressão de rotas e verificação de bundle budget (`npm run check:bundle-budget`).
- **Dependências:** Validação com Agente 09 para deep links.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (CRM completo, com Kanban, visões de lista e drawer de leads funcionando).
- **Cobertura automatizada de testes:** Alta (testes unitários com Vitest e testes E2E cobrindo o fluxo de vendas).
- **Segurança:** Alta (controle de permissão de visualização e filtros de tenant respeitados no frontend).
- **Arquitetura:** Média (prejudicada por monólitos em `CrmBoard.tsx` e `App.tsx`).
- **Confiabilidade:** Alta (tratamento robusto de drag-and-drop com rollback otimista).
- **Observabilidade:** Alta (erros de frontend capturados por Error Boundaries).
- **Manutenibilidade:** Média (alta densidade de linhas em arquivos centrais aumenta o custo de mudanças).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 registrado no domínio de UX.
2. **Segurança e integridade de dados:** Corrigir a persistência de leitura de notificações por usuário (DIV-02-001).
3. **Falhas funcionais:** Refatorar o Kanban (`CrmBoard.tsx`) extraindo hooks e sub-componentes.
4. **Confiabilidade:** Implementar lazy-loading em todas as páginas secundárias no `App.tsx`.
5. **Testes:** Criar testes de regressão específicos para o drag-and-drop entre diferentes colunas.
6. **Arquitetura:** Modularizar a árvore de rotas em `src/routes/`.
7. **Melhorias estruturais:** Implementar skeleton screens refinados em todos os cards de CRM.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-02-002, DIV-02-003)
- **Problemas compartilhados:** 1 (DIV-02-001 compartilhado com 01 e 18)
- **Handoffs necessários:**
  - Handoff para 01: Criação da tabela `NotificationReceipt` no schema Prisma.
- **Riscos mais importantes:** A complexidade monolítica de `CrmBoard.tsx` (1258 linhas) representa o maior risco de bugs em novas iterações comerciais do CRM; broadcast de notificações silenciado prejudica a comunicação interna da equipe.
- **Recomendação final:** Iniciar imediatamente a quebra do `CrmBoard.tsx` em submódulos antes da expiração da exceção em 30/11/2026.
