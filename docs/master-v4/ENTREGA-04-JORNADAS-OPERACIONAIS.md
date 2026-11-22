# JORNADAS OPERACIONAIS COMPLETAS — 20 PROCESSOS PONTA A PONTA (ENTREGA 04)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Documento de Referência:** Documento Mestre Oficial V4 Consolidado  
**Data:** 10 de Novembro de 2026  
**Status:** 20 JORNADAS INTEGRAIS DOCUMENTADAS E HOMOLOGADAS

---

## ÍNDICE DAS 20 JORNADAS OPERACIONAIS

| ID | Jornada Operacional | Persona Primária | Módulo Principal | Agente de IA |
| :--- | :--- | :--- | :--- | :--- |
| **JOR-01** | Onboarding da Organização e Configuração Inicial de Tenant & Pipelines | Administrador / RevOps | MOD-09 Admin & Operations | Sudo |
| **JOR-02** | Descoberta Ativa Multi-Fonte e Enriquecimento Automático de Contas | BDR Estrategista | MOD-02 Inteligência de Mercado | Nexus / account-detective |
| **JOR-03** | Triagem e Roteamento de Inbound na Mesa de Tratamento | SDR Qualificador | MOD-03 Orquestração de Vendas | Aria / sdr-qualification |
| **JOR-04** | Execução de Cadência Multicanal Automatizada com Auto-Stop | SDR / BDR | MOD-03 Orquestração de Vendas | Aria / bdr-outbound |
| **JOR-05** | Cold Calling Governábil com Voice AI e Studio de Voz | SDR / Closer | MOD-08 Engajamento Comercial | Echo / voice-agent |
| **JOR-06** | Preparação Executiva Pré-Reunião com Dossiê 360° | Closer Executivo | MOD-02 Inteligência de Mercado | Nexus / account-detective |
| **JOR-07** | Negociação de Deal e Alinhamento no Pipeline Ponderado | Closer Executivo | MOD-01 Hub Comercial | Orbit / closer-sales |
| **JOR-08** | Elaboração, Alçada de Desconto e Assinatura Digital de Proposta/Contrato | Closer / Gestor Comercial | MOD-01 Hub Comercial | Orbit / contract-signature |
| **JOR-09** | Handoff de Vendas para Sucesso do Cliente e Onboarding de Conta | Closer → Customer Success | MOD-01 Hub Comercial | Orbit / coordinator-commercial |
| **JOR-10** | Gestão de Health Score e Prevenção Ativa de Churn | Customer Success / Gestor | MOD-04 Performance Comercial | Vanguard / churn-retention |
| **JOR-11** | Expansão de Contas, Upsell e Cross-Sell com Sinais de Mercado | Account Manager / Closer | MOD-01 Hub Comercial | Orbit / revenue-intelligence |
| **JOR-12** | Análise Preditiva de Forecast e Calibração de Metas Comerciais | Diretor Comercial / CFO | MOD-05 Previsibilidade Comercial | Oracle / forecast.agent |
| **JOR-13** | War Room Executivo e Autópsia Sistemática de Win/Loss | Gestão Comercial / RevOps | MOD-04 Performance Comercial | Vanguard / devils-advocate |
| **JOR-14** | Vendas em Campo com Gravação Offline e Sincronização Mobile | Vendedor Externo / Field Sales | MOD-10 Mobile & Field Sales | Orbit Mobile / promise-guardian |
| **JOR-15** | Social Selling e Geração de Abordagens Assistidas por IA | BDR / Social Seller | MOD-11 Social Selling | Nexus / bdr-outbound |
| **JOR-16** | Sincronização Bidirecional e Extração Histórica com Bitrix24 | RevOps / Integrador | MOD-07 Automação & Conectividade | Spark / bitrix-guardian |
| **JOR-17** | Criação de Regras de Automação com Teste Simulado Dry-Run | RevOps / Administrador | MOD-07 Automação & Conectividade | Spark / manager-commercial |
| **JOR-18** | Governança do Enxame de IA e Fila de Aprovação Humana | Gestor Comercial / Admin | MOD-06 Inteligência Artificial | Core / role-supervisor |
| **JOR-19** | Treinamento de Vendas, Roleplay Simulado e Certificação de Playbook | Vendedor em Ramping | MOD-03 Orquestração de Vendas | Aria / learning.agent |
| **JOR-20** | Atendimento aos Direitos do Titular LGPD e Exclusão Segura | DPO / Administrador | MOD-09 Admin & Operations | Sudo / ComplianceEnforcer |

---

## ESPECIFICAÇÃO DETALHADA DAS 20 JORNADAS

### JOR-01: Onboarding da Organização e Configuração Inicial de Tenant & Pipelines
- **Persona Inicial:** Administrador / RevOps da empresa contratante.
- **Gatilho:** Conclusão do checkout/contratação e primeiro login administrativo.
- **Pré-Condições:** Organização provisionada no banco de dados com usuário Admin inicial ativo.
- **Etapas de Execução:**
  1. Login no portal administrativo (`/login`).
  2. Wizard de Boas-Vindas apresenta a escolha de modelo de funil (B2B Consultivo, Transacional ou Recorrência SaaS).
  3. Configuração dos estágios do pipeline padrão (Prospecção, Qualificação, Apresentação, Proposta, Negociação, Fechamento).
  4. Convite dos membros da equipe com atribuição de papéis (RBAC).
  5. Configuração das credenciais de integração (e-mail corporativo, Google Calendar e Bitrix24 opcional).
  6. Importação do primeiro lote de contas/leads via CSV ou sincronização inicial.
