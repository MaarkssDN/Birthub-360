# 05 — PLANO MESTRE DE SANEAMENTO RECONCILIADO — BIRTHUB 360°

**Autoridade:** Agente 00 — Supervisor Geral de Engenharia  
**Auditoria Obrigatória:** Agente 24 — Revisão Independente  
**Commit HEAD Auditado:** `08c9734e1bb89a4d4fc552351470a1969f94d64f`  
**Data:** 2026-11-10  
**Estratégia:** 6 Ondas Sucessivas com Cobertura Integral das 52 Dívidas Acionáveis  

---

## 1. ESTRUTURA GERAL DAS ONDAS E GATES DE QUALIDADE

Cada uma das 52 dívidas acionáveis está expressamente contemplada pelo seu **ID canônico reconciliado**, agente autorizado, tarefa de execução, dependências e critério de aceite verificável.

---

## 2. DETALHAMENTO DAS ONDAS DE EXECUÇÃO

### ONDA 0: GOVERNANÇA, SEGURANÇA CRÍTICA E PREPARAÇÃO
- **Objetivo:** Eliminar a vulnerabilidade P0 de vazamento de URLs/tokens em logs, limpar prompts e automatizar higiene de branches.
- **Agentes Autorizados:** Agente **15** (Segurança), Agente **00** (Coordenação), Agente **08A** (Git Ops), Agente **24** (Auditor).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-001` [**BT360-DT-0072** | DIV-15-001 | P0 | Agente 15]: Eliminar chave `resetUrl` e URLs em logs de `src/lib/auth.ts`. Teste: `node scripts/verify-auth-log-redaction.mjs` (100% PASS).
  - `TAREFA-SANEAMENTO-049` [**BT360-DT-0001** | DIV-00-001 | P3 | Agente 00]: Atualizar referências de documentos em prompts centrais.
  - `TAREFA-SANEAMENTO-051` [**BT360-DT-0048** | DIV-08A-001 | P3 | Agente 08A]: Configurar automação de limpeza de branches remotas órfãs.
- **Gates de Saída:** `node scripts/verify-auth-log-redaction.mjs` verde; Parecer Agente 24 `APROVADO`.

---

### ONDA 1: BANCO, RLS, INTEGRIDADE E LGPD
- **Objetivo:** Criar índices compostos no CRM, modularizar `prisma.ts`, validar integridade referencial com `onDelete` e automatizar inventário ROPA LGPD.
- **Agentes Autorizados:** Agente **01** (Leva A), Agente **01A** (Leva B - slot exclusivo), Agente **21** (LGPD).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-013` [**BT360-DT-0008** | DIV-01-004 | P2 | Agente 01]: Índices compostos em `LeadActivity` e `CallAttempt`.
  - `TAREFA-SANEAMENTO-014` [**BT360-DT-0010** | DIV-01-006 | P2 | Agente 01]: Modularização de `src/lib/prisma.ts` (928L) em submódulos < 400L.
  - `TAREFA-SANEAMENTO-015` [**BT360-DT-0013** | DIV-01A-003 | P2 | Agente 01A]: Verificação de integridade referencial de chaves estrangeiras com `onDelete`.
  - `TAREFA-SANEAMENTO-038` [**BT360-DT-0086** | DIV-21-003 | P2 | Agente 21]: Particionamento físico de tabelas volumosas de consentimento.
  - `TAREFA-SANEAMENTO-039` [**BT360-DT-0087** | DIV-21-004 | P2 | Agente 21]: Geração automatizada do inventário ROPA LGPD.
  - `TAREFA-SANEAMENTO-050` [**BT360-DT-0009** | DIV-01-005 | P3 | Agente 01]: Otimização de contagem única na criação do primeiro usuário.
- **Gates de Saída:** `npm run verify:migration-drift` (0 diff); testes de isolamento multi-tenant passando.

---

