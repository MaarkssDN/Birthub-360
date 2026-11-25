# 04 — Matriz de Patches e Commits

**Baseline:** `main = 0d790443` · **Método:** `git cherry` (patch-id vs main) + `git merge-tree --write-tree` (conflito real)

## Patches genuinamente ausentes da main (22 patches em 10 branches)

| Branch | Commits à frente | Patches únicos | Arquivos tocados | Tipo | Merge limpo |
|---|---:|---:|---:|---|---|
| `agente/00-plano-mestre-operacional-100-agentes` | 5 | 4 | 3 (+246) | docs/governança | ✅ |
| `consolidacao_backlog_birthub360` | 1 | 1 | 9 (+826) | docs/governança | ✅ |
| `agente/08-handoffs-20261117` | 17 | 10 | 5 (+292/−1) | CI+testes+docs | ✅* |
| `chore/handoff-00-despacho-wave-a-b-20261120` | 2 | 1 | 2 (+189) | docs | ✅ |
| `chore/handoff-00-reconciliacao-etapa-0-20261121` | 1 | 1 | 1 (+93) | docs | ✅ |
| `chore/handoff-devin-encerramento-20261121` | 1 | 1 | 1 (+97) | docs | ✅ |
| `devin/handoff-continuidade-merge-20261120` | 1 | 1 | 1 (+74) | docs | ✅ |
| `chore/handoff-antigravity-restauracao-governanca-20261121` | 1 | 1 | 1 (+78) | docs | ✅ |
| `chore/handoff-devin-central-operacao-20261121` | 1 | 1 | 1 (+80) | docs | ✅ |
| `chore/handoff-antigravity-encerramento-100-agentes-20261121` | 1 | 1 | 1 (+104) | docs | ✅ |

\* 211 commits atrás — merge-tree limpo, mas recomendo merge de `main` na branch antes (ou cherry-pick dos patches) para reduzir divergência.

## Descartados por equivalência de patch (3 branches)

| Branch | Motivo |
|---|---|
| `chore/handoff-03-genesis-brand-system-20261120` | patch já na main |
| `chore/handoff-03-design-tokens-v2-20261120` | patch já na main |
| `agente/00-onda1-bloqueadores-p0` | patch já na main; merge conflitaria em 7 arquivos de segurança — **proibido mergear** |

## Em quarentena

| Branch | Conteúdo |
|---|---|
| `chore/handoff-devin-consolidacao-global-20261120` | 55 staged = reversão pré-#485 + docs `.agents/`; AHEAD=0 — nada a integrar da branch em si; docs legítimos serão extraídos para branch nova |

## Conflitos de merge encontrados

Apenas `agente/00-onda1-bloqueadores-p0` (descartada por equivalência): `command.processor.ts`, `recording/storage.ts`, `rbac/enforcer.ts`, `db/replication.ts`, `baileys.client.ts`, `ToolEngine.ts`, `mobile/security/storage.ts`.

## Sobreposição documental a verificar na Fase 2

- A raiz (`chore/handoff-00-despacho-wave-a-b-20261120`) tem 24 arquivos não commitados, vários com **nomes idênticos** aos handoffs das branches 03 e antigravity (ex.: `03-para-00-continuidade-genesis-brand-system-telas-20261120.md`). Deduplicar por conteúdo antes de commitar.
- `consolidacao_backlog_birthub360` e `agente/00-plano-mestre-operacional-100-agentes` tocam arquivos vizinhos em `.agents/runs/consolidacao-20261120/` (`00-INDICE`, `12-PLANO-MESTRE`) — verificar sobreposição de versões na integração.
