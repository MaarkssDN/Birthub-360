# 01 — INVENTÁRIO INTEGRAL DE DÍVIDAS TÉCNICAS RECONCILIADO — BIRTHUB 360°

**Projeto:** Birthub 360° (Plataforma Completa de Inteligência Comercial e Enxame de Agentes)  
**Autoridade:** Agente 00 — Supervisor Geral de Engenharia  
**Auditoria de Governança:** Agente 24 — Revisão Independente  
**Fonte Canônica de Autoridade:** `AGENTS.md` (Revisão 2026-10-09)  
**Commit HEAD Auditado:** `08c9734e1bb89a4d4fc552351470a1969f94d64f` (`08c9734e1`)  
**Data de Emissão e Reconciliação:** 2026-11-10  
**Status do Repositório:** HOMOLOGADO E RECONCILIADO (STATUS: PRONTO PARA EXECUÇÃO CONTROLADA)  

---

## 1. HISTÓRICO FORENSE E TRILHA DE RECONCILIAÇÃO

A plataforma Birthub 360 acumulou múltiplos ciclos de auditoria e relatórios de conformidade técnica:
1. **Varredura Automatizada Bruta (2026-09-29 - `TECH_DEBT_REMEDIATION_PLAN.md`):** Registrou 5.505 ocorrências brutas. A investigação forense comprovou que mais de 90% eram falsos positivos decorrentes de correspondência de texto cego (ex.: palavra "todo/todos" em português em comentários de negócio e fixtures).
2. **Auditoria Forense V2 (2026-10-05 - `docs/audits/technical-debt/v2/`):** Descartou os 176 falsos positivos de tradução e isolou 7 dívidas reais focadas em repositórios SQL e tipagens fracas (`TD-00-001` a `TD-08-001`).
3. **Auditoria de Conformidade e Riscos (2026-10-14 - `.agents/audits/technical-debt/2026-10-14/`):** Mapeou 40 achados confirmados (`DEBT-GATE-001` a `DEBT-GOV-004`).
4. **Auditoria de Prontidão para Produção (2026-10-17 - `docs/audits/prontidao-producao-20261017/`):** 13 relatórios setoriais detalhando prontidão de banco, CI/CD, segurança LGPD e testes, definindo ações bloqueantes A-01 a A-03 e não-bloqueantes B-01 a B-04.
5. **Auditoria Global dos 26 Agentes Especialistas (2026-11-04 - `docs/auditorias/dividas-tecnicas/`):** Sweep completo em 26 relatórios individuais gerando **97 dívidas técnicas categorizadas** (`DIV-00-001` a `DIV-24-003`) e sintetizadas no `DIVIDAS-TECNICAS-RELATORIO-MESTRE.md`.
6. **Onda de Saneamento 2026-11-05 (`.agents/handoffs/onda-saneamento-20261105/`):** 35 handoffs formalizados e mesclados no commit `20f1b02b3`, tratando 35 dívidas prioritárias.
7. **Reconciliação Forense Final (2026-11-10 - Main @ `08c9734e1`):** Eliminação de todas as ambiguidades de identificação, correção de mapeamentos divergentes (`BT360-DT-0009` vs `0014`, `BT360-DT-0031` vs `0030`, `BT360-DT-0056` vs `0065`, `BT360-DT-0064` vs `0072`) e vinculação estrita 1:1 entre dívidas acionáveis e tarefas do backlog.

---

## 2. INVENTÁRIO CONSOLIDADO CANÔNICO (BT360-DT-0001 A BT360-DT-0097)

