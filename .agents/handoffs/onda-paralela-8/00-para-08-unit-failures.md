De: 00 — Coordenador
Para: 08 — QA e Release
Onda: paralela-8
Status: aberto
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
