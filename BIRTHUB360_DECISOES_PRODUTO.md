# BIRTHUB 360° — REGISTRO DE DECISÕES DE PRODUTO, ARQUITETURA E PROPOSTAS COMERCIAIS

**Versão do Documento:** 4.0.0 — Oficial Definitiva  
**Data:** 08 de Novembro de 2026  
**Status:** Especificação Mestra de Engenharia de Produto  
**Governança:** Autoridade Global de Decisões e Estratégia de Produto  

---

## 1. NATUREZA DESTE DOCUMENTO

Este documento formaliza as **Decisões de Engenharia de Produto (Architecture & Product Decision Records - ADRs)** adotadas para a construção definitiva do **Birthub 360°**, bem como apresenta as **Propostas Comerciais e de Governança Estratégica que dependem de aprovação formal do Sponsor do Produto**.

> [!IMPORTANT]
> Em estrito cumprimento às diretrizes da Missão Devin, nenhuma precificação comercial, compromisso contratual ou cota de consumo é declarada como "fato consumado" sem a devida chancela executiva. Tais matérias são apresentadas como **Propostas Técnicas Recomendadas (Pendentes de Aprovação Executiva)**, com especificações completas de funcionamento.

---

## 2. DECISÕES DE PRODUTO E ARQUITETURA ADOTADAS (APROVADAS NA ESPECIFICAÇÃO)

### ADR-01: Arquitetura de Enxame Hierárquico Multiagente com Supervisor Central
- **Status:** Adotada e Especificada.
- **Contexto:** Plataformas que utilizam um único modelo ou prompts longos monolíticos sofrem degradação de contexto, alucinações severas e custo exorbitante de tokens.
- **Decisão:** O Birthub 360° adota um enxame de **24 agentes especializados** coordenados por um orquestrador central (`supervisor.agent`). Cada agente possui ferramentas estritas, esquemas tipados de entrada/saída e limites de autonomia delimitados.
- **Impacto:** Confiabilidade operacional máxima, rastreabilidade de custos por tarefa cognitiva e facilidade de substituição individual de modelos de linguagem sem quebra de ecossistema.

### ADR-02: Isolamento Físico-Lógico Multi-Tenant com PostgreSQL Row-Level Security (RLS)
- **Status:** Adotada e Especificada.
- **Contexto:** Em SaaS corporativo B2B, a separação visual no frontend não constitui prova de isolamento. Falhas de autorização de nível de objeto (BOLA/IDOR) são o principal vetor de invasão em nuvem.
- **Decisão:** Todas as tabelas de entidades comerciais possuem a coluna `organization_id UUID NOT NULL` com aplicação compulsória de políticas de RLS no PostgreSQL. Nenhuma query na camada de aplicação é executada sem a atribuição da variável de sessão `app.current_tenant_id`.
- **Impacto:** Impossibilidade matemática de vazamento de dados entre empresas clientes no nível de banco de dados.

### ADR-03: Sincronização Bidirecional com Bitrix24 Governança pelo BitrixGuardian
- **Status:** Adotada e Especificada.
- **Contexto:** Sincronizações bidirecionais entre CRM proprietário e sistemas externos (Bitrix24) geram loops infinitos de replicação (efeito eco) e corrupção de dados.
- **Decisão:** Implementação do agente de infraestrutura `bitrixGuardian.agent`, que assina digitalmente cada payload outbound com hash único (`UF_B360_SYNC_HASH`). Quando o webhook do Bitrix24 retorna, o agente valida o hash e descarta ecos instantaneamente, além de operar fila de retentativas com backoff exponencial e Dead-Letter Queue.
- **Impacto:** Coexistência pacífica com bases legadas sem duplicidade de registros.

### ADR-04: Estratégia Mobile Offline-First com Sincronização Bidirecional
- **Status:** Adotada e Especificada.
- **Contexto:** Vendedores externos e consultores em campo visitam galpões, áreas industriais e fazendas frequentemente sem cobertura 4G/5G confiável.
- **Decisão:** O app móvel (desenvolvido com Capacitor e SQLite local) adota persistência offline-first completa com motor de IA local no dispositivo (`mobileEdgeAi.agent`) para gravação e transcrição de visitas presenciais, enfileirando mutações para sincronização assíncrona com controle de timestamps vetoriais.
- **Impacto:** Continuidade de trabalho em campo sem dependência de internet estável.

---

## 3. PROPOSTAS DE PRODUTO PENDENTES DE APROVAÇÃO EXECUTIVA

Abaixo constam as recomendações funcionais e modelos operacionais desenhados pela Engenharia de Produto, submetidos à validação do comitê executivo e financeiro:

### PROPOSTA 01: MATRIZ DE PLANOS SAAS E LIMITES OPERACIONAIS
*Status: Proposta Recomendada — Pendente de Aprovação Executiva*

