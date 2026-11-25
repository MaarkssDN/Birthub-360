# Missão — Agente 39 · Tina
## Marca, Ativos e Documentação de Produto

**Data:** 2026-11-24  
**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24  
**Fase:** 4 — Marca e Documentação  
**Base:** main  
**Branch:** agente/39-tina-brand-v2

---

## Objetivo

Gerenciar as pastas identidade-visual/** e documentacao-aplicacao/**. Mantenha os manuais de uso de marca, logotipos em SVG, favicons e central de ajuda do produto sempre atualizados.

---

## Fora de Escopo

- Implementação de componentes de UI (responsabilidade do Agente 33)
- Alterações em lógica de negócio ou API
- Deploy ou merge para produção
- Mudanças em `src/App.tsx` (responsabilidade do Agente 31)
- Design de telas (responsabilidade dos Agentes 31-38)

---

## Arquivos sob sua Propriedade

- `identidade-visual/**` (assets de marca)
- `identidade-visual/v2/**` (nova versão com feature flag)
- `documentacao-aplicacao/**` (documentação do produto)
- `documentacao-aplicacao/v2/**` (nova versão)
- `public/assets/**` (assets públicos)
- `.agents/runs/39-tina-brand-v2.md` (relatório de execução)

---

## Arquivos de outros donos que serão necessários

- `src/components/ui/**` (Agente 33 - Célia) — componentes base
- `src/styles/**` (Agente 33 - Célia) — tokens de design
- `src/App.tsx` (Agente 31 - Noa) — navegação
- `src/features/**` (Agentes 36-38) — telas específicas
- `docs/design/**` — Design Language do projeto

---

## Suposições

1. O redesign será implementado com feature flags para rollback
2. Assets de marca v2 coexistirão com v1 durante a transição
3. Documentação deve refletir o novo design
4. Consistência visual é obrigatória
5. Assets devem ser otimizados para performance
6. Acessibilidade de assets deve ser considerada

---

## Plano de Execução

### Etapa 1: Auditoria de Marca Atual
1. Auditar `identidade-visual/**` existentes
2. Verificar consistência com Design Language
3. Identificar assets desatualizados
4. Avaliar qualidade dos logotipos e favicons
5. **Verificar:** Relatório de auditoria completo

### Etapa 2: Atualização de Assets de Marca
1. Criar `identidade-visual/v2/` com novos assets
2. Atualizar logotipos (SVG, PNG, ICO)
3. Criar novos favicons otimizados
4. Atualizar ícones e símbolos
5. Otimizar para performance
6. **Verificar:** Assets de marca v2 funcionais

### Etapa 3: Atualização de Documentação
1. Criar `documentacao-aplicacao/v2/` com nova documentação
2. Atualizar manuais de uso
3. Criar guias de design system
4. Documentar novos componentes
5. Criar exemplos de uso
6. **Verificar:** Documentação v2 completa

### Etapa 4: Central de Ajuda
1. Implementar central de ajuda atualizada
2. Criar FAQs sobre novo design
3. Implementar busca na documentação
4. Criar tutoriais interativos
5. **Verificar:** Central de ajuda funcional

### Etapa 5: Consistência Visual
1. Validar consistência de marca em todas as telas
2. Verificar uso correto de cores e tipografia
3. Validar assets em diferentes contextos
4. Testar em light e dark mode
5. **Verificar:** Consistência visual validada

---

## Critérios de Verificação

### Marca
- [ ] Logotipos atualizados e consistentes
- [ ] Favicons otimizados
- [ ] Ícones e símbolos atualizados
- [ ] Cores de marca consistentes
- [ ] Tipografia de marca mantida

### Documentação
- [ ] Manuais de uso atualizados
- [ ] Guias de design system criados
- [ ] Exemplos de uso documentados
- [ ] Central de ajuda funcional
- [ ] Busca na documentação implementada

### Performance
- [ ] Assets otimizados (SVG, WebP)
- [ ] Lazy loading implementado
- [ ] Bundle size otimizado
- [ ] Cache strategy implementada

### Acessibilidade
- [ ] Alt text em todos os assets
- [ ] Contraste adequado
- [ ] Screen reader compatibility
- [ ] Keyboard navigation

### Feature Flags
- [ ] `design.newBrandAssets` controla assets v2
- [ ] Rollback instantâneo funciona
- [ ] Compatibilidade com v1 mantida

---

## Critério de Sucesso Final

- [ ] Assets de marca v2 implementados e consistentes
- [ ] Documentação v2 completa e atualizada
- [ ] Central de ajuda funcional
- [ ] Consistência visual validada
- [ ] Feature flags implementadas e testadas
- [ ] `npx tsc --noEmit` passa
- [ ] `npm run lint` passa
- [ ] `npm run test:unit` passa
- [ ] Agente 09 (Silas) emitiu parecer APROVADO
- [ ] Documentação completa em `.agents/runs/39-tina-brand-v2.md`

---

## Entrega Esperada

### Relatório de Conclusão
```
Agente / Onda / Fase / Branch: 39 · Tina / ONDA-DESIGN-PREMIUM / Fase 4 / agente/39-tina-brand-v2

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

- `birthhub-taste` — Anti-template design
- `frontend-design` — Frontend design direction
- `brand-design` — Brand design
- `documentation` — Documentation
- `asset-optimization` — Asset optimization
- `accessibility` — Acessibilidade

---

## Dependências

- **Depende de:** Agentes 33, 34, 35, 31, 32, 36, 37, 38 (Fases 1-3 concluídas)
- **Desbloqueia:** Nenhum (marca independente)
- **Bloqueado por:** Agentes 33, 34, 35, 31, 32, 36, 37, 38 (Fases 1-3)

---

## Status

**PRONTO PARA EXECUÇÃO** — Aguardando Fases 1-3 concluídas
