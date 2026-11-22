# BIRTHUB 360° — CRITÉRIOS DE ACEITE E REQUISITOS DE HOMOLOGAÇÃO

**Versão do Documento:** 4.0.0 — Oficial Definitiva  
**Data:** 08 de Novembro de 2026  
**Status:** Especificação Mestra de Engenharia de Produto  
**Governança:** Autoridade Global de Qualidade e Homologação  

---

## 1. DIRETRIZES DE QUALIDADE E HOMOLOGAÇÃO

Nenhuma funcionalidade do **Birthub 360°** será considerada "Concluída" (Definition of Done) na futura implementação sem atender integralmente aos critérios objetivos e verificáveis deste documento.
- **Formato Mandatório:** Especificações em BDD / Gherkin (`Dado / Quando / Então`).
- **Verificação Abrangente:** Todo cenário possui validação de caminho feliz, tratamento de exceções, validação de segurança/tenancy e evidência verificável por script automatizado.
- **Proibição de Cenários Impossíveis:** Testes devem validar situações reais de produção e resiliência a falhas de rede, provedores externos e erros humanos.

---

## 2. CRITÉRIOS DE ACEITE POR PILAR E MÓDULO (BDD / GHERKIN)

### P01 — HUB COMERCIAL

#### Cenário 1.1: Movimentação de Deal no Kanban com Recálculo Ponderado (P01-FN-001)
```gherkin
Funcionalidade: Movimentação de Oportunidades no CrmBoard
  Como Closer ou Gestor Comercial
  Quero arrastar um card de oportunidade entre colunas do Kanban
  Para refletir o avanço da negociação e atualizar o forecast em tempo real

  Cenário: Avanço com sucesso para estágio com maior probabilidade
    Dado que estou autenticado na organização "Tenant-Alpha"
    E possuo a oportunidade "Deal-Alpha-100" no estágio "Qualificação" (Probabilidade 20%, Valor R$ 50.000)
    Quando arrasto o card para o estágio "Demonstração Realizada" (Probabilidade 50%)
    Então o sistema deve atualizar o campo "stage_id" da oportunidade no banco de dados
    E o campo "probability" deve ser recalculado para 50.00%
    E o campo "weighted_amount" deve ser atualizado para R$ 25.000,00
    E uma linha deve ser gravada na tabela "deal_stage_history" registrando o tempo no estágio anterior
    E um evento "deal.stage_changed" deve ser emitido no barramento em menos de 200ms.

  Cenário: Bloqueio de avanço sem preenchimento de campos obrigatórios do estágio
    Dado que a oportunidade está no estágio "Proposta Comercial"
    E a regra do estágio exige o upload do PDF da proposta ou código de proposta vinculado
    Quando tento arrastar o card diretamente para "Fechamento" sem proposta cadastrada
    Então o sistema deve rejeitar o movimento
    E o card deve retornar visualmente à coluna de origem
    E deve ser exibido um toast de alerta: "Obrigatório vincular uma proposta aprovada para avançar a este estágio".
```

#### Cenário 1.2: Comparação de Diff Visual em Propostas Comerciais (P01-FN-004)
```gherkin
Funcionalidade: Versionamento com Diff Visual de Propostas
  Como Gestor Comercial ou Jurídico
  Quero comparar duas versões da mesma proposta comercial
  Para auditar com precisão o que foi alterado antes de emitir a aprovação

  Cenário: Destaque visual de itens adicionados e concessão de descontos
    Dado que a proposta "PROP-2026-0042" possui a Versão 1 (Total R$ 20.000, Desconto 0%)
    E o Closer gerou a Versão 2 (Total R$ 17.000, Desconto 15%, Item "Setup" removido)
    Quando o Gestor clica no botão "Comparar Versões (V1 vs V2)"
    Então a interface deve renderizar as duas colunas lado a lado
    E o item "Setup" deve ser destacado em vermelho com indicador de "Removido"
    E a linha de desconto deve ser destacada em amarelo com a variação "+15% de concessão"
    E a diferença líquida de -R$ 3.000 deve ser exibida no sumário executivo.
```

