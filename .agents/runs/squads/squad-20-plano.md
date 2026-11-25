# Plano do Squad 20 — Core Backend, APIs, Billing e Onboarding

- **Coordenador:** Agente 20 — Ciro
- **Demanda:** DEM-20261123-001 (topologia 10 squads / 10 coordenadores)
- **Branch de squad:** `coord/squad-20`
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-20/wt-coord`
- **Base congelada:** `93e82c22024ccc9ca48abad6b29e855cbd4157f9` (governança 10 squads sobre `0141f258a`, tip da Onda 3)
- **Lease:** `.agents/runs/leases/squad-20.lease` (portas 22200–22299)
- **Data:** 2026-11-24

## 1. Estado real verificado na base

| Item | Estado |
|---|---|
| `src/api/index.ts`, `src/api/router.ts` (ownership do 20) | **INEXISTENTES** — nunca existiram no repo (handoff `onda-3/20-para-00-ownership-api-inexistente.md`, ABERTO) |
| `src/api/` real | contém apenas `middlewares/rate-limit.ts` (dono: Agente 25) |
| Camada HTTP real | `server.ts` (dono: 00) + `src/bootstrap/routes.ts` (288 linhas, ~60 mounts `/api/**`), `rateLimiters.ts`, `security.ts` — **sem dono na MATRIZ_PROPRIEDADE** |
| Handler global de erro | `src/shared/middlewares/errorHandler.ts` (dono formal: Agente 01 via `src/shared/AGENTS.md`) — já sanitiza 5xx em prod/staging e não vaza query string em `instance` |
| Squads 20 na Onda 3 | 20 (diagnóstico, APROVADO), 21 (APROVADO após reenvio spec), 22, 23 (dedup queue, APROVADO) integrados; 24–29 PREPARADOS |

## 2. Backlog priorizado do squad

### P0 — Governança (bloqueia todo o resto)
1. **Ownership gap `src/bootstrap/**` + `src/shared/middlewares/errorHandler.ts`** — handoff `20→00` aberto. Aguardando deliberação do Astra sobre o mapeamento real dos slots 20/21/22/25. **O squad NÃO edita `src/bootstrap/routes.ts` nem `errorHandler.ts` até publicação na matriz.**
2. **Billing/Webhooks (26, 29)** — dados financeiros/PII: qualquer mudança exige cautela extra e handoff ao Astra ANTES de código (regra da missão).

### P1 — Reconciliação HTTP (handoff 22→20, recebido)
3. **Ordem de middlewares/mounts** — verificado pelo coordenador nesta base:
   - ✅ Item 3 do handoff (query string em `instance` do errorHandler) **JÁ RESOLVIDO** — `errorHandler.ts:~190` faz `rawInstance.split('?')[0]`.
   - ⚠️ Item 2 CONFIRMADO: `authenticateToken` executa 2× para `/api/prospecting/ocr/**` (rateLimiters.ts:70 + routes.ts:147). Correção cirúrgica possível (espelhar desenho de `/api/intelligence`), mas `routes.ts`/`rateLimiters.ts` estão sem dono → **proposta de correção vai no handoff ao Astra**, não em código.
   - ⚠️ Item 1 CONFIRMADO: auth implícita via `rateLimiters.ts` para `/api/intelligence`, `/api/agent`, `/api/knowledge`, `/api/bug-reports` — fail-closed hoje, mas frágil a reordenação. Recomendação: teste de contrato de ordem de mounts (ownership de `tests/**` é dos agentes de teste — handoff ao 03/04).
4. **Erros 5xx residuais** — varredura do errorHandler: taxonomia estável, `code`, `retryable`, sanitização prod/staging, `stack` proibido no envelope. Sem residuo crítico encontrado na leitura; pendente apenas cobertura de teste (handoff a 03/04 se necessário).

### P2 — Continuação dos especialistas (após deliberação de ownership)
5. **21 Zara** — drift residual OpenAPI/Zod (paths fantasma já saneados em `21→00`; aguardar nova base).
6. **22 Hugo** — auditar erros 4xx/5xx e propagação quando `src/api/**` real for definido.
7. **23 Pina / 24 Ivo** — dedup de filas concluído na Onda 3; próxima: auditoria DLQ/backoff/idempotência (24) e workers BullMQ (23) na nova base.
8. **25 Tália** — dead code apontado por 22 (`22→25-rate-limit-composite-dead-code.md`): avaliar remoção de `rateLimit` composto não utilizado em `rate-limit.ts`/`rateLimiters.ts` quando houver dono.
9. **26–29** — billing, entitlements, import, export/webhooks: BACKLOG — só após P0 e com revisão Astra (dados financeiros).

## 3. Regras operacionais do squad

- Worktrees de executores: `C:/Github/Birthub-360-worktrees/squads/squad-20/wt-<id>` em branches `agente/<id>-<slug>-s20`, base `coord/squad-20` (ou SHA congelado aprovado).
- Máx. 3 executores concorrentes (política conservadora §5 da estrutura).
- Handoffs oficiais em `.agents/handoffs/squad-20/` e `.agents/handoffs/onda-<n>/`.
- Portas efêmeras: 22200–22299 (lease emitido).
- Sem push/PR/main. SHA congelado → Silas (09) via Astra.
- Testes direcionados por escopo; `npx tsc --noEmit` + `biome check` mínimos por entrega.

## 4. Entregas desta sessão de coordenação

- [x] Worktree `wt-coord` + branch `coord/squad-20` @ `93e82c220`
- [x] Junction `node_modules` → `C:\Github\Birthub-360\node_modules`
- [x] Lease `.agents/runs/leases/squad-20.lease`
- [x] Plano (este arquivo)
- [x] Auditoria de verificação HTTP: `.agents/runs/squads/squad-20-auditoria-http-20261124.md`
- [x] Handoffs: `.agents/handoffs/squad-20/` (status ao Astra + disposição do 22→20)
