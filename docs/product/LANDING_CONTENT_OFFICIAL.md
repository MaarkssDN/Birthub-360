# Birth Hub 360° — Especificação Oficial de Conteúdo da Landing Page

> **Status:** Documento Normativo e Fonte Única da Verdade (SSOT)  
> **Data de Publicação:** Outubro/2026  
> **Classificação:** Conteúdo Institucional & Engenharia de Produto  
> **Conformidade:** `AGENTS.md` (P1–P4, §22, §24, §25, §26, §27)

---

## 1. Princípios Editoriais & Diretrizes de Verdade Operacional

1. **Preciso, Não Promocional:** Toda afirmação na landing page reflete exclusivamente capacidades com base de código existente, testada e auditável no repositório. O produto não faz promessas infladas nem utiliza chavões vazios de marketing.
2. **Proibição Estrita de Métricas Fabricadas (§25 de AGENTS.md):** É estritamente proibido exibir dados numéricos estáticos falsos simulando atividade real (como *"184 contatos ativos"*, *"Deal #4892 de R$ 140k"*, *"12 cadências ativas"*, *"100% OPERACIONAL"*). Quando ilustrações de produto forem necessárias, deve-se explicitar visualmente a estrutura de painéis e processos, sem forjar telemetria.
3. **Previsibilidade com Dependência Declarada:** O recurso de previsibilidade comercial opera sobre um motor determinístico explicável (`forecastEngine.ts`). A landing deve afirmar com clareza que projeções dependem da integridade e maturidade dos dados inseridos no CRM, sem apresentar "Forecast Real" como uma fórmula mágica instantânea.
4. **Ecossistema Abrangente (Não Limitado ao Bitrix24):** A plataforma integra múltiplos pilares tecnológicos: CRMs e ERPs legados, mensageria via WhatsApp e E-mail, telefonia PBX em nuvem, provedores de enriquecimento B2B (Apollo, Hunter, Receita Federal), bancos vetoriais e gateways de IA multi-modelo.
5. **Segurança e Conformidade com Base Legal:** Criptografia em repouso AES-256-GCM para chaves de API, isolamento multi-tenant rigoroso no banco de dados e direitos do titular assegurados conforme a LGPD (Arts. 18 e 18 V).

---

## 2. Auditoria e Mapeamento Evidencial do Repositório

### 2.1. Conectividade & Integrações (`src/features/integrations`)

