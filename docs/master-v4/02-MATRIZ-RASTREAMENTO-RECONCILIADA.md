# MATRIZ MESTRA DE RASTREABILIDADE RECONCILIADA (ENTREGA 02)
**Projeto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Autoridade:** Agente 00 (Supervisor Geral)  
**Data:** 10 de Novembro de 2026  
**Status:** 100% RECONCILIADA — 33 DE 33 CRITÉRIOS VINCULADOS SEM ÓRFÃOS

---

## 1. Convenção de Identificadores

- **MOD-01 a MOD-11:** Os 11 Módulos Funcionais Oficiais.
- **REQ-xxx:** Requisitos Funcionais e Não Funcionais Canônicos (33 itens).
- **RN-xxx:** Regras de Negócio Inegociáveis (33 regras).
- **PERS-xxx:** Personas Autorizadas e Impactadas.
- **DATA-xxx:** Entidades do Modelo de Dados Prisma.
- **INT-xxx:** Conectores e APIs Externas.
- **AGT-xxx:** Agentes Nativos do Enxame de IA e Avatares.
- **JOR-01 a JOR-20:** As 20 Jornadas Operacionais Ponta a Ponta.
- **AC-xxx:** Critérios de Aceite Verificáveis (33 testes objetivos).

---

## 2. Matriz Integral Reconciliada (33 Vínculos Oficiais)

