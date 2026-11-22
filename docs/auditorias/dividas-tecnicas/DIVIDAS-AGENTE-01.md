# Relatório de Auditoria de Dívidas Técnicas — Agente 01

## IDENTIFICAÇÃO
- **ID do agente:** 01
- **Nome oficial:** Plataforma, Segurança e Dados
- **Especialização:** Fundação de dados, schema relacional Prisma, migrações seguras, isolamento de dados de tenant, autenticação central e serviços de infraestrutura compartilhados
- **Responsabilidades:** Gestão exclusiva de `prisma/schema.prisma` e `prisma/migrations/**` (`AGENTS.md` §15), conexão com banco PostgreSQL, pool de conexões, repositórios de dados compartilhados em `src/shared/**`, tenancy enforcement no backend e infraestrutura de autenticação.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `prisma/**`, `src/lib/prisma.ts`, `src/lib/db.ts`, `src/shared/**`, `src/features/organization-modules/**`, `src/features/auth/server/**`, repositórios SQL nativos.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Schema Prisma, migrações SQL, connection pooling, infraestrutura de multi-tenant em `src/lib/tenant-prisma.ts`, serviços de sanitização e expurgo de dados.
- **Arquivos relevantes:**
  - `prisma/schema.prisma` (mais de 130 modelos relacionais)
  - `prisma/migrations/**` (139 diretórios de migrations aplicadas)
  - `src/lib/prisma.ts` (hotspot de 928 linhas com middlewares de transação e auditoria)
  - `src/lib/db.ts`
  - `src/lib/tenant-prisma.ts`
  - `src/features/organization-modules/services/organizationModules.service.ts`
  - `src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.ts`
  - `src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.ts`
  - `src/features/auth/server/auth.service.ts`
- **Serviços existentes:** `DataSubjectErasureService`, `OrganizationModulesService`, `TenantPrismaClient`, `AuthService`.
- **APIs e integrações:** PostgreSQL 16 (PgBouncer, connection pool), BetterAuth / Argon2id, extension hooks do Prisma.
- **Funcionalidades implementadas:** Isolamento multi-tenant por `organization_id`, controle de RLS no PostgreSQL, registro de auditoria append-only, anonimização de dados pessoais.
- **Testes encontrados:** `tests/integration/tenant-isolation.test.ts`, `tests/unit/data-subject-erasure.test.ts`, `tests/integration/prisma-rls.test.ts`.
- **Dependências externas:** PostgreSQL, `@prisma/client`, `better-auth`, `argon2`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-01-001 (DEBT-DB-001)
- **Título:** Guia canônico LOCAL_FIRST.md e compose orientam conectar com superusuário de bootstrap (bypass de RLS)
- **Categoria:** Segurança e Banco de Dados
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `docs/development/LOCAL_FIRST.md` (linhas 35-45), `docker-compose.postgres-local.yml` (linhas 20-28), `scripts/db/create-app-role.sql`
- **Evidência:** O guia `LOCAL_FIRST.md` instrui configurar `DATABASE_URL` usando o usuário `prospector`. No entanto, `docker-compose.postgres-local.yml` define `prospector` como `POSTGRES_USER` (superusuário com flag `rolbypassrls=true`). Em contraste, `scripts/db/create-app-role.sql` cria especificamente o usuário `prospector_app` com privilégios restritos (`NOSUPERUSER, NOBYPASSRLS`).
- **Problema:** Desenvolvedores e ambientes de teste executam a aplicação com credenciais de superusuário que ignoram completamente as políticas de Row-Level Security (RLS) configuradas nas tabelas do PostgreSQL.
- **Causa raiz:** Descompasso histórico entre o script de bootstrap inicial e a introdução da separação estrita de papéis no banco.
- **Impacto:** Falso positivo de segurança em ambiente local; falhas de isolamento entre tenants não são detectadas em testes locais porque o superusuário tem permissão irrestrita.
- **Correção necessária:** Atualizar `LOCAL_FIRST.md` para especificar `prospector_app` na `DATABASE_URL` de runtime e reservar o usuário `prospector` apenas para `DIRECT_URL` (execução de migrations e DDL).
- **Agente proprietário:** 01
- **Agentes dependentes:** 01A (RLS), 08 (Testes de integração), 18 (Contratos e Documentação)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Executar a aplicação conectada via `DATABASE_URL` e comprovar via query SQL `SELECT current_setting('is_superuser'), current_setting('row_security')` que o usuário conectado não possui privilégio de superusuário e obedece RLS.
- **Teste necessário:** Teste de integração automatizado validando que tentativas de acesso cruzado falham com erro de RLS quando conectado como `prospector_app`.
- **Dependências:** Alinhamento com Agente 01A e 18.

