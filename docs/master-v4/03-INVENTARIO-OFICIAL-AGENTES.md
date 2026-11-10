# INVENTÁRIO OFICIAL E GOVERNANÇA DO ECOSSISTEMA DE AGENTES DE IA (ENTREGA 03)
**Projeto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Autoridade:** Agente 00 (Supervisor Geral)  
**Em conformidade com:** `AGENTS.md` e `GUIA-MESTRE-PERSONAGENS-BIRTH-HUB-360.md`  
**Data:** 10 de Novembro de 2026  
**Status:** HOMOLOGADO — TAXONOMIA DE 7 NÍVEIS CONSOLIDADA

---

## 1. Princípio de Separação de Responsabilidades

Para eliminar qualquer ambiguidade entre os agentes que constroem o software e os agentes que executam as tarefas de vendas em produção, o ecossistema é formalmente dividido em **7 categorias estritamente delimitadas**.

---

## 2. As 7 Categorias Oficiais do Ecossistema

### Categoria 1: Agentes de Engenharia e Governança do Repositório (`AGENTS.md`)
São os papéis de engenharia colaborativa que operam no desenvolvimento, teste, segurança e deploy do repositório `MarksNN/Birthub-360`. **Nenhum destes agentes é exposto ao cliente final.**

- **00 — Coordenador / Supervisor Geral:** Orquestração global, planejamento de ondas, matriz de rastreabilidade, gates e conflitos.
- **01 — Plataforma, Segurança e Dados:** Modelagem Prisma, infraestrutura de banco e isolamento multi-tenant.
- **01A — Confiabilidade de Dados, RLS e Retenção:** Especialista em Row-Level Security, retenção e integridade.
- **02 — Produto e UX:** Desenho de jornadas, fluxos de usuário e arquitetura de navegação.
- **03 — Design e Acessibilidade:** Design system, tokens visuais e conformidade WCAG 2.2 AA.
- **04 — CRM e BI:** Lógica de negócio do funil, métricas e relatórios executivos.
- **05 — Prospecção:** Estratégias de outbound e descoberta de mercado.
- **06 — Integrações e Bitrix:** Conectores externos, webhooks e APIs parceiras.
- **06A — Extrações Bitrix:** Especialista em sincronização e paginação profunda do Bitrix24.
- **07 — IA e Automações:** Motores de regras, prompts e pipelines de inferência.
- **08 — QA e Release:** Testes automatizados, qualidade e empacotamento.
- **08A — Operações Git e Deploy AWS:** Operações de CI/CD, esteiras e publicação autorizada.
- **09 — Mobile:** Desenvolvimento do aplicativo híbrido/nativo Capacitor e sincronização offline.
- **10 — Infraestrutura, Observabilidade e SRE:** Kubernetes, Docker, OpenTelemetry e resiliência.
- **11 — Marca e Ativos Institucionais:** Brandbook, logos vetoriais em SVG e diretrizes de identidade.
- **12 — Voz e Telefonia:** WebRTC, telefonia SIP, transcrição de áudio e dialers.
- **13 — Enxame Autônomo e Governança de Runtime:** Supervisão dos agentes em produção.
- **14 — Ambiente de Execução e Test Harness:** Infraestrutura de testes e mocks.
- **15 — Segurança Aplicada e Rotação de Segredos:** Gestão de chaves, criptografia e proteção de PII.
- **16 — Runtime, Workers e Escala:** Filas BullMQ, Redis e balanceamento de workers.
- **17 — Cadência Multicanal e Ciclo de Receita:** Regras de cadência e motor de engajamento.
- **18 — Contratos, API e Documentação Viva:** Especificações OpenAPI e contratos de dados.
- *Agentes 19 e 20: Reservados (Não utilizados).*
- **21 — Privacidade e LGPD:** Direitos do titular, inventário de tratamento e bases legais.
- **22 — Verificação de Realidade:** Auditoria de persistência real de dados em banco de produção.
- **23 — Custo, Performance e Limites de IA:** Gestão de orçamento de tokens, N+1 e latência.
- **24 — Revisão Independente:** Auditor compulsório de PRs, diffs e conformidade com AGENTS.md.

---

### Categoria 2: Agentes Comerciais Operacionais (Runtime de Produção)
São os **15 Agentes Nativos** que operam em background e em tempo real sobre os dados comerciais dos clientes, governados pelo Supervisor Central:

