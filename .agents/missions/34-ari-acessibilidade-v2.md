# Missão — Agente 34 · Ari
## Acessibilidade WCAG 2.2 AA

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 1 — Fundação  
**Base:** main  
**Branch:** agente/34-ari-acessibilidade-v2

---

## Objetivo

Auditar e corrigir componentes para garantir compliance total com WCAG 2.2 AA durante o redesign premium. Garanta navegação 100% via teclado, ordenação lógica de tabulação, atributos aria-* corretos e razão de contraste adequada em elementos de texto.

---

## Fora de Escopo

- Implementação de novos componentes (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)

---

## Arquivos sob sua Propriedade

- `src/components/**` (correções de acessibilidade)
- `src/styles/**` (ajustes de contraste)
- `.agents/runs/34-ari-acessibilidade-v2.md` (relatório de execução)
- Testes de acessibilidade

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/features/**` (Agentes 36-38) — telas específicas

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Novos componentes v2 precisam ser acessíveis desde o início
3. Componentes existentes precisam manter acessibilidade durante transição
4. WCAG 2.2 AA é o padrão mínimo obrigatório
5. Testes axe-core serão executados em CI

---

## Plano de Execução

### Etapa 1: Auditoria de Acessibilidade Atual
1. Executar axe-core em todas as telas existentes
2. Identificar violações WCAG 2.2 AA
3. Mapear componentes com problemas de acessibilidade
4. Priorizar correções por severidade (P0, P1, P2, P3)
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Correção de Componentes Base
1. Corrigir componentes UI v1 (botões, inputs, modais)
2. Garantir navegação por teclado em todos os componentes
3. Implementar foco visível adequado
4. Corrigir atributos ARIA necessários
5. Validar contraste de cores (WCAG 2.2 AA)
6. **Verificar:** Componentes base passam em axe-core

### Etapa 3: Correção de Componentes v2
1. Auditar componentes v2 (quando disponíveis do Agente 33)
2. Garantir acessibilidade desde o design
3. Implementar keyboard navigation
4. Validar screen reader compatibility
5. Testar com leitores de tela (NVDA, JAWS, VoiceOver)
6. **Verificar:** Componentes v2 100% acessíveis

### Etapa 4: Validação de Telas Críticas
1. Validar dashboard principal
2. Validar formulários e wizards
3. Validar tabelas e listas
4. Validar modais e dialogs
5. Validar navegação e menus
6. **Verificar:** Telas críticas passam em axe-core

### Etapa 5: Documentação e Treinamento
1. Documentar padrões de acessibilidade
2. Criar checklist de acessibilidade para novos componentes
3. Treinar equipe em WCAG 2.2 AA
4. Implementar CI gate para acessibilidade
5. **Verificar:** Documentação completa e CI configurado

---

## Critérios de Verificação

### WCAG 2.2 AA
- [ ] Contraste de texto: 4.5:1 (normal), 3:1 (large)
- [ ] Contraste de UI: 3:1
- [ ] Navegação por teclado: 100% funcional
- [ ] Foco visível: 2px outline ou equivalente
- [ ] ARIA labels: todos os elementos interativos nomeados
- [ ] Screen reader: compatibilidade testada

### Componentes
- [ ] Todos os botões têm estados: hover, focus, active, disabled
- [ ] Todos os inputs têm labels associados
- [ ] Modais têm focus trap e escape key
- [ ] Tabelas têm headers e captions
- [ ] Formulários têm error messages acessíveis

### CI/CD
- [ ] axe-core executa em CI
- [ ] Violações P0/P1 bloqueiam merge
- [ ] Relatórios de acessibilidade gerados
- [ ] Documentação de acessibilidade mantida

---

## Critério de Sucesso Final

- [ ] Zero violações WCAG 2.2 AA P0/P1
- [ ] Todos os componentes base acessíveis
- [ ] Componentes v2 acessíveis desde o design
- [ ] Telas críticas validadas
- [ ] CI gate de acessibilidade implementado
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/34-ari-acessibilidade-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 34 · Ari / ONDA-DESIGN-PREMIUM / Fase 1 / agente/34-ari-acessibilidade-v2

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

- `birthhub-accessibility` — WCAG 2.2 AA
- `accessibility` — Acessibilidade geral
- `wcag-2.2-aa` — WCAG 2.2 AA específico
- `axe-a11y` — axe-core automation
- `wcag-keyboard-navigation` — Keyboard navigation
- `wcag-color-contrast` — Color contrast
- `aria-authoring-patterns` — ARIA patterns

---

## Dependências

- **Depende de:** Agente 33 (Célia) — componentes v2
- **Desbloqueia:** Agentes 31, 32, 36, 37, 38 (podem usar componentes acessíveis)
- **Bloqueado por:** Agente 33 (Célia) — componentes v2

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando componentes v2 do Agente 33