| ID Canônico | Ref. Original | Agente | Prioridade | Status Comprovado | Localização Principal | Resumo do Problema / Diagnóstico Forense | Tarefa / Onda |
|---|---|:---:|:---:|---|---|---|:---:|
| **BT360-DT-0001** | `DIV-00-001` (DEBT-GOV-001) | **00** | **P3** | `NÃO INICIADO` | `.agents/prompts/00-coordenador.md` | Leitura obrigatória no prompt de coordenação referencia documento de ondas inexistente | `TAREFA-SANEAMENTO-043` (Onda 0) |
| **BT360-DT-0002** | `DIV-00-002` (DEBT-GOV-002) | **00** | **P2** | `CORRIGIDO / HOMOLOGADO` | `.github/workflows/docker-publish.yml` | Política local-first de desenvolvimento conflita com workflow de publicação contínua automática no GHCR | `Concluído` |
| **BT360-DT-0003** | `DIV-00-003` (DEBT-GOV-003) | **00** | **P2** | `CORRIGIDO / HOMOLOGADO` | `.agents/reviews/handoffs-2026-10-09-24.md` | Handoffs históricos com cabeçalho 'Status: resolvido' contradizendo seções de resolução interna | `Concluído` |
| **BT360-DT-0004** | `DIV-00-004`  | **00** | **P2** | `NÃO INICIADO` | `AGENTS.md` | Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser | `TAREFA-SANEAMENTO-011` (Onda 5) |
| **BT360-DT-0005** | `DIV-01-001` (DEBT-DB-001) | **01** | **P1** | `CORRIGIDO / HOMOLOGADO` | `docs/development/LOCAL_FIRST.md` | Guia canônico LOCAL_FIRST.md e compose orientam conectar com superusuário de bootstrap (bypass de RLS) | `Concluído` |
| **BT360-DT-0006** | `DIV-01-002` (DEBT-DB-002) | **01** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.ts` | Repositórios SQL nativos do discador executam queries diretas sem cláusula organization_id | `Concluído` |
| **BT360-DT-0007** | `DIV-01-003` (DEBT-ONB-001) | **01** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/features/organization-modules/services/organizationModules.service.ts` | Mutações concorrentes de módulos da organização sobrescrevem seleções anteriores sem concorrência otimista | `Concluído` |
| **BT360-DT-0008** | `DIV-01-004` (DEBT-PERF-001) | **01** | **P2** | `NÃO INICIADO` | `src/features/analytics/infra/PrismaAnalyticsRepository.ts` | Resumo de consumo de inteligência artificial carrega todas as linhas de logs em memória para agregação | `TAREFA-SANEAMENTO-012` (Onda 1) |
| **BT360-DT-0009** | `DIV-01-005` (DEBT-CODE-001) | **01** | **P3** | `NÃO INICIADO` | `src/lib/auth.ts` | Lógica de criação de primeiro usuário executa user.count redundante para atribuir role ADMIN | `TAREFA-SANEAMENTO-044` (Onda 1) |
| **BT360-DT-0010** | `DIV-01-006`  | **01** | **P2** | `NÃO INICIADO` | `src/lib/prisma.ts` | Hotspot arquitetural crítico em src/lib/prisma.ts acumulando múltiplas responsabilidades | `TAREFA-SANEAMENTO-013` (Onda 1) |
| **BT360-DT-0011** | `DIV-01A-001` (DEBT-LGPD-002) | **01A** | **P1** | `CORRIGIDO / HOMOLOGADO` | `prisma/schema.prisma` | Memória conversacional de agentes (AgentMemory) não possui vínculo direto com titular para expurgo individual | `Concluído` |
| **BT360-DT-0012** | `DIV-01A-002`  | **01A** | **P1** | `CORRIGIDO / HOMOLOGADO` | `prisma/schema.prisma` | Ausência de particionamento e políticas de retenção automatizada (TTL) em tabelas de auditoria e telemetria | `Concluído` |
| **BT360-DT-0013** | `DIV-01A-003`  | **01A** | **P2** | `NÃO INICIADO` | `prisma/schema.prisma` | Verificação de integridade referencial: foreign keys com onDelete CASCADE em tabelas mestres de tenant | `TAREFA-SANEAMENTO-014` (Onda 1) |
| **BT360-DT-0014** | `DIV-02-001` (DEBT-NOT-001) | **02** | **P2** | `IMPLEMENTADO / NÃO VALIDADO` | `src/features/notifications/services/notification.service.ts` | Leitura de notificação broadcast em entidade compartilhada silencia unread para colegas de equipe | `TAREFA-SANEAMENTO-015` (Onda 5) |
| **BT360-DT-0015** | `DIV-02-002`  | **02** | **P1** | `PARCIALMENTE IMPLEMENTADO` | `src/components/CrmBoard.tsx` | Hotspot estrutural no componente central CrmBoard.tsx acumulando múltiplas responsabilidades | `TAREFA-SANEAMENTO-002` (Onda 5) |
| **BT360-DT-0016** | `DIV-02-003`  | **02** | **P2** | `PARCIALMENTE IMPLEMENTADO` | `src/App.tsx` | Acoplamento excessivo e orquestração de side-effects em src/App.tsx | `TAREFA-SANEAMENTO-016` (Onda 5) |
| **BT360-DT-0017** | `DIV-03-001`  | **03** | **P1** | `REGRESSÃO` | `src/styles/globals.css` | Proliferação de declarações !important em folhas de estilo quebrando a cascata CSS e tokens de tema | `TAREFA-SANEAMENTO-003` (Onda 5) |
| **BT360-DT-0018** | `DIV-03-002`  | **03** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/components/ui/ButtonGroup.tsx` | Elementos de navegação em grupo (ButtonGroup) sem semântica acessível e sem rótulo para leitores de tela | `Concluído` |
| **BT360-DT-0019** | `DIV-03-003`  | **03** | **P3** | `CORRIGIDO / HOMOLOGADO` | `src/components/brand/title-icons/flowIcons.tsx` | SVGs e ícones com cores hexadecimais fixas (hardcoded) e parâmetros inoperantes | `Concluído` |
| **BT360-DT-0020** | `DIV-03-004`  | **03** | **P2** | `NÃO INICIADO` | `playwright.visual.config.ts` | Instabilidade e tolerância frouxa em testes de regressão visual devido a fontes do sistema operacional | `TAREFA-SANEAMENTO-017` (Onda 5) |
| **BT360-DT-0021** | `DIV-04-001` (DEBT-UX-003) | **04** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/analytics/analytics.service.ts` | Serviço de analytics mascara erros de agregação retornando HTTP 200 com métricas zeradas | `Concluído` |
| **BT360-DT-0022** | `DIV-04-002` (DEBT-UX-002) | **04** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/features/companies/components/CompanyList.tsx` | Busca textual full-text de empresas descarta resultados além do primeiro lote sem aviso | `Concluído` |
| **BT360-DT-0023** | `DIV-04-003` (DEBT-UX-004) | **04** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/features/analytics/analytics.service.ts` | Agregações financeiras de vendas utilizam fuso horário UTC em vez do fuso canônico de Brasília | `Concluído` |
| **BT360-DT-0024** | `DIV-04-004`  | **04** | **P2** | `NÃO INICIADO` | `src/features/crm360/infra/PrismaCrm360Repository.ts` | Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts | `TAREFA-SANEAMENTO-018` (Onda 5) |
| **BT360-DT-0025** | `DIV-05-001`  | **05** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/prospecting/outbound/server/routes/leads.routes.ts` | Hotspot estrutural excessivo e concentração de lógica em leads.routes.ts | `Concluído` |
| **BT360-DT-0026** | `DIV-05-002`  | **05** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/prospecting/services/enrichment.service.ts` | Ausência de circuit breaker e rate limit adaptativo no serviço de enriquecimento de leads | `Concluído` |
| **BT360-DT-0027** | `DIV-05-003`  | **05** | **P2** | `NÃO INICIADO` | `src/features/prospecting/services/enrichment.service.ts` | Acúmulo de cache de enriquecimento sem expurgo automático em tabelas temporárias | `TAREFA-SANEAMENTO-019` (Onda 4) |
| **BT360-DT-0028** | `DIV-05-004`  | **05** | **P2** | `NÃO INICIADO` | `src/features/prospecting/services/cold-email.service.ts` | Ausência de validação prévia em lote de listas de supressão (Opt-Out) em importações de prospecção | `TAREFA-SANEAMENTO-020` (Onda 4) |
| **BT360-DT-0029** | `DIV-06-001` (DEBT-INT-001) | **06** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/features/integrations/bitrix/service/client.ts` | Cliente HTTP do Bitrix aborta precocemente a leitura de socket em respostas com latência parcial | `Concluído` |
| **BT360-DT-0030** | `DIV-06-002`  | **06** | **P1** | `PARCIALMENTE IMPLEMENTADO` | `src/features/integrations/components/BitrixImportPanel.tsx` | Três painéis monolíticos gigantescos na interface de gerenciamento de integrações | `TAREFA-SANEAMENTO-004` (Onda 3) |
| **BT360-DT-0031** | `DIV-06-003`  | **06** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/integrations/threecx/threecx.service.ts` | Ingestão de webhooks telefônicos do 3CX síncrona e sem garantia transacional de outbox | `Concluído` |
| **BT360-DT-0032** | `DIV-06-004`  | **06** | **P3** | `NÃO INICIADO` | `src/features/integrations/components/ExternalCrmPanel.tsx` | Tratamento incompleto de promessas assíncronas em componentes de importação externa (Sonar S9383) | `TAREFA-SANEAMENTO-045` (Onda 3) |
| **BT360-DT-0033** | `DIV-06A-001`  | **06A** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/integrations/bitrix/service/extraction.ts` | Acúmulo de dados em arrays de memória durante paginação massiva em extraction.ts com risco de Out of Memory | `Concluído` |
| **BT360-DT-0034** | `DIV-06A-002`  | **06A** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/services/bitrix/exportFormatter.service.ts` | Ausência de sanitização contra CSV/Formula Injection em campos dinâmicos de texto livre do Bitrix | `Concluído` |
| **BT360-DT-0035** | `DIV-06A-003`  | **06A** | **P2** | `NÃO INICIADO` | `src/features/integrations/bitrix/service/extraction.ts` | Falta de rotina de purga periódica de arquivos temporários gerados em extrações antigas | `TAREFA-SANEAMENTO-021` (Onda 3) |
| **BT360-DT-0036** | `DIV-06A-004`  | **06A** | **P3** | `NÃO INICIADO` | `src/features/integrations/bitrix/service/extraction.ts` | Ausência de cancelamento cooperativo via AbortSignal em extrações Bitrix em lote | `TAREFA-SANEAMENTO-046` (Onda 3) |
| **BT360-DT-0037** | `DIV-07-001` (DEBT-AI-002) | **07** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` | Copiloto Comercial exibe métricas financeiras e de pipeline através de constantes fabricadas hardcoded | `Concluído` |
| **BT360-DT-0038** | `DIV-07-002` (DEBT-AI-003) | **07** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx` | Botões de ação do Next Best Action (NBA) emitem feedback de sucesso sem execução ou persistência no backend | `Concluído` |
| **BT360-DT-0039** | `DIV-07-003` (DEBT-AI-004) | **07** | **P1** | `NÃO INICIADO` | `src/features/intelligence/routes/intelligence.routes.ts` | Trace de missões autônomas de IA e consentimento LGPD retornados de forma sintética em rotas de inteligência | `TAREFA-SANEAMENTO-005` (Onda 4) |
| **BT360-DT-0040** | `DIV-07-004` (DEBT-UX-008) | **07** | **P2** | `NÃO INICIADO` | `src/features/intelligence/components/AISuiteHub.tsx` | Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito permanente | `TAREFA-SANEAMENTO-022` (Onda 4) |
| **BT360-DT-0041** | `DIV-07-005` (DEBT-UX-007) | **07** | **P2** | `NÃO INICIADO` | `src/features/knowledge/services/knowledgeBase.service.ts` | Busca textual na base de conhecimento do Copiloto engole falhas do banco e retorna lista vazia | `TAREFA-SANEAMENTO-023` (Onda 4) |
| **BT360-DT-0042** | `DIV-07-006`  | **07** | **P1** | `NÃO INICIADO` | `src/features/intelligence/components/IntelligenceHub.tsx` | Hotspots severos em componentes de painel de inteligência (IntelligenceHub e SwarmDashboard) | `TAREFA-SANEAMENTO-006` (Onda 4) |
| **BT360-DT-0043** | `DIV-08-001` (DEBT-GATE-001) | **08** | **P1** | `CORRIGIDO / HOMOLOGADO` | `scripts/release-gate.js` | Gate local de lançamento emite STATUS: GO mesmo com typecheck e lint falhando devido a flags de tolerância | `Concluído` |
| **BT360-DT-0044** | `DIV-08-002` (DEBT-OPS-001) | **08** | **P1** | `NÃO INICIADO` | `vitest.unit.config.ts` | 62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest | `TAREFA-SANEAMENTO-007` (Onda 5) |
| **BT360-DT-0045** | `DIV-08-003` (DEBT-OPS-002) | **08** | **P2** | `NÃO INICIADO` | `package-lock.json` | Dockerfile reinstala Prisma CLI em etapa sem lock estrito versionado arriscando versão divergente | `TAREFA-SANEAMENTO-024` (Onda 5) |
| **BT360-DT-0046** | `DIV-08-004` (DEBT-OPS-003) | **08** | **P2** | `CORRIGIDO / HOMOLOGADO` | `.dockerignore` | Contexto Docker envia worktrees e artefatos temporários locais aumentando tempo de build | `Concluído` |
| **BT360-DT-0047** | `DIV-08-005` (DEBT-DOC-001) | **08** | **P3** | `NÃO INICIADO` | `docs/development/LOCAL_FIRST.md` | Instrução de inicialização do stack local omite overlay de PostgreSQL obrigatório para migrations | `TAREFA-SANEAMENTO-047` (Onda 5) |
| **BT360-DT-0048** | `DIV-08A-001` (DEBT-GOV-004) | **08A** | **P2** | `NÃO INICIADO` | `.github/workflows/` | Proliferação excessiva de branches remotas órfãs degradando a rastreabilidade e higiene do Git | `TAREFA-SANEAMENTO-025` (Onda 5) |
| **BT360-DT-0049** | `DIV-08A-002`  | **08A** | **P2** | `NÃO INICIADO` | `.github/workflows/ci.yml` | Ausência de cache compartilhado de dependências (node_modules e Prisma) nos workflows de CI | `TAREFA-SANEAMENTO-026` (Onda 5) |
| **BT360-DT-0050** | `DIV-08A-003`  | **08A** | **P2** | `NÃO INICIADO` | `.github/workflows/docker-publish.yml` | Falta de validação automatizada de integridade de tags de release e assinatura de commits | `TAREFA-SANEAMENTO-027` (Onda 5) |
| **BT360-DT-0051** | `DIV-09-001` (DEBT-UX-001) | **09** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/serviceWorkerRegistration.ts` | Cache do Service Worker armazena dados de CRM em CacheStorage local sem particionamento por identidade | `Concluído` |
| **BT360-DT-0052** | `DIV-09-002` (DEBT-MOB-001) | **09** | **P2** | `CORRIGIDO / HOMOLOGADO` | `capacitor.config.ts` | Configuração de build mobile embute URL de fallback apontando para instância legada desativada no Render | `Concluído` |
| **BT360-DT-0053** | `DIV-09-003` (DEBT-UX-005) | **09** | **P2** | `NÃO INICIADO` | `android/app/src/main/AndroidManifest.xml` | Esquema de deep links nativos no AndroidManifest.xml diverge das rotas SPA da aplicação web | `TAREFA-SANEAMENTO-028` (Onda 5) |
| **BT360-DT-0054** | `DIV-09-004` (DEBT-UX-006) | **09** | **P3** | `NÃO INICIADO` | `.agents/audits/technical-debt/2026-10-14/manifest.json` | Ícones declarados no manifest.json do PWA não existem fisicamente na pasta public | `TAREFA-SANEAMENTO-048` (Onda 5) |
| **BT360-DT-0055** | `DIV-10-001` (DEBT-OPS-004) | **10** | **P1** | `CORRIGIDO / HOMOLOGADO` | `scripts/backup/run-backup-restore-drill.ts` | Script de exercício de recuperação de desastres (Restore Drill) ignora integridade Prisma e limite RTO | `Concluído` |
| **BT360-DT-0056** | `DIV-10-002`  | **10** | **P2** | `CORRIGIDO / HOMOLOGADO` | `docker-compose.opensource.yml` | Ausência de graceful shutdown coordenado entre containers no docker-compose.opensource.yml | `Concluído` |
| **BT360-DT-0057** | `DIV-10-003`  | **10** | **P2** | `NÃO INICIADO` | `docker-compose.yml` | Ausência de limitação de taxa em nível de Ingress/Proxy Reverso contra ataques de força bruta | `TAREFA-SANEAMENTO-029` (Onda 2) |
| **BT360-DT-0058** | `DIV-11-001`  | **11** | **P3** | `NÃO INICIADO` | `tests/fixtures/` | Ocorrências residuais de menções a marcas legadas em fixtures de testes e documentações internas | `TAREFA-SANEAMENTO-049` (Onda 5) |
| **BT360-DT-0059** | `DIV-11-002`  | **11** | **P3** | `NÃO INICIADO` | `public/` | Ativos institucionais pesados em public sem compressão moderna lossless (WebP/SVG minificado) | `TAREFA-SANEAMENTO-050` (Onda 5) |
| **BT360-DT-0060** | `DIV-11-003`  | **11** | **P3** | `NÃO INICIADO` | `docs/BrandConstitution.md` | Divergência de nomenclatura entre tokens de cores na BrandConstitution e variáveis Tailwind | `TAREFA-SANEAMENTO-051` (Onda 5) |
| **BT360-DT-0061** | `DIV-12-001` (DEBT-BILL-003) | **12** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/services/telephony/billing.service.ts` | Função de faturamento de consumo de telefonia salta meses de 31 dias em ciclos de cobrança | `Concluído` |
| **BT360-DT-0062** | `DIV-12-002`  | **12** | **P3** | `CORRIGIDO / HOMOLOGADO` | `src/features/ai-voice/flowise-router.service.ts` | Parâmetro prompt não utilizado em flowise-router.service.ts indicando refatoração incompleta | `Concluído` |
| **BT360-DT-0063** | `DIV-12-003`  | **12** | **P1** | `NÃO INICIADO` | `src/features/voice-hub/pages/Dashboard/Overview.tsx` | Hotspots severos em componentes de estúdio de voz (Overview.tsx e useStudioStore.ts) | `TAREFA-SANEAMENTO-008` (Onda 3) |
| **BT360-DT-0064** | `DIV-12-004`  | **12** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/services/telephony/transcription.service.ts` | Ausência de mascaramento automático de PII sensível em transcrições de voz de ligações | `Concluído` |
| **BT360-DT-0065** | `DIV-13-001`  | **13** | **P1** | `PARCIALMENTE IMPLEMENTADO` | `src/features/intelligence/agents/supervisor.agent.ts` | Supervisor de enxame atinge o limite exato de 1000 linhas com acoplamento rígido a 8 agentes | `TAREFA-SANEAMENTO-009` (Onda 4) |
| **BT360-DT-0066** | `DIV-13-002`  | **13** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/lib/agents/agentBus.ts` | Ausência de detector de loop e limite estrito de recursão no barramento Agent Bus local | `Concluído` |
| **BT360-DT-0067** | `DIV-13-003`  | **13** | **P2** | `NÃO INICIADO` | `src/lib/agents/agentBus.ts` | Histórico de conversas e decisões do Agent Bus mantido apenas em memória volátil | `TAREFA-SANEAMENTO-030` (Onda 4) |
| **BT360-DT-0068** | `DIV-13-004`  | **13** | **P2** | `NÃO INICIADO` | `src/features/intelligence/agents/tools/` | Ausência de timeout individual por execução de ferramenta de IA travando o runtime do agente | `TAREFA-SANEAMENTO-031` (Onda 4) |
| **BT360-DT-0069** | `DIV-14-001`  | **14** | **P1** | `CORRIGIDO / HOMOLOGADO` | `scripts/test/prepare-integration-env.js` | Script prepare-integration-env.js arrisca executar migrations no banco operacional se .env.test falhar | `Concluído` |
| **BT360-DT-0070** | `DIV-14-002`  | **14** | **P2** | `NÃO INICIADO` | `scripts/test/prepare-integration-env.js` | Ausência de teardown determinístico para containers efêmeros em caso de cancelamento por SIGINT | `TAREFA-SANEAMENTO-032` (Onda 2) |
| **BT360-DT-0071** | `DIV-14-003`  | **14** | **P2** | `NÃO INICIADO` | `scripts/test/prepare-integration-env.js` | Falta de seed automático de entidades de compliance e opt-out no provisionamento do banco de teste | `TAREFA-SANEAMENTO-033` (Onda 2) |
| **BT360-DT-0072** | `DIV-15-001` (DEBT-SEC-001) | **15** | **P0** | `PARCIALMENTE IMPLEMENTADO` | `src/lib/auth.ts` | URLs de autenticação com tokens mágicos e links de redefinição de senha escritas em texto puro em logs | `TAREFA-SANEAMENTO-001` (Onda 0) |
| **BT360-DT-0073** | `DIV-15-002`  | **15** | **P1** | `NÃO INICIADO` | `docs/security/ROTACAO_SEGREDOS.md` | Criptografia de credenciais em repouso sem suporte a envelope encryption e versionamento de chaves | `TAREFA-SANEAMENTO-010` (Onda 5) |
| **BT360-DT-0074** | `DIV-15-003`  | **15** | **P2** | `NÃO INICIADO` | `server.ts` | Configuração permissiva de CORS em server.ts para clientes externos | `TAREFA-SANEAMENTO-034` (Onda 5) |
| **BT360-DT-0075** | `DIV-16-001` (DEBT-QUEUE-001) | **16** | **P1** | `CORRIGIDO / HOMOLOGADO` | `worker.ts` | Processo worker classificado como processo web e re-enfileiramento infinito de mensagens WhatsApp sem falha definitiva | `Concluído` |
| **BT360-DT-0076** | `DIV-16-002` (DEBT-OPS-006) | **16** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/lib/circuitGuard.ts` | Circuit guard classifica qualquer falha de conexão de forma genérica como indisponibilidade de Redis | `Concluído` |
| **BT360-DT-0077** | `DIV-16-003` (DEBT-OPS-007) | **16** | **P2** | `CORRIGIDO / HOMOLOGADO` | `server.ts` | Shutdown do servidor HTTP aguarda conexões SSE ativas sem encerramento coordenado | `Concluído` |
| **BT360-DT-0078** | `DIV-17-001` (DEBT-CAD-001) | **17** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/cadence/cadence.routes.ts` | API permite cadastrar passos de cadência sem corpo de mensagem e dispatcher envia placeholders cruas para leads reais | `Concluído` |
| **BT360-DT-0079** | `DIV-17-002`  | **17** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/services/cadence/stepScheduler.service.ts` | Ausência de controle de janela de horário comercial permitido em dispatchers automáticos de cadência | `Concluído` |
| **BT360-DT-0080** | `DIV-17-003`  | **17** | **P2** | `NÃO INICIADO` | `src/features/cadence/services/cadenceExecution.service.ts` | Ausência de verificação em lote de opt-out no momento do início da cadência | `TAREFA-SANEAMENTO-035` (Onda 3) |
| **BT360-DT-0081** | `DIV-18-001` (DEBT-API-001) | **18** | **P1** | `CORRIGIDO / HOMOLOGADO` | `docs/openapi.yaml` | Merge de branches antigas removeu 124 linhas dos endpoints de /organization-modules no docs/openapi.yaml | `Concluído` |
| **BT360-DT-0082** | `DIV-18-002`  | **18** | **P2** | `NÃO INICIADO` | `src/features/crm/routes/lead.routes.ts` | Divergência de validação entre schemas Zod de backend e definições DTO do OpenAPI para criação de leads | `TAREFA-SANEAMENTO-036` (Onda 5) |
| **BT360-DT-0083** | `DIV-18-003`  | **18** | **P2** | `NÃO INICIADO` | `scripts/verify-openapi-drift.ts` | Script verify-openapi-drift não cobre rotas criadas recentemente para o Hub de Inteligência e Timeline | `TAREFA-SANEAMENTO-037` (Onda 5) |
| **BT360-DT-0084** | `DIV-21-001` (DEBT-LGPD-001) | **21** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/shared/services/dataSubjectErasure.service.ts` | Rotina de exclusão LGPD pode concluir anonimização sem gravar a supressão multicanal (OptOutRecord) | `Concluído` |
| **BT360-DT-0085** | `DIV-21-002`  | **21** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/lgpd/lgpd.routes.ts` | Ausência de endpoint e interface unificada para exportação do Dossiê de Portabilidade e Acesso do Titular | `Concluído` |
| **BT360-DT-0086** | `DIV-21-003`  | **21** | **P2** | `NÃO INICIADO` | `src/lib/security/consentAuditChain.service.ts` | Hotspot em consentAuditChain.service.ts executando hash-chaining síncrono com impacto em transações | `TAREFA-SANEAMENTO-038` (Onda 1) |
| **BT360-DT-0087** | `DIV-21-004`  | **21** | **P3** | `NÃO INICIADO` | `docs/lgpd-base-legal.md` | Falta de inventário de tratamento de dados (ROPA) automatizado e exportável para auditoria | `TAREFA-SANEAMENTO-052` (Onda 1) |
| **BT360-DT-0088** | `DIV-22-001`  | **22** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/features/settings/components/PillarSettingsPlaceholder.tsx` | Formulários de configuração em PillarSettingsPlaceholder simulam salvamento mas mantêm dados apenas em memória volátil | `Concluído` |
| **BT360-DT-0089** | `DIV-22-002`  | **22** | **P2** | `NÃO INICIADO` | `playwright.config.ts` | Testes E2E do Playwright validam apenas o DOM sem asserções diretas no banco de dados (Database Assertions) | `TAREFA-SANEAMENTO-039` (Onda 5) |
| **BT360-DT-0090** | `DIV-22-003`  | **22** | **P2** | `NÃO INICIADO` | `scripts/security/` | Ausência de teste contínuo de verificação de vazamento de PII em logs de aplicação | `TAREFA-SANEAMENTO-040` (Onda 5) |
| **BT360-DT-0091** | `DIV-23-001` (DEBT-AI-001) | **23** | **P1** | `CORRIGIDO / HOMOLOGADO` | `src/services/ai/aiStream.service.ts` | Streaming de tokens de IA via SSE não aplica controle de cota máxima em tempo real durante a transmissão | `Concluído` |
| **BT360-DT-0092** | `DIV-23-002` (DEBT-FIN-001) | **23** | **P2** | `CORRIGIDO / HOMOLOGADO` | `src/lib/ai/budget.ts` | Alerta de consumo de orçamento de IA compara grandezas incompatíveis gerando falsos alarmes | `Concluído` |
| **BT360-DT-0093** | `DIV-23-003`  | **23** | **P2** | `NÃO INICIADO` | `src/lib/ai/gateway/semanticCache.ts` | Inexistência de cache semântico ativo para pesquisas e análises de mercado frequentes | `TAREFA-SANEAMENTO-041` (Onda 4) |
| **BT360-DT-0094** | `DIV-23-004`  | **23** | **P2** | `NÃO INICIADO` | `src/features/intelligence/services/agentCostAnalysis.service.ts` | Consulta N+1 no cálculo de métricas de uso de IA por vendedor no painel gerencial | `TAREFA-SANEAMENTO-042` (Onda 4) |
| **BT360-DT-0095** | `DIV-24-001`  | **24** | **P2** | `CORRIGIDO / HOMOLOGADO` | `.agents/reviews/handoffs-2026-10-09-24.md` | Handoffs históricos arquivados receberam encerramento administrativo sem parecer formal assinado pelo Agente 24 | `Concluído` |
| **BT360-DT-0096** | `DIV-24-002`  | **24** | **P1** | `CORRIGIDO / HOMOLOGADO` | `.github/workflows/ci.yml` | Ausência de trava automatizada no pipeline de CI para bloquear merges sem parecer do Agente 24 | `Concluído` |
| **BT360-DT-0097** | `DIV-24-003`  | **24** | **P2** | `CORRIGIDO / HOMOLOGADO` | `docs/auditorias/dividas-tecnicas/DIVIDAS-AGENTE-24.md` | Limitação estrutural de governança: impossibilidade de auto-revisão independente pelo próprio Agente 24 | `Concluído` |

