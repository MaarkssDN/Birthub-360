# Parecer de Revisão Independente — Agente 24
**Data:** 2026-11-18  
**Onda:** Wave A — Saneamento de Handoffs e Governança Estrutural  
**PR:** #383 (`agente/05-handoffs-20261117` → `main`)  
**Commit Auditado:** `4f743e6ab` (incluindo `a71f4cd6b`, `daed23538`)  
**Autor:** Agente 05 (Prospecção e Outbound)  
**Auditor:** Agente 24 (Revisão Independente)  

---

## 1. Veredito

### **STATUS: APROVADO** (com dependência de merge do PR #381)

A entrega soluciona de forma definitiva a vulnerabilidade crítica de ausência de isolamento multi-tenant no módulo de prospecção e outbound legado (handoffs 12→05, F1–F3 e 16→05). Foi introduzido o middleware `requireTenantScope` que exige sessão ativa com empresa preenchida (403 fail-closed), todas as consultas a banco foram sanitizadas para injetar `company = ?` (via `tenantCompany(req)`), o endpoint `POST /prospect` agora ignora explicitamente a `company` enviada no payload, o lookup de `search-runs` exige conformidade de tenant (404 em cross-tenant), e o cache de provedores (`providerCache.ts`) migrou para v2 embutindo o `tenantId` na chave Redis.

---

## 2. Escopo e Propriedade de Arquivos (P1, P2, P3)

| Arquivo Alterado | Proprietário Canônico | Justificativa / Conformidade |
|---|---|---|
| `src/features/prospecting/outbound/server/auth.ts` | Agente 05 | Criação de `requireTenantScope`, `normalizeTenantCompany` e helper `tenantCompany(req)`. |
| `src/features/prospecting/outbound/server/routes/*` | Agente 05 | Injeção de `requireTenantScope` e cláusulas `company = ?` em campanhas, chat, integrações, leads, sistema e tarefas. |
| `src/features/prospecting/services/providerCache.ts` | Agente 05 | Migração para chave de cache v2: `prospecting:provider-cache:v2:{tenantId}:{provider}:{operation}:{hash}`. |
| `tests/unit/features/prospecting/outbound/tenantScope.test.ts` | Agente 05 / 08 | 16 testes de isolamento multi-tenant cobrindo todos os vetores de vazamento entre empresas. |
| `src/features/prospecting/services/__tests__/providerCache.test.ts` | Agente 05 / 08 | 12 testes validando segmentação de cache por tenant. |
| `.agents/handoffs/**` | Agente 05 | Atualização formal dos handoffs de tenancy e decisão de modelagem outbound. |

- **P1 (Pensar antes de programar):** O problema de tenancy no outbound legado foi tratado em todas as camadas (auth, queries, rotas, cache).
- **P2 (Simplicidade primeiro):** Normalização centralizada e reaproveitamento dos métodos existentes.
- **P3 (Cirúrgico):** Somente arquivos do módulo `prospecting` e seus testes foram alterados (+828 linhas, -99 linhas).
- **P4 (Verificável):** 28 testes automatizados criados e validados.

---

## 3. Evidências de Validação Local

1. **Testes de Isolamento e Cache:**
   - Comando: `npx vitest run -c vitest.unit.config.ts tests/unit/features/prospecting/outbound/tenantScope.test.ts src/features/prospecting/services/__tests__/providerCache.test.ts`
   - Resultado: **2 arquivos / 28 testes aprovados em 13.48s**.
   - Cobertura de cenários:
     - Sessão sem company rejeitada com 403.
     - `GET /campaigns`, `GET /tasks`, `GET /users` filtram estritamente pela empresa da sessão.
     - Acesso a leads, tarefas ou evidências de outra empresa devolve 404 (sem revelar existência).
     - `POST /prospect` ignora `company` do body enviada por usuário admin.
     - `GET /search-runs/:id` de outro tenant resulta em 404.
     - Provider cache segmentado por organização (cache de A nunca servido para B).
2. **Linter Biome:**
   - Comando: `npx biome lint src/features/prospecting`
   - Resultado: 0 erros nos arquivos do PR.

---

## 4. Análise de Segurança e Tenancy

- **Eliminação de Vazamento Cross-Tenant (B-10):** Nenhuma query do módulo outbound agora executa sem o predicado `company = ?`.
- **Prevenção de Cache Poisoning / Cross-Tenant Cache:** A inclusão de `tenantId` em `providerCache.ts` elimina a possibilidade de reuso indevido de respostas pagas de enriquecimento entre concorrentes.
- **Dependência de Banco:** O arquivo `chat.routes.ts` consulta a coluna `company` em `chat_sessions` e `chat_messages`. Essa coluna foi criada e indexada na migration `20261117230000_outbound_chat_tenant_company` do PR #381.

---

## 5. Próximos Passos de Coordenação

1. **Ordem Obrigatória de Merge:** O PR #381 deve ser mergeado **antes** ou **junto** ao PR #383 para garantir a existência da coluna `company` nas tabelas de chat.
2. Com o PR #381 aprovado, o PR #383 está formalmente liberado para merge.
