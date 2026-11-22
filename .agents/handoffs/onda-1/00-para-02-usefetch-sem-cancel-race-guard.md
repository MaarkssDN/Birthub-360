# Handoff 00 → Agente 02 (dono a confirmar) — `useFetch` sem cancel/race-guard

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas).

## 1. Problema e backlog
O hook central `useFetch` não cancela requests nem protege contra race
condition: respostas fora de ordem podem sobrescrever estado, e fetchers
continuam rodando após unmount — setState em componente desmontado e dados
inconsistentes. Afeta a maior parte das telas de dados.
Backlog: PERF-001 (P1) · `docs/audits/experience-360/09-PERFORMANCE-AUDIT.md`.

## 2. Evidência técnica
`src/hooks/useDatabase.ts:29-53` — `useFetch<T>` genérico:
- `load` usa `useCallback` com `deps` genérico;
- `useEffect` chama `load()` sem cleanup;
- sem `AbortController` nem guarda de "resposta mais recente";
- `fetcher: () => Promise<T>` não recebe `signal`, então nem todos os fetchers
  podem ser cancelados de verdade.
Consumido por dezenas de hooks (companies, contacts, leads, activities,
analytics...).

## 3. Agente responsável e ownership
`src/hooks/**` não tem AGENTS.md local → **escalar ao Agente 00 para designar
dono** (proposta: Agente 02 — estado global). Confirmar antes de editar.

## 4. Causa raiz
Hook criado sem cancelamento (`AbortController`) nem guarda de race
(`requestId`/sequência); fetcher sem `signal` impede abort real.

## 5. Solução mínima proposta
- Adicionar **guarda de race sem mudar a assinatura** dos fetchers: contador de
  requisição (`reqIdRef`) — só aplica `setData`/`setError` se for a mais recente.
- Adicionar flag `cancelled` no cleanup do `useEffect` para evitar setState
  pós-unmount.
- AbortController real depende de cada `fetcher` aceitar `signal` — **fora do
  escopo mínimo**; registrar como débito P2 para fetchers críticos.
- **Não** alterar o retorno `{data, loading, error, refetch}`.

## 6. Arquivos que poderão ser modificados
- `src/hooks/useDatabase.ts` (apenas a função `useFetch`).

## 7. Dependências e riscos
- **Alto alcance:** `useFetch` alimenta a maior parte das telas — regressão é
  global. Mitigação: mudança aditiva (guarda), sem mudar contrato.
- Risco de o guarda mascarar refetch legítimo se mal implementado — testar
  "refetch A depois B, resposta B chega primeiro".
- Fetchers que tratam erro próprio podem depender do comportamento atual —
  revisar 2-3 consumidores representativos.

## 8. Critérios de aceite
- Resposta de requisição antiga nunca sobrescreve a mais recente.
- Nenhum `setState` após unmount (sem warning do React).
- `refetch` continua funcionando e retorna dados frescos.
- Contrato do hook inalterado.

## 9. Testes obrigatórios
- Teste unitário do hook: ordem de resposta invertida, unmount durante fetch,
  refetch.
- Smoke em 2-3 telas consumidoras (ex.: companies, contacts).
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; guarda é aditiva e reversível.