### ID: DIV-01-002 (DEBT-DB-002)
- **Título:** Repositórios SQL nativos do discador executam queries diretas sem cláusula organization_id
- **Categoria:** Banco de Dados e Tenancy
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.ts` (linhas 57-71), `src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.ts` (linhas 84-103)
- **Evidência:** Métodos como `findActive`, `findAll` e `claimNextEligible` realizam consultas SQL cruas (`$queryRaw`) nas tabelas `campaigns` e `leads` sem parâmetro ou cláusula `WHERE organization_id = ...`.
- **Problema:** As entidades do módulo de telefonia/discador foram modeladas sem carregar o `organizationId` obrigatório em suas assinaturas de persistência, confiando apenas no contexto de sessão do banco.
- **Causa raiz:** O módulo foi desenvolvido como subsistema desacoplado e integrado diretamente via SQL cru sem passar pelo cliente `tenant-prisma.ts`.
- **Impacto:** Risco crítico de vazamento de dados de campanhas e contatos telefônicos entre tenants caso a conexão seja aberta fora de transação com `SET LOCAL app.current_tenant_id`.
- **Correção necessária:** Adicionar obrigatoriamente `organizationId` nas entidades de domínio `Campaign` e `Lead`, incluir o filtro `WHERE organization_id = ${organizationId}` em todas as queries SQL cruas ou migrar os métodos para chamadas Prisma gerenciadas.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01A (Auditoria RLS), 17 (Cadência e Discador), 22 (Verificação de realidade)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Teste de integração negativo comprova que uma busca no repositório com credencial do Tenant A jamais retorna registros do Tenant B.
- **Teste necessário:** Suíte de testes de isolamento multi-tenant para `PgCampaignRepository` e `PgLeadRepository`.
- **Dependências:** Ajuste de modelos de domínio com o Agente 17.

### ID: DIV-01-003 (DEBT-ONB-001)
- **Título:** Mutações concorrentes de módulos da organização sobrescrevem seleções anteriores sem concorrência otimista
- **Categoria:** Arquitetura e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/organization-modules/services/organizationModules.service.ts` (linhas 69-74), `src/features/organization-modules/infra/SettingOrganizationModulesRepository.ts` (linhas 33-37)
- **Evidência:** O método `mutate` executa o ciclo read-modify-write (`load -> fn -> save -> get`) utilizando `upsertSetting` sem campo de versão nem mecanismo de compare-and-swap (CAS).
- **Problema:** Requisições concorrentes de ativação de módulos simultâneos (ex.: Habilitar Módulo A e Habilitar Módulo B) sobrescrevem os dados da transação anterior, causando a perda silenciosa de uma das configurações salvas.
- **Causa raiz:** Ausência de controle transacional com bloqueio pessimista (`FOR UPDATE`) ou campo `version` para controle otimista na tabela `settings`.
- **Impacto:** Perda de configurações de onboarding e módulos de clientes quando múltiplos administradores editam configurações ao mesmo tempo.
- **Correção necessária:** Envolver a operação em transação Prisma com lock no registro ou adicionar coluna `version` com repetição exponencial (CAS retry).
- **Agente proprietário:** 01
- **Agentes dependentes:** 02 (UX/Onboarding), 18 (Contratos de API)
- **Complexidade:** Média (1 a 2 dias)
- **Prioridade:** P2
- **Critério de aceite:** Teste de barreira concorrente executando 5 chamadas simultâneas de mutação de módulos mantém 100% das opções habilitadas no estado final.
- **Teste necessário:** Teste de carga de concorrência com chamadas assíncronas paralelas sobre a mesma organização.
- **Dependências:** Alinhamento de schema com Agente 02.

