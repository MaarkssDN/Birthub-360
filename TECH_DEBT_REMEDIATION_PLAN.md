# Plano de Correção de Tech Debt - BirthHub 360

**Data de Criação:** 2026-09-29  
**Baseado em:** BirthHub360-TechDebt-Data-20260929-120403.json  
**Health Index Atual:** 96  
**Total Findings:** 5,505

## Resumo Executivo

| Severidade | Quantidade | Prioridade de Ação |
|------------|-----------|-------------------|
| P0 (Crítico) | 0 | - |
| P1 (Alto Risco) | 215 | **IMEDIATA** |
| P2 (Relevante) | 3,371 | CURTO PRAZO |
| P3 (Manutenção) | 1,918 | MÉDIO PRAZO |
| P4 (Baixa Urgência) | 1 | BAIXA PRIORIDADE |

## Estratégia de Correção

### Fase 1: Crítica (P1) - Imediata
**Objetivo:** Eliminar riscos de segurança, perda de dados e problemas arquiteturais críticos.

#### 1.1 Security (188 findings P1)
**Tempo Estimado:** 2-3 dias  
**Responsável:** Agente 15 (Segurança Aplicada) + Agente 01 (Plataforma/Segurança)

##### 1.1.1 Arquivos Sensíveis no Working Tree (9 findings)
**IDs:** DEBT-5145, DEBT-5147, DEBT-5148, DEBT-5149, DEBT-5150, DEBT-5151, DEBT-5152, DEBT-5153, DEBT-5154, DEBT-5146

**Arquivos:**
- `.env.test` (raiz e em `.gate-backups/*/`)
- `.npmrc`

**Ação:**
1. Verificar se `.env.test` contém segredos reais
2. Se contiver segredos: rotacionar imediatamente
3. Remover do git e adicionar ao `.gitignore`
4. Criar `.env.test.example` como template
5. Limpar backups em `.gate-backups/` que contenham arquivos sensíveis
6. Verificar `.npmrc` - se contiver tokens, mover para secret manager

##### 1.1.2 Segredos Hardcoded (Múltiplos findings)
**IDs Amostra:** DEBT-1261, DEBT-0041, DEBT-1299, DEBT-1288, DEBT-1375, DEBT-1465, DEBT-1734

**Arquivos:**
- `docs/security/runbooks/ROTATE_GEMINI_API_KEY.md` (linha 22)
- `litellm-config.yaml` (linha 41)
- `prisma/migrations/20260802220000_google_workspace_connection/migration.sql` (linha 2)
- `prisma/schema.prisma` (linha 2577)
- `scripts/create-user-marcelin.ts` (linha 9)
- `scripts/qa-sweep-mobile.ts` (linha 4)
- `scripts/test/prepare-integration-env.js` (linha 37)

**Ação:**
1. Para cada segredo encontrado:
   - Identificar se é segredo real ou mock de teste
   - Se real: rotacionar imediatamente
   - Se mock: documentar explicitamente como "MOCK ONLY - NOT A REAL SECRET"
   - Mover segredos reais para secret manager (Devin Cloud ou equivalente)
   - Substituir por referências a environment variables
2. Revisar documentação de incidentes (SEC-2026-001) para verificar se há segredos históricos expostos

##### 1.1.3 Eval/Dynamic Code (Múltiplos findings)
**IDs:** DEBT-1030, DEBT-1031, DEBT-1687, DEBT-1688

**Arquivos:**
- `agente-codigo-local/src/components/TerminalDrawer.tsx` (linhas 169, 184)
- `scripts/pwa/verify-precache.ts` (linhas 52, 54)

**Ação:**
1. Revisar cada uso de `new Function()` / `eval()`
2. Se for código de teste/verificação isolado: documentar com comentário de segurança
3. Se for código de produção: eliminar ou encapsular em sandbox validado
4. Para `TerminalDrawer.tsx`: considerar se este é código de desenvolvimento apenas
5. Para `verify-precache.ts`: validar que a entrada é controlada e não vem de usuário

#### 1.2 Database (16 findings P1)
**Tempo Estimado:** 1-2 dias  
**Responsável:** Agente 01A (Confiabilidade de Dados) + Agente 15 (Segurança Aplicada)

##### 1.2.1 Migrations Potencialmente Destrutivas
**IDs:** DEBT-5127 a DEBT-5142

