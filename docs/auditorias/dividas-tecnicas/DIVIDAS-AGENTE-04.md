# Relatório de Auditoria de Dívidas Técnicas

## IDENTIFICAÇÃO
- **ID do agente:** 04
- **Nome oficial:** CRM, Revenue Intelligence, Analytics & BI Specialist
- **Especialização:** Domínio Especializado
- **Responsabilidades:** Você é responsável pela operação comercial dentro da plataforma: CRM, empresas, contatos, agenda, analytics, relatórios, métricas e forecast.
- **Branch e commit analisados:** HEAD
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** Domínio abrangente definido no prompt

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Verificado em AGENTS.md e diretório raiz.
- **Arquivos relevantes:** Domínio abrangente definido no prompt
- **Serviços existentes:** Serviços mapeados no repositório atrelados ao domínio.
- **APIs e integrações:** Depende da arquitetura rest/grpc aplicável ao módulo.
- **Testes encontrados:** Verificados nas pastas de /tests e specs relativos.

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DEBT-UX-003
**Título:** Analytics devolve sucesso e zeros após erro de agregação
- **Categoria:** Analytics
- **Severidade:** Alta
- **Status:** Confirmado / Aberto
- **Localização:** src/features/analytics/presentation/AnalyticsController.ts (linhas 24-54), src/features/analytics/pr
- **Evidência:** src/features/analytics/presentation/AnalyticsController.ts (linhas 24-54), src/features/analytics/presentation/AnalyticsController.ts (linhas 56-96), src/features/analytics/presentation/AnalyticsController.ts (linhas 87-147), src/features/analytics/presentation/AnalyticsController.ts (linhas 24-54)
- **Problema:** Endpoints metrics/overview/dashboard capturam qualquer exceção e devolvem dados vazios ou zerados com success:true.
- **Causa raiz:** Confusão entre banco vazio e falha de banco/consulta.
- **Impacto:** Usuário e monitoramento interpretam indisponibilidade como métricas reais zeradas; erro não observável nesses handlers.
- **Correção necessária:** Propagar erro ao middleware e manter vazio apenas quando consulta bem-sucedida devolve vazio.
- **Agente proprietário:** 04
- **Agentes dependentes:** 02, 04 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P1
- **Critério de aceite:** Falha do repository retorna erro observável; banco vazio continua 200 com estado empty verdadeiro.
- **Teste necessário:** Repository rejeita overview/dashboard/getMetrics; confirmar status não2xx/log e UI error/retry; repository vazio não gera erro.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento

### ID: DEBT-UX-002
**Título:** Paginação full-text de empresas restringe resultados ao primeiro lote
- **Categoria:** Busca
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/companies/infra/PrismaCompanyRepository.ts (linhas 44-50), src/features/companies/infra
- **Evidência:** src/features/companies/infra/PrismaCompanyRepository.ts (linhas 44-50), src/features/companies/infra/PrismaCompanyRepository.ts (linhas 66-81), src/lib/search/index.ts (linhas 85-90), src/features/companies/infra/PrismaCompanyRepository.ts (linhas 44-50)
- **Problema:** Com ENABLE_SEARCH=true, o repositório pede os mesmos primeiros limit IDs em todas as páginas e só depois aplica skip no banco. Também conta só os IDs recuperados.
- **Causa raiz:** Paginação aplicada duas vezes em contratos incompatíveis; total de busca perdido.
- **Impacto:** Resultados além do primeiro lote tornam-se inalcançáveis; página 2 fica vazia quando Meili retorna no máximo limit IDs.
- **Correção necessária:** Propagar paginação/total ao motor e preservar ordenação de relevância ou obter conjunto adequado sem aplicar segundo offset.
- **Agente proprietário:** 04
- **Agentes dependentes:** 02, 04 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** Busca com 45 resultados e limite20 retorna páginas20/20/5, total45, sem duplicatas.
- **Teste necessário:** Meili mock45 hits; páginas1,2,3; fallback indisponível; zero resultados; tenant distinto.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento

### ID: DEBT-UX-004
**Título:** Analytics ativo usa calendário UTC apesar do contrato comercial Brasília
- **Categoria:** Internacionalização
- **Severidade:** Média
- **Status:** Confirmado / Aberto
- **Localização:** src/features/analytics/application/AnalyticsUseCases.ts (linhas 22-30), src/features/analytics/analy
- **Evidência:** src/features/analytics/application/AnalyticsUseCases.ts (linhas 22-30), src/features/analytics/analytics.service.ts (linhas 86-98), src/shared/di/setup.ts (linhas 178-178), src/shared/time/brazilCalendar.ts (linhas 1-1)
- **Problema:** Rotas analytics usam Controller/UseCases via DI; UseCases calcula monthStart/monthKey em UTC enquanto serviço legado usa helper canônico Brasília.
- **Causa raiz:** Migração para camada hexagonal não preservou calendário comercial.
- **Impacto:** Receita/contagem/cohort no início do mês divergem por três horas e pelo mês durante a virada; indicadores deixam de ser comparáveis.
- **Correção necessária:** Reutilizar calendário canônico na implementação realmente registrada e eliminar divergência contratual.
- **Agente proprietário:** 04
- **Agentes dependentes:** 02, 04 08: regressão isolada, 00: autorização específica de saneamento
- **Complexidade:** M
- **Prioridade:** P2
- **Critério de aceite:** Instante2026-10-01T01:00Z pertence a setembro comercial em todos os endpoints.
- **Teste necessário:** Virada mensal00:00Z/03:00Z; dezembro/janeiro; host TZ UTC e SãoPaulo; API e export CSV coincidem.
- **Dependências:** 08: regressão isolada, 00: autorização específica de saneamento


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
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade confirmada:** 3
- **Riscos mais importantes:** Analytics devolve sucesso e zeros após erro de agregação; Paginação full-text de empresas restringe resultados ao primeiro lote; Analytics ativo usa calendário UTC apesar do contrato comercial Brasília
- **Recomendação final:** Seguir o cronograma do relatório mestre consolidado.