| Categoria | Tecnologia / Provedor | Arquivo de Evidência | Status Real | Descrição Operacional |
| :--- | :--- | :--- | :--- | :--- |
| **CRM Central** | **Bitrix24** | `src/features/integrations/bitrix/bitrix.service.ts` | **IMPLEMENTADO** | Sincronização bidirecional de leads, deals, tarefas e writeback estruturado com webhooks. |
| **CRMs Externos** | **HubSpot, Pipedrive, RD Station** | `src/features/integrations/shared/externalCrm.service.ts` | **IMPLEMENTADO** | Barramento unificado para espelhamento e transição de contatos entre CRMs corporativos. |
| **ERP / Faturamento** | **Omie ERP** | `src/features/integrations/omie/omie.service.ts` | **IMPLEMENTADO** | Consulta e conciliação de faturamento e dados cadastrais de clientes corporativos. |
| **Mensageria Instantânea**| **WhatsApp (Baileys Engine)** | `src/features/integrations/whatsapp/whatsapp.service.ts` | **IMPLEMENTADO** | Pareamento via QR Code por organização, bloqueio distribuído via Redis e respeito estrito a Opt-Out. |
| **Comunicação por E-mail**| **SMTP / IMAP / Webhook** | `src/features/integrations/email/emailReply.webhook.ts` | **IMPLEMENTADO** | Disparo de mensagens e captura de respostas (`EmailMessage`) com vinculação direta ao lead. |
| **Telefonia Corporativa** | **3CX PBX** | `src/features/integrations/threecx/threecx.service.ts` | **IMPLEMENTADO** | Conexão com central telefônica 3CX, registro de ramais, discagem e histórico de chamadas. |
| **Voz Ativa & SDR IA** | **Birth Voice** | `src/features/integrations/birth-voice/birthVoice.service.ts` | **IMPLEMENTADO** | Discador inteligente com supressão de chamadas repetidas, políticas de contato e transcrição. |
| **Enriquecimento B2B** | **Apollo.io** | `src/features/prospecting/services/apollo.service.ts` | **IMPLEMENTADO** | Localização de decisores, emails corporativos verificados e atributos de empresas. |
| **Validação de Contatos** | **Hunter.co** | `src/features/prospecting/services/hunter.service.ts` | **IMPLEMENTADO** | Verificação de sintaxe e entregabilidade de caixas postais corporativas. |
| **Dados Cadastrais BR** | **Receita Federal / CNPJ** | `src/features/prospecting/services/cnpj.util.ts` | **IMPLEMENTADO** | Consulta de razão social, CNAE, quadro societário (QSA) e situação cadastral ativa. |
| **Inteligência Local** | **Google Places / Nominatim**| `src/features/prospecting/services/places.service.ts` | **IMPLEMENTADO** | Busca de empresas por geolocalização e informações públicas de estabelecimentos. |
| **Google Workspace** | **Gmail & Google Calendar** | `src/features/integrations/google/google.service.ts` | **IMPLEMENTADO** | Integração OAuth2 para leitura de interações no Gmail e agendamento de eventos no Calendar. |
| **Gateways de IA** | **LiteLLM / Ollama / OpenAI** | `src/lib/ai/gateway/providers/` | **IMPLEMENTADO** | Roteamento dinâmico entre modelos na nuvem (OpenAI/Anthropic) e modelos locais (Ollama self-hosted). |
| **Bancos de Dados IA** | **Qdrant & Meilisearch** | `src/lib/queue/search.queue.ts` | **IMPLEMENTADO** | Qdrant para recuperação semântica vetorial (RAG) e Meilisearch para indexação e busca textual veloz. |
| **Colaboração Interna** | **Slack** | `src/features/integrations/slack/slack.service.ts` | **IMPLEMENTADO** | Notificações em canais corporativos e alertas de eventos críticos do pipeline. |
| **Cobrança Recorrente** | **Stripe** | `src/features/integrations/stripe/stripe.service.ts` | **IMPLEMENTADO** | Gestão de assinaturas, faturas corporativas e controle de limites de utilização. |

---

### 2.2. Segurança, Governança e Autenticação

1. **Criptografia em Repouso:**
   - Credenciais de integrações (Bitrix Webhook Secrets, chaves 3CX, tokens externos) são cifradas e decifradas de forma transparente pelo Prisma usando **AES-256-GCM** (`src/lib/crypto/secretFields.ts`).
2. **Autenticação:**
   - Provedor central: **Better Auth** com PostgreSQL (`src/lib/auth.ts`).
   - Métodos suportados: **E-mail & Senha** com hash seguro, proteção contra força bruta por IP e bloqueio temporário de conta (15 min) após 5 tentativas incorretas.
   - Provedores Sociais: **Google** e **Microsoft** suportados sob configuração de credenciais no ambiente.
   - *Atenção (Não declarar):* SAML SSO corporativo e autenticação em dois fatores (2FA/MFA) por plugin não estão configurados nativamente no momento.
3. **Isolamento de Dados (Multi-Tenancy):**
   - Todas as tabelas corporativas possuem coluna `organizationId`. A extensão Prisma e os middlewares (`requireTenant`, `requestContext`) injetam o escopo de organização e impedem vazamento de dados entre empresas.
4. **Conformidade LGPD:**
   - Módulo ativo em `src/features/lgpd/`:
     - Exclusão e anonimização de titulares de dados (Art. 18).
     - Exportação e portabilidade de dossiê do titular (Art. 18 V).
     - Expurgo programado de dados temporários via worker em background (`autoAnonymizeWorker`).
     - Trilha de auditoria estruturada (`AuditService`).

---

### 2.3. Motor de Automações & Processamento em Segundo Plano

1. **Gatilhos Implementados no Motor de Regras (`automation.engine.ts`):**
   - `Lead criado`
   - `Lead mudou de status`
   - `Atividade concluída`
   - `Lead estagnado`
2. **Ações Executadas pelo Motor:**
   - `Notificar equipe` (Notificação no sistema via sino e/ou envio de e-mail corporativo via SMTP).
   - `Criar atividade` (Agendamento automático de tarefas de contato com prazo determinado).
   - `Ligar via SDR de Voz` (Disparo de chamada via motor Birth Voice).
   - Integração com webhooks de orquestração externa (n8n).