### ID: DIV-01-004 (DEBT-PERF-001)
- **Título:** Resumo de consumo de inteligência artificial carrega todas as linhas de logs em memória para agregação
- **Categoria:** Performance e Backend
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/analytics/infra/PrismaAnalyticsRepository.ts` (linhas 760+), `src/features/intelligence/**`
- **Evidência:** O cálculo de consumo mensal de tokens de LLM executa `prisma.aILog.findMany({ where: { organizationId, createdAt: { gte: startDate } } })` e faz `reduce` no array retornado em memória Node.js.
- **Problema:** Em organizações com alto volume de interações comerciais com IA (dezenas de milhares de chamadas diárias), a query transfere dezenas de megabytes de texto e payloads para a memória da aplicação, gerando picos de uso de RAM e risco de OOM (Out Of Memory).
- **Causa raiz:** Implementação inicial orientada a protótipo sem uso de funções nativas de agregação do banco.
- **Impacto:** Degradação de performance do dashboard, latência superior a 3 segundos e consumo excessivo de memória no processo da API.
- **Correção necessária:** Refatorar a consulta para utilizar `prisma.aILog.aggregate({ _sum: { totalTokens: true, costUsd: true } })` ou query nativa agrupada por dia.
- **Agente proprietário:** 01
- **Agentes dependentes:** 04 (BI e Analytics), 23 (Custos e Performance de IA)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O endpoint de métricas de IA consome menos de 5MB de RAM e responde em menos de 100ms para bases com mais de 100.000 logs.
- **Teste necessário:** Teste de benchmark com fixture de 50.000 registros na tabela `aILog`.
- **Dependências:** Nenhuma.

### ID: DIV-01-005 (DEBT-CODE-001)
- **Título:** Lógica de criação de primeiro usuário executa user.count redundante para atribuir role ADMIN
- **Categoria:** Código e Qualidade
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `src/features/auth/server/auth.service.ts` (linhas 140-165)
- **Evidência:** Durante o signup de usuário, é realizada uma contagem geral de usuários (`prisma.user.count`) antes da transação e repetida dentro da transação para decidir se o novo usuário recebe o papel `ADMIN`, com ramos idênticos de fallback.
- **Problema:** Chamadas desnecessárias de contagem sequencial aumentam a latência do registro e poluem o fluxo de autenticação.
- **Causa raiz:** Refatoração de autenticação que preservou verificação antiga fora da transação.
- **Impacto:** Sobrecarga insignificante em baixo volume, mas adiciona débito de legibilidade e latência na esteira de onboarding.
- **Correção necessária:** Simplificar a atribuição unificando a contagem de usuários diretamente na transação de criação da organização/usuário.
- **Agente proprietário:** 01
- **Agentes dependentes:** 15 (Segurança e Autenticação)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Fluxo de signup simplificado com 100% de cobertura nos testes unitários de auth.
- **Teste necessário:** Testes unitários de cadastro de primeiro usuário e usuários subsequentes.
- **Dependências:** Nenhuma.

### ID: DIV-01-006
- **Título:** Hotspot arquitetural crítico em src/lib/prisma.ts acumulando múltiplas responsabilidades
- **Categoria:** Arquitetura e Manutenibilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/lib/prisma.ts` (928 linhas)
- **Evidência:** O arquivo ultrapassa o limite de aviso do linter de arquitetura (700 linhas) e acumula inicialização de pool, extensões de soft-delete, log de auditoria, interceptores de métricas e injeção de tenant.
- **Problema:** Arquivo com alta complexidade ciclomática, risco elevado de efeitos colaterais e dificuldade de manutenção e extensão.
- **Causa raiz:** Acúmulo continuado de plugins e handlers em um único ponto central de entrada do ORM.
- **Impacto:** Dificuldade em testar interceptores de forma isolada e alto risco de quebra global da camada de dados em refatorações.
- **Correção necessária:** Modularizar `src/lib/prisma.ts` em submódulos específicos em `src/lib/prisma/` (`extensions/`, `logging/`, `metrics/`, `client.ts`).
- **Agente proprietário:** 01
- **Agentes dependentes:** 01A, 14, 24
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** `src/lib/prisma.ts` passa a ser um agregador com menos de 200 linhas; todos os testes de integração do Prisma permanecem verdes.
- **Teste necessário:** Suíte completa de integração do banco de dados (`npm run test:integration`).
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (Prisma models cobrem todas as entidades do sistema com migrações consolidadas).
- **Cobertura automatizada de testes:** Alta (testes de integração com banco real e testes de transação bem estruturados).
- **Segurança:** Média (RLS bem desenhado no banco, mas com risco em repositórios que utilizam `$queryRaw`).
- **Arquitetura:** Média (hotspots em `prisma.ts` e repositórios SQL nativos fora do padrão de tenant).
- **Confiabilidade:** Alta (suporte a transações ACID e logs estruturados de queries lentas).
- **Observabilidade:** Média (falta agregação de métricas no banco para logs de IA).
- **Manutenibilidade:** Média (139 migrations exigem disciplina para evitar drift).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Corrigir as queries de `PgCampaignRepository` e `PgLeadRepository` para exigir `organization_id` obrigatório.
2. **Segurança e integridade de dados:** Atualizar `LOCAL_FIRST.md` e compose para uso de `prospector_app` sem privilégios de superusuário.
3. **Falhas funcionais:** Implementar lock transacional em `organizationModules.service.ts` para evitar sobreposição em mutações concorrentes.
4. **Confiabilidade:** Otimizar agregação de logs de IA via `prisma.aILog.aggregate`.
5. **Testes:** Criar testes de regressão de RLS para todas as tabelas compartilhadas.
6. **Arquitetura:** Modularizar `src/lib/prisma.ts` em módulos focados.
7. **Melhorias estruturais:** Simplificar contagem redundante de usuários no cadastro.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 6
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 3 Médias, 1 Baixa
- **Quantidade confirmada:** 6
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 4 (DIV-01-001, DIV-01-004, DIV-01-005, DIV-01-006)
- **Problemas compartilhados:** 2 (DIV-01-002 com 01A/17, DIV-01-003 com 02/18)
- **Handoffs necessários:**
  - Handoff para 01A: Revisão e teste de stress de RLS sobre `leads` e `campaigns`.
  - Handoff para 17: Ajuste de DTOs do discador para inclusão de `organizationId`.
- **Riscos mais importantes:** A execução de queries cruas sem `organization_id` representa um risco latente de vazamento de leads entre organizações caso executadas fora de escopo transacional protegido.
- **Recomendação final:** Priorizar a correção de `PgCampaignRepository` e `PgLeadRepository` em conjunto com a substituição do usuário nos manuais de desenvolvimento local.