- **Módulos Envolvidos:** MOD-09 (Admin), MOD-01 (Hub Comercial), MOD-07 (Automações).
- **Ações Humanas:** Definir nomes das fases, validar campos customizados e aprovar convites.
- **Ações Automatizadas:** Criação das tabelas de RLS para o tenant, geração das chaves de API da organização, envio de convites de e-mail com tokens descartáveis.
- **Participação da IA:** Sudo audita o preenchimento de campos obrigatórios e sugere ajustes nos estágios com base no segmento de mercado.
- **Alterações de Estado:** `Organization.status` passa de `PROVISIONED` para `ACTIVE`.
- **Exceções:** Falha no upload de CSV por formatação incorreta → O sistema indica as linhas com erro para download de planilha corrigida.
- **Resultado Final:** Ambiente 100% operacional pronto para prospecção e vendas.
- **Evidências:** Evento `org.onboarding.completed` registrado no log de auditoria.

---

### JOR-02: Descoberta Ativa Multi-Fonte e Enriquecimento Automático de Contas
- **Persona Inicial:** BDR Estrategista.
- **Gatilho:** Necessidade de gerar novas oportunidades qualificadas para a semana.
- **Pré-Condições:** Tenant com créditos disponíveis de enriquecimento no mês.
- **Etapas de Execução:**
  1. BDR acessa o `ProspectingHub` (`/app/prospect/inteligente`).
  2. Insere filtros de ICP: Setor (Tecnologia/SaaS), Faturamento (R$ 10M - R$ 50M), Geografia (São Paulo/Remoto).
  3. Motor consulta em cascata: Receita Federal (CNPJ), Apollo.io, Hunter.io e Google Places.
  4. Sistema calcula o índice de ICP Fit e lista as empresas elegíveis.
  5. BDR seleciona as contas e clica em "Gerar Dossiê 360° e Mapear Decisores".
  6. IA identifica os tomadores de decisão (ex: Diretor de Vendas, Head de TI) com e-mail corporativo verificado e perfil social.
  7. Promoção das contas e contatos validados para o Hub Comercial.
- **Módulos Envolvidos:** MOD-02 (Inteligência de Mercado), MOD-01 (Hub Comercial).
- **Ações Humanas:** Seleção de critérios e clique de aprovação de promoção para o CRM.
- **Ações Automatizadas:** Deduplicação contra a base existente de clientes, validação sintática e MX de e-mails, débito dos créditos consumidos.
- **Participação da IA:** `account-detective` redige o resumo executivo de 10 seções do dossiê e classifica os sinais de risco da conta.
- **Alterações de Estado:** Criação de `Company` e `Contact` vinculados ao status `PROSPECT_QUALIFIED`.
- **Exceções:** Empresa já existente na carteira de outro vendedor → Bloqueio de importação duplicada com alerta indicando o dono da conta.
- **Resultado Final:** 20 novas contas enriquecidas e prontas para cadência de outbound.
- **Evidências:** Dossiê persistido em `CompanyEnrichment` com status `ENRICHED`.

---

### JOR-03: Triagem e Roteamento de Inbound na Mesa de Tratamento
- **Persona Inicial:** SDR Qualificador.
- **Gatilho:** Recebimento de lead inbound (formulário do site, webhook externo ou campanha de mídia).
- **Pré-Condições:** Regras de roteamento (Smart Lead Router) ativas.
- **Etapas de Execução:**
  1. O lead ingressa via API e cai na fila da Mesa de Tratamento (`/app/mesa-tratamento`).
  2. Smart Lead Router avalia o fit da empresa e distribui o lead para o SDR disponível via round-robin balanceado.
  3. SDR recebe notificação visual e sonora em tempo real (SLA de 5 minutos para primeiro toque).
  4. Tela exibe resumo dos dados preenchidos + enriquecimento instantâneo do CNPJ.
  5. SDR analisa as informações e clica em "Iniciar Contato via WhatsApp/Ligação" com abordagem sugerida pela IA.
- **Módulos Envolvidos:** MOD-03 (Orquestração), MOD-07 (Automação), MOD-01 (Hub Comercial).
- **Ações Humanas:** Aceitar o lead e executar o primeiro contato.
- **Ações Automatizadas:** Consulta CNPJ em background, checagem de lead duplicado, disparo de notificação de SLA para o gestor se o lead ficar parado por mais de 15 minutos.
- **Participação da IA:** `sdr-qualification` analisa as respostas do formulário e calcula o Score de Intenção de Compra (0 a 100).
- **Alterações de Estado:** `Lead.status` transita de `NEW` para `IN_QUALIFICATION`.
- **Exceções:** E-mail de provedor genérico (gmail, hotmail) → IA solicita confirmação de domínio corporativo no primeiro contato.
- **Resultado Final:** Primeiro toque executado dentro do SLA com histórico gravado.
- **Evidências:** Registro de atividade com timestamp e `timeToFirstTouchSeconds` computado.

---

### JOR-04: Execução de Cadência Multicanal Automatizada com Auto-Stop
- **Persona Inicial:** SDR / BDR.
- **Gatilho:** Início do expediente e abertura do Plano Diário (`/app/daily-plan`).
- **Pré-Condições:** Cadência ativa configurada com passos multicanais e lead inscrito.
- **Etapas de Execução:**
  1. O vendedor visualiza as tarefas do dia priorizadas por valor e urgência.
  2. Para o Passo 1 (E-mail): o vendedor clica em "Disparar", revisa o corpo hiper-personalizado e envia.
  3. Para o Passo 2 (WhatsApp agendado): mensagem é enviada automaticamente se em modo autônomo, ou retida para clique.
  4. O lead responde por e-mail: "Temos interesse, podem me ligar amanhã?".
  5. O motor detecta a resposta através de webhook de entrada (Sendgrid/Chatwoot).
  6. A cadência é IMEDIATAMENTE pausada (`AUTO-STOP`), cancelando os passos subsequentes.
  7. O lead é movido para o topo da Mesa de Tratamento com alerta sonoro.
