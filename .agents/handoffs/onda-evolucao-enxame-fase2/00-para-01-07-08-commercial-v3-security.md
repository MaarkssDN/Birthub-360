De: Agente 00 — Coordenador Global
Para: Agentes 01 (Plataforma/Segurança), 07 (IA e Automações) e 08 (QA/Release)
Onda: Fase 2 — Homologação e Qualidade
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: Issue #143
Sprint destino: Fase 2 Enxame IA / Gate V3.1

## Problema
Os endpoints comerciais V3.1 montados em `/api/agent/commercial-v3/*` utilizam middlewares de autenticação, RBAC (`writeRoles`, `adminRoles`) e validação Zod. Contudo, conforme levantado na Issue #143, mecanismos em código não constituíam evidência empírica de segurança e isolamento E2E:
1. Falta de comprovação da matriz completa de acesso para as 6 personas (Anônimo, VISUALIZADOR, SDR, CLOSER, GESTOR, ADMIN) nos 8 endpoints.
2. Ausência de teste de penetração/acesso cruzado multi-tenant provando que `organizationId` é confinado e repassado sem vazamento ao AI Gateway entre Tenants A e B.
3. Necessidade de comprovação matemática de que `allowOperational` opera em fail-closed sem permitir side-effects, envios reais de mensagens ou alteração de dados sem executor idempotente.
4. Validação de salvaguardas de prompt injection via `createUntrustedContentGuard` e fallback determinístico de Zod schema.
5. Garantia de que handoffs respeitam `viaSupervisor: true` e que `evaluate-redteam` respeita cotas e isolamento estrito sem chamadas externas.

## Arquivo(s) envolvido(s)
- `src/features/intelligence/commercial-v3/__tests__/commercialV3.security.test.ts`
- `tests/unit/ci-main-protection-workflows.test.ts` (compatibilização cross-platform)

## Resolução
1. Criada suíte completa de segurança e isolamento com 13 cenários de teste automatizados em `src/features/intelligence/commercial-v3/__tests__/commercialV3.security.test.ts`:
   - **Matriz RBAC:** Validada a resposta de todos os 8 endpoints para Anônimo (401), VISUALIZADOR (403 em escrita/redteam; 200 em leitura), SDR (403 em redteam; 200 nos demais), CLOSER (403 em redteam; 200 nos demais), GESTOR (200 em todos) e ADMIN (200 em todos).
   - **Isolamento Multi-tenant E2E:** Comprovado que o `organizationId` originado da sessão autenticada é o único propagado para o AI Gateway, bloqueando qualquer tentativa de injeção de tenant no body ou headers entre Tenant A e Tenant B.
   - **Controle Operacional Fail-Closed:** Comprovado que `mode` é 'CONSULTIVO', `execution.performed = false` e `compliance.sendEligible = false`, tanto quando `allowOperational` é omitido quanto quando é informado como `true` sem executor homologado.
   - **Sanitização de Prompt Injection:** Comprovado que tentativas de prompt injection ("Ignore previous instructions", "SYSTEM OVERRIDE", etc.) são interceptadas pelo guardião e neutralizadas.
   - **Governança de Handoffs:** Comprovado que 100% dos handoffs retornados carregam a flag `viaSupervisor: true`.
   - **Mínimos Privilégios em /context:** Comprovado que tentar carregar skills de outro agente em `/context` resulta em HTTP 400 (`VALIDATION_ERROR`).
   - **RedTeam Isolado:** Comprovado que a execução do RedTeam do supervisor ocorre em ambiente mockado, seguro e determinístico em menos de 100ms.

## Evidências
- `vitest` em `commercialV3.security.test.ts`: 13 passed (100%).
- `vitest` em toda a suíte commercial-v3: 57 passed (3 arquivos).
- `tsc --noEmit`: 0 erros.
- `biome check`: 0 erros e 0 warnings.
