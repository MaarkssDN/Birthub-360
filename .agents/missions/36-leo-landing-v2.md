# Missão — Agente 36 · Léo
## Landing Pages e Conversão

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 3 — Experiência  
**Base:** main  
**Branch:** agente/36-leo-landing-v2

---

## Objetivo

Redesenhar as landing pages com design premium, sofisticado e elegante, eliminando estética genérica de SaaS de IA. Desenvolva páginas institucionais e de alta conversão, com otimização técnica de SEO (OpenGraph, tags canônicas, dados estruturados JSON-LD) e Core Web Vitals elevados.

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)
- Voice Hub landing (responsabilidade do Agente 65 - Lena)

---

## Arquivos sob sua Propriedade

- `src/features/landing/**` (landing pages)
- `src/features/landing/v2/**` (nova versão com feature flag)
- `public/landing/**` (assets de landing)
- `.agents/runs/36-leo-landing-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/lib/motion.ts` (Agente 35 - Mia) — sistema de motion
- `src/App.tsx` (Agente 31 - Noa) — navegação

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Landing pages v2 coexistirão com v1 durante a transição
3. SEO deve ser mantido ou melhorado
4. Core Web Vitals devem ser otimizados
5. Design deve ser premium, sofisticado e elegante
6. Nenhuma estética genérica de SaaS de IA

---

## Plano de Execução

### Etapa 1: Auditoria de Landing Pages Atual
1. Auditar `src/features/landing/**` existentes
2. Identificar problemas de design e UX
3. Verificar SEO e performance
4. Analisar métricas de conversão
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Definição de Direção Visual
1. Definir direção visual premium (baseada em Design Language)
2. Criar mood board e referências
3. Definir paleta de cores e tipografia
4. Estabelecer hierarquia visual
5. **Verificar:** Direção visual aprovada pelo Agente 30

### Etapa 3: Implementação de Landing Pages v2
1. Criar `src/features/landing/v2/` com novas páginas
2. Implementar hero section com design premium
3. Criar seções de features e benefits
4. Implementar social proof e testimonials
5. Criar CTA sections otimizadas para conversão
6. **Verificar:** Landing pages v2 funcionais

### Etapa 4: Otimização de SEO e Performance
1. Implementar OpenGraph tags otimizadas
2. Criar JSON-LD structured data
3. Otimizar meta tags e canonical URLs
4. Implementar lazy loading de imagens
5. Otimizar Core Web Vitals
6. **Verificar:** SEO e performance validados

### Etapa 5: Testes de Conversão
1. Implementar analytics para conversão
2. Criar A/B tests para CTAs
3. Validar formulário de captura
4. Testar responsividade mobile
5. **Verificar:** Conversão otimizada

---

## Critérios de Verificação

### Design Premium
- [ ] Nenhuma estética genérica de SaaS de IA
- [ ] Tipografia premium e hierarquia clara
- [ ] Cores sofisticadas e elegantes
- [ ] Motion com propósito e acessível
- [ ] Layout assimétrico e editorial

### SEO e Performance
- [ ] OpenGraph tags otimizadas
- [ ] JSON-LD structured data implementado
- [ ] Core Web Vitals >90
- [ ] Lazy loading de imagens
- [ ] Mobile-first design

### Conversão
- [ ] CTAs claros e acionáveis
- [ ] Formulários otimizados
- [ ] Social proof convincente
- [ ] Analytics implementado
- [ ] A/B tests configurados

### Feature Flags
- [ ] `design.newLanding` controla landing v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Landing pages v2 implementadas com design premium
- [ ] SEO otimizado e Core Web Vitals >90
- [ ] Conversão mantida ou melhorada
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] `npm run test:e2e` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/36-leo-landing-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 36 · Léo / ONDA-DESIGN-PREMIUM / Fase 3 / agente/36-leo-landing-v2

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

- `impeccable` — Design vocabulary e critique
- `frontend-design` — Frontend design direction
- `design-taste-frontend` — Anti-template design
- `birthhub-frontend-design` — Frontend design do projeto
- `birthhub-taste` — Anti-template do projeto
- `seo` — SEO optimization
- `performance` — Performance optimization

---

## Dependências

- **Depende de:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2 concluídas)
- **Desbloqueia:** Nenhum (landing pages independentes)
- **Bloqueado por:** Agentes 33, 34, 35, 31, 32 (Fases 1 e 2)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fases 1 e 2 concluídas