3. **Workers Especializados (BullMQ / Redis):**
   - 24 workers em segundo plano garantindo execução assíncrona para sincronização Bitrix, deduplicação de leads, escaneamento de estagnação, cálculo de métricas de win/loss, geração de relatórios e monitoramento de notícias.

---

### 2.4. Inteligência Artificial, Copiloto e Previsibilidade

1. **Copiloto Comercial IA:**
   - Ancorado em dados reais do CRM, conversas e documentos de suporte.
   - Funcionalidades: Diagnóstico de saúde de negociações (`dealHealthScoring.ts`), sugestão de campos do CRM, síntese de reuniões e suporte a objeções.
   - *Living Playbook & Roleplay:* Matriz de qualificação, matriz de objeções e ambiente de treino simulado com IA para capacitação contínua de vendedores.
2. **Previsibilidade Comercial:**
   - **Motor Determinístico Explicável:** Não utiliza inferências opacas de caixa preta. Executa cálculo baseado na probabilidade real da etapa do pipeline, histórico de permanência na fase (`LeadStageHistory`), frequência de adiamento de data de fechamento (`closeDateSlips`) e tempo desde a última interação.
   - **Dependência Declarada:** A precisão do modelo depende diretamente do volume e da disciplina de atualização cadastral dos usuários no CRM.

---

## 3. Diretrizes de Claims e Declarações Proibidas (Anti-Patterns)

Para manter o rigor corporativo, a landing page **NUNCA** deve conter:

- ❌ **Métricas simuladas como reais:** Proibido exibir contadores de leads fictícios ("184 leads", "3 em risco", "12 cadências ativas", "100% OPERACIONAL").
- ❌ **SLA sem amparo contratual:** Proibido prometer "99.99% Uptime SLA" sem contrato formal de nível de serviço com o cliente.
- ❌ **Afirmações genéricas sobre privacidade de IA:** Não declarar "Seus dados jamais são usados para treinar modelos" de maneira genérica sem detalhar a arquitetura técnica de isolamento por provedor e chaves privadas do cliente.
- ❌ **Gatilhos de automação não suportados:** Não afirmar detecção de "abertura de propostas por link" como gatilho do motor de regras, visto que o motor opera sobre criação de leads, mudanças de etapa, tarefas concluídas e estagnação temporal.
- ❌ **SAML SSO Enterprise / MFA ativo:** Não ofertar botões de SAML genérico ou 2FA nativo como disponíveis se não estiverem ativados no servidor.
- ❌ **Forecast Infalível / "Forecast Real":** Não sugerir que a ferramenta adivinha o futuro sem dados cadastrais limpos.

---

## 4. Estrutura Textual Oficial das 14 Seções

A landing page é composta pelas seguintes 14 seções em ordem estrita:

```text
1. NAVBAR
   ↓
2. HERO
   ↓
3. PROBLEMA
   ↓
4. PLATAFORMA
   ↓
5. 8 PILARES
   ↓
6. FLUXO OPERACIONAL
   ↓
7. IA
   ↓
8. AUTOMAÇÃO
   ↓
9. PERFORMANCE
   ↓
10. PREVISIBILIDADE
   ↓
11. ECOSSISTEMA
   ↓
12. COMMAND CENTER
   ↓
13. CTA
   ↓
14. FOOTER
```

### Seção 1 — NAVBAR
- **Marca:** Birth Hub 360° · Business Command Center
- **Links de Navegação:**
  - Visão Geral (`#plataforma`)
  - 8 Pilares (`#pilares`)
  - Fluxo (`#fluxo`)
  - IA (`#ia`)
  - Automação (`#automacao`)
  - Performance (`#performance`)
  - Previsibilidade (`#previsibilidade`)
  - Ecossistema (`#ecossistema`)
  - Cockpit (`#command-center`)
- **Ações:** Botão "Acessar Plataforma" (redireciona para o modal de autenticação).

---

### Seção 2 — HERO
- **Badge:** `ARQUITETURA COMERCIAL INTEGRADA · VERSÃO ENTERPRISE`
- **Headline:** `O Centro de Comando Definitivo para a sua Operação Comercial`
- **Subheadline Oficial (Verbatim):**  
  *"Conecte CRM, dados, inteligência artificial e automação em um único centro de comando para planejar, monitorar, prever e acelerar suas operações comerciais."*
- **CTAs:**
  - Primário: "Acessar Plataforma →"
  - Secundário: "Conhecer os 8 Pilares"