---

## 3. RECONCILIAÇÃO NUMÉRICA ABSOLUTA

- **Total de Dívidas Técnicas Catalogadas:** **97 dívidas únicas**.
- **CORRIGIDO / HOMOLOGADO:** **45 dívidas** (46.4%) — Implementações verificadas no código-fonte e com testes automatizados verdes no commit `08c9734e1`.
- **PARCIALMENTE IMPLEMENTADO:** **5 dívidas** (5.2%) — Hotspots estruturais e vulnerabilidade de token pendente de validação formal (`BT360-DT-0015`, `BT360-DT-0016`, `BT360-DT-0030`, `BT360-DT-0065`, `BT360-DT-0072`).
- **REGRESSÃO:** **1 dívida** (1.0%) — Reintrodução de 14 diretivas `!important` em CSS (`BT360-DT-0017`).
- **IMPLEMENTADO / NÃO VALIDADO:** **1 dívida** (1.0%) — Recibo de leitura de notificação broadcast sem validação multi-tenant (`BT360-DT-0014`).
- **NÃO INICIADO:** **45 dívidas** (46.4%) — Dívidas técnicas dos especialistas atribuídas às ondas 0 a 5.
- **OBSOLETO:** **0 dívidas** (0.0%) — Nenhuma dívida foi descartada sem validação; todos os itens foram integrados ao inventário e plano mestre.
- **TOTAL DE DÍVIDAS QUE EXIGEM AÇÃO:** **52 dívidas técnicas acionáveis** (5 Parciais + 1 Regressão + 1 Não Validada + 45 Não Iniciadas).
- **TOTAL DE TAREFAS GERADAS NO BACKLOG:** **52 tarefas executáveis** (`TAREFA-SANEAMENTO-001` a `TAREFA-SANEAMENTO-052`).

*Equação de fechamento contábil:*  
`45 (Corrigidas) + 52 (Acionáveis) = 97 Dívidas Únicas (Consolidação 100% Exata).`
