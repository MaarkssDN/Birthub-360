# 10 — Matriz Final de Integração

**Status:** ONDA I EXECUTADA em 21/11/2026 (autorização Orquestrador). Ondas II e III pendentes.

**Resultado Onda I:** merge 1 `c1b78331e` (limpo); merge 2 `bd77a9593` (1 conflito documental resolvido + fix encoding). Diff acumulado: somente `.agents/**`.

**Base de integração:** `integracao/consolidacao-20261121` @ `0d790443` (= main)
**Worktree:** `C:\Github\Birthub-360-worktrees\integracao-consolidacao-20261121`
**Data:** 2026-11-21 · Revalidação: branches e SHAs confirmados nesta data; `main` inalterada.

## Ordem de integração proposta

### Onda I — Governança estratégica (docs puras, risco mínimo)

| Ordem | Branch | HEAD | Patch | Arquivos | Conflito potencial | Reversão |
|---:|---|---|---|---|---|---|
| 1 | `agente/00-plano-mestre-operacional-100-agentes` | `5b1bc5d45` | 4 | 3 docs (+246): `00-INDICE`, `12-PLANO-MESTRE`, review Silas PR#528 | sobreposição parcial com item 2 em `.agents/runs/consolidacao-20261120/` — verificar versão | `git revert` do merge ou reset da branch de integração |
| 2 | `consolidacao_backlog_birthub360` | `125037537` | 1 | 9 docs (+826): runs/consolidacao-20261120/00–17 | idem — arquivos vizinhos aos do item 1 | idem |

### Onda II — Handoffs documentais (7 branches, 1 patch cada)

Todas merge-tree limpas isoladamente. Executar merges sequenciais verificando diff acumulado.

| Ordem | Branch | HEAD | Arquivo |
|---:|---|---|---|
| 3 | `chore/handoff-00-despacho-wave-a-b-20261120` | `e62fdd238` | 2 handoffs (despacho wave A/B + docker local) |
| 4 | `chore/handoff-00-reconciliacao-etapa-0-20261121` | `ae37cac88` | 1 handoff (+93) |
| 5 | `chore/handoff-devin-encerramento-20261121` | `0a0ec2e71` | 1 handoff (+97) |
| 6 | `devin/handoff-continuidade-merge-20261120` | `fdb806d71` | 1 handoff (+74) |
| 7 | `chore/handoff-antigravity-restauracao-governanca-20261121` | `27d0a5b2d` | 1 handoff (+78) — **idêntico ao untracked da raiz (dedup confirmado)** |
| 8 | `chore/handoff-devin-central-operacao-20261121` | `82eb67477` | 1 handoff (+80) |
| 9 | `chore/handoff-antigravity-encerramento-100-agentes-20261121` | `7f6c85930` | 1 handoff (+104) — **idêntico ao untracked da raiz** |

**Deduplicação raiz × branches (verificada):** os 2 untracked da raiz com nomes iguais aos handoffs antigravity são **byte-idênticos** às versões das branches → a versão commitada prevalece; as cópias untracked da raiz são redundantes. Os 2 handoffs `03-para-00-*` untracked da raiz **já existem na main** → descartar como duplicatas. Restam ~19 untracked únicos na raiz para avaliação individual na Onda II.

### Onda III — CI/Testes (única com código)

| Ordem | Branch | HEAD | Patches | Conteúdo | Estratégia |
|---:|---|---|---:|---|---|
| 10 | `agente/08-handoffs-20261117` | `aafad8eb7` | 10 | `.github/workflows/schemathesis-fuzzing.yml` (novo), `tests/unit/lib/voice-hub/voicehub-persistence-runid.test.ts`, fixes CI/bump, 4 handoffs | **Não mergear direto** (211 atrás). Opções: (a) merge `main→branch` na worktree dela, resolver, CI, merge de volta; (b) cherry-pick dos 10 patches para a integração. Recomendo (b) para os patches de teste/docs e análise manual do workflow. Antes: verificar URL `/api` do OpenAPI, permissões, gatilhos, pacote `schemathesis` no CI. |

### Fora de escopo (não integrar)

- `agente/00-onda1-bloqueadores-p0`, `chore/handoff-03-genesis-brand-system-20261120`, `chore/handoff-03-design-tokens-v2-20261120` — patch-equivalentes.
- `chore/handoff-devin-consolidacao-global-20261120` — AHEAD=0; docs legítimos extraídos separadamente (ver abaixo).
- 21 branches AHEAD=0 — referência histórica.

## Extração da quarentena (branch nova a partir da main)

Conteúdo legítimo preservado em `C:\Github\_backups\genesis-20261121\handoff-devin-consolidacao\`:
- `07-agents-legit-final.patch` — diff staged final de `.agents/` (7 arquivos, +102/−70) **após** restauração dos pareceres.
- `agents-files/` — cópias dos arquivos.
- Novo handoff `devin-para-00-continuidade-consolidacao-global-20261120.md` (+60) — candidato a integração na Onda II como patch adicional.

## Estado pós-itens 1 e 2 (executados)

- `handoff-devin-consolidacao`: index/worktree restaurados de `src tests docs prisma` ao HEAD `86288f30b`; 2 pareceres do Agente 09 restaurados; restam apenas os 7 arquivos `.agents/` staged (legítimos). **PR#485 preservado** — verificado: `rbac/enforcer.ts`, `session.service.ts`, `optout.service.ts`, `mobile/security/storage.ts`, `docs/lgpd/inventario-dados.md`, checklist Prisma todos presentes.
- `wt-handoff-00-consolidacao`: branch realinhada a `b0deaf09` (tracking origin), worktree limpa; commit órfão `5cddf447e` preservado na tag `backup/genesis-20261121-wt-handoff-00-snapshot`.

## Critérios de aceite por merge

Após cada merge: `git diff` acumulado revisado → sem deleções fora de `.agents/handoffs|runs|reviews` → `biome format:check` → commit com mensagem `docs(handoff): integra <branch> (Genesis Consolidation)`.
