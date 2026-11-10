# Relatório de Homologação de Skills — Etapa S0
**Data:** 2026-11-10  
**Status:** APROVADO PELO AGENTE 24 (`agent-review-gate` — Revisão Independente em 2026-11-10T14:15:30Z, Subagente `1a58951d-add9-48cc-aae0-c14b5acb0099`)  
**Responsáveis:** Agente 00 (Coordenador) — Auditoria Independente: Agente 24 (`agent-review-gate`)  
**Escopo:** Inventário e validação de `.agents/skills/`, saneamento de comandos perigosos em skills externas, alinhamento 100% factual das 16 skills customizadas com o repositório (`prisma/schema.prisma`, `package.json`, `src/styles/globals.css`, `AGENTS.md`), cruzamento com bloqueadores B-01 a B-14 e mapa real de dependências.

---

## 1. Inventário Geral e Saneamento de Segurança de `.agents/skills/`

1. **Conformidade estrutural:**
   - **Total de diretórios inspecionados:** 434
   - **Arquivos `SKILL.md` com frontmatter YAML (`name`, `description`):** 434 (100% de conformidade sintática).
2. **Auditoria de padrões sensíveis (20 skills externas identificadas na varredura):**
   - **16 skills de teste/segurança defensiva (`apollo-server-tests`, `atlas-migrations`, `bats-testing`, `database-integrity`, `dependency-vulnerability-scanning`, `git-guardrails-claude-code`, `graphql-subscription-test-author`, `malicious-payload-bank`, `mantis-meta-agent`, `mantis-patch`, `mantis-pipeline-adapter`, `mantis-reproduce`, `migration-operation-taxonomy`, `mvcc-isolation-tests`, `stryker-mutation`, `synthetic-monitor-author`):** Contêm exemplos de payloads de teste (SQLi/XSS defensivo para validação de sanitizadores), hooks que *bloqueiam* `git push --force`/`rm -rf`, ou limpeza de diretórios temporários de teste (`$BATS_TEST_TMPDIR`). Não instruem execução destrutiva no repositório.
   - **4 skills externas continham comandos operacionais de risco e foram SANEADAS neste ciclo:**
     1. `.agents/skills/deploy-to-vercel/SKILL.md`: Removidas todas as instruções de deploy automático não autenticado (`--temporary` nas linhas 148, 162, 178, 188 e 220); substituídas por exigência explícita de autenticação e aprovação do Agente 00 / usuário (`AGENTS.md` §15 e §24).
     2. `.agents/skills/maestro-flows/SKILL.md`: Removido `curl -Ls "https://get.maestro.mobile.dev" | bash`; substituído por verificação de binário pré-instalado sem execução remota de script shell.
     3. `.agents/skills/syft-generation/SKILL.md`: Removido `curl -sSfL https://get.anchore.io/syft | sh`; substituído por uso de gerenciador de pacotes homologado ou container oficial em CI.
     4. `.agents/skills/vercel-cli-with-tokens/SKILL.md`: Removidos comandos `printenv | grep` e `grep .env` que imprimiam valores de tokens no log do terminal; substituídos por verificação booleana de existência da chave sem exibir o segredo (`AGENTS.md` §24).

---

## 2. Alinhamento Factual das 16 Skills Customizadas ao Repositório

Todas as divergências apontadas pela Revisão Independente (Agente 24) nas skills customizadas foram corrigidas:

