# Plano de Orquestração — Squad 30 · Redesign Premium (Incremental com Feature Flags)
**Data:** 2026-11-24  
**Coordenador:** Agente 00 (Astra)  
**Objetivo:** Elevar todas as telas da plataforma para design sofisticado, premium e elegante, eliminando estética genérica de SaaS de IA.
**Abordagem:** Incremental com feature flags para rollback seguro.

---

## 1. Estratégia de Implementação Incremental

### Princípios
1. **Feature Flags:** Cada fase implementada atrás de feature flag
2. **Rollback Imediato:** Capacidade de reverter qualquer fase em <5 minutos
3. **Testes Contínuos:** E2E tests executados antes/depois de cada fase
4. **Validação Visual:** Screenshots comparativos para cada tela
5. **Auditoria Independente:** Agente 09 (Silas) valida cada entrega

### Feature Flags Propostas
```typescript
// src/config/feature-flags.ts
export const DESIGN_REDESIGN_FLAGS = {
  // Fase 1: Fundação
  NEW_TOKENS: 'design.newTokens',
  NEW_COMPONENTS: 'design.newComponents',
  
  // Fase 2: Estrutura
  NEW_NAVIGATION: 'design.newNavigation',
  NEW_UI_STATES: 'design.newUIStates',
  
  // Fase 3: Experiência
  NEW_LANDING: 'design.newLanding',
  NEW_ONBOARDING: 'design.newOnboarding',
  NEW_DASHBOARDS: 'design.newDashboards',
  
  // Fase 4: Marca
  NEW_BRAND_ASSETS: 'design.newBrandAssets',
  
  // Global
  DESIGN_V2_ENABLED: 'design.v2Enabled',
} as const;
```

---

## 2. Fases de Execução Incremental

### Fase 1: Fundação (Agentes 33, 34, 35)
**Duração:** 3-4 dias  
**Feature Flag:** `design.newTokens`, `design.newComponents`

**Agente 33 — Célia:**
- Criar novos tokens de design (cores, espaçamento, tipografia)
- Implementar componentes base atualizados
- Manter compatibilidade com tokens antigos
- **Entregável:** `src/styles/design-v2.css`, `src/components/ui/v2/**`

**Agente 34 — Ari:**
- Auditar acessibilidade dos novos componentes
- Implementar correções WCAG 2.2 AA
- Validar contraste e navegação por teclado
- **Entregável:** Correções de acessibilidade, testes axe-core

**Agente 35 — Mia:**
- Implementar sistema de motion v2
- Otimizar animações para 60fps
- Garantir `prefers-reduced-motion`
- **Entregável:** `src/lib/motion-v2.ts`, animações otimizadas

**Critério de Sucesso:**
- [ ] Novos tokens implementados sem quebrar existentes
- [ ] Componentes v2 funcionam em paralelo com v1
- [ ] Feature flag permite alternância instantânea
- [ ] Testes E2E passam com flag ON e OFF

---

### Fase 2: Estrutura (Agentes 31, 32)
**Duração:** 3-4 dias  
**Feature Flag:** `design.newNavigation`, `design.newUIStates`
**Dependência:** Fase 1 concluída e validada

**Agente 31 — Noa:**
- Implementar nova navegação (sidebar, breadcrumbs)
- Otimizar layout principal
- Manter compatibilidade com rotas existentes
- **Entregável:** `src/components/layout/v2/**`, `src/App-v2.tsx`

**Agente 32 — Ema:**
- Implementar estados de UI v2 (loading, empty, error, stale)
- Criar skeleton loaders consistentes
- Implementar empty states acionáveis
- **Entregável:** `src/components/states/v2/**`

**Critério de Sucesso:**
- [ ] Nova navegação funciona sem quebrar rotas
- [ ] Estados de UI v2 implementados em telas piloto
- [ ] Feature flag permite rollback instantâneo
- [ ] Testes de navegação passam

---

### Fase 3: Experiência (Agentes 36, 37, 38)
**Duração:** 4-5 dias  
**Feature Flag:** `design.newLanding`, `design.newOnboarding`, `design.newDashboards`
**Dependência:** Fases 1 e 2 concluídas

**Agente 36 — Léo:**
- Redesenhar landing pages com design premium
- Otimizar SEO e performance
- Implementar atrás de feature flag
- **Entregável:** `src/features/landing/v2/**`

**Agente 37 — Suri:**
- Criar/otimizar wizards de onboarding v2
- Implementar checklists de ativação
- Reduzir fricção no primeiro uso
- **Entregável:** `src/features/onboarding/v2/**`

**Agente 38 — Nara:**
- Revisar dashboards com novo design system
- Otimizar gráficos e KPIs
- Implementar visualizações premium
- **Entregável:** `src/features/dashboard/v2/**`, `src/components/charts/v2/**`

**Critério de Sucesso:**
- [ ] Landing pages v2 com SEO otimizado
- [ ] Onboarding v2 com TTV melhorado
- [ ] Dashboards v2 com visualização premium
- [ ] Feature flags permitem rollback por página

---

### Fase 4: Marca e Documentação (Agente 39)
**Duração:** 1-2 dias  
**Feature Flag:** `design.newBrandAssets`
**Dependência:** Fases 1-3 concluídas

**Agente 39 — Tina:**
- Atualizar assets de marca
- Manter documentação atualizada
- Validar consistência visual
- **Entregável:** `identidade-visual/v2/**`, `documentacao-aplicacao/v2/**`

**Critério de Sucesso:**
- [ ] Assets de marca atualizados
- [ ] Documentação reflete novo design
- [ ] Consistência visual validada

