# Matriz de verificação de handoffs — 2026-11-15 (Agente 00)

Demanda: DEM-20261114-002. Auditoria pontual dos handoffs abertos com evidência em `origin/main`.
Não substitui a matriz completa do PR #309 — foca nos itens que bloqueiam gates ou demandas ativas.

## Verificados como RESOLVIDOS na prática (status do arquivo ainda "aberto" — atualizar)

| Handoff | Evidência |
|---|---|
| `onda-3/16-para-00-outbox-produtores-sem-idempotency-key.md` | **AINDA VÁLIDO** — ver abaixo. MEL-21 (#e67388b9a) cobriu dedup de `jobId` na fila BullMQ, mas `domainEventMesh.publish()` segue chamado sem `opts.idempotencyKey` (verificado em `behavioralEngine.service.ts:167,393,409`, `automation.engine.ts:613`). ~20 produtores afetados. Manter aberto. |
| `02-para-04-crm-kanban-tokens.md` (meu, Onda 02) | ✅ Resolvido — zero hex em `src/features/crm/**` (atualizado no PR #307, mergeado). |
| `02-para-07-intelligence-hub-tokens.md` (meu, Onda 02) | 🟡 Parcial — `Math.random` = 0 ocorrências confirmado; restam 37 hex em 3 TSX para triagem do 07 (PR #307, mergeado). |

## Abertos e bloqueadores de gate/demanda ativa

| Handoff | Dono | Impacto |
|---|---|---|
| `15-para-02-03-sonar-new-coverage.md` | 02/03 + donos por arquivo | new_coverage — Sonar passou ~83% na main atual; handoff pode estar parcialmente superado, falta medição global atualizada |
| `03-para-00-sonar-new-coverage-resolucao.md` | 03 → 00 | aguardando medição Sonar — mesmo caso acima |
| `onda-4/08-para-00-visual-gate-branch-protection.md` | 08 → 00 | MEL-29 visual gate — PRs #360/#365 em voo; branch protection do check ainda pendente de decisão do 00 |
| `08-para-00-cobertura-modulos-gaps-produto.md` | 08 → 00 | gaps de ACs productivos (market-intelligence/mesa-tratamento/social-selling) — decisão de produto pendente |
| `00-para-18-08-postman-sync-id-collision.md` (meu) | 18/08 | Postman sync HTTP 400 — PR #353 aberto; correção é no workspace Postman (fora do repo) |
| `00-para-03-character-panel-tokens.md` (meu) | 03 | decisão D3: migrar painel dark-glass para tokens |
| `00-para-07-roleplay-simulator-testonly.md` (meu) | 07 | decisão D2: documentar simulador como test-only |

## Pendentes de decisão do coordenador (00)

1. **Branch protection do Visual Regression Gate** (handoff 08): decidir se o check vira obrigatório em `main` — recomendo SIM após #360/#365 estabilizarem baselines, senão todo PR volta a poder mergear com visual quebrado.
2. **Gaps de produto dos ACs** (handoff 08): os 3 módulos têm specs mas faltam critérios de aceite — decidir se viram demanda de produto ou aceitação com ressalva.
3. **`idempotencyKey` nos produtores do outbox** (handoff 16): ainda aberto e real — recomendo manter prioritário alto; cada produtor precisa de chave derivada da identidade de negócio (não trivial, exige dono por domínio).

## Não auditados nesta rodada

Handoffs de ondas antigas (onda-00, onda-2, onda-52, onda-8) e os 8 `00-para-*` transversais — próxima passada deve cobrir status de cada um contra merges recentes.