- **Módulos Envolvidos:** MOD-03 (Orquestração), MOD-07 (Automações), MOD-08 (Engajamento).
- **Ações Humanas:** Revisão do disparo e atendimento da resposta.
- **Ações Automatizadas:** Pausa instantânea de passos futuros, emissão do evento `cadence.lead.replied`.
- **Participação da IA:** `bdr-outbound` personaliza o texto com base no setor do prospect; `sdr-qualification` classifica o tom da resposta como positivo.
- **Alterações de Estado:** `CadenceEnrollment.status` muda de `ACTIVE` para `REPLIED_STOPPED`.
- **Exceções:** O lead envia comando de opt-out ("Descadastrar") → Inscrição cancelada com inclusão do e-mail na lista de supressão de tenant.
- **Resultado Final:** Lead qualificado e pronto para agendamento de reunião.
- **Evidências:** Log da transição registrado em `CadenceExecutionHistory`.

---

### JOR-05: Cold Calling Governábil com Voice AI e Studio de Voz
- **Persona Inicial:** SDR / Closer.
- **Gatilho:** Tarefa de ligação agendada no Plano Diário.
- **Pré-Condições:** Microfone habilitado e integração com discador (3CX/WebRTC) operacional.
- **Etapas de Execução:**
  1. Vendedor clica no ícone de telefone no card do lead.
  2. O Voice Hub abre o Studio de Voz na lateral da tela.
  3. O discador verifica automaticamente se o número consta na base de bloqueios (Não Perturbe Procon/Anatel).
  4. Linha conecta; o prospect atende; o áudio estéreo é gravado com aviso regulatório.
  5. Durante a chamada, a transcrição é processada em tempo real e exibida com latência < 1.2s.
  6. O Copiloto sugere respostas na tela quando o prospect apresenta uma objeção ("Já usamos o concorrente X").
  7. Ao encerrar a ligação, o sistema gera o sumário da conversa com sentimento e notas técnicas.
- **Módulos Envolvidos:** MOD-08 (Engajamento Comercial), MOD-01 (Hub Comercial), MOD-06 (IA).
- **Ações Humanas:** Conduzir a ligação e validar o resumo ao final.
- **Ações Automatizadas:** Bloqueio de números em lista de supressão, gravação com criptografia AES-256, conversão de áudio via Whisper.
- **Participação da IA:** `Echo` e `closer-sales` detectam menção a concorrente e projetam battlecard na tela do vendedor em tempo real.
- **Alterações de Estado:** Criação de `CallRecording` e `Activity` tipo `PHONE_CALL` com status `COMPLETED`.
- **Exceções:** Número na lista de bloqueio legal → Chamada abortada imediatamente com aviso na tela e log registrado.
- **Resultado Final:** Reunião de demonstração agendada verbalmente e registrada no CRM.
- **Evidências:** Objeto de áudio gravado no bucket seguro com link imutável na timeline do lead.

---

### JOR-06: Preparação Executiva Pré-Reunião com Dossiê 360°
- **Persona Inicial:** Closer Executivo.
- **Gatilho:** Notificação de reunião agendada para dali a 30 minutos.
- **Pré-Condições:** Lead promovido a oportunidade com CNPJ e participantes confirmados.
- **Etapas de Execução:**
  1. Closer abre a visualização da oportunidade no CRM.
  2. Clica no botão "Gerar Briefing Pré-Reunião".
  3. O agente `account-detective` compila: histórico de conversas passadas do SDR, tecnologias detectadas no site do prospect, notícias recentes da empresa, conexões em comum no LinkedIn e riscos de fechamento.
  4. O sistema gera um roteiro estratégico de perguntas SPIN adaptadas ao decisor que estará presente.
  5. Closer faz o download do deck de 1 página no tablet ou visualiza na tela.
- **Módulos Envolvidos:** MOD-02 (Inteligência de Mercado), MOD-01 (Hub Comercial), MOD-06 (IA).
- **Ações Humanas:** Leitura do briefing executivo e alinhamento do discurso de vendas.
- **Ações Automatizadas:** Varredura em tempo real no banco vetorial (RAG) para buscar cases de clientes do mesmo nicho para citação.
- **Participação da IA:** `account-detective` estrutura o dossiê de 10 seções e destaca a principal dor econômica do cliente.
- **Alterações de Estado:** `Deal.briefingStatus` atualizado para `BRIEFING_READY`.
- **Exceções:** Falha em API de notícias externa → Briefing é gerado utilizando dados históricos internos com aviso visual.
- **Resultado Final:** Vendedor entra na videoconferência com total domínio do contexto do prospect.
- **Evidências:** Dossiê anexado à oportunidade com timestamp de leitura.

---

### JOR-07: Negociação de Deal e Alinhamento no Pipeline Ponderado
- **Persona Inicial:** Closer Executivo.
- **Gatilho:** Demonstração do produto realizada com sucesso.
- **Pré-Condições:** Oportunidade criada com valor estimado e decisores mapeados.
- **Etapas de Execução:**
  1. Closer acessa o Pipeline Kanban (`/app/crm`).
  2. Arrasta o card da oportunidade de "Apresentação" para "Negociação".
  3. O sistema abre modal exigindo preenchimento de campos obrigatórios: Data Estimada de Fechamento (`closeDate`), Valor Estimado e Decisor Financeiro.
  4. O motor preditivo do Oracle calcula o Health Score do deal e ajusta a probabilidade ponderada de conversão.
  5. Closer agenda tarefa de follow-up pós-proposta com lembrete automático.
