# Relatório de Auditoria de Dívidas Técnicas — Agente 01A

## IDENTIFICAÇÃO
- **ID do agente:** 01A
- **Nome oficial:** Confiabilidade de Dados, RLS e Retenção
- **Especialização:** Políticas de Row-Level Security (PostgreSQL RLS), multi-tenancy estrito no banco, integridade referencial, retenção e expurgo de dados LGPD, migrações seguras e planos de rollback
- **Responsabilidades:** Auditoria e aplicação de políticas RLS em todas as tabelas do PostgreSQL, garantia de que nenhuma query seja executada sem isolamento de tenant comprovado, gestão de integridade referencial (foreign keys sem órfãos), definição e automação de políticas de retenção temporal e sanitização profunda de dados.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Políticas RLS do PostgreSQL, `scripts/db/**`, tabelas com dados de IA e memória conversacional, rotinas de expurgo, integridade de migrações e índices de tenancy.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Políticas DDL de RLS, triggers de tenant, políticas de retenção (TTL de logs e histórico), scripts de migração e verificação de foreign keys.
- **Arquivos relevantes:**
  - `scripts/db/create-app-role.sql`
  - `docs/security/RLS_COVERAGE_MATRIX.md`
  - `prisma/migrations/**` (análise de DDL de RLS)
  - `src/lib/tenant-prisma.ts`
  - Tabelas de alta rotatividade: `AgentMemory`, `AILog`, `SyncHistory`, `AuditLog`
