# INVENTÁRIO FUNCIONAL DETALHADO DOS 11 MÓDULOS (ENTREGA 02)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documento de Referência:** Documento Mestre Oficial V4 Consolidado  
**Data:** 10 de Novembro de 2026  
**Status:** ESPECIFICAÇÃO TÉCNICA E FUNCIONAL INTEGRAL (Fase 01 Homologada)

---

## SUMÁRIO DOS MÓDULOS

1. [MÓDULO 01 — Hub Comercial (Pilar 01 · Orbit)](#módulo-01--hub-comercial-pilar-01--orbit)
2. [MÓDULO 02 — Inteligência de Mercado (Pilar 02 · Nexus)](#módulo-02--inteligência-de-mercado-pilar-02--nexus)
3. [MÓDULO 03 — Orquestração de Vendas (Pilar 03 · Aria)](#módulo-03--orquestração-de-vendas-pilar-03--aria)
4. [MÓDULO 04 — Performance Comercial (Pilar 04 · Vanguard)](#módulo-04--performance-comercial-pilar-04--vanguard)
5. [MÓDULO 05 — Previsibilidade Comercial (Pilar 05 · Oracle)](#módulo-05--previsibilidade-comercial-pilar-05--oracle)
6. [MÓDULO 06 — Inteligência Artificial (Pilar 06 · Core)](#módulo-06--inteligência-artificial-pilar-06--core)
7. [MÓDULO 07 — Automação & Conectividade (Pilar 07 · Spark)](#módulo-07--automação--conectividade-pilar-07--spark)
8. [MÓDULO 08 — Engajamento Comercial (Pilar 08 · Echo)](#módulo-08--engajamento-comercial-pilar-08--echo)
9. [MÓDULO 09 — Admin & Operations (Fundação · Sudo)](#módulo-09--admin--operations-fundação--sudo)
10. [MÓDULO 10 — Mobile & Field Sales (Mobilidade)](#módulo-10--mobile--field-sales-mobilidade)
11. [MÓDULO 11 — Social Selling (Expansão de Canais)](#módulo-11--social-selling-expansão-de-canais)

---

## MÓDULO 01 — Hub Comercial (Pilar 01 · Orbit)
- **ID Canônico:** `MOD-01-HUB-COMERCIAL`
- **Avatar Institucional:** Orbit (Guardião do CRM & Giroscópio Gravitacional)
- **Tag:** `PILAR 01 · CORE REVENUE`
- **Cromática Primária:** Dourado Neon (`#FFC107`) + Azul Neon (`#00D4FF`)
- **Rotas:** `/app/crm`, `/app/crm360`, `/app/propostas`, `/app/companies`, `/app/contacts`, `/app/activities`, `/app/workspace`, `/api/leads/:id/notes`, `/api/leads/:id/attachments`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Centralizar a visão 360° de entidades comerciais (Leads, Contas, Contatos, Oportunidades e Atividades), servindo como repositório de verdade transacional sobre o qual todo o ecossistema e enxame de IA operam, eliminando silos e dados obsoletos.
- **Problemas Resolvidos:** Dispersão de informações em planilhas, falta de histórico de interações, atrito na passagem de bastão entre pré-vendas e vendas, propostas comerciais sem rastreamento de versão e alçada.
- **Público-Alvo & Perfis Autorizados:** SDRs, BDRs, Closers, Account Executives, Gestores Comerciais, RevOps e Diretoria.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Redução do tempo de atualização cadastral em 65%.
  - Zero negócios duplicados ou sem dono ativo (`assignedToId`).
  - 100% das propostas com log de auditoria e cálculo de margem validado.
  - Indicadores: Taxa de conversão por estágio, Tempo médio no funil (Deal Velocity), Índice de integridade de dados (CRM Health > 90%).

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `Pipeline Kanban Interativo`: Visualização de colunas por estágio, arrastar-e-soltar acessível via `@dnd-kit`, cálculo dinâmico de valor total por estágio, ordenação adaptativa por probabilidade ponderada.
  2. `Ficha Cadastral 360° (Lead / Company / Contact)`: Linha do tempo unificada de eventos, histórico de comunicações (WhatsApp, E-mail, Reunião, Ligação), notas internas com menções `@usuário`, anexos com escaneamento antivírus.
  3. `Gerador & Gestor de Propostas Comerciais`: Criação de propostas em múltiplos templates, cálculo de impostos e recorrência (MRR/ARR), controle de descontos com travas de margem por alçada, exportação em PDF assinado.
  4. `Mesa de Atividades & Calendário Integrado`: Agendamento de reuniões sincronizado com Google Calendar/Outlook, controle de SLA de primeiro contato, tarefas sugeridas por agentes de IA.
- **Componentes de UI:** `CrmBoard.tsx`, `CrmOverview.tsx`, `LeadCard.tsx`, `PropostasList.tsx`, `PropostaFormModal.tsx`, `CompanyTimeline.tsx`, `ActivityScheduler.tsx`.
- **Estados de Interface:** Loading (esqueleto pulsante neon), Empty (ilustração do Orbit com CTA "Criar primeiro lead"), Error (alerta de desconexão com retry automático), Stale (indicador de dados em sincronização em background).
- **Entradas & Saídas:** Recebe leads de prospecção, formulários públicos e Bitrix24; exporta dados para relatórios analíticos, forecast e cadência de engajamento.

### C. Operação
- **Jornada Principal:** Criação de lead qualificado → Associação à Empresa → Agendamento de Reunião → Criação de Proposta → Movimentação no Kanban para "Negociação" → Fechamento "Ganho".
- **Fluxos Alternativos:** Perda do negócio com preenchimento obrigatório de motivo de perda padronizado (Loss Taxonomy) → Gatilho para Autópsia de Win/Loss.
- **Validações & Alçadas:** Descontos acima de 15% exigem aprovação sênior (`manager-commercial`); descontos acima de 25% exigem validação de Diretoria (`executive-director`).

### D. Inteligência Artificial
- **Agentes Integrados:** Orbit (Avatar UI), `closer-sales`, `crm.agent`, `promise-guardian`.
- **Capacidades Autorizadas:** Leitura de notas de reuniões para extrair próximos passos automáticos; sugestão de probabilidade de fechamento baseada no histórico da conta; detecção de promessas de entrega não cumpridas.
- **Limites de Autonomia:** Agentes sugerem tarefas e campos; NUNCA movem deal para "Ganho" ou aplicam descontos sem confirmação humana explícita.

### E. Requisitos Técnicos
- **Entidades de Dados:** `Lead`, `Company`, `Contact`, `Deal`, `Pipeline`, `Stage`, `Activity`, `Proposal`, `ProposalItem`.
- **APIs & Rotas:** `GET /api/leads`, `POST /api/leads`, `PATCH /api/leads/:id/stage`, `POST /api/proposals`, `GET /api/companies/:id/timeline`.
- **Eventos Emitidos:** `crm.deal.created`, `crm.deal.stage_changed`, `crm.deal.won`, `crm.deal.lost`, `crm.proposal.issued`.

### F. Homologação (Critérios de Aceite)
- `AC-HUB-001`: O pipeline deve permitir mover deals entre estágios persistindo a alteração no banco e emitindo o evento `crm.deal.stage_changed` em menos de 250ms.
- `AC-HUB-002`: Propostas comerciais com desconto superior à alçada do vendedor devem bloquear o envio e entrar no estado `PENDING_APPROVAL`.
- `AC-HUB-003`: Não deve ser permitida a criação de leads sem `organizationId` ou sem preenchimento dos campos obrigatórios (nome, contato primário).

---

## MÓDULO 02 — Inteligência de Mercado (Pilar 02 · Nexus)
- **ID Canônico:** `MOD-02-INTELIGENCIA-MERCADO`
- **Avatar Institucional:** Nexus (Prisma Hexagonal & Analista de Mercado)
- **Tag:** `PILAR 02 · MARKET DISCOVERY`
- **Cromática Primária:** Azul Neon (`#00D4FF`) + Ciano Quântico (`#38BDF8`)
- **Rotas:** `/app/prospect`, `/app/prospect/inteligente`, `/app/market-intelligence`, `/app/market-intelligence/hub`, `/app/market-intelligence/accounts/:id`, `/app/market-intelligence/deck`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Fornecer um motor de descoberta e enriquecimento multi-fonte em tempo real para encontrar empresas com real propensão de compra (ICP fit), identificando decisores com dados validados e minimizando o tempo de pesquisa do time comercial.
- **Problemas Resolvidos:** Prospecção às cegas, perda de tempo com dados societários desatualizados, e-mails inválidos com alto bounce rate, falta de inteligência sobre o momento da conta (contratações, tecnologias em uso).
- **Público-Alvo & Perfis Autorizados:** BDRs, SDRs, Analistas de Mercado, Gestores Comerciais e RevOps.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Redução de 80% no tempo de montagem de listas de prospecção.
  - Taxa de bounce de e-mails corporativos inferior a 4%.
  - Indicadores: Volume de contas enriquecidas por mês, Acurácia de decisores mapeados, Índice de Fit ICP médio (> 80/100).

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `ProspectingHub Multi-Fonte`: Barramento unificado que consome 7 provedores autoritativos (Receita Federal/CNPJ, Apollo.io, Hunter.io, Google Places, LinkedIn, GitHub e News/RSS).
  2. `Dossiê Executivo de 10 Seções`: Montagem automática de sumário com identificação, quadro societário (QSA), faturamento estimado, CNAE primário/secundário, tecnologias detectadas e riscos jurídicos.
  3. `Gerador de Deck de Aprovação`: Apresentação estruturada e visual da conta para avaliação de viabilidade estratégica antes do início do outbound.
  4. `Scoring de Fit ICP Automático`: Algoritmo que compara a empresa prospectada com a matriz ideal de clientes do tenant (tamanho, setor, faturamento, geografia).
- **Componentes de UI:** `ProspectingHub.tsx`, `MarketIntelligenceHub.tsx`, `AccountDossierView.tsx`, `CnpjTurboSearch.tsx`, `IcpFitMeter.tsx`, `ExecutiveDeckGenerator.tsx`.
- **Estados de Interface:** Loading (radar neon escaneando provedores), Empty (sem filtros aplicados), Stale (dados de scraping com mais de 30 dias com botão "Re-enriquecer").

### C. Operação
- **Jornada Principal:** Inserção de CNPJ ou domínio web → Consulta em cascata aos conectores → Fusão e deduplicação de registros → Cálculo de ICP Fit → Emissão do Dossiê 360° → Exportação para o Hub Comercial.
- **Falhas & Recuperação:** Fallback inteligente em caso de timeout de uma API externa (ex: se Apollo oscilar, usa cache local de Hunter/CNPJ e marca campo com badge `FONTE_PARCIAL`).

### D. Inteligência Artificial
- **Agentes Integrados:** Nexus (Avatar UI), `account-detective`, `ldr-intelligence`, `bdr-outbound`.
- **Capacidades Autorizadas:** Análise semântica de notícias recentes da empresa-alvo para detectar "sinais de compra" (ex: captação de rodada, expansão de fábrica, nova diretoria); estruturação do organograma de tomadores de decisão.
- **Limites de Autonomia:** Busca e enriquecimento são 100% autônomos dentro do limite de créditos da organização; exportação massiva para campanhas ativas exige clique humano.

### E. Requisitos Técnicos
- **Entidades de Dados:** `ProspectAccount`, `CompanyEnrichment`, `DecisionMaker`, `IcpProfile`, `EnrichmentLog`, `MarketSignal`.
- **APIs & Rotas:** `POST /api/prospect/enrich`, `GET /api/market-intelligence/accounts/:id`, `POST /api/prospect/deck/generate`.
- **Eventos Emitidos:** `market.account.discovered`, `market.account.enriched`, `market.icp.scored`.

### F. Homologação (Critérios de Aceite)
- `AC-MKT-001`: Consulta de CNPJ válido deve retornar razão social, CNAE, endereço e quadro de sócios em menos de 2 segundos utilizando cache inteligente.
- `AC-MKT-002`: Nenhum enriquecimento de dados pessoais deve violar a LGPD; e-mails e telefones de pessoas físicas não-decisórias devem ser descartados ou anonimizados.
- `AC-MKT-003`: O consumo de créditos em APIs pagas de enriquecimento deve ser debitado no ledger de quotas do tenant antes da execução da chamada externa.

---

## MÓDULO 03 — Orquestração de Vendas (Pilar 03 · Aria)
- **ID Canônico:** `MOD-03-ORQUESTRACAO-VENDAS`
- **Avatar Institucional:** Aria (Maestrina de Fluxos & Fita Harmônica de Möbius)
- **Tag:** `PILAR 03 · SALES CADENCE`
- **Cromática Primária:** Verde Esmeralda Neon (`#10B981`) + Azul Neon (`#00D4FF`)
- **Rotas:** `/app/cadence`, `/app/daily-plan`, `/app/mesa-tratamento`, `/app/playbooks`, `/app/jornadas`, `/app/processos`, `/app/roteiros`, `/app/qualification_matrix`, `/app/objections_matrix`, `/app/roleplay`, `/app/topic_training`, `/app/chatbook`, `/app/editor`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Transformar o playbook de vendas em execução disciplinada no dia a dia do vendedor através de um motor multicanal de cadências, fila diária priorizada, mesa de triagem e simulador de roleplay com IA.
- **Problemas Resolvidos:** Esquecimento de follow-up, cadências genéricas sem personalização, falta de preparo para contornar objeções técnicas, vendedores executando fora da metodologia homologada.
- **Público-Alvo & Perfis Autorizados:** SDRs, BDRs, Closers, Treinadores de Vendas e Gestores Comerciais.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Aumento de 40% na taxa de resposta em cadências estruturadas.
  - Eliminação de atrasos em tarefas diárias de contato (`overdue tasks` < 5%).
  - Indicadores: Taxa de abertura de e-mail, Taxa de conversão de cadência para reunião, Nota média de vendedores no Roleplay (> 85/100).

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `CadenceHub (Motor de Cadências)`: Sequências multicanais (E-mail, WhatsApp, Ligação, LinkedIn, Tarefa Customizada), agendamento em horário útil comercial, intervalos dinâmicos com pausas configuráveis.
  2. `Mesa de Tratamento (Triagem Rápida)`: Fila de priorização de leads que responderam ou executaram ações de alto sinal, sugestão imediata da melhor abordagem de resposta com IA.
  3. `Plano Diário & Calendário Operacional`: Lista priorizada por score de urgência e valor potencial para o vendedor executar em fluxo contínuo.
  4. `Sales Academy & Simulador de Roleplay`: Módulo interativo de treinamento onde a IA assume o papel do comprador com persona difícil, avaliando aderência aos critérios SPIN/BANT e contorno de objeções.
- **Componentes de UI:** `CadenceHub.tsx`, `DailyPlanView.tsx`, `MesaTratamento.tsx`, `RoleplaySimulator.tsx`, `ObjectionsMatrixModal.tsx`, `PlaybookViewer.tsx`.
- **Estados de Interface:** Executando passo, Aguardando intervalo de cadência, Pausado por resposta do lead (`Auto-Stop on Reply`), Finalizado.

### C. Operação
- **Jornada Principal:** Inclusão de lead em cadência → Disparo do Passo 1 (E-mail) → Aguardo de 2 dias → Disparo do Passo 2 (WhatsApp) → Lead responde → Motor de cadência pausa automaticamente a sequência e joga o lead na Mesa de Tratamento do SDR.
- **Governança & Opt-out:** Respeito absoluto a solicitações de parada ("Descadastrar", "Não tenho interesse", "Stop"), aplicando supressão automática no domínio e telefone.

### D. Inteligência Artificial
- **Agentes Integrados:** Aria (Avatar UI), `sdr-qualification`, `bdr-outbound`, `learning.agent`.
- **Capacidades Autorizadas:** Ajuste dinâmico do tom de voz e do corpo da mensagem baseado no perfil do decisor; avaliação em tempo real do áudio/texto no Roleplay emitindo feedback por scorecard.
- **Limites de Autonomia:** Mensagens automáticas só são enviadas se a cadência estiver marcada como "Modo Totalmente Autônomo"; por padrão, exigem clique de confirmação do vendedor.

### E. Requisitos Técnicos
- **Entidades de Dados:** `Cadence`, `CadenceStep`, `CadenceEnrollment`, `DailyTask`, `Playbook`, `ObjectionMatrix`, `RoleplaySession`.
- **APIs & Rotas:** `POST /api/cadences/:id/enroll`, `POST /api/cadences/steps/:id/execute`, `POST /api/roleplay/start`, `GET /api/daily-plan`.
- **Eventos Emitidos:** `cadence.step.executed`, `cadence.lead.replied`, `cadence.opt_out.received`, `roleplay.session.completed`.

### F. Homologação (Critérios de Aceite)
- `AC-ORQ-001`: Quando um lead responde a um e-mail ou WhatsApp de cadência, o motor DEVE pausar imediatamente a inscrição para evitar envios embaraçosos subsequentes.
- `AC-ORQ-002`: A lista do Plano Diário deve respeitar o fuso horário da organização e do lead, impedindo disparos automáticos fora da janela de horário comercial permitida (08h às 19h).
- `AC-ORQ-003`: O Roleplay deve emitir nota fundamentada por rubrica em menos de 5 segundos após a finalização da simulação.

---

## MÓDULO 04 — Performance Comercial (Pilar 04 · Vanguard)
- **ID Canônico:** `MOD-04-PERFORMANCE-COMERCIAL`
- **Avatar Institucional:** Vanguard (Chevron Ascendente & Lança de Metas)
- **Tag:** `PILAR 04 · EXECUTIVE ANALYTICS`
- **Cromática Primária:** Rosa Neon (`#FF2D9B`) + Dourado Neon (`#FFC107`)
- **Rotas:** `/app/analytics`, `/app/dashboard`, `/app/reports`, `/app/winloss`, `/app/gamification`, `/app/war-room`, `/app/commercial_intelligence`, `/app/usage`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Transformar dados brutos do ciclo de receita em inteligência estratégica executiva através de 17 relatórios executivos em tempo real, autópsia profunda de vitórias e derrotas (Win/Loss), e painéis de War Room para alinhamento da liderança.
- **Problemas Resolvidos:** Decisões comerciais baseadas em opiniões subjetivas, incapacidade de identificar gargalos de conversão no funil, desconhecimento das reais razões pelas quais negócios são perdidos para concorrentes.
- **Público-Alvo & Perfis Autorizados:** Founders, C-Level, Diretores Comerciais, Gestores de Vendas e Analistas de RevOps.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Identificação precisa dos 3 maiores motivos de perda de negócio por trimestre.
  - Redução de tempo na consolidação de relatórios de diretoria de 8 horas para 0 (em tempo real).
  - Indicadores: Taxa de vitória contra concorrentes mapeados (Win Rate), Tempo de ciclo de vendas, Índice de produtividade por vendedor.

### B. Arquitetura Funcional
- **Catálogo Nominal dos 17 Relatórios Executivos Oficiais:**
  1. `Aging Report`: Tempo de permanência de negócios em cada estágio do funil com alertas de estagnação.
  2. `Alerts Report`: Painel executivo consolidado de sinais críticos de risco em deals ativos.
  3. `Bitrix Sync Health Report`: Monitoramento de integridade e atraso de sincronização com o Bitrix24.
  4. `Bottleneck Report`: Detecção de estrangulamento de passagem entre fases do pipeline.
  5. `Channel Attribution Report`: Origem de primeiro toque e multitouch de receita por canal de aquisição.
  6. `Close Date Intelligence Report`: Análise de postergações sucessivas de data estimada de fechamento.
  7. `CRM Quality Report`: Avaliação de preenchimento e integridade dos cadastros por equipe.
  8. `Drill Down Report`: Navegação granular de métricas macro até a transação individual.
  9. `Executive Overview Report`: Sumário em uma página de ARR, CAC, LTV, Pipeline Criado e Forecast.
  10. `Forecast Accuracy Report`: Comparação retrospectiva entre previsões estimadas e valores realizados.
  11. `Historical Trends Report`: Análise temporal de séries históricas de vendas mês a mês.
  12. `Journey Report`: Tempo decorrido de lead a cliente e churn na jornada ponta a ponta.
  13. `Leading Indicators Report`: Indicadores precoces de performance futura (ligações, reuniões, demos).
  14. `Losses Report`: Mapeamento estatístico e categorizado de perdas financeiras.
  15. `Performance Report`: Desempenho individual versus cota de cada profissional de vendas.
  16. `Pipeline Creation Report`: Volume financeiro de novas oportunidades inseridas no funil semanalmente.
  17. `Seller Benchmark Report`: Comparativo de habilidades e eficiência entre os membros do time.
- **Funcionalidades Complementares:** `Win/Loss Deep Autopsy Engine` (análise de padrões em negócios fechados), `War Room Executivo` (sala de situação com telemetria em tempo real), `Ranking & Coaching Gamificado`.
- **Componentes de UI:** `AnalyticsHub.tsx`, `ExecutiveOverviewView.tsx`, `WinLossAutopsyModal.tsx`, `WarRoomDashboard.tsx`, `ReportGrid.tsx`, `SellerBenchmarkChart.tsx`.
- **Estados de Interface:** Live (atualização instantânea via SSE), Loading, Empty, Date-Range Filtered.

### C. Operação
- **Jornada Principal:** Seleção de período e unidade de negócio → Renderização instantânea dos 17 relatórios → Identificação de anomalia no Bottleneck Report → Disparo de sessão no War Room com plano de contingência.

### D. Inteligência Artificial
- **Agentes Integrados:** Vanguard (Avatar UI), `manager-commercial`, `executive-director`, `devils-advocate`.
- **Capacidades Autorizadas:** Geração automática de sumário narrativo em linguagem natural explicando o "porquê" de oscilações nos relatórios; correlação entre discurso de vendas e causas de perda.

### E. Requisitos Técnicos
- **Entidades de Dados:** `DealHistory`, `LossRecord`, `WinLossAutopsy`, `SellerMetricSnapshot`, `ExecutiveKpiSnapshot`.
- **APIs & Rotas:** `GET /api/reports/commercial-intelligence/:reportType`, `GET /api/analytics/overview`, `POST /api/winloss/autopsy`.
- **Eventos Emitidos:** `analytics.report.generated`, `winloss.autopsy.completed`, `warroom.alert.triggered`.

### F. Homologação (Critérios de Aceite)
- `AC-PERF-001`: Todos os 17 relatórios executivos devem ser renderizados com tempo de resposta de API inferior a 800ms para períodos de até 12 meses.
- `AC-PERF-002`: O cálculo do Win/Loss Deep Autopsy deve cruzar os dados de motivo de perda obrigatórios do CRM com o segmento de mercado sem gerar incongruências estatísticas.
- `AC-PERF-003`: Painéis de War Room devem atualizar métricas em tempo real sem exigir recarregamento da página (`F5`).

---

## MÓDULO 05 — Previsibilidade Comercial (Pilar 05 · Oracle)
- **ID Canônico:** `MOD-05-PREVISIBILIDADE-COMERCIAL`
- **Avatar Institucional:** Oracle (Astrolábio Ocular & Previsão Preditiva)
- **Tag:** `PILAR 05 · REVENUE FORECAST`
- **Cromática Primária:** Púrpura Neon (`#A855F7`) + Rosa Neon (`#FF2D9B`)
- **Rotas:** `/app/forecast`, `/app/metas`, `/app/pipeline_ponderado`, `/app/commercial_intelligence`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Entregar previsão de receita científica e auditável (não baseada em "otimismo de vendedor"), utilizando calibração contínua de modelos (MAPE), health score ponderado por evidências de interação e simulador de cenários de contratação.
- **Problemas Resolvidos:** Surpresas de final de trimestre com metas não atingidas, forecast inflado por negócios fictícios, falta de dados para contratação ou corte de capacidade comercial.
- **Público-Alvo & Perfis Autorizados:** CFOs, Diretores Comerciais, Gerentes de Receita e RevOps.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Acurácia do forecast com desvio médio absoluto percentual (MAPE) inferior a 8%.
  - Detecção precoce de "deals zumbis" com mais de 30 dias de estagnação.
  - Indicadores: Índice de Cobertura de Meta (Target Coverage Ratio > 3.2x), Health Score médio do pipeline.

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `Motor de Forecast Calibrado (Oracle Engine)`: Classificação em Commit, Best Case, Pipeline e Omit; recálculo contínuo baseado no comportamento histórico real do vendedor e da empresa.
  2. `Pipeline Ponderado por Health Score`: Ponderação do valor monetário do deal não apenas pela etapa do funil, mas por sinais de engajamento (aberturas recentes, reuniões executivas realizadas, decisores confirmados).
  3. `Detecção de Risco por Negócio (Deal Risk Intelligence)`: Algoritmo que flagra negócios com data de fechamento alterada mais de 3 vezes, propostas sem resposta há 15 dias ou ausência de contato com o comitê econômico.
  4. `Simulador de Cenários & Alocação de Capacidade (What-If & Hiring)`: Modelagem preditiva que simula o impacto de adicionar ou realocar SDRs e Closers sobre a meta de receita trimestral.
  5. `Rebalanceamento de Portfólio com Alçada`: Algoritmo que sugere redistribuição de leads entre vendedores para maximizar a conversão antes do encerramento do mês.
- **Componentes de UI:** `PredictiveForecastView.tsx`, `PipelinePonderadoTable.tsx`, `DealRiskBadge.tsx`, `HiringSimulatorCard.tsx`, `PortfolioRebalanceModal.tsx`.
- **Estados de Interface:** Calibrado, Em Treinamento/Ajuste, Alerta de Risco Alto, Simulação Ativa.

### C. Operação
- **Jornada Principal:** Fechamento de semana → Execução do job de snapshot (`forecastSnapshotWeekly.worker.ts`) → Cálculo de desvio em relação à meta → Disparo de alertas de cobertura insuficiente → Gestor revisa simulação What-If.
- **Alçadas de Rebalanceamento:** Proposta de realocação de carteira exige aprovação do Gerente Comercial através de `rebalanceApproval.service.ts`.

### D. Inteligência Artificial
- **Agentes Integrados:** Oracle (Avatar UI), `forecast.agent`, `revenue-intelligence`, `devils-advocate`.
- **Capacidades Autorizadas:** Atuação como "Advogado do Diabo", questionando agressivamente premissas de negócios no Commit que não possuem proposta formalizada ou reunião registrada nos últimos 7 dias.
- **Limites de Autonomia:** A IA pode rebaixar o rating preditivo de um deal; transferências de contas entre vendedores SEMPRE exigem aprovação humana.

### E. Requisitos Técnicos
- **Entidades de Dados:** `ForecastSnapshot`, `Goal`, `DealRiskScore`, `RebalanceApproval`, `HiringScenario`.
- **APIs & Rotas:** `GET /api/forecast/predictive`, `POST /api/forecast/simulate-what-if`, `POST /api/forecast/rebalance/approve`.
- **Eventos Emitidos:** `forecast.calculated`, `forecast.risk_alert.fired`, `forecast.rebalance.requested`.

### F. Homologação (Critérios de Aceite)
- `AC-PREV-001`: O modelo de forecast deve calcular o MAPE histórico comparando a foto semanal anterior com o realizado em banco sem erros de ponto flutuante.
- `AC-PREV-002`: Qualquer deal sem atividade registrada por mais de 21 dias deve ter seu Health Score rebaixado automaticamente para nível crítico (`HEALTH < 35`).
- `AC-PREV-003`: A simulação de contratação (What-If) deve respeitar o tempo médio de ramp-up histórico da organização configurado em parâmetros.

---

## MÓDULO 06 — Inteligência Artificial (Pilar 06 · Core)
- **ID Canônico:** `MOD-06-INTELIGENCIA-ARTIFICIAL`
- **Avatar Institucional:** Core (Orbe Neural Sináptico & Coordenador do Enxame)
- **Tag:** `PILAR 06 · AI ECOSYSTEM`
- **Cromática Primária:** Índigo Cósmico (`#6366F1`) + Azul Neon (`#00D4FF`)
- **Rotas:** `/app/intelligence`, `/app/intelligence/elite-agent`, `/app/copiloto_ia`, `/app/pending-actions`, `/app/knowledge`, `/app/signals-risks`, `/app/sdr-diagnostic`, `/api/job-roles`, `/api/agents`, `/api/agent-builder`, `/api/capabilities`, `/api/role-supervisor`, `/api/workspace`, `/api/access-requests`, `/api/agent-bus`, `/api/memory`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Orquestrar o ecossistema autônomo de IA da plataforma através de um Supervisor Central, gerindo 15 agentes nativos especializados, base corporativa de conhecimento com busca vetorial (RAG em pgvector), copiloto contextual com voz e fila obrigatória de aprovação para ações de alto impacto comercial.
- **Problemas Resolvidos:** IAs "caixa-preta" sem governança ou rastreabilidade, ações autônomas que geram alucinações ou comunicam promessas indevidas a clientes, falta de contexto institucional dos agentes sobre os produtos vendidos.
- **Público-Alvo & Perfis Autorizados:** Todos os usuários da plataforma (SDRs a C-Level), com permissões e visibilidade de agentes controladas por RBAC por organização.
- **Resultados Esperados & Indicadores de Sucesso:**
  - 100% das ações de alto impacto retidas para aprovação humana antes do disparo.
  - Zero respostas com fatos não ancorados na Base de Conhecimento (RAG).
  - Indicadores: Taxa de aprovação de sugestões de IA (> 75%), Latência média de resposta do Copiloto (< 1.8s), Custo médio de tokens por negócio fechado.

### B. Arquitetura Funcional
- **Inventário Oficial dos 15 Agentes Nativos do Enxame:**
  1. `ldr-intelligence`: Pesquisa aprofundada de contas, sanitização de dados e estruturação prévia.
  2. `bdr-outbound`: Geração de abordagens hiper-personalizadas de prospecção e discovery.
  3. `sdr-qualification`: Condução de qualificação com base em critérios BANT/GPCT e triagem de cadência.
  4. `closer-sales`: Assistência estratégica durante negociações, contorno de objeções e elaboração de proposta.
  5. `coordinator-commercial`: Distribuição e balanceamento de leads entre equipes e controle de SLAs.
  6. `manager-commercial`: Supervisão diária de performance, coaching tático e alçadas de desconto.
  7. `executive-director`: Consolidação executiva de alto nível, visão de metas e estratégia global de receita.
  8. `billing-revenue`: Auditoria de contratos, cobrança e faturamento recorrente.
  9. `churn-retention`: Monitoramento de sinais de churn em clientes e acionamento de planos de retenção.
  10. `contract-signature`: Condução do fluxo de formalização, validação de termos e assinatura digital.
  11. `bitrix-guardian`: Garantia de integridade e idempotência nas sincronizações com Bitrix24.
  12. `revenue-intelligence`: Análise preditiva profunda de pipeline e geração de forecasts.
  13. `account-detective`: Investigação investigativa e montagem de dossiê pré-reunião em 10 seções.
  14. `promise-guardian`: Monitoramento contínuo de transcrições e notas para auditar promessas feitas a clientes.
  15. `devils-advocate`: Auditor implacável que desafia a probabilidade de negócios estagnados ou frágeis.
- **Subcomponentes Centrais:**
  - `Supervisor Central (Role Supervisor)`: Roteamento de comandos para o agente mais qualificado via barramento (`agent-bus`).
  - `Fila de Aprovação Humana (Human-in-the-Loop)`: Painel centralizado onde o gestor/vendedor aprova, rejeita ou edita ações sugeridas pelos agentes.
  - `Base de Conhecimento RAG (Knowledge Hub)`: Indexação de PDFs, playbooks, tabelas de preço e transcripts em embeddings vetoriais pgvector.
  - `Copiloto Contextual`: Janela conversacional acessível em qualquer tela com comandos de voz e texto.
- **Componentes de UI:** `IntelligenceHub.tsx`, `CopilotoModal.tsx`, `PendingActionsQueue.tsx`, `KnowledgeBaseManager.tsx`, `AgentBuilderView.tsx`.

### C. Operação
- **Jornada de Execução Supervisionada:** Agente detecta evento comercial → Monta plano de ação → Avalia matriz de risco → Se Risco Alto (envio de e-mail externo, alteração de contrato): grava na tabela `AIPendingAction` com status `PENDING` → Notifica responsável via SSE/Push → Usuário aprova na interface → Agente executa a chamada técnica → Log estruturado é arquivado no ledger.

### D. Limites de Autonomia & Governança
- **Matriz de Alçadas:**
  - Leitura e Análise: Autonomia Total (100% autônomo).
  - Tarefa Interna / Sugestão de Campo: Autonomia Média (executa e notifica).
  - Comunicação com Cliente / Movimentação de Deal / Assinatura: Bloqueio Obrigatório (exige clique humano).

### E. Requisitos Técnicos
- **Entidades de Dados:** `CommercialAgent`, `AgentExecutionLog`, `AIPendingAction`, `KnowledgeDocument`, `KnowledgeChunk`, `AgentCapability`.
- **APIs & Rotas:** `POST /api/role-supervisor/dispatch`, `GET /api/pending-actions`, `POST /api/pending-actions/:id/approve`, `POST /api/knowledge/upload`.
- **Eventos Emitidos:** `agent.action.proposed`, `agent.action.approved`, `agent.action.executed`, `agent.action.rejected`.

### F. Homologação (Critérios de Aceite)
- `AC-IA-001`: Nenhuma ação classificada com nível de risco `HIGH` pode ser executada sem registro prévio na tabela `AIPendingAction` e consentimento com assinatura de usuário autenticado.
- `AC-IA-002`: Consultas RAG na Base de Conhecimento devem apresentar os chunks originais de citação (referência rastreável) na resposta do Copiloto.
- `AC-IA-003`: O consumo de tokens por sessão deve ser estritamente computado contra a cota do tenant com corte imediato ao esgotar o pacote mensal.

---

## MÓDULO 07 — Automação & Conectividade (Pilar 07 · Spark)
- **ID Canônico:** `MOD-07-AUTOMACAO-CONECTIVIDADE`
- **Avatar Institucional:** Spark (Centelha Estelar 4 Pontas & Mestre das Conexões)
- **Tag:** `PILAR 07 · WORKFLOW ENGINE`
- **Cromática Primária:** Turquesa Neon (`#14B8A6`) + Lima Elétrico (`#D4F434`)
- **Rotas:** `/app/automations`, `/app/integrations`, `/app/bitrix`, `/api/whatsapp`, `/api/integrations/slack`, `/api/integrations/stripe`, `/api/integrations/3cx`, `/api/integrations/external-crm`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Conectar o Birthub 360° com ferramentas externas e executar regras de automação comercial orientadas a eventos (Event-Driven), garantindo sincronização bidirecional resiliente (com destaque para o conector profundo do Bitrix24), idempotência e testes com simulação dry-run.
- **Problemas Resolvidos:** Sincronizações falhas que duplicam cadastros, falta de integração entre CRM e canais de mensageria, ausência de testes antes de ativar automações em produção.
- **Público-Alvo & Perfis Autorizados:** RevOps, Administradores, TI e Gestores Comerciais.
- **Resultados Esperados & Indicadores de Sucesso:**
  - 100% dos eventos processados com chave de idempotência (zero duplicações).
  - Tempo de sincronização de novos negócios com o Bitrix24 < 3 segundos.
  - Indicadores: Taxa de sucesso de webhooks (> 99.8%), Tempo médio de recuperação em falha transitória (Dead-Letter Queue).

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `Motor de Regras de Automação (Automation Engine)`: Criador visual de regras no formato Gatilho → Condições → Ações com suporte a ramificações lógicas (IF/ELSE) e delays agendados.
  2. `Modo de Simulação Dry-Run`: Capacidade de testar uma regra contra uma base de 50 leads reais sem executar nenhuma mutação no banco de dados, gerando relatório de impacto esperado.
  3. `Scanners de Higiene Comercial`: Robôs de background que rodam a cada hora buscando leads sem contato há 5 dias ou negócios estagnados, disparando tarefas corretivas.
  4. `Conector Bitrix24 Profundo`: Sincronização de leads, contatos, empresas, negócios, campos personalizados (`UF_CRM_*`) e timeline com paginação batch e rate limit controlado (2 req/s).
  5. `Smart Lead Router`: Distribuição automática de leads round-robin equilibrada por carga de trabalho, especialidade do vendedor e disponibilidade de calendário.
- **Componentes de UI:** `AutomationWorkflowBuilder.tsx`, `IntegrationHubView.tsx`, `BitrixSyncDashboard.tsx`, `DryRunResultModal.tsx`, `SmartRouterSettings.tsx`.
- **Estados de Interface:** Ativo, Pausado, Modo Teste/Dry-Run, Falha Transitória em Fila (DLQ).

### C. Operação
- **Ciclo de Execução com Idempotência:** Webhook externo recebido → Geração de hash SHA-256 do payload + header de evento → Verificação no Redis de idempotência → Se já processado: retorna 200 imediato; Se novo: enfileira no BullMQ → Processamento pelo worker com retry exponencial.

### D. Inteligência Artificial
- **Agentes Integrados:** Spark (Avatar UI), `bitrix-guardian`.
- **Capacidades Autorizadas:** `bitrix-guardian` monitora anomalias de schema entre Bitrix24 e Birthub 360°, alertando e corrigindo mapeamentos de campos antes que provoquem falhas de importação.

### E. Requisitos Técnicos
- **Entidades de Dados:** `AutomationRule`, `AutomationExecutionLog`, `WebhookSubscription`, `IntegrationCredential`, `DeadLetterQueueItem`.
- **APIs & Rotas:** `GET /api/automations`, `POST /api/automations/test-dry-run`, `POST /api/integrations/bitrix/sync-now`.
- **Eventos Emitidos:** `automation.rule.triggered`, `integration.webhook.received`, `integration.bitrix.sync_completed`.

### F. Homologação (Critérios de Aceite)
- `AC-AUT-001`: Nenhuma regra de automação pode disparar mais de uma vez para o mesmo evento de negócio caso o payload seja reenviado (garantia de idempotência em nível de chave de evento).
- `AC-AUT-002`: O conector do Bitrix24 deve honrar o limite de 2 requisições por segundo utilizando fila de vazamento (token bucket/leaky bucket) sem estourar o HTTP 429 do provedor.
- `AC-AUT-003`: O modo Dry-Run deve retornar a lista exata dos registros que seriam afetados sem persistir alterações reais em banco de produção.

---

## MÓDULO 08 — Engajamento Comercial (Pilar 08 · Echo)
- **ID Canônico:** `MOD-08-ENGAJAMENTO-COMERCIAL`
- **Avatar Institucional:** Echo (Cápsula Acústica & Comunicação de Voz)
- **Tag:** `PILAR 08 · VOICE & CHANNELS`
- **Cromática Primária:** Coral Magenta (`#FB7185`) + Azul Neon (`#00D4FF`)
- **Rotas:** `/app/voice-hub`, `/app/voice-hub/*`, `/app/mesa-tratamento`, `/booking/:slug`, `/social-selling`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Centralizar todos os pontos de contato e conversação direta com os clientes (Telefonia IP, Voice AI, WhatsApp via Chatwoot e agendamento de reuniões público), proporcionando aos vendedores um estúdio de voz com transcrição em tempo real, copiloto de chamadas e conformidade regulatória.
- **Problemas Resolvidos:** Ligações comerciais não registradas, perda de informações críticas acordadas verbalmente em chamadas, desrespeito a listas de "Não Perturbe" (Procon/Anatel), falta de agilidade no agendamento de reuniões.
- **Público-Alvo & Perfis Autorizados:** SDRs, Closers, Analistas de CS e Gestores de Telemetria.
- **Resultados Esperados & Indicadores de Sucesso:**
  - 100% das chamadas e reuniões gravadas transcritas e sumarizadas no CRM.
  - Redução de no-show em reuniões agendadas para menos de 12%.
  - Indicadores: Duração média de chamadas produtivas, Aderência aos roteiros de cold call, Taxa de sucesso de conversão em agendamento público.

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `VoiceHub Studio Visual`: Softphone WebRTC embutido no navegador, supervisão ao vivo de chamadas (Whisper/Barge-in para gestores), gravação estéreo de alta fidelidade.
  2. `Birth Voice (Cold Calling Governábil)`: Discador com verificação automática prévia de listas de bloqueio (Não Me Perturbe), controle de tempo de toque e detecção de caixa postal (AMD).
  3. `Transcrição & Extração Automática de Insights`: Conversão de áudio para texto em tempo real (Whisper/AssemblyAI) com marcação de sentimentos, objeções e extração de compromissos assumidos.
  4. `Página Pública de Agendamento (Booking 360°)`: Link de agendamento personalizado por vendedor com sincronização de disponibilidade em tempo real e envio automático de convite com link de videoconferência.
  5. `WhatsApp Integrado via Chatwoot`: Central de atendimento e disparo de mensagens autorizadas diretamente no contexto da conta do CRM.
- **Componentes de UI:** `VoiceStudioPanel.tsx`, `DialerModal.tsx`, `LiveCallSupervisor.tsx`, `CallTranscriptViewer.tsx`, `PublicBookingCalendar.tsx`, `WhatsAppInboxTab.tsx`.
- **Estados de Interface:** Idle, Chamando, Em Conversação Ativa, Transcrevendo, Processando Resumo IA.

### C. Operação
- **Jornada Principal:** Vendedor abre lead → Clica no ícone de discagem → Sistema verifica ausência de bloqueio na lista de Não Perturbe → Inicia chamada via 3CX/WebRTC → Áudio é transcrito em tempo real → Ao desligar: resumo estruturado e próximas ações são gravados na timeline do lead.

### D. Inteligência Artificial
- **Agentes Integrados:** Echo (Avatar UI), `promise-guardian`, `voice-agent`, `closer-sales`.
- **Capacidades Autorizadas:** `promise-guardian` audita a conversa e, se o vendedor prometer "envio a proposta até amanhã às 14h", cria automaticamente a tarefa correspondente no CRM pendente de validação.

### E. Requisitos Técnicos
- **Entidades de Dados:** `CallRecording`, `CallTranscript`, `PublicBookingSlot`, `ScheduledMeeting`, `WhatsAppMessage`.
- **APIs & Rotas:** `POST /api/voice/call/initiate`, `POST /api/voice/webhook/audio-complete`, `GET /api/booking/:slug/availability`.
- **Eventos Emitidos:** `voice.call.connected`, `voice.call.completed`, `voice.transcript.ready`, `booking.meeting.confirmed`.

### F. Homologação (Critérios de Aceite)
- `AC-ENG-001`: Todas as gravações de chamadas devem armazenar o áudio com criptografia AES-256 e consentimento explícito registrado conforme a LGPD.
- `AC-ENG-002`: O discador de cold call DEVE consultar a lista de supressão da organização antes de estabelecer conexão telefônica, bloqueando números cadastrados.
- `AC-ENG-003`: A página pública de agendamento deve impedir agendamentos simultâneos no mesmo horário (double-booking) utilizando travas transacionais de banco.

---

## MÓDULO 09 — Admin & Operations (Fundação · Sudo)
- **ID Canônico:** `MOD-09-ADMIN-OPERATIONS`
- **Avatar Institucional:** Sudo (Monólito Isométrico Criptográfico & Guardião da Governança)
- **Tag:** `FUNDAÇÃO · PLATFORM GOVERNANCE`
- **Cromática Primária:** Ardósia Platina (`#94A3B8`) + Ouro Imperial (`#FFC107`)
- **Rotas:** `/app/settings`, `/app/team`, `/app/module-access`, `/app/notifications`, `/app/usage`, `/app/failover`, `/app/resilience`, `/api/feature-flags`, `/api/organization-modules`, `/api/bug-reports`, `/api/settings`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Fornecer os pilares administrativos, de governança e infraestrutura do ecossistema: gestão de multi-tenancy, papéis e permissões granulares (RBAC/RLS), contratação modular de produtos, auditoria e bilhetagem de consumo de IA.
- **Problemas Resolvidos:** Riscos de vazamento de dados entre empresas clientes, falta de controle sobre gastos de equipe com modelos de IA, dificuldades para habilitar/desabilitar módulos por contrato.
- **Público-Alvo & Perfis Autorizados:** Administradores de Tenant, TI, Encarregados de Dados (DPO) e Gestores de RevOps.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Zero ocorrências de vazamento de dados entre organizações (100% de isolamento RLS comprovado).
  - Controle preciso de faturamento e custos de tokens por departamento.
  - Indicadores: Uptime da plataforma (> 99.9%), Tempo médio de resposta a incidentes de segurança.

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `Controle de Acesso Modular (Module Access Gate)`: Catálogo que habilita ou oculta módulos e rotas para cada organização conforme o plano contratado.
  2. `Gestão de Equipes & Permissões Granulares (RBAC & RLS)`: Definição de permissões por perfil funcional (`ADMIN`, `GESTOR`, `CLOSER`, `SDR`, `VISUALIZADOR`) com restrições por filial e time.
  3. `Painel de Consumo & Bilhetagem de Tokens (Usage Ledger)`: Monitoramento em tempo real do volume de dados processados, requisições de IA e gastos acumulados.
  4. `Portal de Privacidade & Direitos do Titular (LGPD Portal)`: Registro de bases legais, logs de consentimento e ferramentas para anonimização e exportação de dados pessoais sob demanda.
  5. `Gestor de Feature Flags & Resiliência`: Ativação instantânea de salvaguardas e failover para serviços alternativos sem necessidade de novo deploy.
- **Componentes de UI:** `TeamManagementView.tsx`, `ModuleAccessControl.tsx`, `UsageBillingDashboard.tsx`, `LgpdComplianceTab.tsx`, `FeatureFlagsPanel.tsx`.
- **Estados de Interface:** Configurado, Pendente de Convite, Bloqueado por Quota, Modo Auditoria Ativo.

### C. Operação
- **Isolamento de Tenant em Todo Acesso:** Em cada requisição HTTP, o middleware extrai o token JWT, valida o `organizationId` e injeta a sessão no contexto seguro do banco de dados, ativando as políticas de RLS antes de qualquer consulta.

### D. Inteligência Artificial
- **Agentes Integrados:** Sudo (Avatar UI), `AccessRightAuditor`, `ComplianceEnforcer`.
- **Capacidades Autorizadas:** Auditoria contínua de permissões orfãs, detecção de padrões anômalos de login e sinalização de riscos de segurança.

### E. Requisitos Técnicos
- **Entidades de Dados:** `Organization`, `User`, `Role`, `Membership`, `ModuleGrant`, `UsageRecord`, `AuditLog`, `LgpdConsent`.
- **APIs & Rotas:** `GET /api/organization-modules`, `POST /api/team/invite`, `GET /api/usage/summary`, `POST /api/lgpd/data-subject-request`.
- **Eventos Emitidos:** `org.created`, `user.invited`, `module.granted`, `security.audit.logged`, `lgpd.anonymization.requested`.

### F. Homologação (Critérios de Aceite)
- `AC-ADM-001`: Nenhuma query do Prisma ou rota de API pode permitir que um usuário da Organização A acesse ou altere dados pertencentes à Organização B sob nenhuma circunstância.
- `AC-ADM-002`: Se uma organização não tiver o Módulo de Inteligência de Mercado ativo em seu contrato, todas as rotas e componentes deste módulo devem responder com HTTP 403 Forbidden e visualmente ocultar os menus.
- `AC-ADM-003`: Todos os acessos e modificações em dados pessoais de clientes devem gerar registro imutável em tabela de auditoria com timestamp, IP e identificador do usuário.

---

## MÓDULO 10 — Mobile & Field Sales (Mobilidade)
- **ID Canônico:** `MOD-10-MOBILE-FIELD`
- **Avatar Institucional:** Orbit Mobile / Edge Assistant
- **Tag:** `MOBILIDADE · OFFLINE FIRST`
- **Cromática Primária:** Dourado Neon (`#FFC107`) + Esmeralda (`#10B981`)
- **Rotas:** `/api/mobile`, `android/ (Capacitor)`, `mobileFieldMeeting.routes.ts`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Permitir que o vendedor externo e executivo de campo registre reuniões presenciais, grave áudios com autorização, consulte o pipeline e capture assinaturas mesmo sem acesso à internet, sincronizando tudo automaticamente ao restabelecer conexão.
- **Problemas Resolvidos:** Esquecimento de notas após reuniões presenciais, falta de atualização de status de visitas em tempo hábil, impossibilidade de uso da plataforma em áreas remotas ou sem sinal de celular.
- **Público-Alvo & Perfis Autorizados:** Vendedores de Campo, Executivos de Contas Enterprise e Gerentes Regionais.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Redução para zero de reuniões de campo sem ata registrada.
  - Sincronização offline transparente com taxa de resolução de conflitos > 99%.
  - Indicadores: Número de reuniões presenciais registradas por semana, Tempo entre o fim da visita e a sincronização com o CRM.

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `FieldMeetingRecorder`: Gravador de áudio nativo de alta eficiência para reuniões presenciais com termos de autorização digital.
  2. `Motor Offline-First (Local Database)`: Cache local criptografado via SQLite/IndexedDB contendo a carteira de clientes do vendedor.
  3. `Sincronização em Segundo Plano (Background Sync)`: Mecanismo de fila local que detecta o retorno de rede e despacha todas as ações pendentes ordenadas cronologicamente com resolução inteligente de conflitos (Last-Write-Wins com ledger de auditoria).
  4. `Mobile Edge AI Assist`: Processamento leve em dispositivo para transcrição inicial e classificação de urgência antes do envio à nuvem.
- **Componentes:** `FieldMeetingRecorder.tsx`, `OfflineSyncIndicator.tsx`, `MobilePipelineQuickView.tsx`, `CapacitorAudioPlugin.ts`.
- **Estados de Interface:** Online, Modo Offline (com badge informativo), Sincronizando (spinner neon), Conflito de Versão.

### C. Operação
- **Jornada de Campo:** Vendedor chega ao cliente em local sem sinal → Abre o app no celular → Consulta dados do cliente no cache offline → Grava ata/áudio da reunião → Anota próximos passos acordados → Salva localmente → Entra no carro e recupera conexão 4G/Wi-Fi → App sincroniza tudo com a nuvem silenciosamente.

### D. Inteligência Artificial
- **Agentes Integrados:** `promise-guardian` e `account-detective` em execução no backend processam o pacote enviado pelo mobile assim que recebido.

### E. Requisitos Técnicos
- **Entidades de Dados:** `MobileFieldMeeting`, `OfflineSyncQueueItem`, `MobileDeviceRegistration`.
- **APIs & Rotas:** `POST /api/mobile/field-meeting`, `POST /api/mobile/sync-batch`, `GET /api/mobile/manifest`.
- **Eventos Emitidos:** `mobile.meeting.recorded`, `mobile.data.synced`, `mobile.conflict.resolved`.

### F. Homologação (Critérios de Aceite)
- `AC-MOB-001`: O aplicativo deve permitir gravação contínua de áudio de até 90 minutos em segundo plano sem ser interrompido pelo gerenciador de energia do sistema operacional.
- `AC-MOB-002`: Em caso de perda repentina de energia ou crash durante o modo offline, nenhuma nota de texto ou gravação previamente salva no SQLite local pode ser corrompida ou perdida.
- `AC-MOB-003`: O processo de sincronização em lote deve ser transacional; se um item do lote falhar, ele deve ser isolado na fila de retry sem bloquear a sincronização dos demais itens.

---

## MÓDULO 11 — Social Selling (Expansão de Canais)
- **ID Canônico:** `MOD-11-SOCIAL-SELLING`
- **Avatar Institucional:** Nexus Social / Copywriter Tático
- **Tag:** `EXPANSÃO · SOCIAL ENGAGEMENT`
- **Cromática Primária:** Rosa Neon (`#FF2D9B`) + Ciano Quântico (`#38BDF8`)
- **Rotas:** `/social-selling`, `/api/social-selling`, `ApproachGeneratorCard`, `SocialSellingHub`

### A. Identidade Funcional
- **Objetivo & Proposta de Valor:** Capacitar a equipe comercial a atuar como autoridade em redes sociais corporativas (notadamente LinkedIn), descobrindo posts relevantes de decisores, gerando abordagens e comentários inteligentes que constroem relacionamento e transformam conexões em reuniões qualificadas.
- **Problemas Resolvidos:** Abordagens genéricas ("spam de LinkedIn") que geram rejeição imediata, falta de constância dos vendedores na criação de conteúdo social, isolamento entre interações sociais e o histórico do CRM.
- **Público-Alvo & Perfis Autorizados:** BDRs, SDRs, Closers, Lideranças Comerciais e Especialistas de Marca.
- **Resultados Esperados & Indicadores de Sucesso:**
  - Taxa de aceitação de convites sociais superior a 45%.
  - Taxa de resposta positiva a abordagens sociais superior a 25%.
  - Indicadores: Oportunidades geradas via Social Selling, Engajamento médio dos posts recomendados.

### B. Arquitetura Funcional
- **Funcionalidades & Subfuncionalidades:**
  1. `SocialSellingHub`: Painel de monitoramento de decisores-chave e detecção de posts sobre dores do mercado que a plataforma soluciona.
  2. `ApproachGeneratorCard (Gerador de Abordagens)`: Ferramenta que lê o perfil e as últimas publicações do prospect e redige 3 opções de abordagem personalizadas (Direta, Provocativa e Consultiva).
  3. `Shadow Copywriting`: Auxiliar de redação de artigos e posts com o tom de voz do vendedor para posicionamento de autoridade no setor.
  4. `Extrator de Sinais de Compra Social`: Identificação de curtidas e comentários de prospects em postagens de concorrentes para abordagem oportuna.
- **Componentes de UI:** `SocialSellingHub.tsx`, `ApproachGeneratorCard.tsx`, `SocialEngagementFeed.tsx`, `PostCopyAssistant.tsx`.
- **Estados de Interface:** Explorando, Gerando Cópia com IA, Copiado para Área de Transferência, Vinculado ao Lead no CRM.

### C. Operação
- **Jornada Principal:** Vendedor seleciona lead no Hub Social → Visualiza histórico de publicações → Clica em "Gerar Abordagem Consultiva" → IA processa o perfil e a dor mapeada → Vendedor revisa e aprova o texto → Copia e envia na rede social → Interação fica registrada no CRM.

### D. Inteligência Artificial
- **Agentes Integrados:** `bdr-outbound`, `ldr-intelligence`.
- **Capacidades Autorizadas:** Geração de texto persuasivo com base nos princípios de copywriting do playbook; análise de sentimento das postagens públicas dos decisores.
- **Limites de Autonomia:** Nenhuma mensagem é postada ou enviada em redes sociais de forma automática sem intervenção manual do vendedor (conformidade com termos de uso de terceiros e controle de qualidade).

### E. Requisitos Técnicos
- **Entidades de Dados:** `SocialProfile`, `SocialInteraction`, `GeneratedApproach`, `SocialSignal`.
- **APIs & Rotas:** `POST /api/social-selling/generate-approach`, `GET /api/social-selling/feed`, `POST /api/social-selling/log-interaction`.
- **Eventos Emitidos:** `social.approach.generated`, `social.interaction.logged`, `social.signal.detected`.

### F. Homologação (Critérios de Aceite)
- `AC-SOC-001`: O gerador de abordagens deve sempre incorporar dados reais do perfil (ex: nome, cargo atual e setor) e nunca inventar fatos ou interações fictícias.
- `AC-SOC-002`: Toda abordagem gerada que for utilizada pelo vendedor deve permitir associação imediata à timeline do Lead no Hub Comercial com apenas um clique.
- `AC-SOC-003`: O módulo não deve utilizar métodos ilegais de automação ou scraping que violem os termos de serviço das plataformas parceiras.
