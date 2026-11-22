# Relatório de Auditoria de Dívidas Técnicas — Agente 05

## IDENTIFICAÇÃO
- **ID do agente:** 05
- **Nome oficial:** Prospecção Comercial
- **Especialização:** Motores de prospecção ativa, pesquisa e inteligência de mercado, enriquecimento de leads (Apollo, Hunter, Receita Federal / CNPJ), campanhas de cold-email e conformidade de abordagem comercial
- **Responsabilidades:** Gestão dos fluxos de outbound, listas de prospecção, provedores de enriquecimento de dados cadastrais, verificação de listas de supressão e integridade dos endpoints de captura de leads.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/prospecting/**`, `src/features/market-intelligence/**`, rotas de outbound, serviços de enriquecimento de leads e serviços de envio de e-mails de prospecção.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Rotas de leads de prospecção, serviço de enriquecimento (`EnrichmentService`), serviço de envio de cold-mail (`ColdEmailService`), busca de opções de segmentação.
- **Arquivos relevantes:**
  - `src/features/prospecting/outbound/server/routes/leads.routes.ts` (1372 linhas, sob exceção em `HOTSPOT_EXCEPTIONS.md`)
  - `src/features/prospecting/services/enrichment.service.ts` (720 linhas)
  - `src/features/prospecting/outbound/utils/searchOptions.ts` (718 linhas)
  - `src/features/prospecting/services/cold-email.service.ts`
  - `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts` (1016 linhas)
- **Serviços existentes:** `EnrichmentService`, `ApolloProvider`, `HunterProvider`, `ReceitaWsProvider`, `ColdEmailService`.
- **APIs e integrações:** Integrações externas com APIs da Apollo.io, Hunter.io, BrasilAPI / ReceitaWS e provedores SMTP de disparo.
- **Funcionalidades implementadas:** Descoberta de empresas por CNAE e porte, enriquecimento automático de telefones e e-mails de decisores, validação sintática de caixas postais, filas de cold-mail com limite diário.
- **Testes encontrados:** `tests/unit/enrichment.service.test.ts`, `tests/unit/cold-email.service.test.ts`, `tests/integration/leads.routes.test.ts`.
- **Dependências externas:** Provedores de API externos (Apollo, Hunter, BrasilAPI), `@sendgrid/mail` ou `nodemailer`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-05-001
- **Título:** Hotspot estrutural excessivo e concentração de lógica em leads.routes.ts
- **Categoria:** Arquitetura e Manutenibilidade
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/prospecting/outbound/server/routes/leads.routes.ts` (1372 linhas)
- **Evidência:** O arquivo ultrapassa o limite de alerta de 700 linhas e o limite de falha de 1000 linhas, mantido sob exceção temporária até 30/11/2026.
- **Problema:** O arquivo concentra validação de esquemas Zod de entrada, regras de permissão de prospecção, chamadas aos provedores externos de enriquecimento, parsing de arquivos CSV de importação e mutações no banco de dados relacional.
- **Causa raiz:** O crescimento contínuo de endpoints da esteira de outbound ocorreu por acréscimo sequencial de rotas no mesmo arquivo sem modularização por controlador ou caso de uso.
- **Impacto:** Dificuldade extrema em debugar erros de rotas; alto risco de regressões ao atualizar esquemas de importação de leads; lentidão na compilação do TypeScript.
- **Correção necessária:** Decompor `leads.routes.ts` em:
  - `leads.controller.ts` (recebimento e validação HTTP);
  - `ImportLeadsUseCase.ts` (processamento de listas e CSV);
  - `EnrichLeadUseCase.ts` (orquestração de enriquecimento);
  - `leads.validator.ts` (esquemas Zod isolados).
- **Agente proprietário:** 05
- **Agentes dependentes:** 18 (Contratos de API), 08 (Testes de integração)
- **Complexidade:** Média (2 a 3 dias)
- **Prioridade:** P1
- **Critério de aceite:** `leads.routes.ts` reduzido para menos de 250 linhas atuando estritamente como roteador do Express; 100% dos testes de integração de leads permanecem verdes.
- **Teste necessário:** Execução de `vitest run tests/integration/leads.routes.test.ts`.
- **Dependências:** Nenhuma.

### ID: DIV-05-002
- **Título:** Ausência de circuit breaker e rate limit adaptativo no serviço de enriquecimento de leads
- **Categoria:** Confiabilidade e Resiliência
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/prospecting/services/enrichment.service.ts` (linhas 720+)
- **Evidência:** Chamadas externas para provedores como Apollo e Hunter são executadas de forma direta via `fetch`/`axios` com timeout fixo de 30 segundos, sem implementação de padrão Circuit Breaker nem controle adaptativo de rate limit (429 Too Many Requests).
- **Problema:** Quando a API de um dos provedores de enriquecimento passa por instabilidade ou esgota o limite de requisições por minuto, as requisições da plataforma ficam presas aguardando 30 segundos, esgotando o pool de sockets do Node.js e travando os demais processos da aplicação.
- **Causa raiz:** Falta de uma camada de resiliência (como `opossum` ou padrão circuit breaker customizado) no cliente HTTP de integrações de prospecção.
- **Impacto:** Indisponibilidade em cascata do serviço de prospecção e timeouts generalizados para usuários que tentam enriquecer dados de empresas.
- **Correção necessária:** Integrar biblioteca de Circuit Breaker (ou implementar fail-fast com backoff exponencial) e fallback automático entre provedores secundários quando o primário atingir rate limit ou responder com erro 5xx.
- **Agente proprietário:** 05
- **Agentes dependentes:** 16 (Workers e Filas), 10 (SRE e Monitoramento)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P1
- **Critério de aceite:** Quando o provedor primário simula 5 erros consecutivos ou status 429, o circuit breaker abre imediatamente, roteando chamadas para o provedor secundário ou respondendo com erro amigável sem prender threads.
- **Teste necessário:** Teste unitário com mock de servidor simulando falhas contínuas e validando a transição de estados do Circuit Breaker (CLOSED -> OPEN -> HALF-OPEN).
- **Dependências:** Nenhuma.

### ID: DIV-05-003
- **Título:** Acúmulo de cache de enriquecimento sem expurgo automático em tabelas temporárias
- **Categoria:** Banco de Dados e Confiabilidade
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/prospecting/services/enrichment.service.ts`, `prisma/schema.prisma`
- **Evidência:** Respostas de enriquecimento de CNPJ e domínios são salvas em tabelas relacionais de cache para evitar cobranças redundantes nas APIs externas, mas nenhum registro possui data de expiração (`expiresAt`) ou rotina de purga periódica.
- **Problema:** O cache acumula permanentemente dados cadastrais desatualizados (ex.: quadros societários e telefones que já mudaram) e ocupa espaço desnecessário no banco de dados.
- **Causa raiz:** O cache foi projetado para persistência perpétua sem política de ciclo de vida de dados (TTL).
- **Impacto:** Vendedores realizam prospecção com telefones e contatos obsoletos salvos há meses no banco; crescimento contínuo de linhas na base.
- **Correção necessária:** Adicionar coluna `expiresAt` nas tabelas de cache de prospecção (com validade recomendada de 30 a 60 dias) e incluir a exclusão de registros vencidos no cron de limpeza da plataforma.
- **Agente proprietário:** 05
- **Agentes dependentes:** 01 (Schema Prisma), 16 (Workers)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** O método de busca no cache descarta registros com `expiresAt < now()` e dispara nova consulta no provedor.
- **Teste necessário:** Teste unitário de verificação de expiração de cache no `EnrichmentService`.
- **Dependências:** Handoff para 01 para adição de coluna no Prisma.

### ID: DIV-05-004
- **Título:** Ausência de validação prévia em lote de listas de supressão (Opt-Out) em importações de prospecção
- **Categoria:** Privacidade e LGPD
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/prospecting/services/cold-email.service.ts` (linhas 80-105), `leads.routes.ts`
- **Evidência:** Durante o upload e importação de listas com milhares de contatos para campanhas de cold-mail, os leads são cadastrados e agendados no banco sem cruzamento prévio contra a tabela `OptOutRecord`. A checagem de exclusão/bloqueio só ocorre no instante exato do disparo unitário.
- **Problema:** Se um lead que exerceu seu direito de opt-out estiver em uma lista importada, ele permanece agendado na fila com status "pendente", gerando risco de disparo acidental se houver falha pontual no worker de envio.
- **Causa raiz:** Validação de opt-out tratada como etapa de borda no envio em vez de filtro sanitizador no funil de entrada.
- **Impacto:** Risco de violação de preferências de privacidade e perda de visibilidade prévia sobre quantos contatos da lista são elegíveis para disparo.
- **Correção necessária:** Executar query em lote contra `OptOutRecord` logo na validação do arquivo importado, marcando imediatamente como `BLOCKED_OPTOUT` qualquer lead previamente suprimido.
- **Agente proprietário:** 05
- **Agentes dependentes:** 21 (LGPD e Privacidade), 17 (Cadência Comercial)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Relatório de importação de lista exibe claramente a quantidade de contatos bloqueados por solicitação prévia de opt-out.
- **Teste necessário:** Teste automatizado de importação com lista contendo 10 e-mails cadastrados na base de supressão.
- **Dependências:** Alinhamento com Agente 21.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (motores de busca por CNPJ, enriquecimento Apollo e fluxo de cold-email operacionais).
- **Cobertura automatizada de testes:** Média (testes de rotas existem, mas faltam testes de simulação de indisponibilidade de provedores externos).
- **Segurança:** Alta (tokens de API externas armazenados criptografados e isolados por tenant).
- **Arquitetura:** Média (comprometida pela densidade excessiva em `leads.routes.ts`).
- **Confiabilidade:** Média (suscetível a lentidão e travamento por indisponibilidade de provedores terceiros sem circuit breaker).
- **Observabilidade:** Média (erros de APIs externas registrados em log, mas sem métricas consolidadas de taxa de sucesso).
- **Manutenibilidade:** Média (alta complexidade nos arquivos principais de outbound).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado no domínio de prospecção.
2. **Segurança e integridade de dados:** Implementar validação em lote contra `OptOutRecord` no momento da importação de leads (DIV-05-004).
3. **Falhas funcionais:** Adicionar Circuit Breaker e fallback adaptativo no `EnrichmentService` (DIV-05-002).
4. **Confiabilidade:** Adicionar política de expurgo e expiração de 60 dias para o cache de empresas (DIV-05-003).
5. **Testes:** Criar suíte de testes de integração com simulação de cenários de erro 429 e 503 dos provedores.
6. **Arquitetura:** Decompor `leads.routes.ts` em controladores e casos de uso isolados (DIV-05-001).
7. **Melhorias estruturais:** Adicionar métricas de enriquecimento por provedor no dashboard do SDR.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-05-001, DIV-05-002, DIV-05-003)
- **Problemas compartilhados:** 1 (DIV-05-004 compartilhado com 21 e 17)
- **Handoffs necessários:**
  - Handoff para 01: Adição da coluna `expiresAt` na tabela de cache de enriquecimento.
  - Handoff para 21: Validação dos termos de consentimento e supressão aplicados no outbound.
- **Riscos mais importantes:** A dependência direta de provedores externos de enriquecimento sem circuit breaker expõe a aplicação a travamentos generalizados por timeouts de terceiros; acúmulo em `leads.routes.ts` (1372 linhas) eleva o risco de regressões em produção.
- **Recomendação final:** Implementar imediatamente o padrão Circuit Breaker no `EnrichmentService` e planejar a modularização do roteador de leads.
