# Missão — Agente 35 · Mia
## Motion e Microinterações

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 1 — Fundação  
**Base:** main  
**Branch:** agente/35-mia-motion-v2

---

## Objetivo

Projetar animações com Framer Motion/CSS que enriquecem o entendimento do usuário. Sempre respeite a media query prefers-reduced-motion e impeça animações pesadas que degradem a performance de renderização (FPS).

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)

---

## Arquivos sob sua Propriedade

- `src/lib/motion.ts` (sistema de motion)
- `src/lib/motion-v2.ts` (novo sistema de motion v2)
- `src/components/motion/**` (componentes de motion)
- `src/styles/motion.css` (animações CSS)
- `.agents/runs/35-mia-motion-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/features/**` (Agentes 36-38) — telas específicas

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Framer Motion será usado como biblioteca principal
3. CSS animations serão usadas para casos simples
4. `prefers-reduced-motion` é obrigatório em todas as animações
5. Performance de 60fps é o padrão mínimo
6. Motion deve ter propósito (feedback, continuidade, hierarquia)

---

## Plano de Execução

### Etapa 1: Auditoria de Motion Atual
1. Auditar `src/lib/motion.ts` e animações existentes
2. Identificar animações sem propósito ou decorativas
3. Verificar suporte a `prefers-reduced-motion`
4. Medir performance de animações (FPS)
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Criação de Sistema de Motion v2
1. Criar `src/lib/motion-v2.ts` com novos tokens de motion
2. Definir escala de duração (100ms-500ms)
3. Estabelecer easing functions (standard, enter, exit, emphasized)
4. Criar variantes de animação (fade, slide, scale, rotate)
5. Implementar suporte a `prefers-reduced-motion`
6. **Verificar:** Sistema de motion v2 funcional

### Etapa 3: Implementação de Microinterações
1. Criar microinterações para botões (hover, active, focus)
2. Implementar transições de página suaves
3. Criar animações de entrada/saída para modais
4. Implementar feedback de loading e sucesso
5. Otimizar para 60fps
6. **Verificar:** Microinterações funcionais e performáticas

### Etapa 4: Otimização de Performance
1. Medir FPS de todas as animações
2. Identificar gargalos de performance
3. Otimizar animações pesadas
4. Implementar lazy loading de animações
5. Validar em dispositivos mobile
6. **Verificar:** Performance 60fps em todos os dispositivos

### Etapa 5: Acessibilidade e Reduced Motion
1. Implementar `prefers-reduced-motion` em todas as animações
2. Testar com usuários que preferem reduced motion
3. Validar que animações não causam desconforto
4. Documentar padrões de motion acessível
5. **Verificar:** Acessibilidade de motion validada

---

## Critérios de Verificação

### Motion Design
- [ ] Duração: 100ms-500ms (escala consistente)
- [ ] Easing: cubic-bezier functions otimizadas
- [ ] Propriedades: transform e opacity (GPU accelerated)
- [ ] Propósito: feedback, continuidade, hierarquia
- [ ] Sem bounce excessivo ou animações infinitas

### Performance
- [ ] FPS: 60fps em animações
- [ ] GPU: animações usam transform/opacity
- [ ] Mobile: performance mantida em dispositivos móveis
- [ ] Bundle: tamanho de motion otimizado
- [ ] Lazy: animações carregadas sob demanda

### Acessibilidade
- [ ] `prefers-reduced-motion`: respeitado em 100% das animações
- [ ] Teclado: animações não bloqueiam navegação
- [ ] Screen reader: animações não interferem
- [ ] Contraste: animações não reduzem contraste
- [ ] Foco: animações não causam perda de foco

### Feature Flags
- [ ] `design.newMotion` controla motion v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Sistema de motion v2 implementado e documentado
- [ ] Microinterações funcionais e performáticas
- [ ] Performance 60fps validada
- [ ] `prefers-reduced-motion` implementado em 100%
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/35-mia-motion-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 35 · Mia / ONDA-DESIGN-PREMIUM / Fase 1 / agente/35-mia-motion-v2

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

- `birthhub-motion-design-engineering` — Motion design engineering
- `motion-design` — Motion design geral
- `performance` — Performance optimization
- `accessibility` — Acessibilidade de motion
- `framer-motion` — Framer Motion específico

---

## Dependências

- **Depende de:** Agente 33 (Célia) — tokens de design
- **Desbloqueia:** Agentes 31, 32, 36, 37, 38 (podem usar motion v2)
- **Bloqueado por:** Agente 33 (Célia) — tokens de design

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando tokens do Agente 33
