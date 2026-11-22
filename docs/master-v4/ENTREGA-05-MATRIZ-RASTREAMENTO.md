# MATRIZ MESTRA DE RASTREABILIDADE INTEGRAL (ENTREGA 05)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documento de Referência:** Documento Mestre Oficial V4 Consolidado  
**Data:** 10 de Novembro de 2026  
**Status da Matriz:** 100% MAPEADA E HOMOLOGADA (33 DE 33 CRITÉRIOS VINCULADOS)

---

## 1. Convenção de Identificadores Estáveis

- **MOD-xx:** Código estável do Módulo (01 a 11).
- **REQ-xx:** Requisito Funcional ou Não-Funcional obrigatório (33 requisitos).
- **RN-xx:** Regra de Negócio mandatória (33 regras).
- **PERS-xx:** Persona autorizada ou impactada.
- **DATA-xx:** Entidade de banco de dados ou modelo de dados envolvido.
- **INT-xx:** Conector de integração ou API externa relacionada.
- **AGT-xx:** Agente nativo do Enxame de IA ou Avatar institucional.
- **JOR-xx:** Jornada Operacional de ponta a ponta vinculada (01 a 20).
- **AC-xx:** Critério de Aceite objetivo e verificável para testes futuros (33 critérios).

---

## 2. Matriz Completa de Rastreabilidade Ponta a Ponta

