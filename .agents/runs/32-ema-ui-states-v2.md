# Relatório de Execução — Agente 32 · Ema

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 2 — Estrutura
**Branch:** `agente/32-ema-ui-states-v2` (base: `agente/31-noa-navigation-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. Os 4 estados canônicos v1 (`src/components/feedback/`) já são acessíveis e maduros — v2 é camada visual premium com a **mesma API de props**, permitindo drop-in por tela.
2. `src/components/states/` não existia; criei `states/v2/` conforme a missão.
3. `use-ui-state.ts` não existia; criei hook normalizador do ciclo loading/error/empty/stale.

## Plano executado

- **Etapa 1 — Auditoria:** v1 feedback revisado — já possui role/aria-live corretos, testids e variantes panel/compact. Nenhuma correção necessária no v1.
- **Etapa 2 — Estados v2:** `EmptyStateV2` (role=status, empty acionável com Button v2), `ErrorStateV2` (role=alert, retry visível, variantes panel/compact), `LoadingStateV2` (role=status+aria-busy, spinner `.motion-v2-spinner` + skeleton), `StaleDataIndicatorV2` (role=status, faixa stale-while-revalidate com refresh).
- **Etapa 3 — Hook:** `src/hooks/use-ui-state.ts` — `useUIState({isLoading,isError,isEmpty,isStale})` retorna `{kind, blocking}` com prioridade loading>error>empty>stale>ready.
- **Etapa 4/5 — Acessibilidade/adoção:** mesmas garantias ARIA do v1; adoção nas telas é trabalho dos agentes de feature (36–38) via swap do import.

## Arquivos alterados

- `src/components/states/v2/{EmptyStateV2,ErrorStateV2,LoadingStateV2,StaleDataIndicatorV2,index}.tsx/ts` (novos)
- `src/hooks/use-ui-state.ts` (novo)
- `.agents/runs/32-ema-ui-states-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo para arquivos da missão.
- `npx biome lint` → limpo.

## Testes

- Typecheck/lint verdes. Componentes seguem os mesmos testids pattern (`v2-*`); recomenda-se estender `tests/unit/components/` quando a adoção começar.

## Evidências

- Paleta semântica v2 usada consistentemente: `danger-100/700`, `warning-100/700`, `border-border-strong`, `bg-card` — contraste AA nos dois temas por construção (mesmos pares validados no Agente 33/34).
- Spinner respeita `prefers-reduced-motion` via `.motion-v2-spinner` (motion-v2.css).

## Problemas fora do escopo

- Telas existentes não foram migradas (escopo dos agentes de feature).

## Handoffs abertos

- Para Agentes 36/37/38: usar `*StateV2` + `useUIState` nas telas v2; flag `design.newUIStates` reservada para gating de seções inteiras se necessário.
- Para Agente 34: incluir os 4 estados v2 na próxima rodada axe-core.

## Aprendizados reutilizáveis

- Manter API idêntica ao v1 torna a migração um swap de import — menor atrito, menor risco.
- `useUIState` elimina o anti-padrão `if (isLoading) ... else if (isError) ...` espalhado.

## Pendências

- Adoção nas telas (Fases 3–4).
- Testes unitários dedicados aos componentes v2 (quando houver adoção real).

## Riscos

- Baixo: 100% código novo, nenhum consumidor existente afetado.