---

### P02 — INTELIGÊNCIA DE MERCADO

#### Cenário 2.1: Enriquecimento Cadastral por CNPJ e Detecção de Sócios (P02-FN-002)
```gherkin
Funcionalidade: Consulta Oficial de CNPJ e Quadro Societário (QSA)
  Como BDR
  Quero buscar um CNPJ no ProspectingHub
  Para preencher dados cadastrais oficiais instantaneamente e evitar erros manuais

  Cenário: CNPJ Ativo consultado com sucesso
    Dado que informo o CNPJ "00.000.000/0001-91" no campo de busca rápida
    Quando aciono a consulta
    Então o sistema deve retornar os dados cadastrais da Receita Federal em menos de 1.5s
    E deve preencher Razão Social, Nome Fantasia, CNAE Primário, Endereço Completo e Capital Social
    E deve listar os membros do QSA identificando nomes de sócios e administradores
    E a fonte "Receita Federal Oficial" deve ser gravada no campo de proveniência com timestamp.

  Cenário: CNPJ Inapto ou Baixado
    Dado que informo um CNPJ com status "BAIXADA" ou "INAPTA"
    Quando a consulta retorna
    Então o sistema deve exibir uma tarja vermelha de aviso: "Empresa com cadastro irregular na Receita Federal"
    E o botão de criação de oportunidade deve ser desabilitado por padrão.
```

---

### P03 — ORQUESTRAÇÃO DE VENDAS

#### Cenário 3.1: Pausa Automática de Cadência por Resposta ou Opt-Out (P03-FN-001)
```gherkin
Funcionalidade: Gestão Automática de Cadências e Opt-Out
  Como SDR
  Quero que a cadência pare automaticamente quando o lead responder
  Para evitar disparos inconvenientes e mensagens desconexas

  Cenário: Lead responde e-mail da cadência
    Dado que o contato "Carlos Silva" está ativo no passo 4 da cadência de prospecção
    Quando o sistema detecta um e-mail inbound de resposta vindo do remetente de Carlos
    Então o status da inscrição na cadência deve mudar imediatamente para "REPLIED"
    E todas as próximas tarefas agendadas (e-mail automático, WhatsApp) devem ser canceladas
    E uma tarefa de "Lead Respondeu — Iniciar Conversa Manual" deve ser criada no Workspace do SDR.

  Cenário: Lead solicita descadastramento (LGPD Opt-out)
    Dado que o contato envia a palavra "SAIR", "STOP" ou clica no link de opt-out
    Quando o evento é processado
    Então o campo "opt_out_communications" do contato deve ser definido como "true"
    E o contato deve ser marcado como bloqueado para qualquer cadência futura na organização.
```

---

### P06 — INTELIGÊNCIA ARTIFICIAL

#### Cenário 6.1: Interceptação de Conflito de Carteira pelo Supervisor (P06-FN-001)
```gherkin
Funcionalidade: Coordenação Multiagente e Prevenção de Conflitos
  Como Supervisor Geral de IA
  Quero identificar quando dois operadores tentam contatar a mesma conta ou grupo econômico
  Para proteger a experiência do cliente e evitar desgaste comercial

  Cenário: Detecção de abordagem duplicada em mesma holding
    Dado que o Closer A está em negociação avançada com a "Empresa Matriz Ltda"
    Quando o BDR B tenta cadastrar uma cadência de prospecção fria para a "Filial da Empresa Matriz"
    Então o "supervisor.agent" deve bloquear o início da cadência
    E deve enviar uma notificação para o BDR B: "Conta vinculada à holding em negociação pelo Closer A. Oportunidade associada ao deal existente."
    E a ação deve ser registrada no painel de resolução de conflitos da gestão.
```

