# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 01
- **Nome oficial:** Platform, Security, Data & Tenancy Remediation Specialist
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é o especialista responsável pela fundação de segurança, autorização, autenticação, banco, Prisma, isolamento de tenant e serviços compartilhados.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** prisma, src/shared, src/lib/auth, src/lib/db.ts, src/lib/prisma.ts, src/lib/tenant-prisma.ts

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** prisma, src/shared, src/lib/auth, src/lib/db.ts, src/lib/prisma.ts, src/lib/tenant-prisma.ts
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-DB-001
**Título:** Guia canônico LOCAL_FIRST.md orienta aplicação a conectar no PostgreSQL com superusuário de bootstrap (bypass de RLS)
- **Categoria:** Banco de dados
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** docs/development/LOCAL_FIRST.md (linhas 35-45), docker-compose.postgres-local.yml (linhas 20-28), sc
- **Evidência:** docs/development/LOCAL_FIRST.md (linhas 35-45), docker-compose.postgres-local.yml (linhas 20-28), scripts/db/create-app-role.sql (linhas 1-18)
- **Problema:** O guia docs/development/LOCAL_FIRST.md:39 instrui configurar DATABASE_URL com o usuário prospector. No entanto, docker-compose.postgres-local.yml define prospector como POSTGRES_USER (superusuário de bootstrap, que ignora Row-Level Security no PostgreSQL), enquanto scripts/db/create-app-role.sql cria especificamente o papel restrito prospector_app (NOSUPERUSER, NOBYPASSRLS) para o runtime.
- **Causa raiz:** Documentação de setup local não foi atualizada após a introdução da segregação entre conta de migração/bootstrap e conta de runtime sujeita a RLS.
- **Impacto:** Ambientes configurados segundo o guia executam a aplicação com privilégio de superusuário, neutralizando a defesa em profundidade do PostgreSQL RLS entre tenants.
- **Correção necessária:** Atualizar docs/development/LOCAL_FIRST.md para especificar prospector_app em DATABASE_URL e documentar DIRECT_URL apenas para execução de migrations/bootstrap.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01, 01A, 08, 18 Alinhamento documental com Agente 18 e Agente 08
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Documentação consistente com scripts/db/create-app-role.sql e prisma.config.ts, sem expor credenciais reais.
- **Teste necessário:** Verificação automatizada de contrato documental e teste de integração RLS confirmando que current_user não possui rolsuper/rolbypassrls
- **Dependências:** Alinhamento documental com Agente 18 e Agente 08

### ID: DEBT-DB-002
**Título:** Repositórios SQL nativos do discador (PgCampaignRepository/PgLeadRepository) não filtram organization_id explicitamente
- **Categoria:** Banco de dados
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.ts (linhas 57-71), s
- **Evidência:** src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.ts (linhas 57-71), src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.ts (linhas 84-103)
- **Problema:** Embora o merge 2b918e0a (commit 2512d2b8) tenha substituído $queryRawUnsafe por Prisma.sql parametrizado em PgCampaignRepository.ts e PgLeadRepository.ts, as queries SQL continuam selecionando e atualizando registros nas tabelas campaigns e leads (ex.: findActive, findAll, claimNextEligible) sem coluna ou filtro organization_id. Como $queryRaw opera diretamente no PrismaClient injetado, chamadas fora de withTenantContext ou sob conexão sem RLS estrito não possuem isolamento em nível de query.
- **Causa raiz:** Entidades de domínio do sub-módulo dialer (Campaign e Lead) foram modeladas sem propriedade obrigatória organizationId e persistidas via SQL cru fora do interceptor de modelos do tenant-prisma.ts.
- **Impacto:** Risco de vazamento ou listagem cruzada de campanhas/leads entre organizações caso os repositórios sejam instanciados com o cliente Prisma padrão fora de uma transação RLS.
- **Correção necessária:** Incluir organizationId nas assinaturas de leitura/escrita de CampaignRepository e LeadRepository (ou migrar para modelos Prisma gerenciados por tenant-prisma.ts) e adicionar cláusula WHERE organization_id = ${organizationId} em todas as queries SQL.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01, 01A, 17, 22 Alinhamento de schema/entidade entre Agente 01 e Agente 17
- **Complexidade:** M (1–3 dias)
- **Prioridade:** P1
- **Critério de aceite:** Teste de integração multi-tenant comprova que findAll/findActive/claimNextEligible de Tenant A jamais retornam ou modificam campanhas/leads de Tenant B.
- **Teste necessário:** Teste negativo entre Tenant A e Tenant B em PgCampaignRepository e PgLeadRepository
- **Dependências:** Alinhamento de schema/entidade entre Agente 01 e Agente 17

