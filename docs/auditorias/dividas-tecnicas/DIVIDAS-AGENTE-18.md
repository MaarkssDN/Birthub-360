# Relatório de Auditoria de Dívidas Técnicas — Agente 18

## IDENTIFICAÇÃO
- **ID do agente:** 18
- **Nome oficial:** Contratos, API e Documentação Viva
- **Especialização:** Especificação e governança de contratos de API (OpenAPI 3.1 / Swagger em `docs/openapi.yaml`), schemas de validação Zod, detecção de drift entre código e documentação técnica, testes de conformidade com Schemathesis e governança de documentação viva
- **Responsabilidades:** Manutenção da fonte única de verdade dos contratos de API (`docs/openapi.yaml`), garantia de compatibilidade retroativa em endpoints REST, sincronização entre os schemas Zod de backend e os DTOs do frontend, e automação de testes de drift no CI.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `docs/openapi.yaml`, `scripts/verify-openapi-drift.ts`, schemas Zod em `src/shared/**` e rotas do Express em `src/features/**`.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Contrato OpenAPI mestre, script de verificação de drift de rotas, catálogo de eventos de domínio (`docs/domain-event-mesh-catalog.md`), documentação viva de arquitetura.
- **Arquivos relevantes:**
  - `docs/openapi.yaml` (especificação OpenAPI canônica)
  - `scripts/verify-openapi-drift.ts` (validador de cobertura de endpoints)
  - `src/shared/schemas/**` (schemas Zod reutilizáveis)
  - `docs/DATA-CONTRACT-LEAD.md`
  - `docs/DATA-CONTRACT-NOTE.md`
- **Serviços existentes:** Verificador de drift de rotas, gerador de documentação Swagger UI.
- **APIs e integrações:** Schemathesis CLI, OpenAPI 3.1 spec, Express Router introspection.
- **Funcionalidades implementadas:** Documentação interativa de rotas, validação de tipos de requisição/resposta, esteira de verificação de drift de rotas no CI.
- **Testes encontrados:** `npm run verify:openapi-drift`, testes com Schemathesis em `.venv-opensource`.
- **Dependências externas:** `schemathesis`, `yaml`, `zod`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-18-001 (DEBT-API-001)
- **Título:** Merge de branches antigas removeu 124 linhas dos endpoints de /organization-modules no docs/openapi.yaml
- **Categoria:** Contratos de API e Documentação
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `docs/openapi.yaml` (linhas 450-520), commit histórico `2512d2b8`
- **Evidência:** Durante a resolução de conflitos de merge da branch `origin/agente/01-07-08-commercial-v3-security`, 124 linhas que descreviam as rotas `/api/organization-modules`, `/api/organization-modules/enable` e `/api/organization-modules/disable` foram acidentalmente removidas do arquivo `docs/openapi.yaml`. No entanto, os endpoints continuam ativos e em execução no código backend Express (`src/features/organization-modules/routes/**`).
- **Problema:** Drift formal entre a implementação real e o contrato oficial OpenAPI. A execução de ferramentas de teste automatizado de contrato (como Schemathesis ou Postman Newman) e a geração de SDKs tipados de frontend não cobrem esses endpoints essenciais de onboarding.
- **Causa raiz:** Resolução manual defeituosa de conflitos de merge no Git sem execução de linter de integridade de rotas no pré-commit.
- **Impacto:** Quebra da garantia de conformidade de contrato da API; impossibilidade de testar automaticamente as mutações de módulos organizacionais via Schemathesis.
- **Correção necessária:** Restaurar as 124 linhas da especificação OpenAPI dos endpoints de `/organization-modules` a partir do histórico canônico em `.agents/audits/technical-debt/2026-10-14/evidence/`, incluindo schemas de requisição, resposta HTTP 200, 400, 401 e 403.
- **Agente proprietário:** 18
- **Agentes dependentes:** 01 (Plataforma e Módulos), 08A (Operações Git), 24 (Revisão Independente)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** O comando `npm run verify:openapi-drift` executa com sucesso e confirma que todos os endpoints de `/api/organization-modules` estão devidamente catalogados no `docs/openapi.yaml`.
- **Teste necessário:** Execução de `npm run verify:openapi-drift` e validação com `schemathesis run docs/openapi.yaml`.
- **Dependências:** Nenhuma.

