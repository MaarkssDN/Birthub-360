# Missão — Agente 31 · Noa
## App Shell, Navegação e Layout

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 2 — Estrutura  
**Base:** main  
**Branch:** agente/31-noa-navigation-v2

---

## Objetivo

Implementar a nova navegação e layout principal para o redesign premium. Sua responsabilidade é o container principal da aplicação web (src/App.tsx), menus laterais, barras superiores, rotas principais e alternadores de workspace/tenant. Garanta transições suaves sem re-renderizações desnecessárias da árvore de componentes.

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em features específicas (responsabilidade dos Agentes 36-38)

---

## Arquivos sob sua Propriedade

- `src/App.tsx` (container principal)
- `src/components/layout/**` (sidebar, header, navegação)
- `src/components/navigation/**` (menus, breadcrumbs)
- `src/App-v2.tsx` (nova versão com feature flag)
- `src/components/layout/v2/**` (componentes de layout v2)
- `.agents/runs/31-noa-navigation-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/lib/motion.ts` (Agente 35 - Mia) — sistema de motion
- `src/features/**` (Agentes 36-38) — telas específicas

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Nova navegação coexistirá com v1 durante a transição
3. Rotas existentes devem continuar funcionando
4. Navegação por teclado deve ser mantida
5. Performance de navegação não deve degradar
6. Transições devem ser suaves e acessíveis

---

## Plano de Execução

### Etapa 1: Auditoria de Navegação Atual
1. Auditar `src/App.tsx` e estrutura de rotas
2. Mapear componentes de layout existentes
3. Identificar pontos de re-renderização desnecessários
4. Verificar navegação por teclado e acessibilidade
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Implementação de Layout v2
1. Criar `src/components/layout/v2/` com novos componentes
2. Implementar Sidebar v2 (colapsável, responsiva)
3. Implementar Header v2 (breadcrumbs, ações, usuário)
4. Implementar navegação mobile (drawer, bottom nav)
5. Otimizar transições entre rotas
6. **Verificar:** Layout v2 funcional e responsivo

### Etapa 3: Implementação de App Shell v2
1. Criar `src/App-v2.tsx` com nova estrutura
2. Implementar feature flags para alternância v1/v2
3. Garantir compatibilidade com rotas existentes
4. Otimizar re-renders e performance
5. Implementar lazy loading de rotas
6. **Verificar:** App Shell v2 funcional com feature flags

### Etapa 4: Navegação e Acessibilidade
1. Implementar navegação por teclado
2. Garantir foco visível em todos os elementos
3. Implementar skip links
4. Validar screen reader compatibility
5. Testar com leitores de tela
6. **Verificar:** Navegação 100% acessível

### Etapa 5: Performance e Otimização
1. Medir performance de navegação
2. Otimizar re-renders desnecessários
3. Implementar code splitting para rotas
4. Validar em dispositivos mobile
5. **Verificar:** Performance mantida ou melhorada

---

## Critérios de Verificação

### Layout
- [ ] Sidebar v2: colapsável, responsiva, acessível
- [ ] Header v2: breadcrumbs, ações, usuário
- [ ] Navegação mobile: drawer, bottom nav
- [ ] Transições: suaves, acessíveis, performáticas

### Navegação
- [ ] Todas as rotas existentes funcionam
- [ ] Navegação por teclado: 100% funcional
- [ ] Foco visível: 2px outline ou equivalente
- [ ] Skip links: implementados
- [ ] Screen reader: compatibilidade testada

### Performance
- [ ] Re-renders otimizados
- [ ] Code splitting implementado
- [ ] Lazy loading de rotas
- [ ] Performance mantida ou melhorada
- [ ] Mobile: performance validada

### Feature Flags
- [ ] `design.newNavigation` controla layout v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Layout v2 implementado e funcional
- [ ] Navegação acessível e performática
- [ ] Feature flags implementadas e testadas
- [ ] Todas as rotas existentes funcionam
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] `npm run test:e2e` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/31-noa-navigation-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 31 · Noa / ONDA-DESIGN-PREMIUM / Fase 2 / agente/31-noa-navigation-v2

Suposições feitas:
- [listar suposições]

Plano executado:
- Etapa 1 → critério → resultado
- Etapa 2 → critério → resultado
- Etapa 3 → critério → resultado
- Etapa 4 → critério → resultado
- Etapa 5 → critério → resultado

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
- `ui-ux` — UI/UX guidelines
- `accessibility` — Acessibilidade
- `performance` — Performance optimization
- `vercel-react-best-practices` — React best practices

---

## Dependências

- **Depende de:** Agentes 33, 34, 35 (Fase 1 concluída)
- **Desbloqueia:** Agentes 32, 36, 37, 38 (podem usar layout v2)
- **Bloqueado por:** Agentes 33, 34, 35 (Fase 1)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fase 1 concluída