- **Serviços existentes:** Verificador de contexto de tenant no Prisma, scripts de verificação de integridade referencial.
- **APIs e integrações:** PostgreSQL 16 (funções de sessão `app.current_tenant_id`, RLS policies, índices compostos).
- **Funcionalidades implementadas:** RLS ativo em mais de 90 tabelas, isolamento por tenant em queries Prisma gerenciadas, blind index para PII.
- **Testes encontrados:** `tests/integration/tenant-isolation.test.ts`, `tests/integration/rls-bypass-prevention.test.ts`.
- **Dependências externas:** PostgreSQL engine, `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-01A-001 (DEBT-LGPD-002)
- **Título:** Memória conversacional de agentes (AgentMemory) não possui vínculo direto com titular para expurgo individual
- **Categoria:** Integridade de Dados e LGPD
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `prisma/schema.prisma` (modelo `AgentMemory`), `src/features/intelligence/agents/**`
- **Evidência:** O modelo `AgentMemory` possui colunas `id`, `organizationId`, `agentId`, `content`, `metadata`, `createdAt`, mas não possui relacionamento nem coluna `contactId` ou `leadId` indexada.
- **Problema:** Quando um titular de dados solicita a exclusão de seus dados pessoais (direito ao esquecimento previsto no Art. 18 da LGPD), é tecnicamente impossível identificar quais fragmentos de texto na tabela `AgentMemory` pertencem àquele titular específico sem realizar varredura sequencial completa em campos JSONB não estruturados.
- **Causa raiz:** A memória vetorial e textual de IA foi modelada como contexto genérico do agente, desvinculada do grafo de identidade do contato.
- **Impacto:** Não conformidade com solicitações de exclusão de dados pessoais sob a LGPD; permanência indevida de PII de titulares em memórias persistidas de agentes de atendimento e vendas.
- **Correção necessária:** Criar migração adicionando coluna opcional `subjectId` / `contactId` com índice composto `(organizationId, contactId)` no modelo `AgentMemory` e atualizar o serviço de memória do Agente 07 para gravar essa amarração em interações direcionadas.
- **Agente proprietário:** 01A
- **Agentes dependentes:** 01 (Schema Prisma), 07 (Agentes de IA), 21 (Governança LGPD)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** Execução de rotina de expurgo do titular por `contactId` localiza e remove/anonimiza todos os registros correspondentes em `AgentMemory`.
- **Teste necessário:** Teste de integração de exclusão ponta a ponta comprovando que `AgentMemory.findMany({ where: { contactId } })` retorna zero após o expurgo.
- **Dependências:** Handoff para Agente 01 para aplicação de migração de schema.

### ID: DIV-01A-002
- **Título:** Ausência de particionamento e políticas de retenção automatizada (TTL) em tabelas de auditoria e telemetria
- **Categoria:** Confiabilidade e Banco de Dados
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `prisma/schema.prisma` (modelos `AILog`, `SyncHistory`, `AuditLog`), PostgreSQL DDL
- **Evidência:** As tabelas `AILog`, `SyncHistory` e `AuditLog` acumulam centenas de milhares de linhas sem estratégia de particionamento declarada no PostgreSQL (`PARTITION BY RANGE (created_at)`) e sem rotina de expurgo periódico após a janela legal de 6 meses a 5 anos.
- **Problema:** O crescimento contínuo e irrestrito dessas tabelas causa inchaço (bloat) dos índices B-tree, degrada a performance de queries analíticas e encarece os custos de armazenamento e backup do banco de dados.
- **Causa raiz:** O foco das migrações anteriores foi funcionalidade e RLS, sem implementação de rotinas de retenção em background.
- **Impacto:** Risco de degradação progressiva de latência em escrita/leitura e tempo excessivo de restore em cenários de desastre.
- **Correção necessária:** Implementar rotina de expurgo agendada via cron/worker e preparar migração de particionamento temporal para `AILog` e `SyncHistory`.
- **Agente proprietário:** 01A
- **Agentes dependentes:** 10 (SRE e Backups), 16 (Workers e Filas), 21 (Prazos de Retenção LGPD)
- **Complexidade:** Grande (3 a 5 dias)
- **Prioridade:** P2
- **Critério de aceite:** Job de retenção remove com sucesso registros além do período estipulado em batch sem bloquear escritas ativas (`DELETE IN BATCHES`).
- **Teste necessário:** Teste de carga de retenção com fixture de 100.000 logs históricos simulando execução de expurgo sem lock na tabela.
- **Dependências:** Alinhamento de prazos de retenção com o Agente 21.

### ID: DIV-01A-003
- **Título:** Verificação de integridade referencial: foreign keys com onDelete CASCADE em tabelas mestres de tenant
- **Categoria:** Integridade de Dados
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `prisma/schema.prisma` (relações dependentes de `Organization`)
- **Evidência:** Múltiplas tabelas filhas possuem `onDelete: Cascade` atreladas à remoção da organização. Se uma organização for removida inadvertidamente, dezenas de tabelas sofrem deleção em cascata imediata e irreversível sem soft-delete prévio ou trava de segurança.
- **Problema:** Risco de perda acidental catastrófica de dados em caso de deleção incorreta de uma conta organizacional por rotas administrativas.
- **Causa raiz:** Facilidade de modelagem do Prisma ORM sem implementação de travas defensivas de arquivamento.
- **Impacto:** Impossibilidade de recuperação de histórico comercial e auditoria caso ocorra um comando de exclusão errôneo.
- **Correção necessária:** Adicionar padrão de soft-delete (`deletedAt`) e travas em triggers no PostgreSQL impedindo remoção física direta de organizações com dados ativos.
- **Agente proprietário:** 01A
- **Agentes dependentes:** 01 (Schema Prisma), 15 (Segurança Aplicada)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Tentativa de `prisma.organization.delete` em tenant com histórico falha caso não tenha sido executado o procedimento de arquivamento com token de duplo fator.
- **Teste necessário:** Teste de regressão para deleção acidental de tenant.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (RLS ativado e mapeado em mais de 90 tabelas no PostgreSQL).
- **Cobertura automatizada de testes:** Alta (testes de penetração multi-tenant com tentativa de bypass executados com sucesso).
- **Segurança:** Alta (defesa em profundidade por RLS garante isolamento mesmo em bugs de backend).
- **Arquitetura:** Alta (scripts DDL bem estruturados).
- **Confiabilidade:** Média (ameaçada pelo volume descontrolado de tabelas históricas sem TTL).
- **Observabilidade:** Média (falta monitoramento automatizado de bloat de tabelas e índices).
- **Manutenibilidade:** Alta (matriz `RLS_COVERAGE_MATRIX.md` mantida atualizada).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhuma dívida P0 no domínio exclusivo de RLS.
2. **Segurança e integridade de dados:** Modelar e aplicar migração vinculando `AgentMemory` ao `contactId` para viabilizar expurgo LGPD.
3. **Falhas funcionais:** Proteger remoção em cascata de dados organizacionais com soft-delete defensivo.
4. **Confiabilidade:** Criar job assíncrono de retenção e limpeza periódica de `AILog` e `SyncHistory`.
5. **Testes:** Implementar verificador diário de registros órfãos sem foreign key válida.
6. **Arquitetura:** Planejar particionamento temporal das maiores tabelas de telemetria.
7. **Melhorias estruturais:** Documentar os runbooks de expurgo no `RLS_COVERAGE_MATRIX.md`.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-01A-002, DIV-01A-003)
- **Problemas compartilhados:** 1 (DIV-01A-001 compartilhado com 01 e 21)
- **Handoffs necessários:**
  - Handoff para 01: Aplicação de migração com nova coluna `contactId` em `AgentMemory`.
  - Handoff para 21: Validação dos prazos regulatórios de retenção de logs comerciais.
- **Riscos mais importantes:** A incapacidade de purgar dados de titulares em memórias de inteligência artificial expõe a plataforma a penalidades regulatórias da ANPD/LGPD; inchaço das tabelas de telemetria sem expurgo degrada a performance do banco.
- **Recomendação final:** Priorizar a amarração da memória de agentes a titulares e agendar o primeiro job de retenção de logs.