| ID Canônico | Nome Comercial | Domínio Principal | Nível de Risco Típico | Limite de Autonomia |
| :--- | :--- | :--- | :--- | :--- |
| `ldr-intelligence` | Lead Development Rep | Higienização e estruturação prévia de dados de empresas | LOW | Autônomo para leitura e preenchimento |
| `bdr-outbound` | Business Development Rep | Redação de abordagens hiper-personalizadas para prospecção | MEDIUM | Sugere mensagens; envio retido |
| `sdr-qualification` | Sales Development Rep | Condução de qualificação BANT e triagem de cadências | MEDIUM | Autônomo em triagem; envio retido |
| `closer-sales` | Closer Copilot | Apoio tático em reuniões, objeções e propostas | HIGH | Sugere termos; proibido fechar deal |
| `coordinator-commercial` | Coordenador de Vendas | Balanceamento de carga de trabalho e SLAs de atendimento | MEDIUM | Autônomo em roteamento de leads |
| `manager-commercial` | Gerente Comercial IA | Avaliação de performance e cálculo de alçadas de desconto | HIGH | Exige confirmação humana |
| `executive-director` | Diretor Executivo IA | Visão macro de metas e alçadas máximas de exceção | HIGH | Exige confirmação do Admin |
| `billing-revenue` | Auditor de Faturamento | Auditoria de contratos, cobrança e faturamento recorrente | HIGH | Bloqueio compulsório para alteração |
| `churn-retention` | Guardião de Retenção | Monitoramento de telemetria e planos de resgate de clientes | MEDIUM | Dispara alertas preventivos |
| `contract-signature` | Guardião Contratual | Condução de fluxo de formalização e assinatura digital | HIGH | Bloqueio para envio de contratos |
| `bitrix-guardian` | Guardião do Bitrix24 | Monitoramento de anomalias e integridade de sincronização | LOW | Autônomo para correção de mapeamentos |
| `revenue-intelligence` | Oráculo de Receita | Modelagem preditiva e projeção de forecast ponderado | LOW | Autônomo para cálculo de ratings |
| `account-detective` | Detetive de Conta | Investigação pré-reunião e dossiê em 10 seções (Onda 02) | LOW | Autônomo para pesquisa e síntese |
| `promise-guardian` | Guardião de Promessas | Detecção de promessas verbais em áudios e transcrições | MEDIUM | Cria rascunhos de tarefas pendentes |
| `devils-advocate` | Advogado do Diabo | Auditoria crítica de probabilidade de negócios estagnados | LOW | Autônomo para rebaixar rating preditivo |

---

### Categoria 3: Agentes Especializados de Canais e Voz
Componentes complementares de interface e telecomunicação:
- `voice-agent`: Discador autônomo, detecção de secretária eletrônica (AMD) e saudação governada.
- `sdr-diagnostic`: Diagnóstico de maturidade de leads inbound.
- `hunter-agent`: Scanners automáticos de novas contas no mercado.
- `tactical-agent`: Assistente de respostas rápidas em chat.

---

### Categoria 4: Personas do Catálogo Expandido (Agent Builder)
- **Quantidade:** 379 personas especializadas serializadas em `src/features/job-roles/catalog/agents.normalized.json`.
- **Propósito:** Biblioteca de templates de agentes pré-configurados (ex: `ABTestAutomator`, `AdFatigueMonitor`, `CashFlowClairvoyant`, `CompetitorX-Ray`) que as organizações podem instanciar e customizar através do construtor de agentes (`AgentBuilderView.tsx`).

---

### Categoria 5: Avatares Institucionais de Interface (Dots Não-Humanos)
Os 9 personagens canônicos em SVG definidos pelo Agente 11 no Brandbook oficial. Representam visualmente os pilares do sistema na UI:

1. **Orbit:** Guardião do CRM & Giroscópio Gravitacional (Hub Comercial).
2. **Nexus:** Prisma Hexagonal & Analista de Mercado (Inteligência de Mercado).
3. **Aria:** Fita Harmônica de Möbius & Maestrina de Cadência (Orquestração de Vendas).
4. **Vanguard:** Chevron Ascendente & Lança de Metas (Performance Comercial).
5. **Oracle:** Astrolábio Ocular & Previsão Preditiva (Previsibilidade Comercial).
6. **Core:** Orbe Neural Sináptico & Coordenador do Enxame (Inteligência Artificial).
7. **Spark:** Centelha Estelar 4 Pontas & Mestre das Conexões (Automação & Conectividade).
8. **Echo:** Cápsula Acústica & Comunicação de Voz (Engajamento Comercial).
9. **Sudo:** Monólito Isométrico Criptográfico (Admin & Operations).

---

### Categoria 6: Ferramentas e Capacidades de IA (Capabilities Catalog)
Catálogo formal de primitivas técnicas que os agentes podem invocar via permissão RBAC (definidas em `agentCapabilities.normalized.json`):
- `crm_read`, `crm_write`, `market_enrich`, `dossier_generate`, `forecast_calc`, `rag_search`, `voice_dial`, `contract_issue`, etc.

---

### Categoria 7: Supervisor Central e Mecanismos de Delegação
- **Componente:** `RoleSupervisor` (`src/features/job-roles/`).
- **Função:** Orquestrador central em runtime. Decompõe requisições complexas em DAGs de subtarefas, encaminha comandos para os agentes especialistas via `AgentBus`, gerencia memória compartilhada (`agentMemory.store.ts`), calcula quotas de tokens e retém ações classificadas com risco `HIGH` na tabela `AIPendingAction`.

---

## 3. Matriz de Governança e Alçadas dos Agentes em Runtime

| Nível de Ação | Exemplo de Ação | Fluxo de Aprovação Obrigatório |
| :--- | :--- | :--- |
| **Informativa / Leitura** | Pesquisa de CNPJ, leitura de notas, cálculo de forecast | Execução 100% autônoma |
| **Interna / Rascunho** | Criação de tarefa sugerida no CRM, sugestão de estágio | Executa e notifica o responsável |
| **Externa / Comercial** | Disparo de e-mail de cadência, envio de WhatsApp | Retém em `AIPendingAction` (Human-in-the-Loop) |
| **Financeira / Jurídica**| Aplicação de desconto em proposta, envio de contrato | Bloqueio compulsório; exige alçada do Gestor/Diretor |
| **Destrutiva / Exclusão**| Anonimização de titular LGPD, deleção de registros | Bloqueio absoluto; somente Admin via 2FA |
