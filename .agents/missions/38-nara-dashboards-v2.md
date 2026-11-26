# Missão — Agente 38 · Nara
## Dashboards e Visualização de Dados

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 3 — Experiência  
**Base:** main  
**Branch:** agente/38-nara-dashboards-v2

---

## Objetivo

Transformar indicadores operacionais e financeiros em cartões de KPI, gráficos de rosca, barras e linhas responsivas usando Recharts/Visx, com tooltip interativo e exportação visual.

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)
- Backend de dados (responsabilidade de outros agentes)

---

## Arquivos sob sua Propriedade

- `src/features/dashboard/**` (dashboards existentes)
- `src/features/dashboard/v2/**` (nova versão com feature flag)
- `src/components/charts/**` (componentes de gráficos)
- `src/components/charts/v2/**` (componentes de gráficos v2)
- `src/components/kpi/**` (componentes de KPI)
- `src/components/kpi/v2/**` (componentes de KPI v2)
- `.agents/runs/38-nara-dashboards-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/lib/motion.ts` (Agente 35 - Mia) — sistema de motion
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/components/states/**` (Agente 32 - Ema) — estados de UI
- APIs de dados (outros agentes) — dados para visualização

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Dashboards v2 coexistirão com v1 durante a transição
3. Dados devem ser reais (não fabricados)
4. Gráficos devem ser acessíveis (screen reader, keyboard)
5. Performance de gráficos deve ser otimizada
6. Responsividade mobile é obrigatória

---

## Plano de Execução

### Etapa 1: Auditoria de Dashboards Atual
1. Auditar `src/features/dashboard/**` existentes
2. Identificar problemas de visualização
3. Verificar performance de gráficos
4. Analisar métricas de uso
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Definição de Hierarquia de Dados
1. Definir hierarquia de KPIs (métrica, diagnóstico, tendência, ação)
2. Identificar dados mais importantes
3. Definir layouts otimizados para cada dashboard
4. Criar wireframes e mockups
5. **Verificar:** Hierarquia de dados aprovada pelo Agente 30

### Etapa 3: Implementação de Componentes de Gráficos v2
1. Criar `src/components/charts/v2/` com novos componentes
2. Implementar gráficos de linha (Recharts)
3. Implementar gráficos de barra
4. Implementar gráficos de rosca
5. Implementar tooltips interativos
6. **Verificar:** Componentes de gráficos funcionais

### Etapa 4: Implementação de KPIs v2
1. Criar `src/components/kpi/v2/` com novos componentes
2. Implementar cards de KPI com hierarquia clara
3. Criar indicadores de tendência
4. Implementar comparações temporais
5. **Verificar:** Componentes de KPI funcionais

### Etapa 5: Implementação de Dashboards v2
1. Criar `src/features/dashboard/v2/` com novos dashboards
2. Implementar dashboard principal
3. Criar dashboards especializados (CRM, Vendas, Operações)
4. Implementar filtros e controles
5. Otimizar para mobile
6. **Verificar:** Dashboards v2 funcionais

### Etapa 6: Acessibilidade e Performance
1. Implementar aria-labels para gráficos
2. Criar tabelas alternativas para screen readers
3. Otimizar performance de renderização
4. Implementar lazy loading de gráficos
5. Validar em dispositivos mobile
6. **Verificar:** Acessibilidade e performance validadas

---

## Critérios de Verificação

### Visualização de Dados
- [ ] KPIs com hierarquia clara (métrica, diagnóstico, tendência, ação)
- [ ] Gráficos responsivos e interativos
- [ ] Tooltips informativos
- [ ] Cores semânticas (sucesso, erro, warning)
- [ ] Dados reais (não fabricados)

### Acessibilidade
- [ ] Gráficos com aria-labels
- [ ] Tabelas alternativas para screen readers
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Screen reader compatibility

### Performance
- [ ] Gráficos otimizados (60fps)
- [ ] Lazy loading implementado
- [ ] Bundle size otimizado
- [ ] Mobile performance validada
- [ ] Tempo de renderização <2s

### Feature Flags
- [ ] `design.newDashboards` controla dashboards v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Dashboards v2 implementados com design premium
- [ ] KPIs e gráficos funcionais e acessíveis
- [ ] Performance otimizada
- [ ] Dados reais e precisos
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] `npm run test:e2e` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/38-nara-dashboards-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 38 · Nara / ONDA-DESIGN-PREMIUM / Fase 3 / agente/38-nara-dashboards-v2

Suposições feitas:
- [listar suposições]

Plano executado:
- Etapa 1 → critério → resultado
- Etapa 2 → critério → resultado
- Etapa 3 → critério → resultado
- Etapa 4 → critério → resultado
- Etapa 5 → critério → resultado
- Etapa 6 → critério → resultado

Arquivos alterados:
- [listar arquivos]

Comandos executados:
- comando → resultado

Testes:
- [resultados dos testes]

Evidências:
- [screenshots, logs, pareceres]

Problemas fora do escopo:
- [listar problemas]

Handoffs abertos:
- [listar handoffs]

Aprendizados reutilizáveis:
- [listar aprendizados]

Pendências:
- [listar pendências]

Riscos:
- [listar riscos]
```

---

## Skills Recomendadas

- `birthhub-ui-ux-pro-max` — UX intelligence
- `chart-render-tests` — Chart testing
- `recharts` — Recharts specific
- `accessibility` — Acessibilidade
- `performance` — Performance optimization
- `data-visualization` — Data visualization

---

## Dependências

- **Depende de:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2 concluídas)
- **Desbloqueia:** Nenhum (dashboards independentes)
- **Bloqueado por:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2)
- **Requer:** APIs de dados (outros agentes)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fases 1 e 2 concluídas