- **Tags de Capacidades Reais:**
  - Hub Comercial Unificado
  - Inteligência de Mercado B2B
  - Cadências de Contato
  - Velocidade de Pipeline
  - Previsibilidade Explicável
  - Copiloto Especializado
  - Conectividade Multi-CRM
  - Telefonia PBX Integrada

---

### Seção 3 — PROBLEMA
- **Badge:** `O DESAFIO DA OPERAÇÃO MODERNA`
- **Título:** `A fragmentação de ferramentas custa receita todos os dias`
- **Subtítulo:** `A maioria dos times comerciais perde tempo alternando entre planilhas, sistemas desconectados e processos manuais que geram silos de informação.`
- **Três Dores Centrais:**
  1. **Dados Descentralizados:** Informações de contatos, interações e propostas espalhadas entre múltiplos softwares sem uma visão única do cliente.
  2. **Gargalos Invisíveis:** Negociações travadas por dias em fases críticas sem que a liderança perceba antes do fechamento do mês.
  3. **Esforço Braçal Repetitivo:** Vendedores gastando horas preciosas preenchendo cadastros manuais em vez de negociar com decisores.

---

### Seção 4 — PLATAFORMA
- **Badge:** `ARQUITETURA INTEGRADA`
- **Título:** `Uma base sólida em três camadas estratégicas`
- **Subtítulo:** `O Birth Hub 360° conecta a infraestrutura de dados à tomada de decisão executiva.`
- **As 3 Camadas:**
  1. **Camada de Dados & Conectividade:** Conexão nativa com Bitrix24, ERPs (Omie), centrais telefônicas (3CX) e canais de mensageria em uma arquitetura de banco de dados protegida.
  2. **Camada de Inteligência & Diagnóstico:** Motores determinísticos de qualificação, copilotos contextuais com base de conhecimento (RAG) e matrizes de objeções para suporte a vendas.
  3. **Camada de Cockpit & Execução:** Interfaces dedicadas para cada papel (SDR, Closer, Gestor), com filas de atendimento organizadas por prioridade e regras de passagem de bastão.

---

### Seção 5 — 8 PILARES
- **Badge:** `ESTRUTURA OFICIAL DO PRODUTO`
- **Título:** `Os 8 Pilares Oficiais do Birth Hub 360°`
- **Subtítulo:** `Cada pilar resolve uma dimensão estratégica da operação comercial, operando de forma independente ou em perfeita sinergia sistêmica.`
- **Especificação dos Cards Coloridos (Verbatim):**
  1. **01 · HUB COMERCIAL** (`#0284C7`) — Centralização de contas, pipeline comercial unificado e visão 360° de cada oportunidade em negociação. *Foco: Gestão Unificada de Oportunidades.*
  2. **02 · INTELIGÊNCIA DE MERCADO** (`#2563EB`) — Enriquecimento analítico de dados B2B, sinais de compra, qualificação precisa e inteligência de decisores. *Foco: Sinais & Qualificação Preditiva.*
  3. **03 · ORQUESTRAÇÃO DE VENDAS** (`#0EA5E9`) — Cadências multicanal coordenadas, regras de transição de bastão e alinhamento operacional de ponta a ponta. *Foco: Cadências & Passagem de Bastão.*
  4. **04 · PERFORMANCE COMERCIAL** (`#16A34A`) — Telemetria de conversão, velocidade de avanço no funil, metas operacionais e produtividade da equipe. *Foco: Métricas & Conversão em Tempo Real.*
  5. **05 · PREVISIBILIDADE COMERCIAL** (`#D97706`) — Modelagem estatística de probabilidade, análise de pipeline ponderado e cenários embasados no histórico real. *Foco: Cenários & Probabilidade Real.*
  6. **06 · INTELIGÊNCIA ARTIFICIAL** (`#7C3AED`) — Copiloto comercial ancorado nos dados da empresa, diagnóstico de entraves e suporte ativo em negociações. *Foco: Agentes & Diagnóstico Contextual.*
  7. **07 · AUTOMAÇÃO & CONECTIVIDADE** (`#EA580C`) — Sincronização contínua bidirecional, gatilhos de follow-up em tempo real e integração profunda com Bitrix24. *Foco: Integrações & Ações Instantâneas.*
  8. **08 · ENGAJAMENTO COMERCIAL** (`#E11D48`) — Comunicação integrada, telefonia em nuvem, histórico de interações e rastreabilidade total de contatos. *Foco: Telefonia & Registro de Contato.*