**Migrations Afetadas:**
- `20260717141021_add_lead_enrichment` - ALTER TABLE "User" DROP
- `20260717183411_sprint3_5_enums_and_cleanup` - ALTER TABLE "Activity" ALTER COLUMN "type" DROP
- `20260720235926_sync_accumulated_schema_drift` - ALTER TABLE "User" DROP
- `20260721113210_user_passwordhash_optional` - ALTER TABLE "user" ALTER COLUMN "passwordHash" DROP
- `20260804203000_bitrix_sync_rule_lead_source` - ALTER TABLE "BitrixSyncRule" ALTER COLUMN "categoryId" DROP
- `20260805220000_two_funnels_and_bitrix_fields` - ALTER TABLE "public"."Lead" ALTER COLUMN "status" DROP
- `20260810130000_remove_knowledge_document` - DROP TABLE
- `20260817134959_onda11_db_cleanup` - ALTER TABLE "CallSuppression" DROP
- `20260827200000_drop_dead_ai_governance_models` - DROP TABLE
- `20260828040000_drop_contact_pii_hash_dec01_superseded` - DROP COLUMN
- `20260908020000_multi_cargo_agent_governance_foundation` - DROP TABLE
- `20260908090000_public_booking_link_create_and_rls` - DROP TABLE
- `20260909131444_saved_view` - DROP TABLE
- `20260913000100_notes_cross_entity_and_attachments` - ALTER TABLE "Company" DROP
- `20260918151000_remove_legacy_nba_shadow_domain` - DROP TABLE

**Ação:**
1. Para cada migration com DROP:
   - Verificar se já foi aplicada em produção
   - Se sim: documentar que não pode ser revertida sem backup
   - Se não: considerar usar expand/contract pattern
   - Documentar backup existente antes da migration
   - Verificar se há rollback migration correspondente
2. Criar documento de "Migration Safety Checklist" para futuras migrations
3. Adicionar handoff para Agente 01A sobre necessidade de revisão de migrations

#### 1.3 Architecture (11 findings P1)
**Tempo Estimado:** 5-7 dias  
**Responsável:** Agente 00 (Coordenador) + Agente correspondente por feature

##### 1.3.1 Arquivos Monolíticos/Hotspots
**IDs:** DEBT-5156, DEBT-5157, DEBT-5159, DEBT-5165, DEBT-5168, DEBT-5172, DEBT-5175, DEBT-5190, DEBT-5194, DEBT-5197, DEBT-5200

**Arquivos e Linhas:**
1. `.agents/skills/impeccable/scripts/live-browser.js` - 12,990 linhas
2. `.claude/skills/impeccable/scripts/live-browser.js` - 12,990 linhas (DUPLICADO)
3. `public/design-lab/assets/audit-data.js` - 4,754 linhas
4. `src/features/prospecting/outbound/server/routes.ts` - 3,614 linhas
5. `src/features/prospecting/outbound/components/LeadCard.tsx` - 2,451 linhas
6. `scripts/agent-import/source-prompts.ts` - 2,122 linhas
7. `src/features/voice-hub/pages/Landing.tsx` - 2,111 linhas
8. `src/features/commercial-intelligence/components/JoaoReisDiagnosticHub.tsx` - 1,751 linhas
9. `src/features/voice-hub/store/useStudioStore.ts` - 1,743 linhas
10. `src/features/cadence/components/CadenceHub.tsx` - 1,668 linhas
11. `agente-codigo-local/src/App.tsx` - 1,660 linhas

**Ação por Arquivo:**

**Imediato (Alto Impacto):**
1. **live-browser.js (duplicado)**: Eliminar duplicata, manter apenas em `.agents/` ou `.claude/`
2. **routes.ts (3,614 linhas)**: Decompor por feature/router
3. **LeadCard.tsx (2,451 linhas)**: Extrair subcomponentes (LeadActions, LeadInfo, LeadEnrichment, etc.)

**Curto Prazo (Médio Impacto):**
4. **audit-data.js (4,754 linhas)**: Se for dado estático, mover para JSON/CSV e carregar dinamicamente
5. **source-prompts.ts (2,122 linhas)**: Decompor por agente/fase
6. **Landing.tsx (2,111 linhas)**: Extrair seções em componentes separados
7. **JoaoReisDiagnosticHub.tsx (1,751 linhas)**: Separar lógica de diagnóstico de UI
8. **useStudioStore.ts (1,743 linhas)**: Dividir por domínio (audio, workflow, state)
9. **CadenceHub.tsx (1,668 linhas)**: Extrair CadenceList, CadenceEditor, CadencePreview
10. **App.tsx (1,660 linhas)**: Extrair routing, layout providers em arquivos separados

### Fase 2: Relevante (P2) - Curto Prazo
**Objetivo:** Reduzir dívida técnica que afeta qualidade e manutenibilidade.

#### 2.1 TypeScript Quality (1,819 findings P2)
**Tempo Estimado:** 3-5 dias  
**Responsável:** Agente 01 (Plataforma/Segurança)

**Ações Principais:**
1. Habilitar strict mode no TypeScript se não estiver ativo
2. Eliminar `any` types não justificados
3. Adicionar tipos faltantes em interfaces
4. Corrigir erros de tipo apontados pelo compilador
5. Adicionar tipos para response de APIs externas

#### 2.2 Database (742 findings P2)
**Tempo Estimado:** 2-3 dias  
**Responsável:** Agente 01A (Confiabilidade de Dados)