### ID: DEBT-LGPD-001
**Título:** Exclusão LGPD pode concluir sem gravar supressão multicanal (OptOutRecord)
- **Categoria:** Segurança e privacidade
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/shared/services/dataSubjectErasure.service.ts (linhas 115-135), src/features/prospecting/service
- **Evidência:** src/shared/services/dataSubjectErasure.service.ts (linhas 115-135), src/features/prospecting/services/cold-email.service.ts (linhas 88-96)
- **Problema:** Em main, eraseDataSubject anonimiza email/telefone do Contact antes de gravar OptOutRecord e ignora exceções em blocos catch vazios. Caso a criação de OptOutRecord falhe, o retry subsequente já não possui os identificadores originais para registrar a supressão.
- **Causa raiz:** Persistência de supressão multicanal tratada como efeito colateral opcional após mutação destrutiva dos identificadores do titular.
- **Impacto:** Risco de violação LGPD e reabordagem comercial indevida via cold-email caso a gravação de OptOutRecord falhe durante o expurgo.
- **Correção necessária:** Gravar OptOutRecord obrigatoriamente antes de anonimizar os identificadores do Contact/Lead e propagar qualquer erro de persistência (integrar candidato validado em .agents/handoffs/onda-lancamento-20261014/00-para-01-fnd-01.md).
- **Agente proprietário:** 01
- **Agentes dependentes:** 01, 21, 17, 00 Validação de contrato com Agente 21 (LGPD) e Agente 17 (Cadência), Revisão independente Agente 24
- **Complexidade:** P (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Teste automatizado comprova que falha em optOutRecord.create impede anonimização e propaga erro, e caminho feliz grava supressão antes de limpar PII.
- **Teste necessário:** Cenário de falha em optOutRecord.create preserva identificadores para retry, Cenário de sucesso grava OptOutRecord e bloqueia envio em cold-email.service.ts
- **Dependências:** Validação de contrato com Agente 21 (LGPD) e Agente 17 (Cadência), Revisão independente Agente 24

### ID: DEBT-ONB-001
**Título:** Mutações concorrentes de módulos podem sobrescrever seleção anterior
- **Categoria:** Onboarding
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/organization-modules/services/organizationModules.service.ts (linhas 69-74), src/featur
- **Evidência:** src/features/organization-modules/services/organizationModules.service.ts (linhas 69-74), src/features/organization-modules/infra/SettingOrganizationModulesRepository.ts (linhas 33-37), src/lib/voice-hub/repositories/settingRepository.ts (linhas 19-23)
- **Problema:** mutate faz load->fn->save->get; repository.save usa upsertSetting integral sem versão/CAS no contrato. Reprodução isolada do corpo mutate original com repository in-memory e barrier: enable(optional-a)/enable(optional-b) ambos completam, resultado guarda optional-b e perde optional-a.
- **Causa raiz:** Read-modify-write separado sem controle de versão ou trava por organização.
- **Impacto:** enable(A) e enable(B) simultâneos podem ambos ler S e última gravação perder A ou B; somente mesmo tenant, sem prova de acesso cruzado.
- **Correção necessária:** Executar transformação dentro de transação com lock por Setting ou CAS com retry limitado.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01 02, 01, 18
- **Complexidade:** Médio
- **Prioridade:** P2
- **Critério de aceite:** Teste simultâneo de enable(A)/enable(B) preserva ambas via CAS/lock/transação
- **Teste necessário:** Barrier test dois enables independentes preserva ambos, Enable concorrente com completeOnboarding preserva timestamp e seleção
- **Dependências:** 02, 01, 18

### ID: DEBT-PERF-001
**Título:** Resumo de consumo carrega todas as linhas AILog do período
- **Categoria:** Backend e APIs
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/billing/infra/PrismaUsageRepository.ts (linhas 11-16), src/features/billing/application
- **Evidência:** src/features/billing/infra/PrismaUsageRepository.ts (linhas 11-16), src/features/billing/application/UsageUseCases.ts (linhas 50-55)
- **Problema:** findLogsSince usa findMany sem take e UsageUseCases.summary soma/agrupa logs em JavaScript.
- **Causa raiz:** Agregação diária realizada em app em vez de SQL; consulta sem limite por período.
- **Impacto:** Memória e transferência O(n) por consulta conforme chamadas de IA crescem; latência absoluta e volume real não medidos.
- **Correção necessária:** Agregação groupBy de dia com SQL ou paginação bounded preservando totais por modelo/prompt.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01 23, 07
- **Complexidade:** Médio
- **Prioridade:** P2
- **Critério de aceite:** Agregação diária SQL ou paginação bounded mantém resultados sem crescimento memória linear
- **Teste necessário:** Comparar totals/daily contra fixtures de dias e fusos, Orçamento memória/latência com dataset sintético volumoso
- **Dependências:** 23, 07

### ID: DEBT-CODE-001
**Título:** Signup executa user.count redundante para decidir ADMIN idêntico nos dois ramos
- **Categoria:** Código-fonte
- **Severidade:** Baixa
- **Status:** Confirmado / Aberto
- **Localização:** src/lib/auth.ts (linhas 345-350), src/lib/auth.ts (linhas 361-366)
- **Evidência:** src/lib/auth.ts (linhas 345-350), src/lib/auth.ts (linhas 361-366)
- **Problema:** userCount é usado só por isFirstUser e ternário ADMIN/ADMIN.
- **Causa raiz:** Lógica de primeiro usuário permaneceu após regra fundador sempre ADMIN.
- **Impacto:** Uma consulta ao banco dispensável em cada cadastro; aumenta manutenção e duração de seção bootstrap.
- **Correção necessária:** Eliminar contagem e ternário redundante preservando regra aprovada de fundador.
- **Agente proprietário:** 01
- **Agentes dependentes:** 01 01
- **Complexidade:** Baixo
- **Prioridade:** P3
- **Critério de aceite:** Signup mantém ADMIN fundador sem consulta global redundante
- **Teste necessário:** Cadastro primeiro/segundo fundador gera mesmo papel e org própria sem user.count
- **Dependências:** 01


## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Validada por inferência do número de débitos (relativo ao tamanho do sistema).
- **Cobertura automatizada de testes:** Conforme débitos reportados na plataforma.
- **Segurança:** Riscos levantados nas análises gitleaks e dependency cruiser.
- **Arquitetura:** Complexidade analisada estruturalmente.
- **Confiabilidade:** Otimizações listadas no REMEDIATION_PLAN.

## PLANO DE SANEAMENTO
1. Resolver bloqueadores classificados como Críticos ou P0.
2. Endereçar dívidas relacionadas à exposição de dados.
3. Consertar funcionalidades quebradas/simuladas (P1).
4. Saneamento e Testes adicionais em dívidas médias.

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 6
- **Quantidade confirmada:** 6
- **Riscos mais importantes:** Guia canônico LOCAL_FIRST.md orienta aplicação a conectar no PostgreSQL com superusuário de bootstrap (bypass de RLS); Repositórios SQL nativos do discador (PgCampaignRepository/PgLeadRepository) não filtram organization_id explicitamente; Exclusão LGPD pode concluir sem gravar supressão multicanal (OptOutRecord); Mutações concorrentes de módulos podem sobrescrever seleção anterior; Resumo de consumo carrega todas as linhas AILog do período; Signup executa user.count redundante para decidir ADMIN idêntico nos dois ramos
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
