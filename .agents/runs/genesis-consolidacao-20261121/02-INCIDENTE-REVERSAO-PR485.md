# 02 — Incidente de Reversão PR #485 (B-01 a B-14)

## Sumário

Duas worktrees tiveram suas árvores de trabalho revertidas ao snapshot `23b84f4295c10267893f121ab4aa95fef33902bf` — estado **anterior ao merge do PR #485** (`29979fab3`, "feat(onda-1): resolução integral dos bloqueadores críticos P0"). O conteúdo do PR #485 **está na main**; a reversão existe apenas nas árvores locais contaminadas.

## Evidências

### Worktree A — `handoff-devin-consolidacao` (branch `chore/handoff-devin-consolidacao-global-20261120`, HEAD `86288f30b`, 226 atrás)

- 55 entradas staged, worktree ≡ index (zero unstaged).
- `git diff --cached 23b84f42 -- src/ tests/` → **idêntico** (`INDEX_EQ_PRE_ONDA1`).
- `docs/` e `prisma/` também idênticos ao pré-#485.
- `.agents/` difere de ambos — contém edições reais de handoff.
- Todos os arquivos deletados foram **criados pelo PR #485** (verificado via `git log --diff-filter=A`).
- Patch cached = patch HEAD (4525 linhas) — estado integralmente reproduzível.

### Worktree B — `wt-handoff-00-consolidacao` (branch `chore/handoff-00-consolidacao-global-20261120`)

- Na coleta inicial: HEAD `0000…`, branch aparentemente inexistente, ~13.291 entradas sujas.
- Reflog do gitdir mostra: `reset: moving to HEAD` em `23b84f42` → commit `b0deaf097` "docs(handoff): transfere contexto de consolidacao global ao agente 00" → HEAD zerado.
- **Preservação de emergência paralela** (outro agente/sessão, 21/11 21:44): commit órfão `5cddf447e` "Preservacao de emergencia… Snapshot integral do working tree" — 13.291 arquivos, raiz sem parent.
- Verificação: `git diff b0deaf097 5cddf447e` → **0 arquivos**. A árvore snapshot é byte-idêntica ao tip **remoto** da branch.
- Conclusão: a worktree continha uma cópia de `23b84f42` + 1 handoff já existente no remoto. **Nenhum trabalho único.**

## Arquivos afetados pela reversão (amostra)

`src/lib/auth/rbac/enforcer.ts`, `src/lib/auth/session.service.ts`, `src/lib/db/replication.ts`, `src/lib/integrations/bitrix/{client,batch/extractor}.ts`, `src/lib/integrations/whatsapp/baileys.client.ts`, `src/lib/resilience/retry.ts`, `src/lib/ai/{tools/registry,guardrails/encoding}.ts`, `src/features/notifications/opt-out/optout.service.ts`, `src/features/voice-hub/{commands/command.processor,recording/storage}.ts`, `src/mobile/security/storage.ts`, `src/lib/voice-runtime/ToolEngine.ts`, serviços de `intelligence/` e `knowledge/`, `docs/lgpd/inventario-dados.md`, `prisma/migrations/MIGRATION_ZERO_DOWNTIME_CHECKLIST.md` + ~15 arquivos de teste correspondentes.

**Se incorporados à main, reintroduziriam os bloqueadores B-01 a B-14 (RBAC, sessão, PII/LGPD, opt-out, voz, integrações, segurança mobile).**

## Hipótese de causa (não comprovada)

Restauração de árvore antiga durante o incidente de perda do `.git` documentado no handoff `devin-para-00-continuidade-consolidacao-global-20261120.md` (item 3.1: "`.git` do repo principal SUMIU… Todos os 46 worktrees apontam para esse gitdir → estão quebrados"). A coincidência de ambas as worktrees estarem no MESMO snapshot `23b84f42` sustenta a hipótese de restore em lote a partir de cópia defasada. Causa exata permanece desconhecida — registrar como risco de recorrência.

## Estado atual

- `main`: **intacta** — nenhum dos arquivos revertidos foi alterado nela.
- Worktree A: em quarentena; staged preservado em backup; aguardando aprovação para restauração.
- Worktree B: worktree limpa em `5cddf447e`; branch local divergiu do remoto (histórias não relacionadas, árvores idênticas). Recomenda-se realinhar ao remoto `b0deaf09` — pendente aprovação.
