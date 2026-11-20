De: 03 — Nina
Para: 00 — Astra (repassar ao dono de `src/features/gamification/**`; MATRIZ_PROPRIEDADE não lista a arena)
Onda: 1
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima

## Problema
Commit 9b01b0a23 (2026-11-19, "frentes A+B+C ... rounds arena") passou o contador de rounds a `SAMPLE_OBJECTIONS.length` (agora 4 cenários). Os testes unitários esperavam "Round 1 de 3" e falharam no SonarQube (main vermelha). Testes atualizados para "de 4" (contrato novo; asserções de iniciar duelo/digitar defesa preservadas).

Copy residual desatualizada no produto, que não editei por ser de outro dono:
- `WarRoomArenaView.tsx` ~L331: "3 Rounds · Feedback Instantâneo" (lobby)
- `WarRoomArenaView.tsx` ~L650: "Você enfrentou 3 rounds de cenários de objeção" (conclusão)

## Arquivo(s) envolvido(s)
src/features/gamification/components/WarRoomArenaView.tsx

## Evidência
`getByText('Round 1 de 3')` não encontrado (renderiza "Round 1 de 4"). Determinístico (3/3 execuções, com --no-file-parallelism).

## Alteração necessária
Derivar os dois textos de `SAMPLE_OBJECTIONS.length`.

## Teste esperado
Lobby e conclusão exibem a contagem real de rounds.
