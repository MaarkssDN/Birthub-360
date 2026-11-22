# Run — Agente 01 — TAREFA-SANEAMENTO-013 (refatoração de src/lib/prisma.ts)

- **Data:** 2026-11-10
- **Agente:** 01 — Plataforma, Segurança e Dados
- **Worktree/branch:** `agente-01-refatoracao-prisma` / `agente/01-refatoracao-prisma`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-01-hotspot-arquitetural-critico-em-src-lib-prisma-ts-acumulando-multiplas.md`
- **Status:** implementação concluída; **gates NÃO executados** (permissão de ferramentas negada em background); aguardando execução dos gates + parecer do Agente 24.

## Objetivo

Reduzir o hotspot arquitetural de `src/lib/prisma.ts` (927 linhas, múltiplas responsabilidades no `$allOperations`) extraindo os interceptores puros para módulo testável, sem mudança de comportamento.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/prisma-interceptors.ts` | **NOVO** — interceptores puros: `BYPASS_RLS_ALLOWED_MODELS`, `resolveBypassRls`, `AUDITABLE_MODELS`/`isAuditableModel`, `injectTenantIntoWriteArgs`, `applyPiiEncryptionToWriteArgs`, `applySoftDeleteReadFilter`, `decryptNestedContactPii` |
| `src/lib/prisma.ts` | 927 → ~640 linhas; blocos inline substituídos por chamadas na mesma ordem; imports ajustados |
| `src/lib/crypto/piiFields.ts` | 1 comentário atualizado (nova localização de `decryptNestedContactPii`) |
| `src/lib/__tests__/prisma-interceptors.unit.test.ts` | **NOVO** — 15 testes (sucesso + falha) |
| `.agents/handoffs/onda-saneamento-20261110/00-para-01-...md` | Status → `em-andamento` + seção Resolução |

## Decisões

- Seguido o padrão já documentado em `piiFields.ts`: lógica pura em módulo sem `@prisma/client` instanciado/`pg`/`prom-client`, para teste unitário sem subir `Pool` real.
- Escopo deliberadamente cirúrgico: só a transformação de `args` e a decisão de bypass (puros). Orquestração que depende do client (`executeWithRls`, tx interativa, auditoria, fila de busca) permanece em `prisma.ts` — mover isso seria refatoração não-cirúrgica de arquivo crítico.
- Teste colocado em `src/lib/__tests__/` (colocalizado, coberto por `vitest.unit.config.ts`) para não invadir `tests/` (propriedade do Agente 08).

## Comandos executados / resultados

- `git status`, `git diff`, `git branch` — OK (leitura).
- `npx tsc --noEmit`, `npm run lint`, `npx vitest ...`, `git commit` — **NEGADOS** pela política de permissão do agente em background. Nenhum gate foi rodado; nenhum commit foi criado.

## Pendências para o revisor/coordenador

1. Rodar `npx tsc --noEmit`, `npm run lint` e `npx vitest run -c vitest.unit.config.ts src/lib/__tests__/prisma-interceptors.unit.test.ts`.
2. Revisão do Agente 24 (parecer em `.agents/reviews/`) com hashes dos arquivos.
3. Commit das alterações (4 arquivos de código + handoff + este run).

## Riscos

- Sem compilação/testes executados: risco residual de erro de tipo ou import — mitigado por revisão manual do diff completo (imports órfãos removidos, assinaturas conferidas contra `async-context.ts` e crypto helpers).
- Comportamento externo inalterado: API pública de `prisma.ts` preservada.
