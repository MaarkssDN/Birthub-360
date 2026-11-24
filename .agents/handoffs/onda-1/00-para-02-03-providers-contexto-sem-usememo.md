# Handoff 00 → Agentes 02 + 03 — Providers de contexto sem `useMemo` (débito de render)

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas).

## 1. Problema e backlog
Providers de contexto entregam `value` como objeto literal recriado a cada
render, invalidando a memoização de todos os consumidores — débito de render em
todo o app. ~5 providers sem `useMemo` identificados.
Backlog: REND-001 (P1) · `docs/audits/experience-360/09-PERFORMANCE-AUDIT.md`.

## 2. Evidência técnica
`src/contexts/`:
- `AuthContext.tsx`
- `DailyClosingContext.tsx`
- `ExperienceModeContext.tsx`
- `ThemeContext.tsx`
- ThemeContexts do voice-hub:
  `src/features/voice-hub/components/ThemeContext.tsx` e
  `src/features/voice-hub/components/design-system/ThemeContext.tsx`
  (verificar quais entregam `value={{...}}` inline).

## 3. Agente responsável e ownership
Estado global/app shell → Agente 02; se tocar tokens/tema → Agente 03.
`src/contexts/**` não tem AGENTS.md local — confirmar dono com o 00.
ThemeContexts do voice-hub são do Agente 12 (arquivo), mas a correção de tema
consolida com ADR-012 — **não otimizar código a ser depreciado**; decidir por
item.

## 4. Causa raiz
`value` do `Context.Provider` passado como objeto/função inline sem
`useMemo`/`useCallback`, quebrando memoização downstream.

## 5. Solução mínima proposta
- Envolver `value` em `useMemo` com dependências corretas; callbacks em
  `useCallback`.
- **Não** mudar a API pública dos contexts (mesmas chaves/valores) — só a
  estabilidade de referência.
- Para ThemeContext do voice-hub: se a consolidação de temas (ADR-012) vai
  depreciá-lo, registrar débito e pular; senão corrigir.

## 6. Arquivos que poderão ser modificados
- `src/contexts/*.tsx` (providers sem memo).
- `src/features/voice-hub/**/ThemeContext.tsx` — somente se não depreciado.

## 7. Dependências e riscos
- Risco baixo de regressão funcional (mesma API), mas **risco de efeito
  colateral**: memoização correta pode *expor* re-renders antes mascarados —
  validar comportamento, não assumir.
- Não tocar lógica de auth/session além do memo.

## 8. Critérios de aceite
- `value` de cada provider alterado é referencialmente estável entre renders
  que não mudam estado.
- Nenhuma mudança de comportamento/contrato dos contexts.
- Testes existentes de contexto continuam verdes.

## 9. Testes obrigatórios
- Testes unitários dos providers (se existirem) + smoke de telas consumidoras.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; memoização é aditiva, sem migração.

## 11. Atualização 2026-11-22 (baseline + ownership)
- **Ownership:** `src/contexts/**` proposto → **Agente 02 (legado) / Squad 30**,
  APROVADO PARCIALMENTE pelo Orquestrador (deliberação item 2); ThemeContext
  exige participação do Agente 03. AGENTS.md local ainda não criado — pendente
  autorização específica.
- **Baseline:** contexts afetam todas as rotas — regressão aqui é global;
  mitigação já prevista (API inalterada). Sem baseline visual específica
  necessária (não muda pixels por si só).
