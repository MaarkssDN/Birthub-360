# 05 — MAPA DE DEPENDÊNCIAS
Data: 2026-11-20

## Cadeia crítica atual (ordem obrigatória)
```
1. #466 (ownership manifest × AGENTS.md 100ag) ──merge──► destrava unit tests
        │ (aguardando CI re-run pós-#465; checks re-disparados 20/11)
2. #465 ✅ mergeado ──► audit-waivers GHSA-7589 resolvido em main
        │
3. Re-run checks #434 e #437 ──► merge (ambos APROVADOS pelo 24/Silas-equivalente)
        │
4. Re-reconciliação release-readiness (subagente rodando)
        │
5. Decisões humanas D-P1..D-P12 (ver 04)
        │
6. Handoffs schema: enum Pending (→11 Pietro/12 Vera), EmailMessage cols (→11)
        │
7. Nova onda: DEBT-0012 ReAct-gateway (70/71/72), CRM-08, start_cadence (→07/74?),
   List-Unsubscribe, flaky tests, docs SRE, deploy .ps1 parity
        │
8. Faxina: PRs stale, worktrees, branches
```

## Dependências entre tarefas
| Tarefa | Pré-requisito | Tipo |
|---|---|---|
| merge #434/#437 | #465✅ + #466 + re-run CI | branch/CI |
| DEBT-0009 completo | G-28 enum Pending (schema) | schema |
| DEBT-0021 retentionPurge | D-P5 janelas + caller worker | decisão+schema? |
| DEBT-0022/23/25 voz | D-P3 escopo voz | decisão |
| DEBT-0004 mobile | D-P2 escopo Day-1 | decisão |
| DEBT-0006/0007 | D-P4 envs EC2 | decisão/ops |
| DEBT-0013 | D-P6 jurídico | decisão |
| backup prod lastro | D-P4 + D-P9 + D-P10 | decisão/ops |
| DEBT-0012 ReAct | decisão arquitetura (adapter BaseChatModel × middleware) | decisão técnica |
| Wave E restante | ordem de merge entre PRs do mesmo handler? verificar conflitos | branch |
| AUD-1 (#396/#397/#401/#415) | ordem: #401 primeiro (SSRF), depois config/auth | branch+escopo |
| Onda 1 a11y | independente; Visual Regression gate sensível a UI | CI |
| Re-reconciliação | merges de hoje estáveis | temporal |

## Paralelizáveis com segurança (pós-decisões)
- Schema (11/12): enum Pending ∥ EmailMessage cols — MESMO arquivo schema.prisma → NÃO paralelo; sequencial ou um agente só.
- Docs SRE (→08/39 Tina ou 94 Tess?) ∥ deploy .ps1 parity ∥ flaky tests — arquivos disjuntos.
- Wave E PRs restantes — verificar sobreposição de arquivos antes (vários tocam DomainEventMesh producers em domínios diferentes → provavelmente seguro).
- NÃO paralelo: qualquer coisa em `prisma/schema.prisma`, `package.json`/lockfile (aprovação 00), `.github/workflows/**` (94 Tess).

## Gates
- Todo merge exige: checks verdes + parecer do auditor (09 Silas) quando entrega de agente.
- `--admin` usado 2× nesta saga (#412/#390 visual baseline; #465 impasse circular) — cada uso deve ser justificado e registrado.