**Ações Principais:**
1. Revisar índices faltantes
2. Adicionar foreign keys onde aplicável
3. Revisar nulabilidade de campos
4. Adicionar constraints de validação
5. Otimizar queries N+1

#### 2.3 API & Backend (126 findings P2)
**Tempo Estimado:** 2-3 dias  
**Responsável:** Agente 01 (Plataforma/Segurança)

**Ações Principais:**
1. Adicionar validação Zod em todas as rotas
2. Padronizar error handling
3. Adicionar rate limiting onde faltar
4. Documentar contratos de API
5. Revisar autenticação/autorização em rotas sensíveis

#### 2.4 Privacy & Data Governance (278 findings P2)
**Tempo Estimado:** 2-3 dias  
**Responsável:** Agente 01 (Plataforma/Segurança) + Agente 15 (Segurança Aplicada)

**Ações Principais:**
1. Implementar retenção de dados LGPD
2. Adicionar mecanismo de exclusão de dados
3. Sanitizar logs de PII
4. Revisar permissões de acesso a dados sensíveis
5. Documentar base legal para cada tipo de dado

#### 2.5 Performance (182 findings P2)
**Tempo Estimado:** 2-3 dias  
**Responsável:** Agente 10 (Infraestrutura/Observabilidade)

**Ações Principais:**
1. Adicionar lazy loading em componentes pesados
2. Otimizar bundle size
3. Revisar queries lentas
4. Adicionar cache onde aplicável
5. Revisar animações contínuas

### Fase 3: Manutenção (P3) - Médio Prazo
**Objetivo:** Melhorar maintainability e reduzir technical debt acumulado.

#### 3.1 Backlog & Maintainability (958 findings P3)
**Tempo Estimado:** 5-7 dias  
**Responsável:** Agente 02 (Produto/UX) + Agente 08 (QA/Release)

**Ações Principais:**
1. Revisar TODOs/FIXMEs obsoletos
2. Remover código morto
3. Consolidar comentários
4. Padronizar nomenclatura
5. Documentar complexidade de negócio

#### 3.2 API & Backend (456 findings P3)
**Tempo Estimado:** 3-4 dias  
**Responsável:** Agente 01 (Plataforma/Segurança)

**Ações Principais:**
1. Refatorar controllers
2. Extrair lógica de negócio para services
3. Padronizar response format
4. Adicionar swagger/OpenAPI
5. Melhorar test coverage

#### 3.3 Observability (23 findings P3)
**Tempo Estimado:** 1-2 dias  
**Responsável:** Agente 10 (Infraestrutura/Observabilidade)

**Ações Principais:**
1. Adicionar métricas onde faltar
2. Melhorar logs estruturados
3. Adicionar tracing distribuído
4. Criar dashboards de monitoramento
5. Configurar alertas

## Checklist de Execução

Use o arquivo `tech-debt-checklist.html` para rastrear o progresso de cada item.

## Prompts de Execução

Use o arquivo `tech-debt-prompts.md` para obter prompts detalhados para cada categoria de correção.

## Cronograma Sugerido

**Semana 1:** Fase 1.1 (Security) + Fase 1.2 (Database)  
**Semana 2:** Fase 1.3 (Architecture - Imediato)  
**Semana 3:** Fase 1.3 (Architecture - Curto Prazo) + Início Fase 2.1  
**Semana 4:** Fase 2.2 a 2.5  
**Semana 5-6:** Fase 3 (Manutenção)

## Riscos e Mitigações

### Risco 1: Mudanças em migrations podem quebrar produção
**Mitigação:** Revisar migrations com Agente 01A antes de qualquer alteração. Ter backup de produção pronto.

### Risco 2: Refatoração de arquivos monolíticos pode introduzir bugs
**Mitigação:** Testes extensivos antes e depois da refatoração. Commits pequenos e reversíveis.

### Risco 3: Rotação de segredos pode quebrar integrações
**Mitigação:** Coordenar com Agente 06 (Integrações) para atualizar credenciais em todos os sistemas.

## Métricas de Sucesso

- Health Index: 96 → 98+
- P1 findings: 215 → 0
- P2 findings: 3,371 → < 500
- P3 findings: 1,918 → < 1,000
- Zero segredos hardcoded no código
- Zero migrations sem validação de segurança
- Zero arquivos > 2,000 linhas (exceto dados/gerados)

## Handoffs Necessários

1. **Agente 00 → Agente 15:** Priorização de security findings
2. **Agente 00 → Agente 01A:** Revisão de migrations destrutivas
3. **Agente 00 → Agente 06:** Coordenação de rotação de credenciais
4. **Agente 00 → Agente 10:** Implementação de observability
5. **Agente 00 → Agente 02:** Revisão de backlog de manutenção

## Próximos Passos

1. Revisar este plano com todos os agentes relevantes
2. Ajustar prioridades conforme disponibilidade
3. Iniciar execução pela Fase 1.1 (Security)
4. Atualizar checklist HTML conforme itens são completados
5. Gerar relatório de progresso semanal
