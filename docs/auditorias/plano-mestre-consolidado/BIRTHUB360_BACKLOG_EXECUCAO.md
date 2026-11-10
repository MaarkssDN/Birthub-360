# 06 — BACKLOG OPERACIONAL DE EXECUÇÃO RECONCILIADO — BIRTHUB 360°

**Autoridade:** Agente 00 — Supervisor Geral de Engenharia  
**Auditoria de Qualidade:** Agente 24 — Revisão Independente  
**Commit HEAD:** `08c9734e1bb89a4d4fc552351470a1969f94d64f`  
**Total de Tarefas Ordenadas:** **52 Tarefas Executáveis** (`TAREFA-SANEAMENTO-001` a `TAREFA-SANEAMENTO-052`)  
**Data:** 2026-11-10  

---

## 1. INSTRUÇÕES OPERACIONAIS PARA DESPACHO PELO SUPERVISOR

Cada tarefa abaixo é autossuficiente, canônica e vinculada estritamente às permissões de domínio do **`AGENTS.md` §15**.  
Critérios de aceite genéricos foram banidos e substituídos por comandos e critérios técnicos verificáveis.

---

## 2. FILA OPERACIONAL DETALHADA

### TAREFA-SANEAMENTO-043 [BT360-DT-0001]
- **Dívida Técnica:** **BT360-DT-0001** (`DIV-00-001` / DEBT-GOV-001)
- **Agente Responsável:** Agente **00** (Coordenador e Orquestrador Geral)
- **Onda de Execução:** **Onda 0**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Pequeno**
- **Título do Problema:** Leitura obrigatória no prompt de coordenação referencia documento de ondas inexistente
- **Escopo e Arquivos Envolvidos:** `.agents/prompts/00-coordenador.md`
- **Causa Raiz:** O documento foi renomeado ou consolidado durante a reorganização documental de ondas, sem a respectiva atualização no prompt mestre.
- **Impacto do Problema:** Novos agentes de orquestração operam com incerteza sobre a fonte canônica do planejamento de ondas.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-011 [BT360-DT-0004]
- **Dívida Técnica:** **BT360-DT-0004** (`DIV-00-004` )
- **Agente Responsável:** Agente **00** (Coordenador e Orquestrador Geral)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser
- **Escopo e Arquivos Envolvidos:** `AGENTS.md`
- **Causa Raiz:** O dependency-cruiser foi configurado para checar fronteiras de pastas, mas não os slots dos 26 agentes documentados no `AGENTS.md`.
- **Impacto do Problema:** Risco contínuo de acoplamento indevido e commits concorrentes sobre arquivos de donos exclusivos (ex.: `prisma/schema.prisma` modificado por integrações).
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-012 [BT360-DT-0008]
- **Dívida Técnica:** **BT360-DT-0008** (`DIV-01-004` / DEBT-PERF-001)
- **Agente Responsável:** Agente **01** (Plataforma, Segurança e Dados)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Resumo de consumo de inteligência artificial carrega todas as linhas de logs em memória para agregação
- **Escopo e Arquivos Envolvidos:** `src/features/analytics/infra/PrismaAnalyticsRepository.ts`
- **Causa Raiz:** Implementação inicial orientada a protótipo sem uso de funções nativas de agregação do banco.
- **Impacto do Problema:** Degradação de performance do dashboard, latência superior a 3 segundos e consumo excessivo de memória no processo da API.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-044 [BT360-DT-0009]
- **Dívida Técnica:** **BT360-DT-0009** (`DIV-01-005` / DEBT-CODE-001)
- **Agente Responsável:** Agente **01** (Plataforma, Segurança e Dados)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Lógica de criação de primeiro usuário executa user.count redundante para atribuir role ADMIN
- **Escopo e Arquivos Envolvidos:** `src/lib/auth.ts`
- **Causa Raiz:** Refatoração de autenticação que preservou verificação antiga fora da transação.
- **Impacto do Problema:** Sobrecarga insignificante em baixo volume, mas adiciona débito de legibilidade e latência na esteira de onboarding.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-013 [BT360-DT-0010]
- **Dívida Técnica:** **BT360-DT-0010** (`DIV-01-006` )
- **Agente Responsável:** Agente **01** (Plataforma, Segurança e Dados)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspot arquitetural crítico em src/lib/prisma.ts acumulando múltiplas responsabilidades
- **Escopo e Arquivos Envolvidos:** `src/lib/prisma.ts`
- **Causa Raiz:** Acúmulo continuado de plugins e handlers em um único ponto central de entrada do ORM.
- **Impacto do Problema:** Dificuldade em testar interceptores de forma isolada e alto risco de quebra global da camada de dados em refatorações.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-014 [BT360-DT-0013]
- **Dívida Técnica:** **BT360-DT-0013** (`DIV-01A-003` )
- **Agente Responsável:** Agente **01A** (Confiabilidade de Dados, RLS e Retenção)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Verificação de integridade referencial: foreign keys com onDelete CASCADE em tabelas mestres de tenant
- **Escopo e Arquivos Envolvidos:** `prisma/schema.prisma`
- **Causa Raiz:** Facilidade de modelagem do Prisma ORM sem implementação de travas defensivas de arquivamento.
- **Impacto do Problema:** Impossibilidade de recuperação de histórico comercial e auditoria caso ocorra um comando de exclusão errôneo.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-015 [BT360-DT-0014]
- **Dívida Técnica:** **BT360-DT-0014** (`DIV-02-001` / DEBT-NOT-001)
- **Agente Responsável:** Agente **02** (Produto e UX)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `IMPLEMENTADO / NÃO VALIDADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Leitura de notificação broadcast em entidade compartilhada silencia unread para colegas de equipe
- **Escopo e Arquivos Envolvidos:** `src/features/notifications/services/notification.service.ts`
- **Causa Raiz:** Simplificação de modelagem inicial onde notificações organizacionais não foram desacopladas do status de leitura por usuário.
- **Impacto do Problema:** Usuários e vendedores perdem avisos importantes da plataforma (manutenções, metas atingidas, novos leads compartilhados) porque outro colega já visualizou a notificação previamente.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-002 [BT360-DT-0015]
- **Dívida Técnica:** **BT360-DT-0015** (`DIV-02-002` )
- **Agente Responsável:** Agente **02** (Produto e UX)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P1** | **Status Atual:** `PARCIALMENTE IMPLEMENTADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspot estrutural no componente central CrmBoard.tsx acumulando múltiplas responsabilidades
- **Escopo e Arquivos Envolvidos:** `src/components/CrmBoard.tsx`
- **Causa Raiz:** O crescimento orgânico das funcionalidades do CRM foi concentrado no componente de entrada do Kanban sem extração de hooks de controle e sub-componentes especializados.
- **Impacto do Problema:** Dificuldade em debugar problemas de renderização e re-renders desnecessários em toda a tela ao arrastar um único lead; risco permanente de regressões visuais e quebra de testes unitários.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-016 [BT360-DT-0016]
- **Dívida Técnica:** **BT360-DT-0016** (`DIV-02-003` )
- **Agente Responsável:** Agente **02** (Produto e UX)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `PARCIALMENTE IMPLEMENTADO`
- **Esforço Relativo Estimado:** **Grande**
- **Título do Problema:** Acoplamento excessivo e orquestração de side-effects em src/App.tsx
- **Escopo e Arquivos Envolvidos:** `src/App.tsx`
- **Causa Raiz:** Falta de um router dedicado desacoplado do arquivo principal de montagem da aplicação.
- **Impacto do Problema:** Lentidão no carregamento inicial da aplicação (cold boot) e dificuldade de gerenciar code-splitting / lazy loading de páginas menos utilizadas.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-003 [BT360-DT-0017]
- **Dívida Técnica:** **BT360-DT-0017** (`DIV-03-001` )
- **Agente Responsável:** Agente **03** (Design e Acessibilidade)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P1** | **Status Atual:** `REGRESSÃO`
- **Esforço Relativo Estimado:** **Pequeno**
- **Título do Problema:** Proliferação de declarações !important em folhas de estilo quebrando a cascata CSS e tokens de tema
- **Escopo e Arquivos Envolvidos:** `src/styles/globals.css`
- **Causa Raiz:** Correções emergenciais de contraste em auditorias de WCAG aplicadas via `!important` direto no CSS global em vez de calibração dos tokens semânticos na camada de utility classes.
- **Impacto do Problema:** Dificuldade extrema em manter a consistência visual em novos módulos; quebras inesperadas de layout ao customizar componentes; manutenção frágil e propensa a regressões.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-017 [BT360-DT-0020]
- **Dívida Técnica:** **BT360-DT-0020** (`DIV-03-004` )
- **Agente Responsável:** Agente **03** (Design e Acessibilidade)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Instabilidade e tolerância frouxa em testes de regressão visual devido a fontes do sistema operacional
- **Escopo e Arquivos Envolvidos:** `playwright.visual.config.ts`
- **Causa Raiz:** As fontes institucionais não estão totalmente embutidas localmente via WOFF2 com font-display estável, dependendo de fallbacks do sistema operacional.
- **Impacto do Problema:** Regressões visuais passam desapercebidas para a branch principal, degradando o acabamento visual do produto.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-018 [BT360-DT-0024]
- **Dívida Técnica:** **BT360-DT-0024** (`DIV-04-004` )
- **Agente Responsável:** Agente **04** (CRM, BI e Analytics)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts
- **Escopo e Arquivos Envolvidos:** `src/features/crm360/infra/PrismaCrm360Repository.ts`
- **Causa Raiz:** Agrupamento de todas as consultas da visão 360 em um único método que carrega o grafo completo de dados de uma só vez.
- **Impacto do Problema:** Lentidão no atendimento de clientes e alto consumo de CPU no banco de dados relacional.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-019 [BT360-DT-0027]
- **Dívida Técnica:** **BT360-DT-0027** (`DIV-05-003` )
- **Agente Responsável:** Agente **05** (Prospecção Comercial)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Acúmulo de cache de enriquecimento sem expurgo automático em tabelas temporárias
- **Escopo e Arquivos Envolvidos:** `src/features/prospecting/services/enrichment.service.ts`
- **Causa Raiz:** O cache foi projetado para persistência perpétua sem política de ciclo de vida de dados (TTL).
- **Impacto do Problema:** Vendedores realizam prospecção com telefones e contatos obsoletos salvos há meses no banco; crescimento contínuo de linhas na base.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-020 [BT360-DT-0028]
- **Dívida Técnica:** **BT360-DT-0028** (`DIV-05-004` )
- **Agente Responsável:** Agente **05** (Prospecção Comercial)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de validação prévia em lote de listas de supressão (Opt-Out) em importações de prospecção
- **Escopo e Arquivos Envolvidos:** `src/features/prospecting/services/cold-email.service.ts`
- **Causa Raiz:** Validação de opt-out tratada como etapa de borda no envio em vez de filtro sanitizador no funil de entrada.
- **Impacto do Problema:** Risco de violação de preferências de privacidade e perda de visibilidade prévia sobre quantos contatos da lista são elegíveis para disparo.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-004 [BT360-DT-0030]
- **Dívida Técnica:** **BT360-DT-0030** (`DIV-06-002` )
- **Agente Responsável:** Agente **06** (Integrações e Bitrix)
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P1** | **Status Atual:** `PARCIALMENTE IMPLEMENTADO`
- **Esforço Relativo Estimado:** **Grande**
- **Título do Problema:** Três painéis monolíticos gigantescos na interface de gerenciamento de integrações
- **Escopo e Arquivos Envolvidos:** `src/features/integrations/components/BitrixImportPanel.tsx`
- **Causa Raiz:** O módulo de integrações foi evoluído incrementalmente para suportar múltiplos CRMs (Bitrix, HubSpot, Pipedrive) sem criação de um framework desacoplado de componentes reutilizáveis.
- **Impacto do Problema:** Dificuldade extrema em aplicar melhorias de acessibilidade; alto custo de manutenção; lentidão em formulários de mapeamento devido a renderizações em cascata.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-045 [BT360-DT-0032]
- **Dívida Técnica:** **BT360-DT-0032** (`DIV-06-004` )
- **Agente Responsável:** Agente **06** (Integrações e Bitrix)
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Tratamento incompleto de promessas assíncronas em componentes de importação externa (Sonar S9383)
- **Escopo e Arquivos Envolvidos:** `src/features/integrations/components/ExternalCrmPanel.tsx`
- **Causa Raiz:** Omissão de `AbortController` na requisição disparada pelo hook.
- **Impacto do Problema:** Alertas de linter e pequenas degradações de memória em clientes web de baixa performance.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-021 [BT360-DT-0035]
- **Dívida Técnica:** **BT360-DT-0035** (`DIV-06A-003` )
- **Agente Responsável:** Agente **06A** (Extrações Bitrix)
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Falta de rotina de purga periódica de arquivos temporários gerados em extrações antigas
- **Escopo e Arquivos Envolvidos:** `src/features/integrations/bitrix/service/extraction.ts`
- **Causa Raiz:** O desenvolvimento focou no fluxo de download imediato sem implementação de governança de ciclo de vida do arquivo temporário.
- **Impacto do Problema:** Risco de parada do serviço por falta de espaço em disco no filesystem do servidor.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-046 [BT360-DT-0036]
- **Dívida Técnica:** **BT360-DT-0036** (`DIV-06A-004` )
- **Agente Responsável:** Agente **06A** (Extrações Bitrix)
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de cancelamento cooperativo via AbortSignal em extrações Bitrix em lote
- **Escopo e Arquivos Envolvidos:** `src/features/integrations/bitrix/service/extraction.ts`
- **Causa Raiz:** O loop de paginação não verifica o status da extração entre uma página e outra e não propaga um `AbortController.signal` para os métodos de busca.
- **Impacto do Problema:** Consumo de recursos de rede e CPU desnecessário após o usuário solicitar a interrupção da tarefa.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-005 [BT360-DT-0039]
- **Dívida Técnica:** **BT360-DT-0039** (`DIV-07-003` / DEBT-AI-004)
- **Agente Responsável:** Agente **07** (IA, Copiloto e Automações)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P1** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Trace de missões autônomas de IA e consentimento LGPD retornados de forma sintética em rotas de inteligência
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/routes/intelligence.routes.ts`
- **Causa Raiz:** Implementação de mock para destravar desenvolvimento de telas de auditoria sem substituição pela consulta real.
- **Impacto do Problema:** Impossibilidade de rastrear decisões autônomas tomadas por LLMs em caso de incidentes com clientes.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-022 [BT360-DT-0040]
- **Dívida Técnica:** **BT360-DT-0040** (`DIV-07-004` / DEBT-UX-008)
- **Agente Responsável:** Agente **07** (IA, Copiloto e Automações)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito permanente
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/components/AISuiteHub.tsx`
- **Causa Raiz:** Omissão do reset de `isLoading: false` no bloco de captura de erro.
- **Impacto do Problema:** Frustração do usuário e percepção de que a plataforma travou por completo.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-023 [BT360-DT-0041]
- **Dívida Técnica:** **BT360-DT-0041** (`DIV-07-005` / DEBT-UX-007)
- **Agente Responsável:** Agente **07** (IA, Copiloto e Automações)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Busca textual na base de conhecimento do Copiloto engole falhas do banco e retorna lista vazia
- **Escopo e Arquivos Envolvidos:** `src/features/knowledge/services/knowledgeBase.service.ts`
- **Causa Raiz:** Falta de diferenciação entre "busca sem correspondências" e "erro de infraestrutura na busca".
- **Impacto do Problema:** Respostas degradadas da IA sem que a equipe de SRE perceba que o serviço de busca vetorial está inoperante.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-006 [BT360-DT-0042]
- **Dívida Técnica:** **BT360-DT-0042** (`DIV-07-006` )
- **Agente Responsável:** Agente **07** (IA, Copiloto e Automações)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P1** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspots severos em componentes de painel de inteligência (IntelligenceHub e SwarmDashboard)
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/components/IntelligenceHub.tsx`
- **Causa Raiz:** Desenvolvimento acelerado de funcionalidades avançadas de enxame de IA em componentes monolíticos.
- **Impacto do Problema:** Lentidão na renderização de dashboards em tempo real; risco alto de regressões durante qualquer alteração visual.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-007 [BT360-DT-0044]
- **Dívida Técnica:** **BT360-DT-0044** (`DIV-08-002` / DEBT-OPS-001)
- **Agente Responsável:** Agente **08** (QA, Testes e Release)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P1** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** 62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest
- **Escopo e Arquivos Envolvidos:** `vitest.unit.config.ts`
- **Causa Raiz:** Falta de unificação entre a convenção de testes centralizados em `tests/` e testes co-localizados em `src/`.
- **Impacto do Problema:** Falsa impressão de alta cobertura; funcionalidades críticas podem ter seus testes unitários quebrados sem alerta no CI.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-024 [BT360-DT-0045]
- **Dívida Técnica:** **BT360-DT-0045** (`DIV-08-003` / DEBT-OPS-002)
- **Agente Responsável:** Agente **08** (QA, Testes e Release)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Dockerfile reinstala Prisma CLI em etapa sem lock estrito versionado arriscando versão divergente
- **Escopo e Arquivos Envolvidos:** `package-lock.json`
- **Causa Raiz:** Otimização para reduzir o tamanho da imagem intermediária executando comandos avulsos do npm.
- **Impacto do Problema:** Falhas inesperadas em tempo de inicialização de containers em ambientes Kubernetes ou AWS ECS.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-047 [BT360-DT-0047]
- **Dívida Técnica:** **BT360-DT-0047** (`DIV-08-005` / DEBT-DOC-001)
- **Agente Responsável:** Agente **08** (QA, Testes e Release)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Instrução de inicialização do stack local omite overlay de PostgreSQL obrigatório para migrations
- **Escopo e Arquivos Envolvidos:** `docs/development/LOCAL_FIRST.md`
- **Causa Raiz:** Separação do compose em múltiplos overlays sem atualização correspondente nos manuais de início rápido.
- **Impacto do Problema:** Fricção no onboarding de novos engenheiros e perda de tempo em setup de ambiente.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-025 [BT360-DT-0048]
- **Dívida Técnica:** **BT360-DT-0048** (`DIV-08A-001` / DEBT-GOV-004)
- **Agente Responsável:** Agente **08A** (Operações Git e Deploy AWS)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Proliferação excessiva de branches remotas órfãs degradando a rastreabilidade e higiene do Git
- **Escopo e Arquivos Envolvidos:** `.github/workflows/`
- **Causa Raiz:** Ausência de rotina de exclusão automática de branches pós-merge no GitHub (`Automatically delete head branches`) e falta de governança periódica de expurgo de experimentos arquivados.
- **Impacto do Problema:** Poluição visual severa no repositório; risco de agentes clonarem ou utilizarem branches desatualizadas como base de novas funcionalidades.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-026 [BT360-DT-0049]
- **Dívida Técnica:** **BT360-DT-0049** (`DIV-08A-002` )
- **Agente Responsável:** Agente **08A** (Operações Git e Deploy AWS)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de cache compartilhado de dependências (node_modules e Prisma) nos workflows de CI
- **Escopo e Arquivos Envolvidos:** `.github/workflows/ci.yml`
- **Causa Raiz:** Configuração inicial simplificada de pipeline mantida sem otimização de cache.
- **Impacto do Problema:** Lentidão no feedback de testes para os desenvolvedores e consumo acelerado de minutos de execução no GitHub Actions.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-027 [BT360-DT-0050]
- **Dívida Técnica:** **BT360-DT-0050** (`DIV-08A-003` )
- **Agente Responsável:** Agente **08A** (Operações Git e Deploy AWS)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Falta de validação automatizada de integridade de tags de release e assinatura de commits
- **Escopo e Arquivos Envolvidos:** `.github/workflows/docker-publish.yml`
- **Causa Raiz:** Esteiras de CI desenhadas focando apenas em sucesso de testes automatizados, sem integração de gates criptográficos de governança.
- **Impacto do Problema:** Risco de deployment não autorizado em ambientes de produção ou homologação.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-028 [BT360-DT-0053]
- **Dívida Técnica:** **BT360-DT-0053** (`DIV-09-003` / DEBT-UX-005)
- **Agente Responsável:** Agente **09** (Mobile e PWA (Capacitor/Android))
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Esquema de deep links nativos no AndroidManifest.xml diverge das rotas SPA da aplicação web
- **Escopo e Arquivos Envolvidos:** `android/app/src/main/AndroidManifest.xml`
- **Causa Raiz:** Atualização das rotas do React Router no frontend web sem a sincronização correspondente no manifesto nativo do Android.
- **Impacto do Problema:** Quebra da experiência de navegação do vendedor em trânsito ao clicar em alertas móveis; aumento do tempo necessário para localizar o cliente.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-048 [BT360-DT-0054]
- **Dívida Técnica:** **BT360-DT-0054** (`DIV-09-004` / DEBT-UX-006)
- **Agente Responsável:** Agente **09** (Mobile e PWA (Capacitor/Android))
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ícones declarados no manifest.json do PWA não existem fisicamente na pasta public
- **Escopo e Arquivos Envolvidos:** `.agents/audits/technical-debt/2026-10-14/manifest.json`
- **Causa Raiz:** O arquivo foi referenciado na especificação do manifesto sem a respectiva exportação dos assets gráficos.
- **Impacto do Problema:** Auditoria Lighthouse acusa falha no checklist de PWA instalável; apresentação visual degradada na tela inicial de smartphones.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-029 [BT360-DT-0057]
- **Dívida Técnica:** **BT360-DT-0057** (`DIV-10-003` )
- **Agente Responsável:** Agente **10** (Infraestrutura, Observabilidade e SRE)
- **Onda de Execução:** **Onda 2**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de limitação de taxa em nível de Ingress/Proxy Reverso contra ataques de força bruta
- **Escopo e Arquivos Envolvidos:** `docker-compose.yml`
- **Causa Raiz:** Infraestrutura focada no cluster interno sem implementação de camadas perimetrais de Web Application Firewall (WAF) ou Ingress Rate Limiting.
- **Impacto do Problema:** Vulnerabilidade a ataques de negação de serviço (DoS) e tentativas automatizadas de adivinhação de senhas em larga escala.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-049 [BT360-DT-0058]
- **Dívida Técnica:** **BT360-DT-0058** (`DIV-11-001` )
- **Agente Responsável:** Agente **11** (Marca e Ativos Institucionais)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ocorrências residuais de menções a marcas legadas em fixtures de testes e documentações internas
- **Escopo e Arquivos Envolvidos:** `tests/fixtures/`
- **Causa Raiz:** O script de busca anterior focou apenas nos diretórios `src/` e `prisma/`, poupando arquivos em pastas de relatórios arquivados.
- **Impacto do Problema:** Ruído conceitual em documentações e possível vazamento de nomes legados em logs de testes.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-050 [BT360-DT-0059]
- **Dívida Técnica:** **BT360-DT-0059** (`DIV-11-002` )
- **Agente Responsável:** Agente **11** (Marca e Ativos Institucionais)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ativos institucionais pesados em public sem compressão moderna lossless (WebP/SVG minificado)
- **Escopo e Arquivos Envolvidos:** `public/`
- **Causa Raiz:** Exportação direta de ferramentas de design (Figma/Photoshop) sem passagem por ferramentas de otimização de imagem (ImageMin / Sharp).
- **Impacto do Problema:** Degradação no score de performance do Google Lighthouse e lentidão no carregamento de logos em dispositivos móveis.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-051 [BT360-DT-0060]
- **Dívida Técnica:** **BT360-DT-0060** (`DIV-11-003` )
- **Agente Responsável:** Agente **11** (Marca e Ativos Institucionais)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Divergência de nomenclatura entre tokens de cores na BrandConstitution e variáveis Tailwind
- **Escopo e Arquivos Envolvidos:** `docs/BrandConstitution.md`
- **Causa Raiz:** Evolução da identidade visual documentada na Brand Constitution que foi apenas parcialmente refletida na hierarquia das variáveis CSS globais.
- **Impacto do Problema:** Dificuldade de manter fidelidade estrita ao manual de marca em novas páginas e componentes.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-008 [BT360-DT-0063]
- **Dívida Técnica:** **BT360-DT-0063** (`DIV-12-003` )
- **Agente Responsável:** Agente **12** (Voz e Telefonia (Birthub Voices))
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P1** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspots severos em componentes de estúdio de voz (Overview.tsx e useStudioStore.ts)
- **Escopo e Arquivos Envolvidos:** `src/features/voice-hub/pages/Dashboard/Overview.tsx`
- **Causa Raiz:** O módulo Voice Hub foi desenvolvido como uma aplicação completa embutida em uma única pasta sem modularização de serviços de áudio.
- **Impacto do Problema:** Lentidão na renderização de gráficos de onda em tempo real durante chamadas; alto risco de vazamento de memória em sessões longas de discagem.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-009 [BT360-DT-0065]
- **Dívida Técnica:** **BT360-DT-0065** (`DIV-13-001` )
- **Agente Responsável:** Agente **13** (Enxame Autônomo e Governança de Runtime)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P1** | **Status Atual:** `PARCIALMENTE IMPLEMENTADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Supervisor de enxame atinge o limite exato de 1000 linhas com acoplamento rígido a 8 agentes
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/agents/supervisor.agent.ts`
- **Causa Raiz:** O supervisor foi desenvolvido acumulando a lógica de decisão, prompts específicos de cada sub-enxame e regras de fallback em um único arquivo.
- **Impacto do Problema:** Dificuldade de expansão do enxame de agentes; risco iminente de quebra de CI em qualquer refatoração.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-030 [BT360-DT-0067]
- **Dívida Técnica:** **BT360-DT-0067** (`DIV-13-003` )
- **Agente Responsável:** Agente **13** (Enxame Autônomo e Governança de Runtime)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Histórico de conversas e decisões do Agent Bus mantido apenas em memória volátil
- **Escopo e Arquivos Envolvidos:** `src/lib/agents/agentBus.ts`
- **Causa Raiz:** O módulo foi prototipado para testes locais rápidos sem integração com o banco relacional de auditoria.
- **Impacto do Problema:** Perda de rastreabilidade regulatória e governança de IA exigidas para clientes enterprise.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-031 [BT360-DT-0068]
- **Dívida Técnica:** **BT360-DT-0068** (`DIV-13-004` )
- **Agente Responsável:** Agente **13** (Enxame Autônomo e Governança de Runtime)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de timeout individual por execução de ferramenta de IA travando o runtime do agente
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/agents/tools/`
- **Causa Raiz:** Falta de wrapper defensivo com `Promise.race` ou timeout configurável por ferramenta.
- **Impacto do Problema:** Travamento de tarefas autônomas de enriquecimento e prospecção em background.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-032 [BT360-DT-0070]
- **Dívida Técnica:** **BT360-DT-0070** (`DIV-14-002` )
- **Agente Responsável:** Agente **14** (Ambiente de Execução e Test Harness)
- **Onda de Execução:** **Onda 2**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de teardown determinístico para containers efêmeros em caso de cancelamento por SIGINT
- **Escopo e Arquivos Envolvidos:** `scripts/test/prepare-integration-env.js`
- **Causa Raiz:** O harness não registra listeners de sinais de processo (`process.on('SIGINT')`, `process.on('SIGTERM')`) para garantir o encerramento limpo dos containers antes da saída.
- **Impacto do Problema:** Acúmulo de dezenas de containers zumbis no Docker local; lentidão e travamentos por esgotamento de memória no host.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-033 [BT360-DT-0071]
- **Dívida Técnica:** **BT360-DT-0071** (`DIV-14-003` )
- **Agente Responsável:** Agente **14** (Ambiente de Execução e Test Harness)
- **Onda de Execução:** **Onda 2**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Falta de seed automático de entidades de compliance e opt-out no provisionamento do banco de teste
- **Escopo e Arquivos Envolvidos:** `scripts/test/prepare-integration-env.js`
- **Causa Raiz:** O provisionamento de teste focou apenas na estrutura de tabelas sem definição de um estado inicial de dados de compliance.
- **Impacto do Problema:** Testes de regras de privacidade tornam-se frágeis e suscetíveis a falsos positivos por falta de baseline padronizada.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-001 [BT360-DT-0072]
- **Dívida Técnica:** **BT360-DT-0072** (`DIV-15-001` / DEBT-SEC-001)
- **Agente Responsável:** Agente **15** (Segurança Aplicada e Rotação de Segredos)
- **Onda de Execução:** **Onda 0**
- **Prioridade:** **P0** | **Status Atual:** `PARCIALMENTE IMPLEMENTADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** URLs de autenticação com tokens mágicos e links de redefinição de senha escritas em texto puro em logs
- **Escopo e Arquivos Envolvidos:** `src/lib/auth.ts`
- **Causa Raiz:** Facilitação temporária de depuração mantida ativa fora de ambiente de teste puro.
- **Impacto do Problema:** Comprometimento total de contas de usuários administrativos caso os logs de aplicação sejam acessados por terceiros ou sofram vazamento; violação direta do Bloqueador B-04 (`AGENTS.md` §22).
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-010 [BT360-DT-0073]
- **Dívida Técnica:** **BT360-DT-0073** (`DIV-15-002` )
- **Agente Responsável:** Agente **15** (Segurança Aplicada e Rotação de Segredos)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P1** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Criptografia de credenciais em repouso sem suporte a envelope encryption e versionamento de chaves
- **Escopo e Arquivos Envolvidos:** `docs/security/ROTACAO_SEGREDOS.md`
- **Causa Raiz:** O formato de envelope criptográfico não previu metadados de versionamento de chaves (Key Rotation Grace Period).
- **Impacto do Problema:** Risco elevado de corrupção ou perda permanente de acesso a tokens de integração do Bitrix24 e telefonia durante processos de rotação de chaves.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-034 [BT360-DT-0074]
- **Dívida Técnica:** **BT360-DT-0074** (`DIV-15-003` )
- **Agente Responsável:** Agente **15** (Segurança Aplicada e Rotação de Segredos)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Configuração permissiva de CORS em server.ts para clientes externos
- **Escopo e Arquivos Envolvidos:** `server.ts`
- **Causa Raiz:** Facilitação para permitir que o app mobile e o frontend Vite rodem em portas dinâmicas sem bloqueio de CORS no desenvolvimento.
- **Impacto do Problema:** Risco de Cross-Origin Request Forgery e roubo de dados via scripts de terceiros em ambientes de homologação.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-035 [BT360-DT-0080]
- **Dívida Técnica:** **BT360-DT-0080** (`DIV-17-003` )
- **Agente Responsável:** Agente **17** (Cadência Multicanal e Ciclo de Receita)
- **Onda de Execução:** **Onda 3**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de verificação em lote de opt-out no momento do início da cadência
- **Escopo e Arquivos Envolvidos:** `src/features/cadence/services/cadenceExecution.service.ts`
- **Causa Raiz:** Falta de filtro prévio na etapa de associação de leads à régua comercial.
- **Impacto do Problema:** Sobrecarga desnecessária na fila do BullMQ e relatórios de cadência distorcidos com leads inelegíveis.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-036 [BT360-DT-0082]
- **Dívida Técnica:** **BT360-DT-0082** (`DIV-18-002` )
- **Agente Responsável:** Agente **18** (Contratos, API e Documentação Viva)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Divergência de validação entre schemas Zod de backend e definições DTO do OpenAPI para criação de leads
- **Escopo e Arquivos Envolvidos:** `src/features/crm/routes/lead.routes.ts`
- **Causa Raiz:** Atualização da regra de negócio no código de backend sem sincronização correspondente no arquivo OpenAPI.
- **Impacto do Problema:** Dificuldade de integração para desenvolvedores terceiros e falsos positivos em testes de contrato.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-037 [BT360-DT-0083]
- **Dívida Técnica:** **BT360-DT-0083** (`DIV-18-003` )
- **Agente Responsável:** Agente **18** (Contratos, API e Documentação Viva)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Script verify-openapi-drift não cobre rotas criadas recentemente para o Hub de Inteligência e Timeline
- **Escopo e Arquivos Envolvidos:** `scripts/verify-openapi-drift.ts`
- **Causa Raiz:** Uso de exclusões em scripts de teste para silenciar falhas de CI durante o desenvolvimento de novas features.
- **Impacto do Problema:** Acúmulo silencioso de rotas não documentadas e não testadas por ferramentas de segurança de API.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-038 [BT360-DT-0086]
- **Dívida Técnica:** **BT360-DT-0086** (`DIV-21-003` )
- **Agente Responsável:** Agente **21** (Privacidade e LGPD)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Hotspot em consentAuditChain.service.ts executando hash-chaining síncrono com impacto em transações
- **Escopo e Arquivos Envolvidos:** `src/lib/security/consentAuditChain.service.ts`
- **Causa Raiz:** Concentração de funções de cálculo de hash, validação de integridade de elos anteriores e ancoragem em arquivo único sem offload.
- **Impacto do Problema:** Degradação de tempo de resposta da API de onboarding em horários de pico.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-052 [BT360-DT-0087]
- **Dívida Técnica:** **BT360-DT-0087** (`DIV-21-004` )
- **Agente Responsável:** Agente **21** (Privacidade e LGPD)
- **Onda de Execução:** **Onda 1**
- **Prioridade:** **P3** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Falta de inventário de tratamento de dados (ROPA) automatizado e exportável para auditoria
- **Escopo e Arquivos Envolvidos:** `docs/lgpd-base-legal.md`
- **Causa Raiz:** Ausência de script de verificação de drift entre anotações de PII no schema e a documentação regulatória.
- **Impacto do Problema:** Dificuldade em responder prontamente a solicitações de auditoria ou Relatório de Impacto à Proteção de Dados Pessoais (RIPD).
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-039 [BT360-DT-0089]
- **Dívida Técnica:** **BT360-DT-0089** (`DIV-22-002` )
- **Agente Responsável:** Agente **22** (Verificação de Realidade)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Testes E2E do Playwright validam apenas o DOM sem asserções diretas no banco de dados (Database Assertions)
- **Escopo e Arquivos Envolvidos:** `playwright.config.ts`
- **Causa Raiz:** Testes E2E focados exclusivamente no comportamento visual do browser sem inclusão de cliente de banco para asserções de persistência.
- **Impacto do Problema:** Falsos positivos na esteira de testes; risco de regressões onde a UI parece funcionar mas o backend falha silenciosamente.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-040 [BT360-DT-0090]
- **Dívida Técnica:** **BT360-DT-0090** (`DIV-22-003` )
- **Agente Responsável:** Agente **22** (Verificação de Realidade)
- **Onda de Execução:** **Onda 5**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Ausência de teste contínuo de verificação de vazamento de PII em logs de aplicação
- **Escopo e Arquivos Envolvidos:** `scripts/security/`
- **Causa Raiz:** Falta de um harness de injeção e varredura de PII em logs.
- **Impacto do Problema:** Dificuldade de comprovar para auditores externos que o sistema é imune a vazamento de dados em stdout/stderr.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-041 [BT360-DT-0093]
- **Dívida Técnica:** **BT360-DT-0093** (`DIV-23-003` )
- **Agente Responsável:** Agente **23** (Custo, Performance e Limites de IA)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Inexistência de cache semântico ativo para pesquisas e análises de mercado frequentes
- **Escopo e Arquivos Envolvidos:** `src/lib/ai/gateway/semanticCache.ts`
- **Causa Raiz:** O módulo de cache semântico foi prototipado em branch separada mas não foi conectado ativamente aos endpoints de pesquisa de mercado.
- **Impacto do Problema:** Gastos redundantes com provedores de IA e tempo de espera de 8 a 12 segundos para respostas de empresas já pesquisadas recentemente.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---

### TAREFA-SANEAMENTO-042 [BT360-DT-0094]
- **Dívida Técnica:** **BT360-DT-0094** (`DIV-23-004` )
- **Agente Responsável:** Agente **23** (Custo, Performance e Limites de IA)
- **Onda de Execução:** **Onda 4**
- **Prioridade:** **P2** | **Status Atual:** `NÃO INICIADO`
- **Esforço Relativo Estimado:** **Médio**
- **Título do Problema:** Consulta N+1 no cálculo de métricas de uso de IA por vendedor no painel gerencial
- **Escopo e Arquivos Envolvidos:** `src/features/intelligence/services/agentCostAnalysis.service.ts`
- **Causa Raiz:** Falta de agrupamento em query única via `groupBy`.
- **Impacto do Problema:** Lentidão no painel de gestão de equipe e sobrecarga desnecessária no pool de conexões do banco de dados.
- **Critérios de Aceite Específicos:**
  1. Alteração estritamente cirúrgica nos arquivos autorizados pelo `AGENTS.md` §15.
  2. Implementação com tratamento explícito de erro sem fallbacks enganosos (`AGENTS.md` §30 e §32).
  3. Adição ou atualização de testes automatizados dedicados cobrindo caminho de sucesso e de falha.
- **Comandos de Validação e Gates Exigidos:**
  - `npx tsc --noEmit`
  - `npm run lint`
  - Testes específicos da área afetada.
- **Agente Revisor Obrigatório:** Agente **24** (Parecer em `.agents/reviews/`)
- **Condição para Encerramento:** Parecer formal `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.

---
