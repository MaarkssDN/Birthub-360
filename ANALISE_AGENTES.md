# Análise Técnica Consolidada e Profunda dos 25 Agentes do Birth Hub 360

O ecossistema do **Birth Hub 360** é gerenciado por uma arquitetura de múltiplos agentes, orquestrada de maneira rigorosa pelo `AGENTS.md` e descrita individualmente nas prompts de configuração em `.agents/prompts/`. Cada agente opera dentro de um **domínio técnico exclusivo**, com responsabilidades restritas de leitura, escrita e auditoria de diretórios e arquivos bem estabelecidos.

Esta análise desdobra de forma profunda as competências, limites e fronteiras de colaboração dos 25 agentes ativos no projeto. O rigor na separação de interesses (SoC) entre eles garante que dados, segurança, interfaces visuais e lógica comercial sejam desenvolvidos de maneira concorrente sem infrações de escopo.

---

## Estrutura de Orquestração (00 e 24)

Estes são os agentes de governança. Eles controlam o fluxo de integração, orquestram o paralelismo e asseguram que nenhum agente especialista suba código que quebre os limites de qualidade, segurança ou tenancy definidos para a aplicação.

### **00 — Coordenador (Chief Commercial Intelligence Engineering Orchestrator)**
- **Papel:** Integrador técnico absoluto. Decompõe tarefas, cria as *waves* (ondas), controla a capacidade paralela do enxame (através de *worktrees* ou processamento em série) e gerencia os isolamentos.
- **Escopo e Domínio Exclusivo:**
  - `server.ts` (modificações neste arquivo requerem sua autorização explícita).
  - `package.json` e arquivos de *lock* (como `pnpm-lock.yaml`).
  - Responsável por escrever as submissões finais em `.agents/runs/` e analisar *handoffs*.
- **Limites:** Não escreve código operacional sozinho, e não pode pular a revisão de segurança (`Agente 24`) em nenhuma entrega.

### **24 — Auditor Independente e Aprovação de Entregas**
- **Papel:** A figura central do controle de qualidade e mitigação de regressões. Antes de qualquer entrega, merge, PR ou finalização de handoff ser aprovada, o *Agente 24* obrigatoriamente valida se a intenção técnica cumpre o seu propósito real (observabilidade real, sem dados "mocks").
- **Escopo e Domínio Exclusivo:**
  - Seus laudos são os únicos documentos que podem ser salvos em `.agents/reviews/`.
- **Limites:** Ele não coda no produto e nunca audita o próprio trabalho. As decisões são categóricas: `APROVADO`, `REPROVADO` ou `BLOQUEADO`.

---

## 1. Fundação, Dados e Segurança (01, 01A, 15, 21 e 22)

Esse cluster técnico de agentes garante que a base da arquitetura relacional, a separação de *tenants* e a lei de proteção de dados estejam enraizados em código puro (antes da UI).

### **01 — Plataforma, Segurança e Dados**
- **Papel:** Arquiteto de segurança fundacional, focando em RBAC, autenticação, schema de banco e isolamento (Tenant e Organizações).
- **Escopo e Domínio Exclusivo:**
  - `prisma/schema.prisma` (somente ele modifica entidades).
  - `prisma/migrations/**` (ninguém além do 01 gera migrações. Integrações devem abrir handoffs para ele).

### **01A — Confiabilidade de Dados, RLS e Retenção**
- **Papel:** Sub-slot do 01. Especializa-se em Row Level Security (RLS), integridade e política de retenção no banco de dados. Nunca executa junto com o 01 para não conflitar na propriedade de arquivos Prisma.
- **Escopo e Domínio Exclusivo:**
  - Trabalha no mesmo pool do 01 para gerir a infraestrutura dos schemas.

### **15 — Segurança Aplicada e Rotação de Segredos**
- **Papel:** Garantir e verificar que tokens, chaves API e credenciais não estejam hard-coded em lugar algum.
- **Escopo e Domínio Exclusivo:**
  - Scripts rotativos e scans de segredos. Não possui arquivos do produto, mas patrulha credenciais em configs locais e arquivos remotos, levantando *achados*.