---

### Seção 6 — FLUXO OPERACIONAL
- **Badge:** `CICLO OPERACIONAL COMPLETO`
- **Título:** `Como os dados fluem da prospecção ao fechamento`
- **Subtítulo:** `Um processo ponta a ponta estruturado com governança de dados, rastreamento de interações e transições claras entre etapas.`
- **As 5 Etapas do Fluxo:**
  1. **ETAPA 01 · Captura & Ingestão:** Entrada de contas e contatos através de formulários, listas prospectadas ou sincronização direta com Bitrix24 e CRMs integrados.
  2. **ETAPA 02 · Enriquecimento Cadastral:** Validação de CNPJ e dados corporativos, identificação de decisores e confirmação de e-mails via provedores analíticos.
  3. **ETAPA 03 · Triagem & Distribuição:** Atribuição aos responsáveis de pré-vendas (SDR) e execução de réguas de contato com controle de horário e opt-out.
  4. **ETAPA 04 · Negociação Assistida:** Apoio em tempo real com matriz de objeções, sugestões do copiloto comercial e histórico unificado de chamadas e mensagens.
  5. **ETAPA 05 · Conclusão & Aprendizado:** Registro formal de fechamento com auditoria de causas de perda (Win/Loss) para calibração contínua do processo.

---

### Seção 7 — IA (INTELIGÊNCIA ARTIFICIAL)
- **Badge:** `IA CONTEXTUAL ESPECIALIZADA`
- **Título:** `Inteligência Artificial orientada a processos e dados comerciais`
- **Subtítulo:** `Modelos de linguagem conectados à base de conhecimento da sua empresa para apoiar o vendedor em momentos decisivos da negociação.`
- **Três Capacidades Centrais:**
  1. **Diagnóstico de Negociações:** Análise dos fatores de avanço e detecção de riscos de estagnação com base no tempo de permanência em cada estágio.
  2. **Playbooks & Simulação (Roleplay):** Treinamento ativo da equipe contra objeções típicas de mercado com avaliações orientadas por IA.
  3. **Sugestão de Próxima Ação:** Recomendações fundamentadas no histórico de interações registradas no CRM, auxiliando no avanço do pipeline.
- **Painel Ilustrativo:**
  - Demonstração do assistente com estrutura de diagnóstico: análise de etapa, identificação de ausência de contato e recomendação de abordagem estruturada, sem números fictícios ou nomes falsos.

---

### Seção 8 — AUTOMAÇÃO (& CONECTIVIDADE)
- **Badge:** `MOTOR DE REGRAS E WORKERS`
- **Título:** `Automação precisa para eliminar gargalos operacionais`
- **Subtítulo:** `Regras determinísticas e filas assíncronas que garantem consistência nas rotinas comerciais sem depender de lembretes manuais.`
- **Três Pilares de Automação:**
  1. **Gatilhos por Eventos do Ciclo:** Execução imediata de ações diante de eventos como novo lead cadastrado, alteração de etapa no funil ou tarefas concluídas.
  2. **Escaneamento de Estagnação:** Monitoramento em segundo plano que identifica oportunidades esquecidas e alerta os responsáveis antes da perda do contato.
  3. **Sincronização Bidirecional:** Atualização contínua de status e dados entre o Birth Hub 360° e suas ferramentas legadas via webhooks seguros e filas assíncronas.

---

### Seção 9 — PERFORMANCE COMERCIAL
- **Badge:** `TELEMETRIA E GESTÃO DE METAS`
- **Título:** `Visibilidade analítica sobre a tração da sua equipe`
- **Subtítulo:** `Acompanhe métricas essenciais de pipeline, conversão por fase e motivos de perda com precisão cirúrgica.`
- **Quatro Dimensões de Performance:**
  1. **Conversão por Estágio:** Visualização clara das passagens de fase no funil para identificar onde a operação perde volume.
  2. **Velocidade de Negociação:** Acompanhamento do ciclo médio de vendas e do tempo que oportunidades permanecem em cada etapa.
  3. **Acompanhamento de Metas (Pace):** Monitoramento contínuo do faturamento realizado frente aos objetivos traçados para o período.
  4. **Análise de Win / Loss:** Diagnóstico estruturado sobre as razões de ganho e perda de contas para aprimorar a estratégia de produto e abordagem.

---

