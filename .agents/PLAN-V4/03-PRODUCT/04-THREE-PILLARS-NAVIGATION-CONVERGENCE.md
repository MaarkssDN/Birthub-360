# Convergência da Navegação: Arquitetura dos 3 Pilares Canônicos

**Data:** 28 de Setembro de 2026  
**Status:** Planejado e Mapeado para Implementação  
**Governança:** AGENTS.md · GOV-003 (Scope Freeze & Convergence)  
**Domínio:** Agente 02 (Produto e UX) + Agente 03 (Design e Acessibilidade)

---

## 1. Contexto e Motivação

Atualmente, o arquivo [`src/components/layout/Sidebar.tsx`](file:///c:/Github/Birthub-360/src/components/layout/Sidebar.tsx) expõe mais de 30 módulos fragmentados em 6 grupos navegacionais (`COMMAND CENTER`, `INTELLIGENCE`, `BUSINESS`, `EXECUTION`, `CAPACITATION`, `ADMINISTRATION`). Essa dispersão sobrecarrega a carga cognitiva do usuário (SDRs, Closers e Gestores) e desvia da visão de produto consolidada no [`02-PRODUCT-CONVERGENCE-GATE.md`](file:///c:/Github/Birthub-360/.agents/PLAN-V4/01-GOVERNANCE/02-PRODUCT-CONVERGENCE-GATE.md).

O mandato estratégico é convergir a experiência principal da **Central de Inteligência Comercial Birth Hub 360** em **3 Pilares Fundamentais**, suportados por um **Command Center** de entrada e uma camada segregada de **Operações & Administração**.

---

## 2. Visão Canônica da Navegação

```text
BIRTH HUB 360º — Intelligent Business Command Center
│
├── COMMAND CENTER (Cockpit / Entrada)
│   ├── Visão Geral / Dashboard (/app/dashboard)
│   ├── Espaço Unificado / Workspace (/app/workspace)
│   └── Plano Diário de Ação (/app/daily-plan)
│
├── 🏛️ PILAR 1: CRM COMERCIAL
│   ├── Funil de Vendas / Deals (/app/crm)
│   ├── Visão 360 do Cliente (/app/crm360)
│   ├── Empresas & Contas (/app/companies)
│   ├── Contatos & Decisores (/app/contacts)
│   ├── Atividades & Tarefas (/app/activities)
│   ├── Agenda & Reuniões (/app/calendar)
│   ├── Propostas & CPQ (/app/propostas)
│   └── [Mesa de Tratamento] (condicional por perfil /app/mesa-tratamento)
│
├── 🎯 PILAR 2: PROSPECÇÃO INTELIGENTE
│   ├── Motor de Busca & ICP (/app/prospect)
│   ├── Geração & Enriquecimento Outbound (/app/outbound)
│   ├── Cadências Multicanal (/app/cadence)
│   └── [Ações Contextuais de Telefonia: Discador / Dialer / Voice Hub]
│
├── 🧠 PILAR 3: COPILOTO COMERCIAL IA
│   ├── Copiloto Conversacional (/app/intelligence ou /app/copiloto_ia)
│   ├── Inteligência Competitiva & Mercado (/app/market-intelligence)
│   ├── Base de Conhecimento RAG (/app/knowledge)
│   ├── Relatórios & Análise de Win/Loss (/app/reports /app/winloss)
│   └── [Treinamento Contextual: Roleplay / Chatbook / Matriz de Objeções]
│
└── ⚙️ ADMINISTRAÇÃO & OPERAÇÕES (Camada segregada / Rodapé)
    ├── Integrações & Bitrix24 (/app/integrations, /app/bitrix)
    ├── Automações & Webhooks (/app/automations)
    ├── Gestão de Equipe (/app/team)
    ├── Auditoria & Uso de Recursos (/app/usage, /app/module-access)
    └── Configurações da Organização (/app/settings)
```

---

## 3. Matriz de Mapeamento dos 35+ Itens de Aba (`TabType`)

| Tab ID | Rótulo Atual | Pilar Destino | Modalidade | Justificativa |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard` | Dashboard | Command Center | Primário | Ponto de entrada gerencial e cockpit executivo |
| `workspace` | Espaço de Trabalho | Command Center | Primário | Cockpit unificado multitarefa |
| `daily-plan` | Plano Diário | Command Center | Primário (Destaque SDR) | Foco de execução diária para a força de vendas |
| `crm` | CRM Kanban | **Pilar 1: CRM** | Primário | Gestão do pipeline comercial ativo |
| `crm360` | Visão 360 | **Pilar 1: CRM** | Primário | Visão consolidada da conta/cliente |
| `companies` | Empresas | **Pilar 1: CRM** | Primário | Carteira de contas B2B |
| `contacts` | Contatos | **Pilar 1: CRM** | Primário | Pessoas e decisores mapeados |
| `activities` | Atividades | **Pilar 1: CRM** | Primário | Histórico e próximas tarefas |
| `calendar` | Calendário | **Pilar 1: CRM** | Primário | Agenda de reuniões e demonstrações |
| `propostas` | Propostas | **Pilar 1: CRM** | Primário | Geração de propostas comerciais e contratos |
| `mesa-tratamento` | Mesa de Tratamento | **Pilar 1: CRM** | Condicional (Role) | Rota especializada de triagem de inbound |
| `prospect` | Prospecção | **Pilar 2: Prospecção** | Primário | Busca de empresas no mercado e ICP matching |
| `outbound` | Outbound | **Pilar 2: Prospecção** | Primário | Gestão de listas frias e campanhas outbound |
| `cadence` | Cadência | **Pilar 2: Prospecção** | Primário | Sequências de touchpoints multicanal |
| `voice-hub` | Central de Voz | **Pilar 2: Prospecção** | Contextual/Primário | Central telefônica e chamadas de voz IA |
| `dialer` | Discador | **Pilar 2: Prospecção** | Contextual/Primário | Discador rápido integrado à prospecção |
| `intelligence` | Copiloto IA | **Pilar 3: Copiloto** | Primário | Hub de assistência cognitiva e chat RAG |
| `copiloto_ia` | Copiloto Comercial | **Pilar 3: Copiloto** | Primário (Alias) | Alias do Copiloto para assinantes do módulo |
| `commercial_intelligence` | Inteligência | **Pilar 3: Copiloto** | Primário (Alias) | Radar de inteligência de contas |
| `market-intelligence` | Mercado & Concorrência | **Pilar 3: Copiloto** | Primário | Análise mercadológica e concorrência |
| `knowledge` | Base de Conhecimento | **Pilar 3: Copiloto** | Primário | Repositório de documentos para RAG e playbooks |
| `analytics` | Analytics | **Pilar 3: Copiloto** | Primário/Contextual | Diagnóstico preditivo e métricas avançadas |
| `winloss` | Win / Loss | **Pilar 3: Copiloto** | Primário/Contextual | Análise de causas de ganho e perda |
| `reports` | Relatórios | **Pilar 3: Copiloto** | Primário/Contextual | Exportação e visualização de dados agregados |
| `roleplay` | Simulação & Treino | **Pilar 3: Copiloto** | Contextual | Capacitação orientada por IA para SDRs/Closers |
| `chatbook` | Chatbook Playbook | **Pilar 3: Copiloto** | Contextual | Playbooks interativos gerados por IA |
| `qualification_matrix` | Matriz de Qualificação | **Pilar 3: Copiloto** | Contextual | Critérios de qualificação B2B (SPICED/BANT) |
| `objections_matrix` | Matriz de Objeções | **Pilar 3: Copiloto** | Contextual | Guias de contorno de objeções comerciais |
| `topic_training` | Treinamento | **Pilar 3: Copiloto** | Contextual | Trilha de capacitação da equipe |
| `editor` | Editor de Docs | **Pilar 3: Copiloto** | Contextual | Criação de playbooks e notas |
| `notifications` | Notificações | **Administração** | Retrátil/Rodapé | Avisos do sistema e alertas de negócio |
| `bitrix` | Integração Bitrix24 | **Administração** | Retrátil/Rodapé | Painel específico de extração Bitrix24 |
| `integrations` | Integrações Globais | **Administração** | Retrátil/Rodapé | Configuração de APIs, CRMs externos e webhooks |
| `automations` | Automações | **Administração** | Retrátil/Rodapé | Disparo de fluxos automáticos e gatilhos |
| `team` | Equipe & Cargos | **Administração** | Retrátil/Rodapé | Gestão de membros, papéis e permissões |
| `usage` | Consumo & Quotas | **Administração** | Retrátil/Rodapé | Métricas de uso de IA, minutos de voz e dados |
| `module-access` | Acesso a Módulos | **Administração** | Retrátil/Rodapé | Liberação de planos e módulos por tenant |
| `settings` | Configurações | **Administração** | Retrátil/Rodapé | Ajustes de organização, tema e segurança |

---

## 4. Plano de Implementação

1. **Paridade e Preservação de Rotas**: Todas as rotas `/app/<tab>` continuam existindo e funcionando normalmente em `App.tsx` e `tabMeta.ts`. Nenhuma URL é quebrada.
2. **Reorganização de `navGroupsByJourney` em `Sidebar.tsx`**:
   - Substituir os 6 grupos dispersos pelos 3 pilares unificados + Command Center + Administração.
   - Para SDRs (`isRestrictedSdrProfile`), manter o foco em `Plano Diário` no topo e os atalhos de `Prospecção` e `Capacitação`.
3. **Sub-menus / Seções Contextuais**:
   - Capabilities contextuais (como `dialer` dentro de prospecção, ou `roleplay` e `chatbook` dentro do copiloto) podem ser acessadas via botões secundários no cabeçalho ou sub-listas da barra lateral, limpando o visual sem perder o acesso direto.
4. **Verificação de Regressão**:
   - Testes E2E de navegação (`tests/e2e/`) e testes unitários de sidebar continuarão passando normalmente.