### **21 — Privacidade e LGPD**
- **Papel:** Guardião da Lei 13.709/2018. Rastreabilidade, DSR (direitos do titular), fluxos de k-anonimato.
- **Escopo e Domínio Exclusivo:**
  - `src/lib/privacy/**` e `src/shared/services/consentAuditChain.service.ts`
  - `docs/lgpd/ROPA-INVENTARIO-TRATAMENTO.md`

### **22 — Verificação de Realidade**
- **Papel:** "Anti-Mock". Responsável por produzir provas baseadas em PostgreSQL de que ações da UI persistem em tabelas sem estados efêmeros em memórias frontend.
- **Escopo e Domínio Exclusivo:**
  - `scripts/verification/**`
  - Laudos de falha que geram handoffs ao `01` ou `02`.

---

## 2. Produto, Experiência de Navegação e Apresentação Visual (02, 03 e A-G, 09 e 11)

Esta camada engloba o frontend cru, os componentes, os estilos, as tipografias e as compilações multiplataforma.

### **02 — Produto e UX**
- **Papel:** Domínio da navegação, roteamento, *onboarding* e dashboard. É o guardião do "como se usa".
- **Escopo e Domínio Exclusivo:**
  - `src/App.tsx`, navs, e estrutura geral de navegação do frontend.

### **03 — Design e Acessibilidade (Cluster)**
- **03 (Pai):** Coordena o *design system*, assets visuais e a acessibilidade global. Identificação de *Tenants* visuais que cruzam no `playbooks.ts`.
- **03A — Diretor:** Arquiteto focado em transformar a interface num "cockpit" B2B B2B executivo.
- **03B — Arquiteto de UI:** Controla o sistema Bento Grid e os quatro estados mandatórios de tela.
- **03C — Design System:** Dono de *tokens Tailwind*, variáveis CSS e tipografia.
- **03D — Motion:** Especialista em microinterações, transições e cinética do React.
- **03E — Auditor A11Y:** Audita conformidade exigente com WCAG 2.2 Nível AA.
- **03F — Inspetor de QA Visual:** Previne regressões estéticas (ex: padding, layout quebrando).
- **03G — Guardião Anti-Slop:** Usa o "Impeccable" para garantir que interfaces e textos da IA fujam de clichês operacionais.
- *Nota: Todo o Cluster 03 opera as camadas de `components` e Tailwind.*

### **09 — Mobile**
- **Papel:** Gerencia a versão mobile unificando webview via Capacitor sem duplicar lógica de domínio.
- **Escopo e Domínio Exclusivo:**
  - `android/**` e `capacitor.config.ts`.

### **11 — Marca e Ativos Institucionais**
- **Papel:** Curadoria e versão da marca global.
- **Escopo e Domínio Exclusivo:**
  - Diretórios `identidade-visual/**` e `documentacao-aplicacao/**`.

---

## 3. Inteligência Comercial e Processamento de Dados B2B (04, 05 e 17)

Camada onde a essência de um "Hub" de nascimento e escalabilidade comercial mora. CRM, scoring, pipelines.

### **04 — CRM e BI**
- **Papel:** Estruturas corporativas. Gerenciamento do ciclo de vida das contas comerciais, contatos, pipelines e o motor de métricas base de BI.
- **Escopo e Domínio Exclusivo:**
  - Lógica comercial core nos pipelines que dependem das extrações visuais ou do backend. Ponto-chave no consumo de schemas CRM.

### **05 — Prospecção**
- **Papel:** Operador focado no "Topo de funil". Responsável pelo motor de leads, scraping (se houver), descobrimentos e motores de *Lead Scoring*.

### **17 — Cadência Multicanal e Ciclo de Receita**
- **Papel:** Automatizador de *Closer*. Domina a fase pós-onboarding (o engajamento profundo após a prospecção inicial dar o match).
- **Escopo e Domínio Exclusivo:**
  - Todo o diretório `src/features/cadence/**` (novo diretório restrito a este agente).
  - Emite handoffs para o `04` quando toca em *pipelines de vendas*.

---

## 4. Orquestração Externa e Integrações (06, 06A, 12, 16)

A integração com o mundo (voz, Bitrix24, filas Rabbit/BullMQ, cron jobs).

