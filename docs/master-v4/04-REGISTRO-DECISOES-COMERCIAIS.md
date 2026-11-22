# REGISTRO DE DECISÕES COMERCIAIS E LIMITES OPERACIONAIS (ENTREGA 04)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Autoridade:** Agente 00 (Supervisor Geral)  
**Data:** 10 de Novembro de 2026  
**Status:** AUDITADO E CLASSIFICADO

---

## 1. Critérios de Classificação

Conforme instrução expressa da missão, cada decisão de produto e modelo comercial é classificada em quatro categorias determinísticas:
- **APROVADA:** Decisão amparada por implementação em código, schema de banco ou documentação oficial já chancelada.
- **PROPOSTA:** Recomendação técnica da engenharia ou estratégia, estruturada e consistente, porém aguardando formalização comercial.
- **PENDENTE:** Decisão de negócio que depende exclusivamente de deliberação executiva (preços, valores monetários, SLAs contratuais com penalidade).
- **CONFLITANTE:** Definições divergentes encontradas na documentação que foram reconciliadas pelo Agente 00 através de parâmetros de configuração.

---

## 2. Matriz Geral de Decisões Comerciais e Operacionais

| Item de Decisão | Definição Registrada | Classificação Oficial | Origem da Informação | Impacto Técnico / Comercial | Tratamento / Resolução |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Arquitetura Modular dos 11 Módulos** | Divisão em 8 pilares centrais e 3 complementares | **APROVADA** | `src/config/brand.ts`, schema Prisma e Documento Mestre V4 | Define a estrutura de navegação e pacotes de contratação | Mantida integralmente na especificação |
| **Isolamento de Tenant por RLS** | Uso mandatório de `organizationId` com políticas PostgreSQL RLS | **APROVADA** | `prisma/schema.prisma` e `ADR-002` | Segurança contra vazamento de dados entre clientes corporativos | Inegociável para todas as rotas e queries |
| **Fila de Aprovação de IA (HITL)** | Ações de risco `HIGH` retidas em `AIPendingAction` | **APROVADA** | `src/features/job-roles/` e `AIPendingAction` | Previne disparos autônomos indevidos e alucinações | Bloqueio compulsório com confirmação humana |
| **Escalonamento Padrão de Descontos (10% / 20%)** | Closer até 10%, Gestor de 10.1% a 20%, Diretoria > 20% | **CONFLITANTE (Reconciliada como Aprovada Default)** | RBAC de Contratos Transversais e Jornada JOR-08 | Controla a margem comercial de vendas consultivas B2B | Adotado como default da plataforma out-of-the-box |
| **Escalonamento Alternativo de Descontos (15% / 25%)** | Closer até 15%, Gestor de 15.1% a 25%, Diretoria > 25% | **CONFLITANTE (Reconciliada como Proposta Configurável)** | Texto descritivo do Módulo 01 | Indicado para mercados de alta margem de contribuição | Parametrizado em `organization.settings.approval_thresholds` |
| **Quotas de Tokens de IA (Starter / Growth)** | Starter: 500k tokens/mês; Growth: 2.5M tokens/mês | **PROPOSTA** | `ENTREGA-03-CONTRATOS-TRANSVERSAIS.md` | Dimensionamento de infraestrutura e custos de LLM | Quotas configuradas no ledger com corte em 100% |
| **Retenção de Gravações de Áudio** | Áudio bruto: 180 dias; Transcrição e notas: Indeterminada | **PROPOSTA** | Política de custos S3/Glacier e Art. 16 LGPD | Reduz custo de storage mantendo o histórico de vendas | Áudio expira para Glacier; texto persiste no CRM |
| **Página Pública de Booking** | Agendamento público de reuniões sincronizado com Google Calendar | **APROVADA** | `src/features/voice-hub` e `booking/:slug` | Elimina atrito de agendamento e no-show | Trava contra double-booking com transação de banco |
| **Limite de Taxa Bitrix24** | Taxa máxima de 2 req/s com lotes de 50 registros | **APROVADA** | `src/features/integrations/bitrix` e `bitrixGuardian.agent.ts` | Previne bloqueio da conta do cliente por HTTP 429 | Fila leaky bucket no BullMQ com monitoramento |
| **SLA de Suporte — Planos Starter e Growth** | Starter: e-mail até 48h úteis; Growth: chat/e-mail até 8h úteis | **PROPOSTA** | Prática padrão de mercado SaaS B2B | Estabelece expectativa operacional de atendimento | Parâmetro nos termos de serviço |
| **SLA de Suporte — Plano Enterprise (1 hora)** | Canal dedicado com tempo de resposta garantido em 1 hora | **PENDENTE** | Requisito de vendas Enterprise de alto ticket | Demanda equipe de plantão 24/7 com custo operacional | Depende de validação executiva da estrutura de suporte |
| **Tabela de Preços em Reais (R$/mês)** | Valores nominais de assinatura por plano e assento adicional | **PENDENTE** | Módulo de billing sem precificação hardcoded | Define a receita e a taxa de retorno do produto | NENHUM VALOR MONETÁRIO FOI INVENTADO |

---

## 3. Detalhamento e Justificativa dos Conflitos Reconciliados

### 3.1 Conflito das Alçadas de Desconto (10%/20% vs 15%/25%)
- **Problema:** O texto do Módulo 01 citava aprovação para descontos acima de 15% e 25%, enquanto os Contratos Transversais (RBAC) e as Jornadas JOR-07 e JOR-08 estipulavam alçada do Closer até 10% e do Gestor até 20%.
- **Impacto:** Risco de inconsistência no motor de regras de propostas comerciais (`proposalEngine`).
- **Resolução do Agente 00:**
  1. A regra de negócio foi desacoplada de código estático. O schema prevê os campos `maxSelfDiscountPercent` e `maxManagerDiscountPercent` na configuração da Organização.
  2. O template padrão da plataforma (**Default Seguro B2B**) adota:
     - **Faixa Closer:** 0.00% a 10.00% (autonomia do vendedor).
     - **Faixa Gestor:** 10.01% a 20.00% (aprovação em 1 clique na fila de decisões).
     - **Faixa Diretoria:** Acima de 20.01% (exige aprovação do Administrador/Diretor).
  3. A escala 15%/25% é formalizada como **Template Setorial de Alta Margem**, selecionável no onboarding da organização caso seu ticket e margem comportem maior flexibilidade na ponta.

### 3.2 Indefinição da Tabela de Preços e SLAs
- **Alternativas para a Diretoria:**
  - *Opção A (Precificação por Assento + Add-on de IA):* Cobrança de mensalidade por usuário vendedor (ex: SDR/Closer) + pacote avulso de tokens e enriquecimento.
  - *Opção B (Precificação por Volume de Receita / Transações):* Cobrança baseada no pipeline gerido pela organização.
- **Recomendação do Agente 00:** A Opção A é a mais previsível e de menor atrito de vendas. A precificação permanece formalmente marcada como `PENDENTE`, permitindo que a liderança comercial defina os valores em reais diretamente nas variáveis de ambiente do Stripe sem necessidade de refatoração do software.
