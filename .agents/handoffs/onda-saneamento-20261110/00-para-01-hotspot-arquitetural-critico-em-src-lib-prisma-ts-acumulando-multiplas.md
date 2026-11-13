De: Agente 00 — Coordenador
Para: Agente 01 (Plataforma, Segurança e Dados)
Onda: Onda 1 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-013)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

**Hotspot arquitetural crítico em src/lib/prisma.ts acumulando múltiplas responsabilidades**

- **Dívida técnica:** BT360-DT-0010
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Acúmulo continuado de plugins e handlers em um único ponto central de entrada do ORM.

**Impacto:** Dificuldade em testar interceptores de forma isolada e alto risco de quebra global da camada de dados em refatorações.

## Arquivo(s) envolvido(s)

`src/lib/prisma.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-013`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-013` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução (Agente 01 — 2026-11-10, worktree agente-01-refatoracao-prisma)

**Implementação concluída; gates de compilação/lint/teste NÃO executados neste ambiente** — o agente rodou em background e as ferramentas de execução (`npx`, `npm`, `node`, `git commit`) foram negadas por política de permissão. Diff revisado manualmente; evidência abaixo. **Pendente:** rodar os gates e parecer do Agente 24 antes de considerar encerrado.

### O que foi feito (alteração cirúrgica, comportamento preservado)

Extração dos interceptores PUROS de `$allOperations` para módulo próprio sem efeitos colaterais de boot (`pg.Pool`, Prometheus), seguindo o padrão já estabelecido por `src/lib/crypto/piiFields.ts`:

- **Novo:** `src/lib/prisma-interceptors.ts` — contém `BYPASS_RLS_ALLOWED_MODELS` + `resolveBypassRls`, `AUDITABLE_MODELS`/`isAuditableModel`, `injectTenantIntoWriteArgs`, `applyPiiEncryptionToWriteArgs` (com índice cego de Contact), `applySoftDeleteReadFilter` e `decryptNestedContactPii`. Todas cópias fiéis dos blocos inline, incluindo mutação in-place de `args` e guards multi-tenant (`delete` de `organizationId`).
- **`src/lib/prisma.ts`**: 927 → ~640 linhas; os blocos inline foram substituídos por chamadas às funções extraídas, na MESMA ordem (tenant → cifragem PII → soft-delete read). Comentários de justificativa (allowlist de bypass, índice cego) migraram com o código.
- **`src/lib/crypto/piiFields.ts`**: apenas atualização de comentário apontando a nova localização de `decryptNestedContactPii`.
- **Novo:** `src/lib/__tests__/prisma-interceptors.unit.test.ts` — 15 testes cobrindo sucesso E falha: bypass negado em produção para model fora da allowlist (Company/Contact), injeção de tenant e remoção de `organizationId` em update/upsert, cifragem + índice cego parcial vs. completo, soft-delete filter, descriptografia aninhada, isolamento de falha de decrypt (`DECRYPTION_FAILED_MARKER`) e limite de profundidade.

### Gates — NÃO EXECUTADOS (bloqueio de permissão do ambiente)

Comandos que devem ser rodados antes do parecer do 24:

```bash
npx tsc --noEmit
npm run lint
npx vitest run -c vitest.unit.config.ts src/lib/__tests__/prisma-interceptors.unit.test.ts src/lib/crypto/__tests__/
```

Sem commit realizado (git commit negado em background). Alterações estão unstaged no worktree.

### Riscos

- Refatoração de arquivo crítico de dados: diff é movediço fiel, mas sem `tsc`/testes executados há risco residual de erro de tipo/import — mitigado por revisão manual do diff completo.
- `src/lib/prisma-interceptors.ts` é arquivo novo sob `src/lib/` (escopo do Agente 01 como utilitário de segurança/dados); teste colocado em `src/lib/__tests__/` (colocalizado, incluído pelo vitest.unit.config) para não invadir `tests/` (propriedade do Agente 08) — se o 00 preferir, pode ser movido para `tests/unit/lib/`.
- Comportamento externo inalterado: nenhuma assinatura pública de `prisma.ts` mudou (`prisma`, `withRlsContext`, `runInTransaction`, `TENANT_INJECTED_MODELS`, `isInActiveTransaction`, `TransactionClosedError`, `TransactionTenantMismatchError`, métricas `dbPool*` permanecem).
