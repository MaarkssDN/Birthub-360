# Missão — Agente 33 · Célia
## Design System e Componentes Base

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 1 — Fundação  
**Base:** main  
**Branch:** agente/33-celia-design-tokens-v2

---

## Objetivo

Implementar o novo sistema de design tokens e componentes base v2 para o redesign premium do Birth Hub. Você possui a custódia da biblioteca de UI (shadcn/ui, Tailwind CSS e design tokens). Não permita estilos inline isolados ou duplicação de primitivos visuais; centralize variações em componentes reutilizáveis acessíveis.

---

## Fora de Escopo

- Alterações em lógica de negócio ou API
- Mudanças em componentes de features específicas (responsabilidade dos agentes 36-38)
- Deploy ou merge para produção
- Alterações em `src/App.tsx` (responsabilidade do Agente 31)

---

## Arquivos sob sua Propriedade

- `src/styles/**` (tokens, globals.css, design-v2.css)
- `src/components/ui/**` (componentes base)
- `tailwind.config.js` (configuração de tema)
- `src/components/ui/v2/**` (novos componentes v2)
- `.agents/runs/33-celia-design-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` (referência de design)
- `src/App.tsx` (Agente 31 - Noa) — para entender uso de componentes
- `src/features/**` (Agentes 36-38) — para validar compatibilidade

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Novos tokens serão criados em paralelo aos existentes
3. Componentes v2 coexistirão com v1 durante a transição
4. Tailwind CSS v4 será usado (já configurado no projeto)
5. shadcn/ui será adaptado ao Design Language do Birth Hub

---

## Plano de Execução

### Etapa 1: Auditoria do Design System Atual
1. Auditar `src/styles/globals.css` e tokens existentes
2. Verificar conformidade com `BIRTHHUB-360-DESIGN-LANGUAGE.md`
3. Identificar classes arbitrárias e duplicações
4. Mapear componentes existentes e suas variantes
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Criação de Tokens v2
1. Criar `src/styles/design-v2.css` com novos tokens
2. Implementar paleta de cores premium (neutros + semânticas)
3. Definir escala tipográfica consistente
4. Estabelecer sistema de espaçamento (base 4px)
5. Configurar escala de border-radius
6. Definir sistema de sombras e elevação
7. **Verificar:** Tokens validados contra WCAG 2.2 AA

### Etapa 3: Implementação de Componentes v2
1. Criar `src/components/ui/v2/` com novos componentes
2. Implementar Button v2 (variantes, estados, acessibilidade)
3. Implementar Input v2 (formulários, validação)
4. Implementar Card v2 (hierarquia, elevação)
5. Implementar Badge v2 (semântica, cores)
6. Implementar Modal/Dialog v2 (foco, keyboard)
7. **Verificar:** Componentes passam em testes de acessibilidade

### Etapa 4: Feature Flags e Compatibilidade
1. Implementar feature flags para alternância v1/v2
2. Garantir compatibilidade com componentes existentes
3. Criar sistema de fallback para componentes não migrados
4. **Verificar:** Feature flags testadas e funcionais

### Etapa 5: Validação e Documentação
1. Executar testes de acessibilidade (axe-core)
2. Validar contraste de cores (WCAG 2.2 AA)
3. Documentar novos tokens e componentes
4. Criar exemplos de uso
5. **Verificar:** Documentação completa e examples funcionais

---

## Critérios de Verificação

### Tokens
- [ ] Paleta de cores segue Design Language (navy, gold, neon accents)
- [ ] Contraste WCAG 2.2 AA em todos os pares de cores
- [ ] Escala tipográfica consistente (Sora + JetBrains Mono)
- [ ] Espaçamento baseado em escala de 4px
- [ ] Border-radius consistente (4px-20px)

### Componentes
- [ ] Todos os componentes têm estados: default, hover, focus, disabled, loading, error
- [ ] Navegação por teclado funciona em todos os componentes
- [ ] Atributos ARIA corretos
- [ ] Foco visível em todos os elementos interativos
- [ ] Contraste adequado em todos os estados

### Feature Flags
- [ ] `design.newTokens` controla novos tokens
- [ ] `design.newComponents` controla componentes v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Tokens v2 implementados e documentados
- [ ] Componentes v2 funcionais e acessíveis
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/33-celia-design-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 33 · Célia / ONDA-DESIGN-PREMIUM / Fase 1 / agente/33-celia-design-tokens-v2

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

- `birthhub-shadcn-system` — Governança de componentes
- `tailwind-token-auditor` — Auditoria de tokens
- `birthhub-accessibility` — WCAG 2.2 AA
- `design-system` — Design system governance
- `wcag-color-contrast` — Validação de contraste

---

## Dependências

- **Depende de:** Nenhuma (primeira fase)
- **Desbloqueia:** Agentes 34, 35 (podem usar novos tokens)
- **Bloqueado por:** Nenhum

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando início