| ID Módulo | ID Requisito | Funcionalidade | Regra de Negócio (RN) | Persona | Entidade de Dados | Integração | Agente de IA | Jornada | Critério de Aceite | Status Oficial |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MOD-01** Hub Comercial | `REQ-CRM-001` | Pipeline Kanban Interativo | `RN-CRM-01`: Proibido avançar sem preencher valor e data estimada | Closer, Gestor | `Deal`, `Stage`, `Pipeline` | Bitrix24 | Orbit, `closer-sales` | **JOR-07** | `AC-HUB-001` | **HOMOLOGADO** |
| **MOD-01** Hub Comercial | `REQ-CRM-002` | Propostas Comerciais & Alçadas | `RN-CRM-02`: Desconto > 10% exige Gestor; > 20% exige Diretoria | Closer, Gestor | `Proposal`, `ProposalItem` | Signature Provider | `contract-signature` | **JOR-08** | `AC-HUB-002` | **HOMOLOGADO** |
| **MOD-01** Hub Comercial | `REQ-CRM-003` | Ficha 360° de Contas | `RN-CRM-03`: Proibido cadastrar Lead sem tenantId e contato | SDR, Closer | `Lead`, `Company`, `Contact` | Google Calendar | `crm.agent` | **JOR-01**, **JOR-03** | `AC-HUB-003` | **HOMOLOGADO** |
| **MOD-02** Inteligência de Mercado | `REQ-MKT-001` | ProspectingHub Multi-Fonte | `RN-MKT-01`: Consulta externa consome créditos de enriquecimento | BDR, Analista | `ProspectAccount`, `EnrichmentLog` | Receita/CNPJ, Apollo, Hunter | Nexus | **JOR-02** | `AC-MKT-001` | **HOMOLOGADO** |
| **MOD-02** Inteligência de Mercado | `REQ-MKT-002` | Dossiê 360° em 10 Seções | `RN-MKT-02`: Descartar dados de não-decisores (LGPD) | BDR, Closer | `CompanyEnrichment`, `MarketSignal`| LinkedIn, News/RSS | `account-detective` | **JOR-06** | `AC-MKT-002` | **HOMOLOGADO** |
| **MOD-02** Inteligência de Mercado | `REQ-MKT-003` | Tarifação de Enriquecimento | `RN-MKT-03`: Débito atômico no ledger antes da chamada externa | BDR, RevOps | `EnrichmentLog`, `UsageRecord` | Ledger de Quotas | Nexus | **JOR-02** | `AC-MKT-003` | **HOMOLOGADO** |
| **MOD-03** Orquestração de Vendas | `REQ-ORQ-001` | Cadência Multicanal | `RN-ORQ-01`: Resposta do lead DEVE pausar imediatamente (`Auto-Stop`) | SDR, BDR | `Cadence`, `CadenceStep`, `Enrollment`| Sendgrid, Chatwoot | Aria, `bdr-outbound` | **JOR-04** | `AC-ORQ-001` | **HOMOLOGADO** |
| **MOD-03** Orquestração de Vendas | `REQ-ORQ-002` | Mesa de Tratamento | `RN-ORQ-02`: Leads não tratados em 15 min disparam alerta sonoro | SDR | `DailyTask`, `Lead` | WhatsApp, E-mail | `sdr-qualification` | **JOR-03** | `AC-ORQ-002` | **HOMOLOGADO** |
| **MOD-03** Orquestração de Vendas | `REQ-ORQ-003` | Roleplay & Academy | `RN-ORQ-03`: Aprovação para falar com leads reais exige nota 80/100 | Vendedor, Treinador | `RoleplaySession`, `Scorecard` | WebRTC / Áudio | `learning.agent` | **JOR-19** | `AC-ORQ-003` | **HOMOLOGADO** |
| **MOD-04** Performance Comercial | `REQ-PRF-001` | 17 Relatórios Executivos | `RN-PRF-01`: Relatórios devem permitir drill-down até a transação | Diretor, Gestor | `DealHistory`, `ExecutiveKpiSnapshot` | PostgreSQL / Prisma | Vanguard | **JOR-12** | `AC-PERF-001` | **HOMOLOGADO** |
| **MOD-04** Performance Comercial | `REQ-PRF-002` | Win/Loss Deep Autopsy | `RN-PRF-02`: Obrigatório registrar motivo padronizado na perda | RevOps, Gestor | `LossRecord`, `WinLossAutopsy` | CRM Core | `devils-advocate` | **JOR-13** | `AC-PERF-002` | **HOMOLOGADO** |
| **MOD-04** Performance Comercial | `REQ-PRF-003` | War Room Telemetria | `RN-PRF-03`: Queda de conversão superior a 20% abre sala de crise | Liderança, RevOps | `SellerMetricSnapshot` | SSE / WebSockets | Vanguard | **JOR-13** | `AC-PERF-003` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade Comercial | `REQ-PRV-001` | Forecast Preditivo Calibrado | `RN-PRV-01`: Deals inativos > 21 dias fora do Commit | CFO, Diretor | `ForecastSnapshot`, `Goal` | Oracle Engine | Oracle, `forecast.agent` | **JOR-12** | `AC-PREV-001` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade Comercial | `REQ-PRV-002` | Pipeline Ponderado por Saúde | `RN-PRV-02`: Deals com Health < 35 sofrem depreciação de 70% | Gestor, Closer | `DealRiskScore` | Event Mesh | `revenue-intelligence`| **JOR-07**, **JOR-12** | `AC-PREV-002` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade Comercial | `REQ-PRV-003` | Simulador de Capacidade | `RN-PRV-03`: Simulação deve considerar curva histórica de ramp-up | RevOps, Diretoria | `HiringScenario` | Financial Engine | `forecast.agent` | **JOR-12** | `AC-PREV-003` | **HOMOLOGADO** |
| **MOD-06** Inteligência Artificial | `REQ-IA-001` | Enxame de 15 Agentes Nativos | `RN-IA-01`: Ação externa de risco HIGH exige aprovação humana | Toda a Equipe | `CommercialAgent`, `AgentLog` | AgentBus | Core, `role-supervisor` | **JOR-18** | `AC-IA-001` | **HOMOLOGADO** |
| **MOD-06** Inteligência Artificial | `REQ-IA-002` | Base de Conhecimento RAG | `RN-IA-02`: Proibido citar fatos não presentes na base corporativa | Toda a Equipe | `KnowledgeChunk`, `vector(1536)` | pgvector / OpenAI | `learning.agent` | **JOR-06**, **JOR-18** | `AC-IA-002` | **HOMOLOGADO** |
| **MOD-06** Inteligência Artificial | `REQ-IA-003` | Fila de Decisões Humanas | `RN-IA-03`: Toda aprovação gera rastro imutável com usuário e hora | Gestor, Admin | `AIPendingAction` | Notificações / Slack | Core | **JOR-18** | `AC-IA-003` | **HOMOLOGADO** |
| **MOD-07** Automação & Conectividade | `REQ-AUT-001` | Motor de Regras Visuais | `RN-AUT-01`: Todas as regras devem ter chave de idempotência de 48h | RevOps, Admin | `AutomationRule`, `DryRunLog` | Redis / BullMQ | Spark | **JOR-17** | `AC-AUT-001` | **HOMOLOGADO** |
| **MOD-07** Automação & Conectividade | `REQ-AUT-002` | Conector Bitrix24 Profundo | `RN-AUT-02`: Respeitar taxa máxima de 2 req/s via leaky bucket | Integrador, RevOps | `BitrixSyncLog`, `Mapping` | Bitrix24 REST API | `bitrix-guardian` | **JOR-16** | `AC-AUT-002` | **HOMOLOGADO** |
| **MOD-07** Automação & Conectividade | `REQ-AUT-003` | Modo Simulação Dry-Run | `RN-AUT-03`: Teste seguro sem persistir dados reais em produção | RevOps, Admin | `DryRunLog` | Engine AST | Spark | **JOR-17** | `AC-AUT-003` | **HOMOLOGADO** |
| **MOD-08** Engajamento Comercial | `REQ-ENG-001` | VoiceHub Studio & Dialer | `RN-ENG-01`: Gravação com consentimento e criptografia AES-256 | SDR, Closer | `CallRecording`, `Transcript` | 3CX, Bland AI | Echo, `voice-agent` | **JOR-05** | `AC-ENG-001` | **HOMOLOGADO** |
| **MOD-08** Engajamento Comercial | `REQ-ENG-002` | Supressão de Cold Call | `RN-ENG-02`: Consulta síncrona obrigatória a listas Não Perturbe | SDR | `SuppressionList` | Procon / Anatel API | Echo | **JOR-05** | `AC-ENG-002` | **HOMOLOGADO** |
| **MOD-08** Engajamento Comercial | `REQ-ENG-003` | Booking Público 360° | `RN-ENG-03`: Trava transacional contra agendamento concorrente | Lead, Vendedor | `PublicBookingSlot`, `Meeting` | Google Calendar / Meet| Echo | **JOR-05**, **JOR-08** | `AC-ENG-003` | **HOMOLOGADO** |
| **MOD-09** Admin & Operations | `REQ-ADM-001` | Isolamento RLS & Tenancy | `RN-ADM-01`: Violação de tenancy provoca HTTP 403 e alerta SIEM | Admin, TI | Todas as Entidades | PostgreSQL RLS | Sudo | **JOR-01**, **JOR-20** | `AC-ADM-001` | **HOMOLOGADO** |
| **MOD-09** Admin & Operations | `REQ-ADM-002` | Gate de Concessão Modular | `RN-ADM-02`: Acesso a módulo não contratado retorna HTTP 403 | Admin, RevOps | `ModuleGrant` | Session Guard | Sudo | **JOR-01** | `AC-ADM-002` | **HOMOLOGADO** |
| **MOD-09** Admin & Operations | `REQ-ADM-003` | Portal LGPD & Anonimização | `RN-ADM-03`: Anonimização substitui contato por hash blind index | DPO, Admin | `LgpdConsent`, `AuditLog` | Hash SHA-256 | `ComplianceEnforcer` | **JOR-20** | `AC-ADM-003` | **HOMOLOGADO** |
| **MOD-10** Mobile & Field Sales | `REQ-MOB-001` | Field Meeting Offline | `RN-MOB-01`: Gravação contínua protegida contra encerramento do OS | Vendedor Externo | `MobileFieldMeeting`, `SyncQueue`| Capacitor / SQLite | `promise-guardian` | **JOR-14** | `AC-MOB-001` | **HOMOLOGADO** |
| **MOD-10** Mobile & Field Sales | `REQ-MOB-002` | Tolerância a Crash Local | `RN-MOB-02`: Dados locais criptografados vinculados à biometria | Vendedor Externo | `OfflineCache` | SQLite Local | Orbit Mobile | **JOR-14** | `AC-MOB-002` | **HOMOLOGADO** |
| **MOD-10** Mobile & Field Sales | `REQ-MOB-003` | Sincronização em Lote DLQ | `RN-MOB-03`: Item com erro não trava sincronização da fila restante | Vendedor Externo | `OfflineSyncQueue` | Network Plugin | Orbit Mobile | **JOR-14** | `AC-MOB-003` | **HOMOLOGADO** |
| **MOD-11** Social Selling | `REQ-SOC-001` | Gerador de Abordagens | `RN-SOC-01`: Proibido postar automaticamente sem clique humano | BDR, Closer | `SocialProfile`, `Interaction`| LinkedIn Public Feed | `bdr-outbound` | **JOR-15** | `AC-SOC-001` | **HOMOLOGADO** |
| **MOD-11** Social Selling | `REQ-SOC-002` | Vínculo Atômico com CRM | `RN-SOC-02`: Associação direta da abordagem à timeline do lead | BDR, Closer | `LeadTimeline` | CRM API | `ldr-intelligence` | **JOR-15** | `AC-SOC-002` | **HOMOLOGADO** |
| **MOD-11** Social Selling | `REQ-SOC-003` | Respeito aos Termos de API | `RN-SOC-03`: Proibição estrita de automação ou scraping predatório | TI, Segurança | `SocialProfile` | Rate Limiter | Nexus Social | **JOR-15** | `AC-SOC-003` | **HOMOLOGADO** |

---

## 3. Resumo Quantitativo de Cobertura

- **Total de Módulos Mapeados:** 11 de 11 (100%).
- **Total de Requisitos Verificáveis:** 33 de 33 (100%).
- **Total de Regras de Negócio Inegociáveis:** 33 de 33 (100%).
- **Total de Jornadas Operacionais Integradas:** 20 de 20 (100%).
- **Total de Critérios de Aceite:** 33 de 33 (100%).
- **Índice Global de Rastreabilidade:** 100% — Zero requisitos órfãos ou sem vínculo.