---

### Fase 5: Rollout Gradual e QA (Agentes 01-09)
**Duração:** 3-4 dias  
**Dependência:** Todas as fases anteriores

**Estratégia de Rollout:**
1. **Semanas 1-2:** 10% dos usuários (beta testers)
2. **Semanas 3-4:** 50% dos usuários (rollout gradual)
3. **Semana 5:** 100% dos usuários (rollout completo)

**Agente 01 — Ória:**
- Definir critérios de aceite para cada fase
- Monitorar métricas de adoção
- Validar Definition of Done

**Agente 05 — Luma:**
- Executar testes E2E em produção
- Monitorar erros e performance
- Validar fluxos críticos

**Agente 09 — Silas:**
- Auditoria independente de cada fase
- Emitir parecer APROVADO/REPROVADO/BLOQUEADO
- Validar segurança e acessibilidade

**Critério de Sucesso:**
- [ ] 10% rollout sem erros críticos
- [ ] 50% rollout com métricas estáveis
- [ ] 100% rollout com aprovação do Silas
- [ ] Feature flags removidas após validação

---

## 3. Matriz de Feature Flags

| Flag | Descrição | Fase | Rollback |
|------|-----------|------|----------|
| `design.newTokens` | Novos tokens de design | 1 | Instantâneo |
| `design.newComponents` | Componentes UI v2 | 1 | Instantâneo |
| `design.newNavigation` | Nova navegação | 2 | Instantâneo |
| `design.newUIStates` | Estados de UI v2 | 2 | Instantâneo |
| `design.newLanding` | Landing pages v2 | 3 | Por página |
| `design.newOnboarding` | Onboarding v2 | 3 | Por fluxo |
| `design.newDashboards` | Dashboards v2 | 3 | Por dashboard |
| `design.newBrandAssets` | Assets de marca v2 | 4 | Instantâneo |
| `design.v2Enabled` | Flag global v2 | Todas | Instantâneo |

---

## 4. Plano de Rollback

### Rollback Imediato (<5 minutos)
1. Desabilitar feature flag `design.v2Enabled`
2. Todas as telas voltam para v1 automaticamente
3. Sem necessidade de deploy ou restart

### Rollback por Fase
1. Desabilitar flags específicas da fase
2. Manter outras fases ativas
3. Permite rollback granular

### Rollback Completo
1. Desabilitar todas as flags de design
2. Reverter commits se necessário
3. Restaurar backup de banco se houver migração

---

## 5. Métricas de Sucesso

### Técnicas
- [ ] Typecheck passa (`npx tsc --noEmit`)
- [ ] Lint passa (`npm run lint`)
- [ ] Testes unitários passam (`npm run test:unit`)
- [ ] Testes de integração passam (`npm run test:integration`)
- [ ] Testes E2E passam (`npm run test:e2e`)
- [ ] Build passa (`npm run build`)

### Visuais
- [ ] Nenhuma tela parece template genérico
- [ ] Tipografia consistente e hierarquia clara
- [ ] Cores usadas com significado
- [ ] Motion com propósito e acessível

### Funcionais
- [ ] Todas as rotas funcionam
- [ ] Navegação por teclado funciona
- [ ] Estados de UI completos
- [ ] Acessibilidade WCAG 2.2 AA
- [ ] Performance mantida (Lighthouse >90)

### Negócio
- [ ] Time-to-Value (TTV) melhorado
- [ ] Taxa de conversão mantida ou melhorada
- [ ] Satisfação do usuário (NPS) mantida ou melhorada
- [ ] Zero erros críticos em produção

---

## 6. Handoffs Necessários

### Para Squad 40 (CRM)
- **Agente 40 (Ravi):** Coordenar mudanças em componentes CRM
- **Agentes 41-49:** Validar telas de CRM com novo design

### Para Squad 50 (Integrações)
- **Agente 50 (Atlas):** Coordenar mudanças em telas de integração
- **Agentes 51-59:** Validar estado de sync com novo design

### Para Squad 60 (Voz/Omnichannel)
- **Agente 60 (Aurora):** Coordenar mudanças em Voice Hub
- **Agente 65 (Lena):** Validar Voice Hub UI com novo design

### Para Squad 70 (IA)
- **Agente 70 (Orion):** Coordenar mudanças em telas de IA
- **Agentes 71-79:** Validar copiloto e automações com novo design

---

## 7. Timeline Atualizado

| Fase | Duração | Data Estimada |
|------|---------|---------------|
| Fase 1: Fundação | 3-4 dias | 2026-11-25 a 2026-11-28 |
| Fase 2: Estrutura | 3-4 dias | 2026-11-29 a 2026-12-02 |
| Fase 3: Experiência | 4-5 dias | 2026-12-03 a 2026-12-07 |
| Fase 4: Marca | 1-2 dias | 2026-12-08 a 2026-12-09 |
| Fase 5: Rollout | 3-4 dias | 2026-12-10 a 2026-12-13 |
| **Total** | **14-19 dias** | **2026-11-25 a 2026-12-13** |

---

## 8. Aprovação

Este plano requer aprovação do usuário antes da execução.

**Vantagens da abordagem incremental:**
- ✅ Zero risco de quebra total
- ✅ Rollback instantâneo
- ✅ Validação contínua
- ✅ Menor pressão de prazo
- ✅ Aprendizado iterativo

**Desvantagens:**
- ⏱️ Mais lento que redesign completo
- 🔄 Necessidade de manter duas versões temporariamente
- 📊 Mais complexidade de feature flags

**Recomendação:** Aprovar abordagem incremental para minimizar riscos.
