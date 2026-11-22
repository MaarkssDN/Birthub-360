# Run — Agente 06 — TAREFA-SANEAMENTO-045 (BT360-DT-0032)

Onda: W5 | Branch: `agente/06-w5-integracoes` | Worktree: `agente-06-w5-integracoes`

## Problema
`ExternalCrmPanel.fetchConnections` não aceitava `AbortSignal` (Sonar S9383 /
tratamento incompleto de promises): `useEffect` chamava `void fetchConnections()` sem
cancelamento — risco de setState após unmount e request pendurado.

## Correção
- `fetchConnections(signal?: AbortSignal)` propaga o signal ao `fetch`.
- `useEffect` cria `AbortController` por ciclo e aborta no cleanup.
- `catch` distingue cancelamento (`signal.aborted`/`AbortError` → return silencioso)
  de falha real (mensagem explícita via `setError` + `toast.error`).
- `finally` só limpa `loading` se não abortado.
- Botão "Atualizar lista" segue chamando sem signal (retry manual não-cancelável).

## Teste adicionado
`tests/unit/features/integrations/ExternalCrmPanel.test.tsx` — novo caso
"cancela o carregamento ao desmontar sem exibir erro nem toast": verifica que o
signal chega ao fetch, é abortado no unmount e que `toast.error` não é chamado.
Suíte completa do painel: 13/13 PASS (sucesso, erro HTTP, permissões, validação,
salvar, testar/sincronizar/remover).

## Gates
- `npx tsc --noEmit` — PASS
- `npx biome check` — PASS
- vitest ExternalCrmPanel — 13/13 PASS
- `npm run build` — PASS (vite + esbuild server + verify:pwa-precache, 220 entradas)