### ONDA 2: INFRAESTRUTURA, RUNTIME, WORKERS E TEST HARNESS
- **Objetivo:** Implementar teardown determinístico de containers de teste, seed de conformidade e rate limiting de borda.
- **Agentes Autorizados:** Agente **14** (Harness), Agente **10** (SRE), Agente **15** (Segurança de Rede), Agente **16** (Workers).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-029` [**BT360-DT-0057** | DIV-10-003 | P2 | Agente 10]: Limitação de taxa em nível de Ingress/Caddy/Nginx.
  - `TAREFA-SANEAMENTO-033` [**BT360-DT-0070** | DIV-14-002 | P2 | Agente 14]: Teardown determinístico de containers efêmeros em caso de SIGINT/erro.
  - `TAREFA-SANEAMENTO-034` [**BT360-DT-0071** | DIV-14-003 | P2 | Agente 14]: Seed automático de entidades sintéticas de conformidade.
  - `TAREFA-SANEAMENTO-035` [**BT360-DT-0073** | DIV-15-002 | P2 | Agente 15]: Envelope encryption para segredos em repouso.
  - `TAREFA-SANEAMENTO-036` [**BT360-DT-0074** | DIV-15-003 | P2 | Agente 15]: Restrição de CORS em `server.ts` apenas para origens explícitas.
- **Gates de Saída:** `npm run test:architecture` verde; simulação de shutdown de containers 100% limpa.

---

### ONDA 3: INTEGRAÇÕES, BITRIX24, TELEFONIA E CADÊNCIA
- **Objetivo:** Modularizar o painel BitrixImportPanel (1.252L), aplicar cancelamento com AbortSignal, purgar temporários de extração e sanear estúdio de voz.
- **Agentes Autorizados:** Agente **06** (Leva A), Agente **06A** (Leva B - slot exclusivo), Agente **12** (Voz), Agente **17** (Cadência).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-004` [**BT360-DT-0030** | DIV-06-002 | P1 | Agente 06]: Modularização de `BitrixImportPanel.tsx` (1.252L).
  - `TAREFA-SANEAMENTO-020` [**BT360-DT-0032** | DIV-06-004 | P2 | Agente 06]: Tratamento de promessas assíncronas em componentes de conectores.
  - `TAREFA-SANEAMENTO-021` [**BT360-DT-0035** | DIV-06A-003 | P2 | Agente 06A]: Rotina de purga periódica de arquivos temporários de exportação.
  - `TAREFA-SANEAMENTO-022` [**BT360-DT-0036** | DIV-06A-004 | P2 | Agente 06A]: Cancelamento cooperativo com `AbortSignal` em extrações Bitrix.
  - `TAREFA-SANEAMENTO-027` [**BT360-DT-0063** | DIV-12-003 | P2 | Agente 12]: Decomposição de hotspots em estúdio de voz (`Overview.tsx` 1.431L).
  - `TAREFA-SANEAMENTO-037` [**BT360-DT-0080** | DIV-17-003 | P2 | Agente 17]: Verificação em lote de opt-out prévia ao início de cadências.
- **Gates de Saída:** `npm run verify:integrations` aprovado; testes unitários de extrações verdes.

---

