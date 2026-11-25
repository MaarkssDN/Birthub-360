# Missão — Agente 37 · Suri
## UX Research e Onboarding Interativo

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 3 — Experiência  
**Base:** main  
**Branch:** agente/37-suri-onboarding-v2

---

## Objetivo

Criar fluxos passo-a-passo (Wizards), tours guiados pela interface e componentes de ativação de conta para maximizar o Time-to-Value (TTV) dos novos clientes e eliminar fricções no primeiro uso.

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)

---

## Arquivos sob sua Propriedade

- `src/features/onboarding/**` (onboarding existente)
- `src/features/onboarding/v2/**` (nova versão com feature flag)
- `src/components/onboarding/**` (componentes de onboarding)
- `src/components/onboarding/v2/**` (componentes v2)
- `.agents/runs/37-suri-onboarding-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/lib/motion.ts` (Agente 35 - Mia) — sistema de motion
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/components/states/**` (Agente 32 - Ema) — estados de UI

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Onboarding v2 coexistirá com v1 durante a transição
3. TTV (Time-to-Value) deve ser medido e otimizado
4. Wizards devem ser acessíveis e intuitivos
5. Checklists devem guiar o usuário de forma clara
6. Progress tracking deve ser implementado

---

## Plano de Execução

### Etapa 1: Auditoria de Onboarding Atual
1. Auditar `src/features/onboarding/**` existentes
2. Identificar fricções no primeiro uso
3. Analisar métricas de ativação
4. Mapear jornada do usuário
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Pesquisa de UX e Jornadas
1. Conduzir pesquisa com usuários (se possível)
2. Mapear jornadas de ativação
3. Identificar pontos de abandono
4. Definir métricas de sucesso (TTV, ativação)
5. **Verificar:** Pesquisa e jornada documentadas

### Etapa 3: Implementação de Wizards v2
1. Criar `src/features/onboarding/v2/` com novos wizards
2. Implementar wizard multi-step para setup inicial
3. Criar tour guiado pela interface
4. Implementar checklist de ativação
5. Otimizar para mobile
6. **Verificar:** Wizards v2 funcionais

### Etapa 4: Componentes de Ativação
1. Criar `src/components/onboarding/v2/` com novos componentes
2. Implementar progress indicators
3. Criar tooltips contextuais
4. Implementar modais de ajuda
5. **Verificar:** Componentes de ativação funcionais

### Etapa 5: Otimização de TTV
1. Implementar analytics de ativação
2. Criar A/B tests para onboarding
3. Otimizar fluxo para reduzir TTV
4. Implementar gamificação (se apropriado)
5. **Verificar:** TTV otimizado e medido

---

## Critérios de Verificação

### Onboarding
- [ ] Wizards multi-step funcionais
- [ ] Tours guiados implementados
- [ ] Checklists de ativação claros
- [ ] Progress tracking funcional
- [ ] Mobile-optimized

### UX
- [ ] TTV medido e otimizado
- [ ] Fricções eliminadas
- [ ] Jornada intuitiva
- [ ] Ajuda contextual disponível
- [ ] Feedback claro em cada etapa

### Acessibilidade
- [ ] Wizards acessíveis por teclado
- [ ] Screen reader compatibility
- [ ] Contraste adequado
- [ ] Foco visível
- [ ] ARIA labels corretos

### Feature Flags
- [ ] `design.newOnboarding` controla onboarding v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Onboarding v2 implementado com design premium
- [ ] TTV otimizado e medido
- [ ] Wizards e tours funcionais
- [ ] Checklists de ativação implementados
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] `npm run test:e2e` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/37-suri-onboarding-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 37 · Suri / ONDA-DESIGN-PREMIUM / Fase 3 / agente/37-suri-onboarding-v2

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
- `prototype` — Prototyping
- `ui-ux` — UI/UX guidelines
- `accessibility` — Acessibilidade
- `user-research` — UX Research
- `onboarding` — Onboarding patterns

---

## Dependências

- **Depende de:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2 concluídas)
- **Desbloqueia:** Nenhum (onboarding independente)
- **Bloqueado por:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fases 1 e 2 concluídas
