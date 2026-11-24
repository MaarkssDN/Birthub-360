# SQUAD 70 — PLANO DO COORDENADOR (Agente 70 — Orion)

Data: 2026-11-24 · Demanda: DEM-20261123-001 · Coordenação: Devin (Orion)
Base de corte: `93e82c220` (docs governança 10 squads) · Branch coord: `coord/squad-70`
Worktree coord: `C:/Github/Birthub-360-worktrees/squads/squad-70/wt-coord`
Lease: `.agents/runs/leases/squad-70.lease` · Portas do squad: 22700–22799

## 1. Topologia e isolamento

- `wt-coord` → `coord/squad-70` (artefatos de coordenação: `.agents/**`).
- Executores: `wt-<id>` → `agente/<id>-<slug>-s70` sob `squads/squad-70/`.
- NÃO tocar: `integracao/onda-3-dem20261123`, worktrees `dem-20261123-*`, branches de outros squads.
- `node_modules` por junction para `C:\Github\Birthub-360\node_modules`.
- Capacidade: máx. 3 executores concorrentes; como não há `run_subagent` neste runtime, o coordenador executa as missões priorizadas sequencialmente e emite os briefs para despacho futuro.

## 2. Mapa de backlog (confirmado em REGISTRO_GLOBAL_100_AGENTES_20261124.md §Squad 70 + varredura de código no SHA base)

| Agente | Ownership (MATRIZ) | Estado real no SHA base | Missão priorizada |
|---|---|---|---|
| 70 Orion | `src/lib/ai/index.ts` | coordenação | Este plano + catálogo de agentes de runtime |
| 71 Clara | `src/lib/ai/agents/**` | só `supervisor.ts` | ciclo de vida/memória/isolamento do enxame de runtime |
| 72 Ada | `src/lib/ai/tools/**` | `registry.ts` = re-export de `voice-runtime/ToolEngine` + singleton `toolRegistry` **sem nenhum consumidor** | **B-08: tool calling real** |
| 73 Numa | `src/lib/ai/rag/**`, `vector-db/**` | só `rag/vector.service.ts`; `embeddings/qdrant.ts` existe | ingestão/embeddings/PgVector + isolamento tenant (handoff 13 Nilo) |
| 74 Luca | `src/features/ai-copilot/**` | só `copilot.service.ts` | Hotspot #8 + copiloto comercial (handoff formal 40 Ravi) |
| 75 Yara | `src/lib/ai/nlp/**` | só `sentiment.ts` | resumo/sentimento/falhas NLP (interface 63 Lira) |
| 76 Dex | `src/features/automations/**` | motor completo + testes | Hotspot #7 `intelligence.routes.ts` + idempotência |
| 77 Gaia | `src/lib/ai/guardrails/**` | R3 integrado (fenceUntrustedPromptField, anti-ReDoS) | manutenção: nunca enfraquecer; regressão contínua |
| 78 Oz | `src/lib/ai/finops/**` | `budget.service.ts`, `tokenQuota.service.ts` + teste | orçamento/cotas/circuit breaker (interface 27 Vic) |
| 79 Mina | `tests/evals/**` | `promptfoo.config.yaml` + golden dataset | suite reproduzível de evals (consome 71–78) |

## 3. Achado crítico — Bloqueador B-08 (tool calling)

Evidência no SHA `93e82c220`:
- `src/lib/ai/tools/registry.ts` exporta `toolRegistry = new ToolExecutionEngine()` — **segunda instância** do engine canônico `toolEngine` de `src/lib/voice-runtime/ToolEngine.ts`.
- `grep registerTool|executeTool|toolRegistry` em `src/**`: **zero consumidores em produção**. Só `tests/unit/lib/voice-runtime/toolEngineTimeout.test.ts` instancia o engine diretamente.
- O gateway de IA (`src/lib/ai/gateway/*`) não tem suporte a `tool_calls`; `toolPermissionPolicy.ts` existe mas não é referenciado por nenhum fluxo de chat.
- `src/features/intelligence/**` usa sistema próprio de tools (`capabilityToolRegistry`) — fora do ownership do Squad 70; não tocar.

Conclusão: infraestrutura de timeout/permissão/observabilidade existe e está testada, mas **não há caminho real** de tool calling para agentes de runtime. Risco: dois singletons divergentes (registro numa instância, execução noutra → `Tool not found`).

## 4. Priorização

1. **P0 — B-08 (Agente 72)**: unificar singleton + provar execução real via entrypoint público `src/lib/ai/tools` com testes de regressão (allowlist, permissão, timeout 15s). Depois: brief de wiring gateway→tools para onda seguinte.
2. **P1 — B-07 adjacente**: comandos de voz são Squad 60 (Agente 64); manter handoff formal, não invadir ownership.
3. **P1 — Guardrails (77)**: regressão de `fenceUntrustedPromptField`/anti-ReDoS antes de qualquer mudança em prompts/outputs; mudanças exigem handoff ao Astra + auditoria Silas.
4. **P2 — FinOps (78) / RAG (73) / Evals (79)**: após B-08.
5. **P3 — Hotspots 74/76**: vencimento 30/11; agendar antes do freeze.

## 5. Regras operacionais do squad

- Guardrails de IA = segurança crítica: nunca enfraquecer `fenceUntrustedPromptField`, `input.filter`, `pii.guard`; teste de regressão obrigatório; handoff ao Astra para promoção.
- Cross-squad formal via `.agents/handoffs/squad-70/`: 40 (copiloto/CRM), 60 (transcrição/voz), 90 (AppSec), 13 (tenant em RAG), 27 (entitlements/FinOps), 23 (filas/runtime).
- SHA congelado por entrega → Agente 09 Silas via Astra. Sem push/PR/main.
- Testes: apenas direcionados ao escopo; typecheck + lint antes de commit.

## 6. Execução nesta sessão

- [x] Worktree + branch + lease + junction.
- [x] Mapa de backlog e prioridade B-08.
- [ ] Missão 1: `agente/72-tool-calling-b08-s70` — unificação do registry + testes de regressão B-08.
