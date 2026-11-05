# Relatório de Auditoria de Dívidas Técnicas — Agente 04

## IDENTIFICAÇÃO
- **ID do agente:** 04
- **Nome oficial:** CRM, BI e Analytics
- **Especialização:** Gestão de funil de vendas, pipelines comerciais, cálculo de métricas de BI (receita, ticket médio, conversão, CAC, LTV), agregação de empresas e contatos, e inteligência de vendas (CRM 360)
- **Responsabilidades:** Lógica de negócio de oportunidades de vendas, relatórios de performance comercial, agregações de métricas para dashboards analíticos, consistência de timezone nos fechamentos e modelagem de entidades do ciclo de receita.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/crm/**`, `src/features/analytics/**`, `src/features/companies/**`, `src/features/contacts/**`, `src/features/crm360/**`.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Casos de uso de CRM (`LeadUseCases`, `OpportunityUseCases`), serviços de analytics e agregação de dados, repositórios Prisma de empresas e contatos, módulo analítico CRM 360.
- **Arquivos relevantes:**
  - `src/features/analytics/services/analytics.service.ts`
  - `src/features/companies/services/company.service.ts`
  - `src/features/companies/components/CompanyList.tsx` (789 linhas)
  - `src/features/crm/application/LeadUseCases.ts` (767 linhas)
  - `src/features/crm360/infra/PrismaCrm360Repository.ts` (1205 linhas, sob exceção em `HOTSPOT_EXCEPTIONS.md`)
  - `src/features/analytics/infra/PrismaAnalyticsRepository.ts` (760 linhas)
- **Serviços existentes:** `AnalyticsService`, `CompanyService`, `ContactService`, `Crm360Aggregator`.
- **APIs e integrações:** Endpoints de analytics `/api/analytics/*`, buscas de empresas e contatos, exportações de relatórios gerenciais em CSV/JSON.
- **Funcionalidades implementadas:** Funil de conversão por etapa, velocímetro de metas comerciais, agrupamento por vendedor, histórico de interações com clientes.
- **Testes encontrados:** `tests/unit/analytics.service.test.ts`, `tests/integration/crm360.repository.test.ts`, `tests/unit/company.service.test.ts`.
- **Dependências externas:** PostgreSQL, `@prisma/client`, `date-fns-tz`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-04-001 (DEBT-UX-003)
- **Título:** Serviço de analytics mascara erros de agregação retornando HTTP 200 com métricas zeradas
- **Categoria:** Confiabilidade e Observabilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/analytics/services/analytics.service.ts` (linhas 110-135)
- **Evidência:** O bloco de captura de exceções em `getDashboardMetrics` envolve a consulta SQL em `try/catch` genérico e, ao capturar qualquer erro (incluindo timeout de banco ou falha de conexão), registra apenas `console.error` e retorna um payload com status 200 contendo `{ revenue: 0, dealsWon: 0, conversionRate: 0 }`.
- **Problema:** O dashboard gerencial exibe zeros em todas as métricas financeiras sem informar o gestor de vendas que o banco de dados falhou, dando a falsa impressão de que a empresa não teve faturamento ou vendas no período.
- **Causa raiz:** Padrão defensivo mal planejado para evitar quebra total de renderização da página, violando o princípio global P4 e a regra de "erros visíveis e observáveis" (`AGENTS.md` §32).
- **Impacto:** Decisões gerenciais errôneas baseadas em relatórios fictícios; mascaramento de panes e timeouts no banco de dados analítico.
- **Correção necessária:** Propagar exceção tratada (`AppError.databaseError`) com status HTTP 500 ou retornar payload estruturado contendo status `error: true` para que o frontend renderize estado de erro explícito com botão de re-tentativa (retry).
- **Agente proprietário:** 04
- **Agentes dependentes:** 02 (UX de estados de erro), 10 (SRE e Alertas)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Quando o banco simula timeout, a API responde HTTP 500 com código `METRICS_AGGREGATION_FAILED`, e o dashboard renderiza o card de erro com opção de retry.
- **Teste necessário:** Teste unitário e de integração simulando rejeição de Promise no repositório de analytics e verificando o payload de erro retornado.
- **Dependências:** Nenhuma.

### ID: DIV-04-002 (DEBT-UX-002)
- **Título:** Busca textual full-text de empresas descarta resultados além do primeiro lote sem aviso
- **Categoria:** Funcionalidade e Integridade de Dados
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/companies/services/company.service.ts` (linhas 45-62), `src/features/companies/components/CompanyList.tsx`
- **Evidência:** O método `searchCompanies` executa `findMany` aplicando `take: 50`, mas não calcula a contagem total de registros correspondentes (`count`) nem fornece metadados de cursor ou paginação para os resultados subsequentes.
- **Problema:** Em uma base com 500 empresas correspondentes à busca "Indústria", a aplicação exibe as 50 primeiras e informa visualmente "50 empresas encontradas", ocultando as outras 450 empresas cadastradas sem permitir navegar pelas páginas seguintes.
- **Causa raiz:** Otimização apressada para limitar a resposta da API sem inclusão de paginação paginada ou infinita.
- **Impacto:** Vendedores e analistas comerciais não conseguem localizar empresas existentes no CRM, duplicando cadastros por acharem que a empresa não consta no sistema.
- **Correção necessária:** Adicionar paginação formal na rota (`page`, `pageSize`, `totalCount`, `totalPages`) ou paginação por cursor (`nextCursor`), atualizando a UI para suportar paginação ou scroll infinito.
- **Agente proprietário:** 04
- **Agentes dependentes:** 02 (UX de Listas), 18 (Contratos de API)
- **Complexidade:** Média (1 a 2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Busca por termo genérico retorna o primeiro lote junto com `total: 500`, permitindo navegar e carregar todos os 500 registros.
- **Teste necessário:** Teste automatizado com fixture de 120 empresas comprovando que a paginação alcança todos os itens.
- **Dependências:** Alinhamento com Agente 02.

### ID: DIV-04-003 (DEBT-UX-004)
- **Título:** Agregações financeiras de vendas utilizam fuso horário UTC em vez do fuso canônico de Brasília
- **Categoria:** Regra de Negócio e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/analytics/services/analytics.service.ts` (linhas 85-98)
- **Evidência:** Os filtros temporais de início e fim de mês são gerados com `new Date().toISOString()`, operando em UTC (`Z`).
- **Problema:** Vendas fechadas entre 21h00 e 23h59 no horário de Brasília (UTC-3) no último dia do mês são contabilizadas como faturamento do primeiro dia do mês seguinte no fuso UTC.
- **Causa raiz:** Ausência de conversão explícita de timezone comercial utilizando o fuso canônico da organização (`America/Sao_Paulo`).
- **Impacto:** Divergência entre os relatórios fiscais/contábeis da empresa e as métricas de comissão e metas exibidas no CRM.
- **Correção necessária:** Utilizar utilitários de timezone (`date-fns-tz` com timezone da organização ou padrão `America/Sao_Paulo`) para definir os limites exatos de dia, semana e mês nas queries SQL.
- **Agente proprietário:** 04
- **Agentes dependentes:** 01 (Queries SQL do Prisma)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Venda registrada às 22h00 do dia 31/10 em Brasília é computada integralmente no fechamento de outubro.
- **Teste necessário:** Teste de regressão com dados simulados às 21h01, 22h30 e 23h59 UTC-3 validando a data comercial correta.
- **Dependências:** Nenhuma.

### ID: DIV-04-004
- **Título:** Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts
- **Categoria:** Performance e Arquitetura
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/crm360/infra/PrismaCrm360Repository.ts` (1205 linhas, sob exceção até 30/11/2026)
- **Evidência:** O arquivo ultrapassa o limite de 1000 linhas e realiza joins densos com contatos, atividades, histórico de chamadas e propostas sem paginação eficiente na visualização holística de 360 graus do cliente.
- **Problema:** Abertura da ficha 360 de empresas com extenso histórico de interações gera queries de mais de 1.5 segundo, degradando o tempo de resposta do servidor.
- **Causa raiz:** Agrupamento de todas as consultas da visão 360 em um único método que carrega o grafo completo de dados de uma só vez.
- **Impacto:** Lentidão no atendimento de clientes e alto consumo de CPU no banco de dados relacional.
- **Correção necessária:** Desacoplar as sub-seções da visão 360 (Atividades, Chamadas, Oportunidades) em endpoints e queries assíncronos independentes carregados sob demanda via tabs no frontend.
- **Agente proprietário:** 04
- **Agentes dependentes:** 01 (Índices compostos no Prisma), 02 (UX de carregamento por aba)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P2
- **Critério de aceite:** Tempo de resposta do endpoint inicial da visão 360 inferior a 250ms em empresas com mais de 5.000 atividades registradas.
- **Teste necessário:** Teste de performance e benchmark da query de CRM 360.
- **Dependências:** Alinhamento com Agente 01.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (pipeline comercial, oportunidades, cálculo de métricas e CRM 360 funcionais).
- **Cobertura automatizada de testes:** Média (testes de cálculos unitários presentes, mas testes de timezone e paginação escassos).
- **Segurança:** Alta (isolamento estrito de oportunidades e empresas por tenant).
- **Arquitetura:** Média (comprometida pelo tamanho monolítico de `PrismaCrm360Repository.ts`).
- **Confiabilidade:** Média (reduzida pelo retorno enganoso de métricas zeradas em panes).
- **Observabilidade:** Baixa (falhas em cálculos analíticos são suprimidas silenciosamente).
- **Manutenibilidade:** Média (código de agregação complexo e altamente acoplado).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Remover a supressão de erros em `analytics.service.ts` e implementar estado de erro observável (DIV-04-001).
2. **Segurança e integridade de dados:** Não aplicável (isolamento de tenant validado).
3. **Falhas funcionais:** Implementar suporte a paginação completa na busca textual de empresas (DIV-04-002).
4. **Confiabilidade:** Alinhar timezone dos relatórios de vendas para `America/Sao_Paulo` (DIV-04-003).
5. **Testes:** Criar testes de regressão com horários de borda no encerramento de mês.
6. **Arquitetura:** Decompor `PrismaCrm360Repository.ts` em repositórios especializados de sub-entidades.
7. **Melhorias estruturais:** Adicionar cache com revalidação rápida para dashboards gerenciais consolidados.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 3 Médias, 0 Baixas
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-04-001, DIV-04-002, DIV-04-003)
- **Problemas compartilhados:** 1 (DIV-04-004 compartilhado com 01 e 02)
- **Handoffs necessários:**
  - Handoff para 01: Criação de índices compostos para histórico de atividades na visão CRM 360.
- **Riscos mais importantes:** Retorno de zeros em vez de erro em panes analíticas induz a liderança a tomar decisões sobre relatórios fictícios; fechamento de vendas em UTC causa inconsistência com comissões contábeis.
- **Recomendação final:** Eliminar imediatamente o fallback silencioso para zeros em `analytics.service.ts`.