#### Cenário 6.2: Alçadas de Desconto e Human-in-the-Loop em Propostas (P06-FN-002)
```gherkin
Funcionalidade: Alçadas de Aprovação e Governança com PricingAgent
  Como Administrador do Sistema
  Quero que a IA exija aprovação humana obrigatória em descontos elevados
  Para proteger a margem financeira da empresa

  Cenário: Desconto solicitado acima de 15%
    Dado que a alçada máxima configurada para o cargo de Closer é de 5%
    Quando o Closer submete uma proposta com 18% de desconto
    Então o "pricing.agent" não deve autorizar o envio direto ao cliente
    E o status da versão deve ser marcado como "UNDER_APPROVAL"
    E um card de aprovação com o parecer do "devilsAdvocate.agent" deve ser enviado ao Gestor Comercial
    E o PDF final para assinatura só deve ser gerado após o clique de aprovação do Gestor.
```

---

### P07 — AUTOMAÇÃO & CONECTIVIDADE

#### Cenário 7.1: Prevenção de Eco Bidirecional com BitrixGuardian (P07-FN-003)
```gherkin
Funcionalidade: Sincronização Segura com Bitrix24
  Como Engenheiro de Integração
  Quero que atualizações no Birthub 360 reflitam no Bitrix24 sem gerar loops de repetição
  Para garantir dados íntegros e evitar consumo abusivo de quotas de API

  Cenário: Sincronização de Deal sem loop
    Dado que um deal no Birthub 360 avança de estágio
    Quando o conector envia a atualização para a API do Bitrix24 com o hash "H_982341"
    E o Bitrix24 processa e devolve um webhook "ONCRMDEALUPDATE" contendo o mesmo hash "H_982341"
    Então o "bitrixGuardian.agent" deve identificar o hash idêntico
    E deve classificar o webhook como "ECO_ORIGEM_PROPRIA"
    E deve descartar o processamento sem disparar nova atualização de banco.
```

---

### P08 — ENGAJAMENTO COMERCIAL

#### Cenário 8.1: Transcrição e Resumo Cognitivo em Reunião WebRTC (P08-FN-002)
```gherkin
Funcionalidade: Conversational Intelligence e Resumo de Reuniões
  Como Closer
  Quero que a gravação da chamada seja transcrita e resumida automaticamente
  Para economizar tempo de preenchimento de CRM após a reunião

  Cenário: Resumo gerado após encerramento da chamada
    Dado que o Closer encerra uma chamada telefônica de 25 minutos no Voice Hub
    Quando o arquivo de áudio WAV é persistido no bucket de gravações
    Então o pipeline de IA deve concluir a transcrição em menos de 10 segundos
    E deve gerar um resumo executivo estruturado em: (1) Dores do Cliente, (2) Solução Proposta, (3) Próximos Passos Acordados
    E os compromissos com data devem ser criados automaticamente como tarefas na oportunidade
    E o sentimento predominante da conversa deve ser pontuado na timeline.
```

---

### M09 — ADMIN & OPERATIONS

#### Cenário 9.1: Isolamento Físico Multi-Tenant via RLS (M09-FN-001)
```gherkin
Funcionalidade: Isolamento de Dados por Organização (Multi-Tenancy)
  Como DPO e Diretor de Segurança
  Quero garantir que nenhum usuário consiga ler dados de outra organização
  Mesmo em caso de manipulação forçada de parâmetros na API

  Cenário: Tentativa de leitura de Deal de outro Tenant
    Dado que estou autenticado com token válido da organização "Tenant-Beta"
    Quando executo uma requisição HTTP "GET /api/v1/deals/{deal_id_do_tenant_alpha}"
    Então o banco de dados PostgreSQL deve aplicar a política de Row-Level Security
    E a consulta deve retornar 0 registros ou resposta HTTP 404 Not Found
    E nenhum dado do Tenant-Alpha deve vazar na resposta
    E um evento de alerta de segurança deve ser registrado em "audit_logs".
```

