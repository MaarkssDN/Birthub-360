---
name: react-render-antipatterns
description: Identificação e correção de anti-patterns de renderização no React (Vite / React 18 & 19). Previne renderizações em cascata, estado zumbi, dependências incorretas em useEffect e problemas de memoização em listas densas do CRM.
---

# React Render Anti-Patterns — Birth Hub 360

## Objetivo
Garantir alta performance e fluidez na interface do usuário (60 FPS), eliminando gargalos comuns de renderização React em telas complexas do CRM (Kanban de Leads, tabela paginada com centenas de linhas e painel de atendimento multicanal).

## Principais Anti-Patterns e Como Evitá-los

### 1. Efeitos Colaterais em Cadeia (`useEffect` Cascading)
- **Problema:** Usar `useEffect` para sincronizar estados derivados, causando múltiplos re-renders sequenciais visíveis na tela.
- **Solução:** Calcule valores derivados durante a própria renderização (`const filtered = useMemo(...)` ou simples cálculo síncrono).

### 2. Funções e Objetos Inline como Props em Componentes Pesados
- **Problema:** Passar objetos (`style={{ margin: 10 }}`) ou funções de callback não memoizadas (`onClick={() => doSomething(item.id)}`) para componentes de lista virtualizada faz com que todos os itens renderizem novamente a cada tecla digitada.
- **Solução:** Utilize `useCallback` para handlers estáveis e extraia objetos de configuração para fora do componente.

### 3. Falta de Virtualização em Listas Longas
- **Problema:** Renderizar 500 elementos DOM de cards de contato ou histórico de chat de uma só vez, degradando a memória e a rolagem da página.
- **Solução:** Empregue bibliotecas de virtualização de lista (`@tanstack/react-virtual` ou similar) renderizando apenas a janela visível no viewport.

### 4. `key` com Índice do Array em Listas Reordenáveis
- **Problema:** Usar `key={index}` em listas onde itens podem ser excluídos, ordenados ou filtrados no Kanban, gerando perda de foco em inputs e comportamentos anômalos de transição.
- **Solução:** Use sempre o identificador estável e exclusivo do registro (`key={lead.id}`).

## Checklist de Renderização
- [ ] O componente não dispara re-renders infinitos ou loops de renderização?
- [ ] Listas com mais de 50 itens possuem chaves (`key`) únicas e estáveis?
- [ ] Contextos globais são divididos para que mudanças de estado local (ex: campo de busca digitando) não re-renderizem toda a árvore de navegação?
