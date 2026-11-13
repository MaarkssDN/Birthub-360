De: 00 — Coordenador
Para: 08 — QA e Release
Onda: paralela-8
Status: resolvido
Prioridade: alto

## Problema
Verificar e corrigir falhas reais da suíte unitária `vitest.unit.config.ts`. No diagnóstico do coordenador a suíte estava em execução; logs mostraram stack trace em `tests/unit/intelligence/universalTools.integrationSecrets.test.ts` (~linha 308, `IntegrationSettingsTenantError`) que precisa ser classificado como falha real ou erro esperado logado.

## Evidência
Execução parcial do coordenador: `npx vitest run -c vitest.unit.config.ts --no-file-parallelism` (log em `unit_diag.txt` na raiz do worktree principal — pode não existir no worktree; reexecutar).

## Alteração necessária
1. Rodar a suíte unitária no worktree.
2. Para cada falha: classificar (defeito de produto vs defeito de teste vs ambiente).
3. Corrigir defeitos de produto somente dentro do escopo mínimo necessário; defeitos de teste no arquivo de teste; problemas de ambiente → reportar, não mascarar.
4. Se a suíte completa for inviável (>30min), priorizar os arquivos de teste que falharam e declarar cobertura parcial honestamente.

## Teste esperado
`npx vitest run -c vitest.unit.config.ts` → relatar contagens reais de pass/fail. `npx tsc --noEmit` limpo.

## Contexto
Worktree: `.claude/worktrees/ag-08`, branch `agente/08-unit-failures`. Não alterar código de produção fora do estritamente necessário para corrigir falha comprovada; se a correção exigir arquivo de outro dono, abrir handoff.

## Resolução

- **Executado por:** Agente 08 em 2026-11-12, worktree `Birthub-360-worktrees/agente-08-qa`, branch `agente/08-qa-saneamento` @ `a8ce7646f` (origin/main pós-merge do PR #240).
- **Comando:** `npm run test:unit` (`vitest run -c vitest.unit.config.ts --no-file-parallelism`), execução completa serial.
- **Resultado real:** **771 arquivos de teste, 5918 testes passaram, 1 skipped, 0 falhas** — duração 2464s (~41min). Nenhuma falha para classificar.
- **Arquivo da suspeita inicial:** `tests/unit/intelligence/universalTools.integrationSecrets.test.ts` passou integralmente (23 testes, 160ms) — o stack trace `IntegrationSettingsTenantError` visto no diagnóstico parcial do coordenador era log esperado do próprio teste (caminho de erro coberto), não falha.
- **Nota de cobertura:** a suíte coletou 771 arquivos; o arquivo `tests/unit/brand/fixtures-brand-hygiene.test.ts` (criado nesta mesma sessão, commit `95137518b`) não entrou na coleta porque foi escrito durante a execução — foi verificado separadamente com `npx vitest run -c vitest.unit.config.ts tests/unit/brand/` → 5/5 verdes.
- **Gates:** `npx tsc --noEmit` → limpo (exit 0). `npm run lint` (`biome lint src`) → 0 erros, 1498 warnings pré-existentes em `src/**` (nenhum introduzido por esta entrega — os arquivos alterados estão fora de `src/`).
- **Conclusão:** suíte unitária de `main` está verde; nenhuma correção de produto ou de teste foi necessária.