- **Módulos Envolvidos:** MOD-01 (Hub Comercial), MOD-05 (Previsibilidade Comercial).
- **Ações Humanas:** Preenchimento dos dados do comitê de compras e movimentação do estágio.
- **Ações Automatizadas:** Recálculo do valor ponderado da coluna no Kanban e emissão de evento de sincronização com o Bitrix24.
- **Participação da IA:** `closer-sales` avalia se a data de fechamento é realista comparada com a média histórica daquele segmento de cliente.
- **Alterações de Estado:** `Deal.stageId` atualizado para estágio de negociação; `Deal.weightedValue` recalculado.
- **Exceções:** Tentativa de mover sem preencher a data estimada de fechamento → Interface bloqueia o drop e exibe validação em vermelho.
- **Resultado Final:** Deal estruturado com probabilidade calculada cientificamente.
- **Evidências:** Evento `crm.deal.stage_changed` propagado no barramento.

---

### JOR-08: Elaboração, Alçada de Desconto e Assinatura Digital de Proposta/Contrato
- **Persona Inicial:** Closer / Gestor Comercial.
- **Gatilho:** Cliente solicita proposta formal com condições comerciais negociadas.
- **Pré-Condições:** Oportunidade em estágio de negociação com produtos/serviços selecionados.
- **Etapas de Execução:**
  1. Closer abre a aba de Propostas e clica em "Nova Proposta Comercial".
  2. Seleciona os itens: Licença Enterprise (12 meses) + Módulo Inteligência de Mercado.
  3. Insere desconto comercial de 18% para pagamento à vista.
  4. O sistema detecta que a alçada do Closer é de até 10%; a proposta entra automaticamente no estado `PENDING_APPROVAL`.
  5. Notificação via Slack e Painel é enviada para o Gestor Comercial.
  6. O Gestor acessa o modal de aprovação, revisa a margem de contribuição calculada e aprova com um clique.
  7. A proposta é gerada em PDF e despachada para o provedor de assinatura digital (Gov.br / Signature Provider).
  8. O cliente recebe link seguro, autentica-se e assina digitalmente.