---

### M10 — MOBILE & FIELD SALES

#### Cenário 10.1: Gravação e Sincronização Offline em Vendas Externas (M10-FN-003)
```gherkin
Funcionalidade: Operação Offline-First no App Android
  Como Vendedor Externo
  Quero gravar notas de visita e editar oportunidades sem internet
  Para sincronizar os dados de volta ao escritório quando restabelecer conexão

  Cenário: Sincronização após reconexão 4G
    Dado que o smartphone do vendedor está em "Modo Avião" (sem conectividade)
    Quando o vendedor registra uma visita presencial com áudio gravado e atualiza o valor do deal
    Então o registro deve ser persistido imediatamente no banco SQLite local do dispositivo
    E deve ser inserido na fila local com status "PENDING_SYNC"
    Quando a conectividade de rede é restabelecida
    Então o app móvel deve disparar a sincronização em segundo plano
    E o servidor deve aceitar as alterações utilizando a resolução de conflito de timestamps
    E o deal deve ser atualizado no servidor com o áudio anexado.
```

---

## 3. REQUISITOS NÃO-FUNCIONAIS MENSURÁVEIS (NFRs)

| Identificador | Categoria | Métrica Alvo | Condição de Medição |
|---|---|---|---|
| **NFR-PERF-01** | Latência de Interface | p95 < 600ms, p99 < 1.2s | Navegação entre estágios do Kanban com 500 deals carregados em rede 4G simulada. |
| **NFR-PERF-02** | Throughput de Eventos | >= 5.000 eventos/segundo | Ingestão simultânea de webhooks e eventos assíncronos no cluster de filas sem degradação. |
| **NFR-PERF-03** | Tempo de Resposta API | p95 < 150ms | Consultas autenticadas de leitura a endpoints de CRM sob carga de 1.000 usuários simultâneos. |
| **NFR-IA-01** | Latência de Transcrição | < 800ms por chunk de áudio | Processamento contínuo de ASR durante chamadas WebRTC em tempo real para alimentação do HUD. |
| **NFR-IA-02** | Orçamento e FinOps | 100% de conformidade com quotas | Bloqueio automático ou chaveamento para modelo local ao atingir 100% do teto mensal de tokens. |
| **NFR-SEC-01** | Isolamento Multi-Tenant | 0 vazamentos (Zero Tolerance) | Teste automatizado de injeção de parâmetros cruzando 100.000 requisições entre tenants distintos. |
| **NFR-SEC-02** | Rastreabilidade LGPD | 100% de cobertura de trilha | Toda ação de escrita, visualização de dados sensíveis e exclusão com registro imutável em `audit_logs`. |
| **NFR-DISP-01** | Disponibilidade (SLA) | >= 99.9% de uptime | Tolerância a falhas com failover automático de instâncias de aplicação e réplicas de leitura de banco. |

---

## 4. MATRIZ DE HOMOLOGAÇÃO DA ENGENHARIA FUTURA

Para que a implementação futura seja aprovada, a suíte de testes automatizados deverá cumprir:
1. **Testes de Arquitetura (ArchUnit/TS-Arch):** Garantir que nenhum módulo acesse tabelas de outros domínios sem passar pelos contratos de serviço ou barramento de eventos.
2. **Testes Unitários:** Cobertura de código mínima de 85% em regras de cálculo financeiro, pricing, pontuação de ICP e validação de documentos.
3. **Testes de Integração com Mocks:** Simulação completa de todas as 7 fontes de inteligência e conector Bitrix24 validando idempotência e tratamento de erro 429/500.
4. **Testes E2E (Playwright):** Automação ponta a ponta das 20 jornadas operacionais em navegadores desktop e viewport mobile.
5. **Testes de Carga (k6):** Validação de estabilidade sob pico de 10.000 requisições concorrentes mantendo latência dentro dos parâmetros NFR.