### Seção 10 — PREVISIBILIDADE COMERCIAL
- **Badge:** `RIGOR ANALÍTICO E PROBABILIDADE`
- **Título:** `Previsibilidade construída sobre a maturidade dos seus dados`
- **Subtítulo:** `Modelagem explicável de pipeline ponderado baseada em probabilidades de fechamento e taxas históricas, sem ilusões de previsões automáticas sem dados.`
- **Três Fundamentos Metodológicos:**
  1. **Pipeline Ponderado Explicável:** Cálculo transparente que ajusta a probabilidade de fechamento conforme o histórico de adiamentos e a etapa real da negociação.
  2. **Dependência de Dados Declarada:** O sistema é honesto com a liderança: a acurácia de projeções futuras exige disciplina e preenchimento consistente do time.
  3. **Cenários de Projeção:** Comparação entre cenários conservadores e prováveis para embasar decisões de alocação de recursos e metas.

---

### Seção 11 — ECOSSISTEMA
- **Badge:** `CONECTIVIDADE MULTI-PLATAFORMA`
- **Título:** `Conectado ao ecossistema tecnológico corporativo`
- **Subtítulo:** `O Birth Hub 360° integra-se nativamente com as principais ferramentas do seu fluxo de vendas, gestão e comunicação.`
- **Grade Completa de Integrações (Não Limitada ao Bitrix24):**
  1. **CRMs & ERPs:** Bitrix24 (sincronização bidirecional completa), Omie ERP (faturamento e clientes), HubSpot, Pipedrive e RD Station.
  2. **Mensageria & E-mail:** WhatsApp (integração direta com isolamento de sessão) e E-mail corporativo (rastreamento de respostas).
  3. **Telefonia & Voz:** 3CX PBX (integração de ramais e discagem) e Birth Voice (motor de ligações ativas com supressão).
  4. **Enriquecimento B2B:** Provedores de inteligência de mercado (Apollo.io, Hunter.co, Receita Federal / CNPJ e Google Places).
  5. **Workspace & Produtividade:** Google Workspace (Gmail e Google Calendar) e Slack para alertas operacionais.
  6. **Infraestrutura de IA:** Gateway LiteLLM (OpenAI, Anthropic), Ollama (modelos locais self-hosted) e banco vetorial Qdrant para RAG.

---

### Seção 12 — COMMAND CENTER
- **Badge:** `COCKPIT OPERACIONAL UNIFICADO`
- **Título:** `O centro de comando desenhado para cada função comercial`
- **Subtítulo:** `Ambientes especializados com foco na execução diária de SDRs, no fechamento de negócios por Closers e na governança estratégica de Gestores.`
- **Visões por Cargo:**
  1. **Mesa de Tratamento (SDR / BDR):** Fila de oportunidades ordenada por prioridade, dados de contato enriquecidos e sugestões imediatas de abordagem.
  2. **Gestão de Oportunidades (Closer):** Visão completa do histórico de interações, suporte a objeções e diagnóstico de saúde do deal.
  3. **Painel de Governança (Gestor):** Visão agregada do funil, alertas de estagnação de negócios e acompanhamento do cumprimento de metas em tempo real.
- **Estrutura Visual do Cockpit:** Representação arquitetural dos três módulos de controle (Mesa Operacional, Pipeline Central e Alertas Estratégicos), sem indicadores inventados.

---

### Seção 13 — CTA (CALL TO ACTION)
- **Título:** `Pronto para estruturar sua operação comercial com rigor e inteligência?`
- **Subtítulo:** `Acesse o centro de comando do Birth Hub 360° e conecte equipe, processos e decisões em uma única plataforma.`
- **Botão Principal:** "Acessar Plataforma →" (abre o modal de autenticação).
- **Indicadores de Segurança:** `Acesso Corporativo Seguro` · `Isolamento por Organização` · `Criptografia AES-256`

---

### Seção 14 — FOOTER
- **Identidade:** Birth Hub 360° · Business Command Center
- **Navegação:** Links ancorados para todas as seções (Problema, Plataforma, 8 Pilares, Fluxo, IA, Automação, Performance, Previsibilidade, Ecossistema, Cockpit).
- **Rodapé Legal e Técnico:**
  - Copyright: `© 2026 Birth Hub 360°. Todos os direitos reservados.`
  - Badges de Conformidade: `Isolamento Multi-Tenant` · `Conformidade LGPD` · `Criptografia em Repouso AES-256-GCM`.
