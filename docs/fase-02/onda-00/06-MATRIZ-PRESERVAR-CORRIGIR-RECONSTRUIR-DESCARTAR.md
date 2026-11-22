# MATRIZ CONSOLIDADA DE DECISÃO TÉCNICA (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Status:** CONCLUÍDO — CLASSIFICAÇÃO DIAGNÓSTICA COM BASE EM EVIDÊNCIAS EMPÍRICAS

---

## 1. Critérios de Classificação Diagnóstica

| Classificação | Critério Objetivo | Ação Requerida na Fase 02 |
| :--- | :--- | :--- |
| **PRESERVAR** | Código funcional, seguro, testado e aderente ao Documento Mestre V4. | Manter intacto; integrar como dependência estável. |
| **CORRIGIR** | Código aproveitável com débitos pontuais, hotspots ou falta de testes. | Refatoração cirúrgica sem quebrar contratos existentes. |
| **RECONSTRUIR** | Código ausente, inadequado ou com débito estrutural de difícil reparo. | Nova implementação seguindo Clean Architecture e TDD. |
| **DESCARTAR** | Código obsoleto, duplicado ou abandonado sem consumidores ativos. | Remoção controlada com validação de orfandade de imports. |
| **NÃO VERIFICADO**| Código cuja verificação depende de infraestrutura externa no momento. | Reavaliar em ambiente com container ou chaves ativas. |

---

## 2. Classificação dos Principais Componentes e Subsistemas

| Componente / Subsistema | Caminho no Repositório | Classificação | Justificativa Técnica & Evidência | Requisito V4 | Agente |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Hash de Senhas Argon2id** | `src/lib/auth.ts` | **PRESERVAR** | 13/13 testes unitários aprovados em PHC Argon2id com retrocompatibilidade Scrypt. | REQ-ADM-001 | 15 |
| **Trilha de Consentimento LGPD**| `src/lib/security/consentAuditChain.service.ts`| **PRESERVAR** | Cadeia imutável com hash criptográfico encadeado implementada e ativa. | REQ-ADM-003 | 21 |
| **Mascaramento PII em Áudio** | `src/services/telephony/transcription-pii-masking.ts`| **PRESERVAR** | 3/3 testes unitários verdes validando supressão de CPF e telefones em transcrição. | REQ-ENG-003 | 12 |
| **Orçamento de Tokens IA** | `src/lib/ai/budget.ts` | **PRESERVAR** | 10/10 testes unitários verdes garantindo cortes de cota a 80% e 100%. | REQ-AI-001 | 23 |
| **Catálogo de Personas (379)** | `src/features/job-roles/catalog/agents.normalized.json`| **PRESERVAR** | Catálogo rico e normalizado pronto para uso no Agent Builder. | REQ-AI-001 | 07 |
| **Logs de Reset de Senha** | `src/lib/auth.ts` | **CORRIGIR** | Falha em `verify-auth-log-redaction.mjs`: vazamento de `resetUrl` em log de console. | REQ-ADM-001 | 15 |
| **Kanban Board Central** | `src/components/CrmBoard.tsx` (1.258L) | **CORRIGIR** | Hotspot sob exceção em HOTSPOT_EXCEPTIONS.md; exige modularização em colunas. | REQ-CRM-001 | 02 |
| **Painel de Importação Bitrix** | `src/features/integrations/components/BitrixImportPanel.tsx` (1.252L)| **CORRIGIR** | Hotspot sob exceção; requer decomposição em steps e isolamento de validação batch. | REQ-AUT-001 | 06 |
| **Supervisor Central de IA** | `src/features/intelligence/agents/supervisor.agent.ts` (1.000L)| **CORRIGIR** | Hotspot no limite máximo (1.000L); separar despacho semântico e alçadas. | REQ-AI-001 | 13 |
| **CSS Overrides com !important**| `src/styles/` / Tailwind | **CORRIGIR** | 14 ocorrências de `!important` detectadas pelo Biome; refatorar para classes semânticas. | Visual V4 | 03 |
| **Motor de Forecast e BI** | `src/features/analytics/infra/PrismaAnalyticsRepository.ts`| **CORRIGIR** | N+1 queries em relatórios agregados; refatorar com queries agrupadas indexadas. | REQ-PRF-001 | 04 |
| **Persistência Mobile Offline** | `src/features/mobile/OfflineSyncQueue.ts` | **RECONSTRUIR**| Implementação atual em LocalStorage/IndexedDB frágil; exige SQLite nativo Capacitor. | REQ-MOB-002 | 09 |
| **Simulador Dry-Run Automações**| `src/features/automations/engine/RuleEngineAST.ts` | **RECONSTRUIR**| Execução de dry-run simulado em memória com rollback total ausente no backend. | REQ-AUT-003 | 07 |
| **Rotas Legadas de Voice-Hub** | `src/bootstrap/routes.ts` (`/api/voice-hub`) | **DESCARTAR** | Módulo marcado como `unavailableLegacyModule`; substituir pelo conector ativo. | REQ-ENG-001 | 12 |
| **Rotas Legadas de Outbound** | `src/bootstrap/routes.ts` (`/api/outbound`) | **DESCARTAR** | Rotas legadas descontinuadas; substituídas pelas rotas de cadência oficial. | REQ-SLS-001 | 17 |
| **Testes de Contêiner k6 / DB** | `tests/integration/` / `load:k6` | **NÃO VERIFICADO** | Depende de Docker daemon ativo com portas 5434 e Redis levantados no ambiente. | Não Funcional | 14 |

---

## 3. Resumo Quantitativo das Decisões

- **Componentes PRESERVAR:** 62% da base de código (núcleo transacional, schemas, auth PHC, contratos OpenAPI).
- **Componentes CORRIGIR:** 28% da base de código (modularização de hotspots, redação de logs, N+1 em queries, CSS).
- **Componentes RECONSTRUIR:** 6% da base de código (mecanismo offline mobile SQLite, motor de dry-run simulado).
- **Componentes DESCARTAR:** 4% da base de código (stubs de rotas legadas e arquivos órfãos sem referências).