Propõe-se a estruturação comercial da plataforma em 3 camadas (tiers), com diferenciação por capacidade funcional, assentos e cotas de infraestrutura:

| Dimensão | Tier 1: Growth (Recomendado) | Tier 2: Professional (Recomendado) | Tier 3: Enterprise (Recomendado) |
|---|---|---|---|
| **Público-Alvo** | Pequenas empresas comerciais e operações de vendas diretas (3 a 10 vendedores). | Empresas de médio porte com equipes estruturadas de SDR, Closer e Gestão (11 a 50 vendedores). | Grandes corporações B2B com governança rígida, auditoria e múltiplos funis (> 50 vendedores). |
| **Módulos Centrais Inclusos** | P01 (Hub Comercial), P03 (Orquestração), P04 (Performance). | Todos do Growth + P02 (Inteligência), P05 (Previsibilidade), P08 (Voice & WhatsApp). | Todos os 11 Pilares e Módulos (Incluindo M09, M10 Field Sales e M11 Social Selling). |
| **Enxame de IA (P06)** | 6 Agentes Essenciais (CRM, Qualificação, Roteiros). | 16 Agentes Especialistas (Incluindo Forecast, Pricing e Voice Assistant). | Enxame Completo com os 24 Agentes + Supervisor dedicado com RAG Corporativo. |
| **Cota de Tokens de IA Mensal** | 2.000.000 tokens inclusos por organização. | 10.000.000 tokens inclusos por organização. | Cota customizada com suporte a pool de tokens compartilhados e instâncias dedicadas. |
| **Cota de Minutos de Telefonia** | 500 minutos inclusos / mês. | 2.500 minutos inclusos / mês. | Minutos sob demanda com tronco SIP corporativo do cliente. |
| **Créditos de Enriquecimento de Dados** | 300 consultas de CNPJ/Apollo inclusas / mês. | 2.000 consultas inclusas / mês. | Consultas ilimitadas com cache compartilhado entre filiais. |
| **SLA de Suporte** | Atendimento em horário comercial (Resposta em até 8h). | Atendimento estendido com gerente de sucesso (Resposta em até 2h). | Suporte 24/7 com canal dedicado no WhatsApp/Slack e SLA de 15 minutos para incidentes críticos. |

---

### PROPOSTA 02: POLÍTICA FUNCIONAL DE EXCESSO DE CONSUMO (FINOPS DE IA E VOZ)
*Status: Proposta Recomendada — Pendente de Aprovação Executiva*

Para proteger a sustentabilidade financeira da plataforma SaaS e evitar contas de nuvem descontroladas causadas por abusos de clientes:
1. **Regra dos 80% (Alerta Prévio):** Ao consumir 80% do pacote de tokens ou minutos de voz, o sistema emite alerta visual no cockpit do Administrador sugerindo contratação de pacote adicional.
2. **Regra dos 100% (Degradação Elegante):** Ao atingir o teto contratado:
   - Os fluxos essenciais de CRM (leitura, escrita manual, movimentação no kanban, agendamentos) continuam funcionando normalmente sem qualquer bloqueio.
   - Chamadas de IA sofisticada (sínteses de RAG, análises de forecast preditivo, sugestões do Devil's Advocate) são pausadas temporariamente até a renovação da cota ou aprovação de compra de pacote de expansão com 1-clique.
   - Mensagens de WhatsApp e discador telefônico operam sob tarifa adicional por minuto/mensagem debitada no cartão corporativo vinculado.

---

### PROPOSTA 03: POLÍTICA DE RETENÇÃO DE GRAVAÇÕES E PRIVACIDADE LGPD
*Status: Proposta Recomendada — Pendente de Aprovação Executiva*

Propõe-se que:
1. **Gravações de Voz:** Sejam mantidas em armazenamento frio (Cold Storage) por no máximo **180 dias**, sendo automaticamente excluídas após esse período, salvo se o cliente marcar a chamada como "Evidência de Compliance / Contencioso".
2. **Transcrições e Resumos em Texto:** Sejam preservados indefinidamente associados à conta para alimentar a memória comercial do RAG, salvo requisição explícita do titular dos dados para eliminação (direito ao esquecimento previsto na LGPD).

---

## 4. PRÓXIMOS PASSOS E TRANSIÇÃO PARA A FASE 02

1. **Apresentação do Documento Mestre V4 ao Sponsor:** O documento unificado interativo e seus 7 anexos estruturados serão entregues para validação.
2. **Homologação das Propostas:** O comitê executivo avaliará as propostas de planos e cotas, emitindo a resolução de aprovação formal.
3. **Início da Fase 02 (Engenharia e Construção de Código):** Com as especificações congeladas e aprovadas, inicia-se a implementação dos microsserviços, schemas de banco de dados, motores de IA e interfaces visuais em estrita conformidade com este Documento Mestre.