### ONDA 4: IA, ENXAMES AUTÔNOMOS E CONTROLE DE CUSTOS
- **Objetivo:** Modularizar o supervisor de enxame (1000L), persistir histórico do barramento em Redis, aplicar timeouts individuais por tool e otimizar N+1 em métricas de IA.
- **Agentes Autorizados:** Agente **13** (Enxame), Agente **07** (IA), Agente **23** (FinOps IA), Agente **05** (Prospecção).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-005` [**BT360-DT-0065** | DIV-13-001 | P1 | Agente 13]: Modularização de `supervisor.agent.ts` (1.000L) para menos de 400 linhas.
  - `TAREFA-SANEAMENTO-018` [**BT360-DT-0027** | DIV-05-003 | P2 | Agente 05]: Purga periódica de cache de enriquecimento de dados.
  - `TAREFA-SANEAMENTO-019` [**BT360-DT-0028** | DIV-05-004 | P2 | Agente 05]: Validação prévia em lote de listas de supressão de prospecção.
  - `TAREFA-SANEAMENTO-023` [**BT360-DT-0039** | DIV-07-003 | P2 | Agente 07]: Trilha de auditoria e consentimento em execuções autônomas de IA.
  - `TAREFA-SANEAMENTO-024` [**BT360-DT-0040** | DIV-07-004 | P2 | Agente 07]: Tratamento de erro resiliente e retry explícito no Copiloto.
  - `TAREFA-SANEAMENTO-025` [**BT360-DT-0041** | DIV-07-005 | P2 | Agente 07]: Logging observável em falhas de busca na base de conhecimento.
  - `TAREFA-SANEAMENTO-030` [**BT360-DT-0067** | DIV-13-003 | P2 | Agente 13]: Persistência de mensagens e decisões do Agent Bus em Redis.
  - `TAREFA-SANEAMENTO-031` [**BT360-DT-0068** | DIV-13-004 | P2 | Agente 13]: Timeout estrito com AbortController por ferramenta de agente.
  - `TAREFA-SANEAMENTO-042` [**BT360-DT-0093** | DIV-23-003 | P2 | Agente 23]: Cache semântico de embeddings para redução de custos de LLM.
  - `TAREFA-SANEAMENTO-043` [**BT360-DT-0094** | DIV-23-004 | P2 | Agente 23]: Eliminação de consultas N+1 no cálculo de métricas de IA.
- **Gates de Saída:** `npm run verify:ai` verde; `npm run check:hotspots` comprovando supervisor < 700 linhas.

---

### ONDA 5: FRONTEND, HOTSPOTS, DESIGN SYSTEM E HOMOLOGAÇÃO INTEGRAL
- **Objetivo:** Eliminar regressão de `!important` em CSS, modularizar CrmBoard (1258L) e App.tsx (716L), validar recibo de broadcast e certificar release.
- **Agentes Autorizados:** Agente **02** (UX), Agente **03** (Design), Agente **04** (BI), Agente **09** (Mobile), Agente **11** (Marca), Agente **18** (Contratos), Agente **22** (Verificação Realidade), Agente **24** (Auditoria Final).
- **Tarefas e Dívidas Integradas:**
  - `TAREFA-SANEAMENTO-002` [**BT360-DT-0017** | DIV-03-001 | P1 | Agente 03]: Eliminação total de 14 diretivas `!important` em `globals.css` e `NewLoginScreen.css`.
  - `TAREFA-SANEAMENTO-003` [**BT360-DT-0015** | DIV-02-002 | P1 | Agente 02]: Decomposição modular de `src/components/CrmBoard.tsx` (1.258L).
  - `TAREFA-SANEAMENTO-011` [**BT360-DT-0014** | DIV-02-001 | P2 | Agente 02]: Validação de testes multi-tenant de recibo de leitura de notificações broadcast.
  - `TAREFA-SANEAMENTO-012` [**BT360-DT-0016** | DIV-02-003 | P2 | Agente 02]: Desacoplamento e extração de rotas em `src/App.tsx` (716L).
  - `TAREFA-SANEAMENTO-016` [**BT360-DT-0020** | DIV-03-004 | P2 | Agente 03]: Estabilização e calibração de tolerância em testes visuais.
  - `TAREFA-SANEAMENTO-017` [**BT360-DT-0024** | DIV-04-004 | P2 | Agente 04]: Otimização de queries pesadas em relatórios analíticos de vendas.
  - `TAREFA-SANEAMENTO-028` [**BT360-DT-0054** | DIV-09-004 | P2 | Agente 09]: Sincronização offline background via SQLite no Android.
  - `TAREFA-SANEAMENTO-032` [**BT360-DT-0060** | DIV-11-003 | P2 | Agente 11]: Alinhamento semântico de tokens na BrandColorPalette.
  - `TAREFA-SANEAMENTO-037` [**BT360-DT-0082** | DIV-18-002 | P2 | Agente 18]: Sincronização estrita de schemas Zod com definições OpenAPI.
  - `TAREFA-SANEAMENTO-040` [**BT360-DT-0089** | DIV-22-002 | P2 | Agente 22]: Asserções de persistência real em banco nas jornadas Playwright.
  - `TAREFA-SANEAMENTO-041` [**BT360-DT-0090** | DIV-22-003 | P2 | Agente 22]: Suíte de testes de detecção e vazamento de PII em logs.
  - `TAREFA-SANEAMENTO-052` [**BT360-DT-0059** | DIV-11-002 | P3 | Agente 11]: Compressão WebP/AVIF em ativos de `public/`.
- **Gates de Saída:** `npm run release:check` 100% verde; `check:hotspots` com 0 arquivos acima de 1.000L sem exceção; Parecer formal `APROVADO` do Agente 24.
