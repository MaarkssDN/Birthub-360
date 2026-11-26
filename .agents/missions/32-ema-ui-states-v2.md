# Missão — Agente 32 · Ema
## Arquitetura de Informação e Estados de UI

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 2 — Estrutura  
**Base:** main  
**Branch:** agente/32-ema-ui-states-v2

---

## Objetivo

Garantir que 100% das telas apresentem os 4 estados essenciais: Carregamento (Skeleton Loaders), Vazio (Empty States acionáveis), Erro (com opção de retry) e Dados Obsoletos (Stale Data feedback).

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)

---

## Arquivos sob sua Propriedade

- `src/components/states/**` (componentes de estados)
- `src/components/states/v2/**` (componentes de estados v2)
- `src/components/feedback/**` (feedback de loading, error)
- `src/hooks/use-ui-state.ts` (hook de estados)
- `.agents/runs/32-ema-ui-states-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/features/**` (Agentes 36-38) — telas específicas

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Estados v2 coexistirão com v1 durante a transição
3. Todos os estados devem ser acessíveis
4. Empty states devem ser acionáveis
5. Error states devem ter opção de retry
6. Stale data deve ter feedback visual claro

---

## Plano de Execução

### Etapa 1: Auditoria de Estados de UI Atual
1. Auditar estados existentes em todas as telas
2. Identificar telas sem estados obrigatórios
3. Mapear componentes de loading, empty, error, stale
4. Verificar acessibilidade dos estados
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Implementação de Skeleton Loaders v2
1. Criar `src/components/states/v2/Skeleton.tsx`
2. Implementar variantes de skeleton (card, list, table, form)
3. Otimizar para performance (shimmer, pulse)
4. Garantir acessibilidade (aria-busy, aria-label)
5. **Verificar:** Skeleton loaders funcionais e acessíveis

### Etapa 3: Implementação de Empty States v2
1. Criar `src/components/states/v2/EmptyState.tsx`
2. Implementar variantes (no data, no results, no permission)
3. Criar CTAs acionáveis para cada estado
4. Incluir ilustrações e ícones apropriados
5. **Verificar:** Empty states acionáveis e acessíveis

### Etapa 4: Implementação de Error States v2
1. Criar `src/components/states/v2/ErrorState.tsx`
2. Implementar variantes (network error, server error, validation)
3. Criar opção de retry funcional
4. Incluir mensagens de erro claras
5. **Verificar:** Error states com retry funcional

### Etapa 5: Implementação de Stale Data Feedback
1. Criar `src/components/states/v2/StaleDataIndicator.tsx`
2. Implementar indicador visual de dados obsoletos
3. Criar opção de refresh manual
4. Implementar auto-refresh quando apropriado
5. **Verificar:** Stale data feedback funcional

### Etapa 6: Hook de Estados de UI
1. Criar `src/hooks/use-ui-state.ts`
2. Implementar lógica de transição entre estados
3. Garantir consistência em toda a aplicação
4. Otimizar performance de transições
5. **Verificar:** Hook funcional e performático

---

## Critérios de Verificação

### Estados Obrigatórios
- [ ] Loading: skeleton loaders em todas as telas
- [ ] Empty: empty states acionáveis em todas as telas
- [ ] Error: error states com retry em todas as telas
- [ ] Stale: feedback de dados obsoletos onde aplicável

### Acessibilidade
- [ ] Skeleton loaders: aria-busy, aria-label
- [ ] Empty states: headings, descriptions, CTAs
- [ ] Error states: role="alert", aria-live
- [ ] Stale data: aria-label descritivo
- [ ] Navegação por teclado: 100% funcional

### UX
- [ ] Empty states: CTAs claros e acionáveis
- [ ] Error states: mensagens claras e retry funcional
- [ ] Stale data: feedback visual e refresh manual
- [ ] Transições: suaves e não intrusivas

### Feature Flags
- [ ] `design.newUIStates` controla estados v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Estados v2 implementados em todas as telas piloto
- [ ] Todos os estados acessíveis
- [ ] Empty states acionáveis
- [ ] Error states com retry funcional
- [ ] Stale data feedback implementado
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/32-ema-ui-states-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 32 · Ema / ONDA-DESIGN-PREMIUM / Fase 2 / agente/32-ema-ui-states-v2

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
- `error-resilience` — Error handling
- `accessibility` — Acessibilidade
- `ui-ux` — UI/UX guidelines
- `prototype` — Prototyping states

---

## Dependências

- **Depende de:** Agentes 33, 34, 35 (Fase 1 concluída)
- **Desbloqueia:** Agentes 36, 37, 38 (podem usar estados v2)
- **Bloqueado por:** Agentes 33, 34, 35 (Fase 1)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fase 1 concluída
