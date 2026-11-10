# Matriz de propriedade — Onda saneamento-20261110 · Wave 2

- **Data:** 2026-11-10 · **Coordenador:** Agente 00
- **Base:** `integracao/onda-saneamento-20261110` @ `3e0f6f839`
- **Worktrees:** `C:\Users\Marks\Documents\GitHub\Birthub-360-worktrees\<nome>` (node_modules via junction para o checkout principal)

## Agentes em execução (wave 2)

| Agente | Branch | Worktree | Handoff | Arquivos-alvo | Gates |
|---|---|---|---|---|---|
| 05 | `agente/05-supressao-optout` | `agente-05-supressao-optout` | TAREFA-SANEAMENTO-020 / BT360-DT-0028 | `src/features/prospecting/services/cold-email.service.ts` (+ testes do domínio) | tsc, lint, vitest focado |
| 09 | `agente/09-pwa-icons` | `agente-09-pwa-icons` | TAREFA-SANEAMENTO-048 / BT360-DT-0054 | `public/` (novos ícones), `manifest`/config PWA | tsc, lint, build ou verify:pwa-precache |
| 17 | `agente/17-optout-cadencia` | `agente-17-optout-cadencia` | TAREFA-SANEAMENTO-035 / BT360-DT-0080 | `src/features/cadence/services/cadenceExecution.service.ts` (+ testes) | tsc, lint, vitest focado |
| 23 | `agente/23-n1-metricas-ia` | `agente-23-n1-metricas-ia` | TAREFA-SANEAMENTO-042 / BT360-DT-0094 | `src/features/intelligence/services/agentCostAnalysis.service.ts` (+ testes) | tsc, lint, vitest focado |

## Conflitos conhecidos / bloqueios

- **`00-para-11-hotspot-characters` (bloqueador, paralela-8):** BLOQUEADO — `src/features/characters/**` tem WIP não commitado de outra sessão no checkout principal; worktree `agente/11-hotspot-characters` já existe em `.claude/worktrees/` (outra sessão). Não duplicar.
- **Onda paralela-8 em execução por outra sessão** (`.claude/worktrees/ag-*`): agentes 01A, 02, 06, 07, 08, 11, 15, 18 ocupados — wave 2 evita todos esses slots.
- **Slot 01/01A:** 01A ativo na paralela-8 → Agente 01 fora desta wave.
- **`agentCostAnalysis.service.ts` (Agente 23):** arquivo no domínio do 07; handoff 00-para-23 autoriza explicitamente. 07 está em tarefa não relacionada (duplicate-exports) — risco baixo, monitorar no merge.
- **`public/` (Agente 09):** wave 1 do 11 já comprimiu assets; 09 só ADICIONA ícones faltantes — sem sobreposição de arquivos.

## Regras aplicadas

- Propriedade disjunta verificada; sem schema/migrations em nenhum item.
- `server.ts`, `package.json`, lockfiles, CI/Docker: fora de escopo.
- Nenhum agente commita em `main`/`integracao` — branches próprias; integração só após parecer APROVADO do Agente 24.
- Handoffs: destinatário atualiza `Status` e adiciona `## Resolução`; novos handoffs para problemas fora de escopo.