| Skill Customizada | Correção Aplicada para Aderência Estrita ao Código Real |
| :--- | :--- |
| `tailwind-token-auditor` | Alinhada ao Tailwind CSS v4 (`@tailwindcss/vite` + `@theme` em `src/styles/globals.css`), exigindo tokens canônicos (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-ink-2`, `border-line`, `bg-brand`) e proibindo aliases legados (`bg-background`, `text-foreground`, `bg-primary`) conforme `A03-P2-07` (`src/styles/globals.css:668-676`). |
| `sql-n-plus-one-detector` | Exemplos corrigidos para usar models e campos reais de `prisma/schema.prisma` (`Lead`, `Activity` com `id`, `type`, `owner`, `date`, `time`, `status`, `observations`). |
| `bitrix24-payload-validator` | Removido model fictício `BitrixFieldMapping`; referenciados os models reais `BitrixConnection`, `BitrixSyncRule`, `BitrixSyncLog`, `BitrixExtractionRun`, `CopilotoBitrixFieldMapping` e `ExternalCrmStageMapping`. Configurado rate limit de 2 req/s (Standard/Pro) a 5 req/s (Enterprise). |
| `baileys-whatsapp-resilience` | Alinhada às colunas reais de `WhatsAppMessage` (`id`, `organizationId`, `waMessageId`, `direction`, `phoneE164`, `body`, `contactId`, `leadId`, `receivedAt`) e documentado o risco de conformidade da biblioteca não-oficial `@whiskeysockets/baileys`. |
| `capacitor-offline-sync` | Removidas referências a bibliotecas não instaladas (`zustand`, `@capacitor-community/sqlite`, `@capacitor/network`); alinhada às dependências reais do `package.json` (`rxdb ^17.5.0`, `@tanstack/react-query ^5.103.1`, `@capacitor/core`, `@capacitor/android`, `@capacitor/ios` e eventos `online`/`navigator.onLine`). |
| `llm-cost-and-token-budgeter` | Alinhada exclusivamente aos campos reais do model `AILog` em `prisma/schema.prisma:1826-1846` (`id`, `tokens`, `cost`, `latencyMs`, `model`, `promptId`, `organizationId`, `agentRole`, `createdAt`) e aos módulos `src/lib/ai/budget.ts` e `src/lib/ai/usage-log.ts`. |
| `vitest-mutation-testing` | Documentado explicitamente que `@stryker-mutator/*` não está instalado em `package.json` e que qualquer adição requer aprovação explícita do Agente 00 (`AGENTS.md` §15). |
| `rls-leak-checker` | Alinhada a `src/shared/middlewares/authenticateToken.ts`, `src/bootstrap/dbRoleCheck.ts`, coluna `"organizationId"` (camelCase), `current_setting('app.current_tenant_id', true)`, `BYPASS_RLS_ALLOWED_MODELS` em `src/lib/prisma.ts`, e ao princípio de que `@@unique([id, organizationId])` não substitui políticas RLS (`ENABLE` + `FORCE ROW LEVEL SECURITY` + `CREATE POLICY`). |
| `lgpd-pii-sanitizer` | Removida menção a `Winston`; alinhada ao `pino` (`src/lib/logger.ts`), `decryptNestedContactPii` em `src/lib/prisma.ts` e protocolo obrigatório de 4 etapas (backup, dry-run, validação e rollback) para `scripts/security/backfill-contact-pii.ts`. |
| `openapi-contract-keeper` | Removida menção a `Fastify`; alinhada ao Express 5 e aos scripts reais `npm run verify:openapi-drift` (`tsx scripts/verify-openapi-drift.ts`) e `npm run test:api-schema` (`.\\.venv-opensource\\Scripts\\schemathesis.exe run docs/openapi.yaml --url http://127.0.0.1:3000`). |
| `k6-load-testing` | Detalhados os 3 scripts reais (`load:k6` -> `tests/load/k6-api.js` e `load:k6:crm` -> `tests/load/k6-crm-authenticated.js` via `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.opensource.yml --profile tools`, e `load:k6:ai-voice` via `node scripts/test/run-k6-ai-voice-stress.mjs`) e autenticação via sessões do `better-auth` (`auth.api.getSession`). |
| `websocket-stream-debugger` | Substituída menção genérica a JWT por validação de sessão `better-auth` (`auth.api.getSession`), salas por organização (`org_${organizationId}`) e verificação de persistência real de comandos de voz (**B-07**). |
| `agent-review-gate` | Alinhada à propriedade exclusiva de `prisma/schema.prisma` e `prisma/migrations/**` pelo **Agente 01** (`AGENTS.md` §15, com exclusão mútua `01 ↔ 01A` no §14) e aos três vereditos oficiais (`APROVADO`, `REPROVADO`, `BLOQUEADO`). |
| `bullmq-worker-governance` | Diferenciada deduplicação de fila (`jobId` no Redis) de idempotência de negócio no PostgreSQL usando os models reais `DomainEventOutbox` e `DomainEventConsumption` (`@@unique([consumerName, eventId])`). |
| `prisma-migration-safety` | Verificada: 100% compatível com PostgreSQL, `CONCURRENTLY`, `deletedAt` e `auditableModels` em `src/lib/prisma.ts`. |
| `react-render-antipatterns` | Verificada: 100% compatível com React 19.3.0 e `@tanstack/react-virtual` (`^3.13.23`) instalado em `package.json`. |

---

## 3. Matriz de Cruzamento: 20 Skills Primárias vs Bloqueadores B-01 a B-14 (`AGENTS.md`)

| Bloqueador Crítico | Descrição do Risco | Skills Diretas de Mitigação | Agente Responsável |
| :--- | :--- | :--- | :--- |
| **B-01** | RBAC duplicado ou divergente | `agent-review-gate`, `vitest-mutation-testing` | Agente 01 / Agente 24 |
| **B-02** | Rotas administrativas sem autorização adequada | `openapi-contract-keeper`, `agent-review-gate` | Agente 18 / Agente 24 |
| **B-03** | Risco ou dependência insegura na autenticação | `agent-review-gate`, `openapi-contract-keeper` | Agente 15 |
| **B-04** | Credenciais armazenadas sem proteção | `baileys-whatsapp-resilience`, `agent-review-gate` | Agente 15 |
| **B-05** | Deploy capaz de iniciar sem migrações | `prisma-migration-safety` | Agente 01 / Agente 08A |
| **B-06** | Dados fictícios misturados com dados reais | `lgpd-pii-sanitizer`, `msw-handlers` | Agente 21 / Agente 08 |
| **B-07** | Comando de voz que afirma executar ação sem executá-la | `websocket-stream-debugger` | Agente 12 |
| **B-08** | Ferramentas do Hub de IA inacessíveis | `llm-cost-and-token-budgeter` | Agente 07 / Agente 13 |
| **B-09** | Erros de frontend em Integrações | `tailwind-token-auditor`, `vercel-composition-patterns`, `react-render-antipatterns` | Agente 02 / Agente 03 |
| **B-10** | Separação visual sem isolamento real de dados | `rls-leak-checker`, `prisma-migration-safety` | Agente 01 / Agente 01A |
| **B-11** | Sincronizações Bitrix que falham silenciosamente | `bitrix24-payload-validator`, `bullmq-worker-governance` | Agente 06 / Agente 16 |
| **B-12** | Extrações Bitrix incompletas tratadas como definitivas | `bitrix24-payload-validator` | Agente 06 / Agente 06A |
| **B-13** | Tratamento de dados pessoais sem base legal, retenção ou exclusão | `lgpd-pii-sanitizer` | Agente 21 |
| **B-14** | Dumps/backups de banco versionados no Git | `lgpd-pii-sanitizer`, `agent-review-gate` | Agente 15 / Agente 24 |

---

## 4. Matriz de Propriedade e Roster Oficial (`AGENTS.md` §3, §14 e §15)

1. `rls-leak-checker` → **Agente 01A (Confiabilidade de Dados, RLS e Retenção)** *(Slot compartilhado com 01; exclusão mútua `01 ↔ 01A`)*
2. `prisma-migration-safety` → **Agente 01 (Plataforma, Segurança e Dados)** *(Dono exclusivo de `prisma/schema.prisma` e `prisma/migrations/**`)*
3. `lgpd-pii-sanitizer` → **Agente 21 (Privacidade e LGPD)** & **Agente 15 (Segurança Aplicada)**
4. `sql-n-plus-one-detector` → **Agente 23 (Custo, Performance e Limites de IA)**
5. `bullmq-worker-governance` → **Agente 16 (Runtime, Workers e Escala)**
6. `bitrix24-payload-validator` → **Agente 06 (Integrações e Bitrix)** / **06A (Extrações Bitrix)** *(Exclusão mútua `06 ↔ 06A`)*
7. `baileys-whatsapp-resilience` → **Agente 06 (Integrações)** & **Agente 15 (Segurança Aplicada)**
8. `openapi-contract-keeper` → **Agente 18 (Contratos, API e Documentação Viva)**
9. `tailwind-token-auditor` → **Agente 03 (Design e Acessibilidade)**
10. `vercel-composition-patterns` → **Agente 02 (Produto e UX)**
11. `react-render-antipatterns` → **Agente 02 (Produto e UX)**
12. `vercel-react-view-transitions` → **Agente 03 (Design e Acessibilidade)**
13. `playwright-automation-expert` → **Agente 08 (QA e Release)** & **Agente 14 (Test Harness)**
14. `msw-handlers` → **Agente 14 (Ambiente de Execução e Test Harness)**
15. `k6-load-testing` → **Agente 23 (Performance)** & **Agente 10 (Infraestrutura e SRE)**
16. `vitest-mutation-testing` → **Agente 08 (QA e Release)**
17. `llm-cost-and-token-budgeter` → **Agente 23 (Custo, Performance e Limites de IA)**
18. `websocket-stream-debugger` → **Agente 12 (Voz e Telefonia)**
19. `capacitor-offline-sync` → **Agente 09 (Mobile)** *(Dono exclusivo de `android/**` e `capacitor.config.ts`)*
20. `agent-review-gate` → **Agente 24 (Revisão Independente)**

---

## 5. Mapa Factual de Dependências Técnicas e Pré-requisitos (S1 a S4)

```
[Etapa S1 - RLS & Tenancy]
   ├── Depende de: scripts/db/bootstrap-app-role.sh e src/bootstrap/dbRoleCheck.ts (Papel NOSUPERUSER/NOBYPASSRLS)
   ├── Depende de: docker-compose.postgres-local.yml ativo (porta 5434) para testes de integração RLS
   └── Depende de: Handoff ao Agente 01 para criar CREATE POLICY ausente na tabela "DocumentEmbedding" e corrigir bloco vazio em tests/unit/db/rls-coverage.test.ts

[Etapa S2 - Filas & Integrações]
   ├── Depende de: Redis ativo (porta 6379) para BullMQ
   ├── Depende de: Models reais `DomainEventOutbox` e `DomainEventConsumption` (em prisma/schema.prisma) para idempotência
   └── Depende de: Models reais `BitrixConnection`, `CopilotoBitrixFieldMapping` e `ExternalCrmStageMapping`

[Etapa S3 - Frontend & Interface]
   ├── Depende de: React 19.3.0 e @tanstack/react-virtual ^3.13.23 (Confirmados em package.json)
   └── Depende de: Tokens semânticos @theme em src/styles/globals.css (Tailwind v4 via @tailwindcss/vite)

[Etapa S4 - QA, IA & Mobile]
   ├── Depende de: Servidor local ativo (porta 3000) para npm run test:api-schema (Schemathesis) e npm run verify:openapi-drift (scripts/verify-openapi-drift.ts)
   ├── Depende de: Modelos reais `AILog` (prisma/schema.prisma) e módulos src/lib/ai/budget.ts + src/lib/ai/usage-log.ts
   ├── Depende de: Aprovação explícita do Agente 00 caso se deseje instalar @stryker-mutator/* no package.json
   └── Depende de: rxdb ^17.5.0, @tanstack/react-query ^5.103.1 e @capacitor/core já presentes em package.json
```