- **Módulos Envolvidos:** MOD-01 (Hub Comercial), MOD-09 (Admin), MOD-07 (Automação).
- **Ações Humanas:** Criação da proposta pelo Closer, aprovação pelo Gestor e assinatura pelo cliente.
- **Ações Automatizadas:** Validação de travas de desconto, geração do PDF com hash criptográfico, pooling/webhook de status de assinatura.
- **Participação da IA:** `contract-signature` e `billing-revenue` auditam as cláusulas contratuais e validam a consistência de valores.
- **Alterações de Estado:** `Proposal.status` transita: `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `SENT` → `SIGNED`.
- **Exceções:** Desconto superior à alçada do Gestor (ex: 30%) → Encaminhamento automático para a Diretoria Executiva (`executive-director`).
- **Resultado Final:** Contrato juridicamente válido assinado e negócio movido para "Ganho".
- **Evidências:** Documento assinado arquivado no storage com carimbo de data/hora e hash SHA-256.

---

### JOR-09: Handoff de Vendas para Sucesso do Cliente e Onboarding de Conta
- **Persona Inicial:** Closer → Analista de Sucesso do Cliente (CS).
- **Gatilho:** Deal marcado como "Fechado Ganho" (`WON`).
- **Pré-Condições:** Contrato assinado e pagamento confirmado ou faturado.
- **Etapas de Execução:**
  1. O evento `crm.deal.won` é disparado no Domain Event Mesh.
  2. O sistema gera automaticamente o projeto de Onboarding no módulo de pós-venda.
  3. Formulário de passagem de bastão é gerado com: dores levantadas nas reuniões, expectativas de ROI, cronograma acordado e pontos de atenção.
  4. Agendamento da Reunião de Kick-off com o cliente através do calendário integrado.
  5. CS assume a conta com todo o histórico de e-mails, notas e gravações acessíveis em sua visão 360°.
- **Módulos Envolvidos:** MOD-01 (Hub Comercial), MOD-04 (Performance), MOD-07 (Automações).
- **Ações Humanas:** Reunião de alinhamento interno entre Closer e CS e condução do Kick-off.
- **Ações Automatizadas:** Criação do registro de cliente ativo, envio de e-mail automático de boas-vindas com acessos à plataforma.
- **Participação da IA:** `coordinator-commercial` sumariza os 3 objetivos principais do cliente e cria checklist inicial de implementação.
- **Alterações de Estado:** `Company.lifecycleStage` muda de `PROSPECT` para `CUSTOMER_ONBOARDING`.
- **Exceções:** Falha no faturamento financeiro inicial → Bloqueio da liberação do ambiente de produção com alerta ao financeiro.
- **Resultado Final:** Cliente acolhido em menos de 2 horas após a assinatura do contrato com alinhamento perfeito de expectativas.
- **Evidências:** Formulário de Handoff concluído e assinado digitalmente por Vendas e CS.

---

### JOR-10: Gestão de Health Score e Prevenção Ativa de Churn
- **Persona Inicial:** Customer Success / Gestor de Contas.
- **Gatilho:** Alerta emitido pelo algoritmo de Health Score indicando deterioração de uso.
- **Pré-Condições:** Cliente em operação regular com telemetria ativa.
- **Etapas de Execução:**
  1. O scanner de integridade detecta que os logins semanais da conta caíram 60% e há 2 tickets de suporte sem resolução.
  2. O Health Score da conta cai de 85 para 32 (zona vermelha de risco).
  3. O agente `churn-retention` dispara notificação urgente no painel do CS.
  4. O sistema gera um plano tático de resgate sugerindo pautas para uma reunião de check-in executivo.
  5. O CS entra em contato com o patrocinador da conta (Champion) e agenda sessão de alinhamento técnico.
  6. Os gargalos são superados e o plano de ação é concluído.
  7. O Health Score é recalculado e retorna à faixa de segurança (> 75).
- **Módulos Envolvidos:** MOD-04 (Performance Comercial), MOD-01 (Hub Comercial), MOD-06 (IA).
- **Ações Humanas:** Contato com o decisor do cliente e aplicação do plano de contingência.
- **Ações Automatizadas:** Monitoramento contínuo de sinais de uso, logs e chamadas de API do cliente.
- **Participação da IA:** `churn-retention` correlaciona o perfil da conta com clientes passados que deram churn, apontando o risco exato.
- **Alterações de Estado:** `Company.healthScore` atualizado e registro de `ChurnRiskAlert` arquivado.
- **Exceções:** O patrocinador deixou a empresa cliente → IA aciona o `account-detective` para mapear o novo líder contratado no LinkedIn.
- **Resultado Final:** Risco de cancelamento neutralizado preventivamente antes da data de renovação.
- **Evidências:** Registro de check-in e recuperação do volume de acessos na telemetria.

---

### JOR-11: Expansão de Contas, Upsell e Cross-Sell com Sinais de Mercado
- **Persona Inicial:** Account Manager / Closer.
- **Gatilho:** Notificação de consumo de 90% da cota contratada ou notícia de aquisição de nova filial pelo cliente.
- **Pré-Condições:** Cliente ativo há mais de 90 dias com Health Score saudável (> 80).
- **Etapas de Execução:**
  1. O sistema de telemetria avisa que o cliente atingiu 90% dos usuários licenciados.
  2. O módulo de Inteligência de Mercado captura notícia: "Cliente XYZ abre 3 novas filiais na região Sul".
  3. O agente `revenue-intelligence` cria automaticamente uma oportunidade de Upsell no funil de carteira (`pipeline_expansao`).
  4. O Account Manager recebe a sugestão com estimativa de valor (+15 licenças) e proposta pré-configurada.
  5. Executivo aborda o cliente parabenizando pela expansão e apresentando o plano aditivo com desconto por volume.
  6. Negociação é fechada e aditivo contratual é assinado.
- **Módulos Envolvidos:** MOD-01 (Hub Comercial), MOD-02 (Inteligência de Mercado), MOD-09 (Admin).
- **Ações Humanas:** Apresentação da proposta de expansão ao cliente e negociação final.
- **Ações Automatizadas:** Detecção de limites de cota, monitoramento de notícias via RSS/Google News.
- **Participação da IA:** `revenue-intelligence` projeta o aumento de LTV e a elasticidade de preço da conta.
- **Alterações de Estado:** Criação de `Deal` com tipo `UPSELL` e atualização do ARR do cliente.
- **Exceções:** Cliente com fatura em atraso → Sistema bloqueia proposição de expansão até a regularização financeira.
- **Resultado Final:** Aumento de 35% no contrato anual da conta sem custo de aquisição (CAC zero).
- **Evidências:** Aditivo contratual registrado e faturamento recorrente reajustado no Stripe/Financeiro.

---

### JOR-12: Análise Preditiva de Forecast e Calibração de Metas Comerciais
- **Persona Inicial:** Diretor Comercial / CFO.
- **Gatilho:** Reunião semanal de planejamento executivo (Segunda-feira 09h).
- **Pré-Condições:** Pipeline atualizado pelos vendedores com datas de fechamento válidas.
- **Etapas de Execução:**
  1. A diretoria abre o painel preditivo do Oracle (`/app/forecast`).
  2. O sistema exibe o Forecast em 4 categorias: Commit, Best Case, Pipeline e Omit.
  3. O algoritmo exibe o indicador de acurácia histórica (MAPE) e a projeção de fechamento do trimestre contra a meta.
  4. O sistema aponta que o Commit cobre 85% da meta, mas há R$ 350k em risco por concentração em um único grande negócio.
  5. A diretoria visualiza a recomendação do `devils-advocate` de exigir validação jurídica antes de incluir o deal no Commit definitivo.
  6. Ajuste da projeção oficial e exportação do relatório executivo em PDF para o Conselho de Administração.
- **Módulos Envolvidos:** MOD-05 (Previsibilidade), MOD-04 (Performance Comercial).
- **Ações Humanas:** Decisão executiva de aprovar ou rebaixar a classificação dos negócios para o fechamento.
- **Ações Automatizadas:** Recálculo estatístico de regressão logística baseado nos últimos 6 trimestres, congelamento de snapshot semanal.
- **Participação da IA:** `Oracle` e `forecast.agent` comparam o discurso do vendedor com as evidências reais de contato e rebaixam deals sem tração.
- **Alterações de Estado:** Persistência do snapshot oficial da semana em `ForecastSnapshot`.
- **Exceções:** Oscilação severa de dados de entrada → O motor aciona badge de alerta `MAPE_HIGH_VARIANCE` recomendando auditoria de higiene de CRM.
- **Resultado Final:** Previsibilidade financeira de receita com erro inferior a 5% ao final do trimestre.
- **Evidências:** Relatório oficial assinado digitalmente arquivado no histórico de relatórios executivos.

---

### JOR-13: War Room Executivo e Autópsia Sistemática de Win/Loss
- **Persona Inicial:** Gestor Comercial / RevOps.
- **Gatilho:** Fechamento de trimestre ou queda anômala na taxa de conversão de um produto específico.
- **Pré-Condições:** Base de negócios encerrados (`WON` e `LOST`) devidamente preenchida com motivos de perda.
- **Etapas de Execução:**
  1. O gestor acessa o módulo `/app/war-room` e ativa a sessão de análise de Win/Loss.
  2. O motor de autópsia (`winloss.ts`) agrupa todas as perdas dos últimos 90 dias por categoria: Preço, Funcionalidade Faltante, Concorrente, Momento/Timing e Atendimento.
  3. A inteligência cruza os dados e aponta: "O Concorrente Y venceu 62% das disputas em contas com menos de 50 colaboradores oferecendo um pacote de entrada mais barato".
  4. O time comercial define uma nova estratégia de contra-ataque: criação de um pacote competitivo com playbook de contorno específico.
  5. Criação de metas de recuperação e atribuição de ações táticas para os closers.
- **Módulos Envolvidos:** MOD-04 (Performance Comercial), MOD-01 (Hub Comercial), MOD-03 (Orquestração).
- **Ações Humanas:** Condução da sessão com o time e definição dos planos de ação.
- **Ações Automatizadas:** Clusterização semântica das notas de reuniões de negócios perdidos.
- **Participação da IA:** `devils-advocate` apresenta dados incontestáveis e contrapõe justificativas superficiais de vendedores.
- **Alterações de Estado:** Geração de documento de autópsia homologado em `WinLossAutopsy`.
- **Exceções:** Motivo de perda marcado como "Outros" sem texto explicativo → Sistema gera pendência de higiene para o vendedor responsável.
- **Resultado Final:** Ajuste de posicionamento de mercado e aumento da taxa de vitórias no trimestre seguinte.
- **Evidências:** Relatório de Autópsia distribuído para produto, marketing e diretoria comercial.

---

### JOR-14: Vendas em Campo com Gravação Offline e Sincronização Mobile
- **Persona Inicial:** Vendedor Externo / Field Sales.
- **Gatilho:** Visita presencial à fábrica ou escritório de um grande cliente em zona industrial sem cobertura 4G.
- **Pré-Condições:** App Android (Capacitor) instalado no smartphone com credenciais sincronizadas previamente.
- **Etapas de Execução:**
  1. O vendedor chega ao local e percebe a ausência de conexão de internet (badge `OFFLINE` acende no app).
  2. Abre o aplicativo e consulta os dados da empresa e participantes direto do banco local SQLite criptografado.
  3. Inicia a reunião e ativa o `FieldMeetingRecorder` após consentimento do cliente.
  4. Ao término da conversa de 45 minutos, encerra a gravação, digita as principais decisões e marca o próximo passo para terça-feira.
  5. O app salva localmente a gravação e o texto em fila transacional segura.
  6. Ao retornar à cidade e reconectar ao 4G, o serviço de background sync detecta a rede e transmite os pacotes para o servidor na nuvem.
  7. O backend transcreve o áudio, atualiza a oportunidade no CRM e notifica o gestor.
- **Módulos Envolvidos:** MOD-10 (Mobile & Field Sales), MOD-01 (Hub Comercial), MOD-08 (Engajamento).
- **Ações Humanas:** Gravação da conversa e anotação dos pontos-chave no celular.
- **Ações Automatizadas:** Detecção de conectividade pelo plugin de Network do Capacitor, descarte de arquivos temporários após sync confirmado.
- **Participação da IA:** `promise-guardian` audita a gravação no servidor e gera a tarefa de proposta prometida verbalmente.
- **Alterações de Estado:** `OfflineSyncQueueItem.status` transita de `QUEUED` para `SYNCED`.
- **Exceções:** Conflito de versão (alguém editou o deal no escritório enquanto o vendedor estava offline) → O sistema preserva ambos os históricos criando versão ramificada com alerta de mesclagem.
- **Resultado Final:** Zero perda de informações de campo com atualização imediata do funil comercial.
- **Evidências:** Gravação e ata sincronizadas na timeline do cliente no CRM com indicador `FONTE_MOBILE_FIELD`.

---

### JOR-15: Social Selling e Geração de Abordagens Assistidas por IA
- **Persona Inicial:** BDR / Social Seller.
- **Gatilho:** Publicação relevante de um decisor-alvo no LinkedIn sobre desafios de gestão de equipes de vendas.
- **Pré-Condições:** Módulo de Social Selling habilitado no plano e perfil do lead vinculado.
- **Etapas de Execução:**
  1. BDR abre o `/social-selling` e seleciona o perfil do Vice-Presidente de Vendas da empresa prospectada.
  2. O feed exibe a postagem recente: "Como manter a governança de IA sem frear a velocidade do time?".
  3. BDR clica em "Gerar Abordagem de Conexão".
  4. O agente `bdr-outbound` lê o post, cruza com o diferencial do Birthub 360° e gera 3 variações de cópia:
     - Opção 1 (Consultiva): Comentário técnico para publicação direta no post do decisor.
     - Opção 2 (InMail): Mensagem privada conectando o post ao case de governança da plataforma.
     - Opção 3 (Provocativa): Pergunta estratégica para gerar debate no chat.
  5. BDR escolhe a Opção 1, ajusta uma frase para dar seu toque pessoal e publica na rede social.
  6. Clica em "Salvar Interação no CRM".
- **Módulos Envolvidos:** MOD-11 (Social Selling), MOD-01 (Hub Comercial), MOD-06 (IA).
- **Ações Humanas:** Escolha da cópia, edição e envio manual na plataforma parceira.
- **Ações Automatizadas:** Indexação da interação social na timeline do prospect.
- **Participação da IA:** `bdr-outbound` garante tom respeitoso, sem agressividade comercial prematura e com alta densidade técnica.
- **Alterações de Estado:** Registro de `SocialInteraction` com status `ENGAGED`.
- **Exceções:** Perfil do lead não localizado → O sistema sugere busca alternativa por nome e empresa.
- **Resultado Final:** O decisor responde ao comentário e aceita solicitação de conexão iniciando diálogo de negócio.
- **Evidências:** Interação registrada com link do post social no histórico do lead.

---

### JOR-16: Sincronização Bidirecional e Extração Histórica com Bitrix24
- **Persona Inicial:** RevOps / Integrador de Sistemas.
- **Gatilho:** Migração ou operação híbrida entre Birthub 360° e Bitrix24 institucional.
- **Pré-Condições:** Webhook de entrada e saída do Bitrix24 configurados com token de segurança ativo.
- **Etapas de Execução:**
  1. O integrador acessa o painel `/app/bitrix`.
  2. Clica em "Iniciar Sincronização Bidirecional em Lote".
  3. O extrator inteligente consulta a API REST do Bitrix24 com paginação controlada de 50 itens por requisição.
  4. A fila de vazamento (token bucket) impõe rigorosamente a cadência máxima de 2 requisições por segundo.
  5. Campos personalizados (`UF_CRM_*`) são mapeados dinamicamente para as entidades de `Lead`, `Company` e `Deal`.
  6. Se um negócio for alterado no Bitrix24, o webhook do Birthub 360° atualiza o estágio local em menos de 1 segundo.
  7. Se um closer alterar o deal no Birthub 360°, a mutação é despachada e refletida no Bitrix24.
- **Módulos Envolvidos:** MOD-07 (Automação & Conectividade), MOD-01 (Hub Comercial).
- **Ações Humanas:** Configuração de mapeamento de campos e autorização da chave de webhook.
- **Ações Automatizadas:** Controle de rate limit, paginação automática, tradução de tipos de dados.
- **Participação da IA:** `bitrix-guardian` monitora divergências de valores entre os bancos e sinaliza anomalias.
- **Alterações de Estado:** Atualização bidirecional de entidades com registro de `bitrixSyncTimestamp`.
- **Exceções:** O Bitrix24 responde com HTTP 429 ou fica fora do ar → O conector entra em modo de retry exponencial com armazenamento seguro em fila BullMQ, retomando automaticamente sem perda de dados.
- **Resultado Final:** 100% dos dados comerciais perfeitamente sincronizados entre as plataformas.
- **Evidências:** Relatório de integridade do `BitrixSyncHealthReport` verde (0 divergências e lag < 2s).

---

### JOR-17: Criação de Regras de Automação com Teste Simulado Dry-Run
- **Persona Inicial:** RevOps / Administrador.
- **Gatilho:** Necessidade de criar regra para alertar o gestor sempre que um deal de mais de R$ 50k ficar 7 dias sem atividade.
- **Pré-Condições:** Acesso ao módulo de Automações com perfil `ADMIN` ou `GESTOR`.
- **Etapas de Execução:**
  1. Usuário acessa o construtor visual de regras em `/app/automations`.
  2. Define o Gatilho: `Deal Inativo por X Dias` (Parâmetro: 7).
  3. Define a Condição: `Deal.value >= 50000` E `Deal.stage != "Fechado"`.
  4. Define a Ação: `Notificar Gestor via Slack` E `Adicionar Tag "Deal de Alto Risco"`.
  5. Antes de publicar em produção, o usuário clica no botão "Executar Simulação Dry-Run".
  6. O motor simula a regra contra a base real de negócios dos últimos 30 dias sem persistir alterações.
  7. A tela exibe o relatório: "A simulação encontrou 8 negócios que seriam impactados hoje, disparando 8 mensagens no Slack".
  8. RevOps valida que a lógica está precisa e clica em "Ativar Regra em Produção".
- **Módulos Envolvidos:** MOD-07 (Automação & Conectividade), MOD-09 (Admin).
- **Ações Humanas:** Modelagem lógica da regra e aprovação após verificação do Dry-Run.
- **Ações Automatizadas:** Execução simulada em memória, compilação da árvore de condições em AST segura.
- **Participação da IA:** `Spark` valida se há sobreposição ou conflito com outras regras ativas na organização.
- **Alterações de Estado:** `AutomationRule.status` passa de `DRAFT` para `ACTIVE`.
- **Exceções:** Condição com loop infinito detectada na AST → O validador rejeita a ativação com erro explicativo.
- **Resultado Final:** Automação ativada com garantia total de que não gerará disparos indesejados.
- **Evidências:** Registro de simulação gravado em `AutomationDryRunLog`.

---

### JOR-18: Governança do Enxame de IA e Fila de Aprovação Humana
- **Persona Inicial:** Gestor Comercial / Administrador.
- **Gatilho:** Agente de IA propõe ação externa de alto impacto (envio de e-mail de fechamento para diretoria de grande conta).
- **Pré-Condições:** Agente operando em modo supervisionado (Human-in-the-Loop).
- **Etapas de Execução:**
  1. O agente `closer-sales` detecta que o contrato foi visualizado 4 vezes e redige um e-mail estratégico para destravar a assinatura.
  2. Como a ação envolve envio externo a cliente, a política de governança retém a mensagem na fila `AIPendingAction`.
  3. O gestor recebe notificação no topo da aplicação: "1 ação de IA aguardando sua aprovação".
  4. Clica e abre o modal da Fila de Decisões (`/app/pending-actions`).
  5. A interface exibe: contexto do negócio, raciocínio do agente, evidências consideradas e texto proposto.
  6. O gestor decide alterar uma palavra no segundo parágrafo e clica no botão "Aprovar & Disparar".
  7. O barramento despacha o e-mail através do conector seguro e arquiva o log com a assinatura do gestor aprovador.
- **Módulos Envolvidos:** MOD-06 (Inteligência Artificial), MOD-01 (Hub Comercial), MOD-09 (Admin).
- **Ações Humanas:** Revisão, edição cirúrgica e aprovação da ação da IA.
- **Ações Automatizadas:** Interceptação obrigatória por política de segurança, bloqueio de execução direta, envio pós-aprovação.
- **Participação da IA:** `Core` e `role-supervisor` coordenam a proposta do agente especialista e garantem a integridade das referências.
- **Alterações de Estado:** `AIPendingAction.status` transita de `PENDING` para `APPROVED_AND_EXECUTED`.
- **Exceções:** Gestor clica em "Rejeitar" com feedback "O cliente solicitou falar por WhatsApp" → A IA descarta o e-mail e aprende a preferência da conta.
- **Resultado Final:** Execução comercial rápida e de alta tecnologia com garantia absoluta de controle humano e zero risco de alucinação pública.
- **Evidências:** Transação registrada no ledger de auditoria com ID do usuário aprovador e diff do texto editado.

---

### JOR-19: Treinamento de Vendas, Roleplay Simulado e Certificação de Playbook
- **Persona Inicial:** Vendedor em Ramping (SDR ou Closer recém-contratado).
- **Gatilho:** Tarefa do plano de integração e capacitação (Sales Academy).
- **Pré-Condições:** Playbook de Vendas e Matriz de Objeções configurados no sistema.
- **Etapas de Execução:**
  1. O vendedor acessa a tela `/app/roleplay` e seleciona o cenário de treino: "Contorno de Objeção de Preço em Grande Conta de Varejo".
  2. O simulador inicia uma chamada ou chat onde o agente assume a persona do comprador resistente ("Diretor de Compras").
  3. O vendedor fala pelo microfone apresentando a proposta de valor e usando a técnica ensinada no playbook.
  4. A IA responde em tempo real simulando reações naturais, dúvidas e pressão comercial.
  5. Ao concluir os 10 minutos de simulação, o sistema encerra a sessão e emite imediatamente o Scorecard de Desempenho.
  6. O relatório avalia: clareza de dicção, aderência à metodologia SPIN, empatia, tempo de fala (Talk-to-Listen Ratio) e contorno da objeção.
  7. O vendedor atinge nota 88/100 e desbloqueia a certificação para atender leads reais daquela categoria.
- **Módulos Envolvidos:** MOD-03 (Orquestração de Vendas), MOD-06 (Inteligência Artificial).
- **Ações Humanas:** Participação ativa na simulação e leitura das recomendações de coaching.
- **Ações Automatizadas:** Transcrição de áudio em streaming, medição de métricas de fala, cálculo automático da pontuação por rubrica.
- **Participação da IA:** `Aria` e `learning.agent` conduzem a dinâmica de simulação e redigem o plano de melhoria personalizado.
- **Alterações de Estado:** Registro de `RoleplaySession` com notas e emissão de `SellerCertification`.
- **Exceções:** Nota inferior a 70 → Sistema sugere leitura de trechos específicos do playbook e recomenda repetição do exercício.
- **Resultado Final:** Vendedor treinado e certificado antes de falar com prospects reais, garantindo a qualidade do atendimento da empresa.
- **Evidências:** Scorecard completo arquivado no histórico de desenvolvimento do profissional.

---

### JOR-20: Atendimento aos Direitos do Titular LGPD e Exclusão Segura
- **Persona Inicial:** Encarregado de Proteção de Dados (DPO) / Administrador.
- **Gatilho:** Titular de dados envia solicitação formal: "Quero revogar meu consentimento e excluir todos os meus dados da plataforma".
- **Pré-Condições:** Usuário autenticado com permissão administrativa no Portal LGPD (`/app/settings`).
- **Etapas de Execução:**
  1. DPO acessa o menu de Conformidade e Direitos do Titular (`/app/settings/privacy`).
  2. Insere o e-mail ou documento do titular e clica em "Pesquisar Dados do Titular".
  3. O sistema varre todos os módulos e apresenta o inventário completo de dados encontrados: cadastros no CRM, logs de cadência, gravações de voz e mensagens.
  4. O DPO clica em "Executar Anonimização e Exclusão Definitiva".
  5. O processo executa a descaracterização irreversível:
     - Nome, e-mail, telefone e notas pessoais são substituídos por hashes cegos irreversíveis (`blind index`).
     - Gravações de áudio são permanentemente apagadas dos buckets de armazenamento seguro.
     - Os valores financeiros das oportunidades fechadas são mantidos para integridade contábil e fiscal sem qualquer vínculo ao nome do indivíduo.
  6. O sistema emite automaticamente o Certificado Digital de Exclusão de Dados Pessoais.
  7. O certificado em PDF é encaminhado ao titular como prova de atendimento à LGPD (Art. 18).
- **Módulos Envolvidos:** MOD-09 (Admin & Operations), MOD-01 (Hub Comercial), MOD-08 (Engajamento).
- **Ações Humanas:** Validação da solicitação do titular e autorização expressa da anonimização.
- **Ações Automatizadas:** Varredura em cascata em todas as tabelas de dados, destruição de arquivos de áudio, geração de hash blind index.
- **Participação da IA:** `Sudo` e `ComplianceEnforcer` conferem se não restou nenhuma cópia do dado pessoal em logs ou bancos vetoriais de embeddings.
- **Alterações de Estado:** `Lead` e `Contact` atualizados para status `ANONYMIZED`; log de consentimento gravado como `CONSENT_REVOKED`.
- **Exceções:** Tentativa de excluir dado de contrato ativo com obrigação legal de guarda fiscal (Art. 16 da LGPD) → O sistema bloqueia a exclusão dos dados fiscais e mantém apenas o registro mínimo obrigatório com justificativa legal.
- **Resultado Final:** Conformidade total com a Lei Geral de Proteção de Dados sem quebrar a integridade histórica dos relatórios de receita da organização.
- **Evidências:** Certificado de Exclusão com assinatura criptográfica gerado e arquivado em registro imutável de auditoria.