### **06 — Integrações e Bitrix**
- **Papel:** Confiança na cola técnica. Gere OAuths, autenticações de apps terceiros e as rotinas complexas da infraestrutura Bitrix.

### **06A — Extrações Bitrix**
- **Papel:** Especialista estrito de alto volume. Puxa os dados corporativos do Bitrix via scripts pesados (em chunks). É slot-partilhado do 06.
- **Limites:** Nenhum deles cria tabelas. Geram esquemas transitórios ou dependem de handoffs para o `01`.

### **12 — Voz e Telefonia**
- **Papel:** Operador de comunicações "duras" (Bland, 3CX). Discagens SIP e autônomas, Webhooks e supressões de ligações (ex: Blacklists de voz).

### **16 — Runtime, Workers e Escala**
- **Papel:** Guardião das filas do BullMQ e de *background jobs*. O express (`server.ts`) monta os jobs, mas a lógica paralela é dele.
- **Escopo:** Todo e qualquer worker, gerencia cron/schedules do repositório.

---

## 5. Hub de IA e Agentes Autônomos em Runtime (07, 13 e 23)

O Hub de IAs do próprio produto, diferentemente das automações (onde a IA constrói o código, como esta análise), aqui o foco é a IA em runtime para o usuário final.

### **07 — IA e Automações**
- **Papel:** Dono das *embeddings*, do RAG e das abstrações lógicas de Roleplay (os chatbots do usuário). Utiliza fortemente OpenTelemetry e gerencia promps B2B do cliente.

### **13 — Enxame Autônomo e Governança**
- **Papel:** Dono estritamente dos "agentes de IA do cliente" (ex: SDR autônomo, BDR, Closer IA). É fácil confundi-lo com ferramentas locais. Ele programa o *Scheduler* de conversas da plataforma.

### **23 — Custo, Performance e Limites de IA**
- **Papel:** Orçamentista. Bloqueia *rate limits*, gargalos (N+1 queries), e regula consumo de *tokens* em tempo real.
- **Escopo e Domínio Exclusivo:**
  - `docs/performance/**` e `scripts/benchmarks/**`.
  - `src/lib/ai/tokenBudget.ts`.

---

## 6. QA, Deploy, Harness e Infraestrutura (08, 08A, 10, 14, 18)

Os guardiões finais do código no repositório antes, durante, e depois do release.

### **08 — QA e Release**
- **Papel:** QA clássico. Valida a bateria de testes finais e gates formais (CI/CD).
- **Escopo e Domínio Exclusivo:**
  - `.github/workflows/**`, `Dockerfile` e arquivos globais `docker-compose*.yml`.

### **08A — Operações Git e Deploy AWS**
- **Papel:** Executor de pushes e PRs sob demanda. Se autorizado, dispara e coordena fluxos para nuvem pública sob o slot do 08.
- **Restrição:** Depende do 24 para agir. Não é dono da arquitetura K8s, é só o script de delivery.

### **10 — Infraestrutura e SRE**
- **Papel:** Como a aplicação "vive" em produção. Alertas, Telemetria base e provisionamento K8s.
- **Escopo e Domínio Exclusivo:**
  - `k8s/**`, `charts/**`, `argocd/**` e `infrastructure/**`.

### **14 — Ambiente de Execução e Harness**
- **Papel:** Controla a sanidade das máquinas de teste (os setups onde CI, playwrights, testes de integração correm). Garante que gates não dêem falso sucesso se a base quebrar.

### **18 — Contratos, API e Documentação**
- **Papel:** Assegura que o código (a verdade crua) bata exatamente com o que os manifestos dizem que é (Swagger/OpenAPI).
- **Escopo:** Evita drifts, analisando roteadores e tabelas contra payloads reais descritos nos docs.

---

### **Conclusão Operacional**
O enxame de agentes de desenvolvimento do *Birth Hub 360* elimina pontos cegos ao impor que modificações pontuais que cruzem domínios **sejam sempre** notificadas em forma de `Handoffs`. Nenhum agente, em hipótese alguma, refatora código órfão pertencente a outro agente. Esse modelo hiper-especializado promove alta coerência de projeto, eliminando débito técnico furtivo.