| Módulo | ID Requisito | Descrição Funcional | Regra de Negócio | Persona | Entidade de Dados | Integração | Agente IA | Jornada | Critério de Aceite | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MOD-01** Hub Comercial | `REQ-CRM-001` | Transição atômica de estágio no Kanban com recálculo de valores | `RN-CRM-01`: Proibido avançar sem valor e data estimada | Closer, Gestor | `Deal`, `Stage` | Bitrix24 | Orbit, `closer-sales` | **JOR-07** | `AC-HUB-001` | **HOMOLOGADO** |
| **MOD-01** Hub Comercial | `REQ-CRM-002` | Emissão de propostas com cálculo de margem e alçada escalonada | `RN-CRM-02`: Desconto > 10% exige Gestor; > 20% Diretoria | Closer, Gestor | `Proposal` | Signature Provider | `contract-signature` | **JOR-08** | `AC-HUB-002` | **HOMOLOGADO** |
| **MOD-01** Hub Comercial | `REQ-CRM-003` | Ficha Cadastral 360° com timeline unificada de interações | `RN-CRM-03`: Proibido criar lead sem tenantId e contato | SDR, Closer | `Lead`, `Contact` | Google Calendar | `crm.agent` | **JOR-01**, **JOR-03** | `AC-HUB-003` | **HOMOLOGADO** |
| **MOD-02** Inteligência | `REQ-MKT-001` | Busca em cascata em 7 fontes externas com deduplicação | `RN-MKT-01`: Consulta consome créditos de enriquecimento | BDR | `ProspectAccount` | Receita, Apollo | Nexus | **JOR-02** | `AC-MKT-001` | **HOMOLOGADO** |
| **MOD-02** Inteligência | `REQ-MKT-002` | Dossiê 360° em 10 seções com sinais de compra | `RN-MKT-02`: Descartar dados de não-decisores (LGPD) | BDR, Closer | `CompanyEnrichment`| LinkedIn, News | `account-detective` | **JOR-06** | `AC-MKT-002` | **HOMOLOGADO** |
| **MOD-02** Inteligência | `REQ-MKT-003` | Tarifação e débito atômico de créditos de enriquecimento | `RN-MKT-03`: Bloqueio imediato da chamada se cota zerada | BDR, RevOps | `EnrichmentLog` | Ledger de Quotas | Nexus | **JOR-02** | `AC-MKT-003` | **HOMOLOGADO** |
| **MOD-03** Orquestração | `REQ-ORQ-001` | Motor multicanal de cadência com envio em horário comercial | `RN-ORQ-01`: Auto-Stop obrigatório ao receber resposta | SDR, BDR | `Cadence`, `Step` | Sendgrid, Chatwoot | Aria, `bdr-outbound` | **JOR-04** | `AC-ORQ-001` | **HOMOLOGADO** |
| **MOD-03** Orquestração | `REQ-ORQ-002` | Mesa de Tratamento priorizada com SLA de 5 minutos | `RN-ORQ-02`: Alerta sonoro após 15min sem atendimento | SDR | `DailyTask`, `Lead` | WhatsApp, E-mail | `sdr-qualification` | **JOR-03** | `AC-ORQ-002` | **HOMOLOGADO** |
| **MOD-03** Orquestração | `REQ-ORQ-003` | Simulador de Roleplay com IA e scorecard por rubrica | `RN-ORQ-03`: Nota mínima 80/100 para certificar vendedor | Vendedor | `RoleplaySession` | WebRTC / Áudio | `learning.agent` | **JOR-19** | `AC-ORQ-003` | **HOMOLOGADO** |
| **MOD-04** Performance | `REQ-PRF-001` | Renderização instantânea dos 17 relatórios executivos | `RN-PRF-01`: Permitir drill-down até a transação | Diretor, Gestor | `ExecutiveKpi` | PostgreSQL RLS | Vanguard | **JOR-12** | `AC-PERF-001` | **HOMOLOGADO** |
| **MOD-04** Performance | `REQ-PRF-002` | Win/Loss Deep Autopsy com agrupamento semântico | `RN-PRF-02`: Motivo padronizado obrigatório na perda | RevOps, Gestor | `WinLossAutopsy` | CRM Core | `devils-advocate` | **JOR-13** | `AC-PERF-002` | **HOMOLOGADO** |
| **MOD-04** Performance | `REQ-PRF-003` | War Room com telemetria ao vivo via Server-Sent Events | `RN-PRF-03`: Queda de conversão > 20% abre sala de crise | Liderança | `SellerMetric` | SSE / WebSockets | Vanguard | **JOR-13** | `AC-PERF-003` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade | `REQ-PRV-001` | Forecast Preditivo Calibrado contra realizado (MAPE < 8%) | `RN-PRV-01`: Deals inativos > 21 dias fora do Commit | CFO, Diretor | `ForecastSnapshot` | Oracle Engine | Oracle, `forecast.agent` | **JOR-12** | `AC-PREV-001` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade | `REQ-PRV-002` | Pipeline Ponderado por Health Score de 0 a 100 | `RN-PRV-02`: Health < 35 reduz valor ponderado em 70% | Gestor, Closer | `DealRiskScore` | Event Mesh | `revenue-intelligence`| **JOR-07**, **JOR-12** | `AC-PREV-002` | **HOMOLOGADO** |
| **MOD-05** Previsibilidade | `REQ-PRV-003` | Simulador What-If de capacidade e ramp-up de contratação | `RN-PRV-03`: Considerar curva histórica real de ramp-up | RevOps, Diretoria | `HiringScenario` | Financial Engine | `forecast.agent` | **JOR-12** | `AC-PREV-003` | **HOMOLOGADO** |
| **MOD-06** Inteligência | `REQ-IA-001` | Enxame de 15 Agentes Nativos sob o Supervisor Central | `RN-IA-01`: Ação externa de risco HIGH exige aprovação | Toda a Equipe | `CommercialAgent` | AgentBus | Core, `role-supervisor` | **JOR-18** | `AC-IA-001` | **HOMOLOGADO** |
| **MOD-06** Inteligência | `REQ-IA-002` | Base de Conhecimento RAG em pgvector (1536 dimensões) | `RN-IA-02`: Proibido citar dados fora da base corporativa | Toda a Equipe | `KnowledgeChunk` | pgvector / OpenAI | `learning.agent` | **JOR-06**, **JOR-18** | `AC-IA-002` | **HOMOLOGADO** |
| **MOD-06** Inteligência | `REQ-IA-003` | Fila de Aprovação Humana com rastro imutável de autor | `RN-IA-03`: Registro de justificativa e timestamp de aceite | Gestor, Admin | `AIPendingAction` | Slack / Painel | Core | **JOR-18** | `AC-IA-003` | **HOMOLOGADO** |
| **MOD-07** Automação | `REQ-AUT-001` | Motor de regras visuais orientadas a eventos (Event Mesh) | `RN-AUT-01`: Chave de idempotência de 48h obrigatória | RevOps, Admin | `AutomationRule` | Redis / BullMQ | Spark | **JOR-17** | `AC-AUT-001` | **HOMOLOGADO** |
| **MOD-07** Automação | `REQ-AUT-002` | Conector Bitrix24 bidirecional resiliente com leaky bucket | `RN-AUT-02`: Limite estrito de 2 req/s e lotes de 50 itens | Integrador | `BitrixSyncLog` | Bitrix24 REST API | `bitrix-guardian` | **JOR-16** | `AC-AUT-002` | **HOMOLOGADO** |
| **MOD-07** Automação | `REQ-AUT-003` | Modo Dry-Run para simulação de regras sem mutação | `RN-AUT-03`: Execução em memória sem escrita em produção | RevOps, Admin | `DryRunLog` | Engine AST | Spark | **JOR-17** | `AC-AUT-003` | **HOMOLOGADO** |
| **MOD-08** Engajamento | `REQ-ENG-001` | VoiceHub Studio WebRTC com transcrição estéreo ao vivo | `RN-ENG-01`: Gravação com consentimento e criptografia | SDR, Closer | `CallRecording` | 3CX, Bland AI | Echo, `voice-agent` | **JOR-05** | `AC-ENG-001` | **HOMOLOGADO** |
| **MOD-08** Engajamento | `REQ-ENG-002` | Supressão de cold call contra lista Não Perturbe | `RN-ENG-02`: Bloqueio compulsório de números registrados | SDR | `SuppressionList` | Procon / Anatel API | Echo | **JOR-05** | `AC-ENG-002` | **HOMOLOGADO** |
| **MOD-08** Engajamento | `REQ-ENG-003` | Booking Público 360° com prevenção de double-booking | `RN-ENG-03`: Trava transacional de horário no calendário | Lead, Closer | `BookingSlot` | Google Calendar | Echo | **JOR-05**, **JOR-08** | `AC-ENG-003` | **HOMOLOGADO** |
| **MOD-09** Admin | `REQ-ADM-001` | Isolamento multi-tenant obrigatório via PostgreSQL RLS | `RN-ADM-01`: Violação de tenantId dispara HTTP 403 e SIEM | Admin, TI | Todas as Entidades | PostgreSQL RLS | Sudo | **JOR-01**, **JOR-20** | `AC-ADM-001` | **HOMOLOGADO** |
| **MOD-09** Admin | `REQ-ADM-002` | Gate de concessão modular por organização | `RN-ADM-02`: Rota de módulo não contratado retorna HTTP 403 | Admin, RevOps | `ModuleGrant` | Session Guard | Sudo | **JOR-01** | `AC-ADM-002` | **HOMOLOGADO** |
| **MOD-09** Admin | `REQ-ADM-003` | Portal LGPD com anonimização cega (blind index) | `RN-ADM-03`: Preservação de dados fiscais (Art. 16 LGPD) | DPO, Admin | `LgpdConsent`, `AuditLog` | Hash SHA-256 | `ComplianceEnforcer` | **JOR-20** | `AC-ADM-003` | **HOMOLOGADO** |
| **MOD-10** Mobile | `REQ-MOB-001` | Field Meeting Recorder com áudio e notas em campo | `RN-MOB-01`: Gravação protegida contra desligamento do OS | Vendedor Externo | `MobileFieldMeeting`| Capacitor Plugin | `promise-guardian` | **JOR-14** | `AC-MOB-001` | **HOMOLOGADO** |
| **MOD-10** Mobile | `REQ-MOB-002` | Persistência transacional local e tolerância a crash | `RN-MOB-02`: Gravação salva em SQLite criptografado local | Vendedor Externo | `OfflineCache` | SQLite / Biometria | Orbit Mobile | **JOR-14** | `AC-MOB-002` | **HOMOLOGADO** |
| **MOD-10** Mobile | `REQ-MOB-003` | Sincronização em lote isolada com Dead-Letter Queue | `RN-MOB-03`: Falha em 1 pacote não bloqueia a fila restante | Vendedor Externo | `OfflineSyncQueue` | Network Plugin | Orbit Mobile | **JOR-14** | `AC-MOB-003` | **HOMOLOGADO** |
| **MOD-11** Social | `REQ-SOC-001` | Gerador de abordagens consultivas para posts de decisores | `RN-SOC-01`: Proibido envio automático sem clique humano | BDR, Social Seller | `SocialInteraction`| LinkedIn Public Feed | `bdr-outbound` | **JOR-15** | `AC-SOC-001` | **HOMOLOGADO** |
| **MOD-11** Social | `REQ-SOC-002` | Associação imediata de abordagem gerada à timeline do CRM | `RN-SOC-02`: Vinculação da interação com 1 clique | BDR, Closer | `LeadTimeline` | CRM API | `ldr-intelligence` | **JOR-15** | `AC-SOC-002` | **HOMOLOGADO** |
| **MOD-11** Social | `REQ-SOC-003` | Conformidade e controle de taxa com termos das redes | `RN-SOC-03`: Proibição estrita de scraping predatório | TI, Segurança | `SocialProfile` | Rate Limiter | Nexus Social | **JOR-15** | `AC-SOC-003` | **HOMOLOGADO** |

---

## 3. Balanço de Fechamento da Rastreabilidade

- **Total de Módulos Cobertos:** 11 de 11 (100%).
- **Total de Requisitos Canônicos:** 33 de 33 (100%).
- **Total de Regras de Negócio:** 33 de 33 (100%).
- **Total de Critérios de Aceite:** 33 de 33 (100%).
- **Critérios Órfãos:** ZERO.
- **Vínculos Quebrados:** ZERO.