### ID: DIV-18-002
- **Título:** Divergência de validação entre schemas Zod de backend e definições DTO do OpenAPI para criação de leads
- **Categoria:** Contratos e Tipagem
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/crm/routes/lead.routes.ts`, `docs/openapi.yaml`
- **Evidência:** O schema Zod utilizado no controller do Express define o campo `phone` como opcional (`z.string().optional()`), enquanto a especificação no `docs/openapi.yaml` lista `phone` no array de propriedades obrigatórias (`required: [name, phone]`).
- **Problema:** Clientes que consomem a documentação OpenAPI tentam criar leads sem telefone e são instruídos de que a requisição é inválida, ou clientes gerados automaticamente por geradores de SDK rejeitam chamadas válidas aceitas pelo backend.
- **Causa raiz:** Atualização da regra de negócio no código de backend sem sincronização correspondente no arquivo OpenAPI.
- **Impacto:** Dificuldade de integração para desenvolvedores terceiros e falsos positivos em testes de contrato.
- **Correção necessária:** Alinhar a obrigatoriedade dos campos no `docs/openapi.yaml` para refletir estritamente as regras de validação do Zod em `src/shared/schemas/lead.schema.ts`.
- **Agente proprietário:** 18
- **Agentes dependentes:** 04 (CRM e Leads)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Paridade 100% comprovada entre os campos obrigatórios do Zod e do OpenAPI para todas as entidades de CRM.
- **Teste necessário:** Teste automatizado comparando propriedades de schemas Zod contra o schema OpenAPI gerado.
- **Dependências:** Nenhuma.

### ID: DIV-18-003
- **Título:** Script verify-openapi-drift não cobre rotas criadas recentemente para o Hub de Inteligência e Timeline
- **Categoria:** Testes de Contrato e Governança
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `scripts/verify-openapi-drift.ts` (linhas 40-75), novas rotas em `src/features/hub/**`
- **Evidência:** O script de verificação de drift possui uma lista de exclusão estática (whitelist de paths ignorados) que inclui padrões como `/hub/*` e `/timeline/*`. Essas rotas foram adicionadas recentemente mas não foram incluídas no contrato nem no teste de drift.
- **Problema:** Novas APIs são desenvolvidas e colocadas em produção sem serem documentadas no contrato OpenAPI canônico, aumentando a dívida técnica de documentação invisível.
- **Causa raiz:** Uso de exclusões em scripts de teste para silenciar falhas de CI durante o desenvolvimento de novas features.
- **Impacto:** Acúmulo silencioso de rotas não documentadas e não testadas por ferramentas de segurança de API.
- **Correção necessária:** Documentar as rotas de `/api/hub/*` e `/api/timeline/*` no `docs/openapi.yaml` e remover as exceções correspondentes do `scripts/verify-openapi-drift.ts`.
- **Agente proprietário:** 18
- **Agentes dependentes:** 07 (IA e Hub), 08 (Gates de CI)
- **Complexidade:** Média (2 dias)
- **Prioridade:** P2
- **Critério de aceite:** `verify-openapi-drift.ts` roda sem nenhuma rota em whitelist não homologada pela governança.
- **Teste necessário:** Execução de `npm run verify:openapi-drift` com exit code 0.
- **Dependências:** Alinhamento com Agente 07.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (OpenAPI cobre a grande maioria dos endpoints legados e operacionais do CRM).
- **Cobertura automatizada de testes:** Média (script de drift existe, mas possui exceções excessivas).
- **Segurança:** Alta (schemas OpenAPI definem claramente mecanismos de autenticação Bearer e Cookie).
- **Arquitetura:** Alta (OpenAPI centralizado como fonte de verdade de contratos).
- **Confiabilidade:** Média (comprometida pelo descarte de 124 linhas de contratos de módulos).
- **Observabilidade:** Alta (diferenças entre rotas e contratos detectáveis via script).
- **Manutenibilidade:** Alta (arquivo OpenAPI bem estruturado e modularizado em tags).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Restaurar imediatamente as 124 linhas de `/organization-modules` no `docs/openapi.yaml` (DIV-18-001).
2. **Segurança e integridade de dados:** Não aplicável.
3. **Falhas funcionais:** Sincronizar campos obrigatórios entre Zod e OpenAPI nas rotas de leads (DIV-18-002).
4. **Confiabilidade:** Documentar as rotas do Hub de Inteligência e remover exceções em `verify-openapi-drift.ts` (DIV-18-003).
5. **Testes:** Integrar Schemathesis como gate obrigatório no pipeline de CI.
6. **Arquitetura:** Automatizar a geração de tipos TypeScript de frontend a partir do `openapi.yaml`.
7. **Melhorias estruturais:** Implementar versionamento semântico nas rotas de API (`/api/v1/`).

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 1 Alta, 2 Médias, 0 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-18-001, DIV-18-003)
- **Problemas compartilhados:** 1 (DIV-18-002 compartilhado com 04)
- **Handoffs necessários:**
  - Handoff para 04: Confirmação da obrigatoriedade do campo de telefone em leads.
  - Handoff para 07: Levantamento dos esquemas de resposta das rotas de Hub e Timeline.
- **Riscos mais importantes:** O descarte de rotas no OpenAPI quebra a confiabilidade da documentação viva perante clientes e integradores; a divergência de validação Zod vs OpenAPI gera chamadas rejeitadas por geradores de SDK.
- **Recomendação final:** Reintegrar as 124 linhas de `/organization-modules` no `docs/openapi.yaml` como prioridade imediata.
