# Missão — Agente 30 · Violeta
## Coordenador de Produto, UX & Design

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Base:** main  
**Branch:** agente/30-coord-squad30-design-premium

---

## Objetivo

Liderar a experiência visual e a coerência de produto em todas as aplicações do Birth Hub durante o redesign premium incremental. Você valida a fidelidade dos componentes aos requisitos de produto, impede inconsistências de layout ou biblioteca e orquestra o trabalho dos especialistas 31–39 garantindo fluidez nas jornadas do usuário.

---

## Fora de Escopo

- Implementação direta de componentes (responsabilidade dos especialistas 31-39)
- Alterações em código backend ou API
- Mudanças em schema de banco de dados
- Deploy ou merge para produção

---

## Arquivos sob sua Propriedade

- `.agents/runs/ONDA-DESIGN-PREMIUM-2026-11-24.md` (plano de orquestração)
- `.agents/handoffs/onda-design-premium/` (coordenação de handoffs)
- Documentação de decisões de design
- Relatórios de coordenação do Squad 30

---

## Arquivos de outros donos que serão necessários

- `src/App.tsx` (Agente 31 - Noa)
- `src/components/ui/**` (Agente 33 - Célia)
- `src/styles/**` (Agente 33 - Célia)
- `src/features/landing/**` (Agente 36 - Léo)
- `src/features/onboarding/**` (Agente 37 - Suri)
- `src/features/dashboard/**` (Agente 38 - Nara)
- `identidade-visual/**` (Agente 39 - Tina)

---

## Suposições

1. O redesign será implementado de forma incremental com feature flags
2. Cada fase será validada antes de prosseguir para a próxima
3. O Agente 09 (Silas) realizará auditoria independente de cada entrega
4. Feature flags permitirão rollback instantâneo se necessário
5. Testes E2E serão executados antes e depois de cada fase

---

## Plano de Execução

### Fase 1: Coordenação e Planejamento
1. Revisar plano de orquestração e validar com Agente 00 (Astra)
2. Criar matriz de propriedade detalhada para Squad 30
3. Definir critérios de aceite para cada agente especialista
4. Estabelecer protocolo de comunicação entre agentes
5. **Verificar:** Matriz de propriedade publicada e aprovada

### Fase 2: Execução Incremental
1. Coordenar Fase 1 (Fundação): Agentes 33, 34, 35
2. Validar entregas da Fase 1 antes de prosseguir
3. Coordenar Fase 2 (Estrutura): Agentes 31, 32
4. Validar entregas da Fase 2 antes de prosseguir
5. Coordenar Fase 3 (Experiência): Agentes 36, 37, 38
6. Validar entregas da Fase 3 antes de prosseguir
7. Coordenar Fase 4 (Marca): Agente 39
8. **Verificar:** Cada fase validada e aprovada pelo Silas

### Fase 3: Rollout e Validação
1. Coordenar rollout gradual (10% → 50% → 100%)
2. Monitorar métricas de performance e UX
3. Validar ausência de regressões
4. Coletar feedback dos usuários beta
5. **Verificar:** Rollout completo sem erros críticos

---

## Critérios de Verificação

### Por Fase
- [ ] Feature flags implementadas e testadas
- [ ] Testes E2E passam com flag ON e OFF
- [ ] Screenshots comparativos gerados
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação atualizada

### Global
- [ ] Nenhuma quebra de funcionalidade existente
- [ ] Acessibilidade WCAG 2.2 AA mantida
- [ ] Performance não degradada
- [ ] Consistência visual em todas as telas
- [ ] Rollback testado e funcional

---

## Critério de Sucesso Final

- Todas as 5 fases concluídas e validadas
- Rollout 100% concluído sem erros críticos
- Agente 09 (Silas) emitiu parecer APROVADO para cada fase
- Feature flags removidas após validação
- Documentação completa e atualizada
- Zero regressões reportadas pelos usuários

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Branch: 30 · Violeta / ONDA-DESIGN-PREMIUM-2026-11-24 / agente/30-coord-squad30-design-premium

Suposições feitas:
- [listar suposições]

Plano executado:
- Fase 1 → critério → resultado
- Fase 2 → critério → resultado
- Fase 3 → critério → resultado
- Fase 4 → critério → resultado
- Fase 5 → critério → resultado

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

## Protocolo de Comunicação

### Com Agente 00 (Astra)
- Escalar bloqueadores e decisões estratégicas
- Reportar progresso das fases
- Solicitar aprovação para transições de fase

### Com Especialistas 31-39
- Coordenar missões e dependências
- Validar entregas antes de prosseguir
- Resolver conflitos de propriedade
- Facilitar comunicação entre agentes

### Com Agente 09 (Silas)
- Solicitar auditoria de cada fase
- Fornecer evidências de qualidade
- Responder a questionamentos do auditor

---

## Skills Recomendadas

- `birthhub-design-director` — Orquestração de design
- `impeccable` — Design vocabulary e critique
- `birthhub-taste` — Anti-template design
- `birthhub-ui-ux-pro-max` — UX intelligence
- `birthhub-frontend-design` — Frontend design direction

---

## Status

**EM EXECUÇÃO** — Aguardando início da Fase 1
