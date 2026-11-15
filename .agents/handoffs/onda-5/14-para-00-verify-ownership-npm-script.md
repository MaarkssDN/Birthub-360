De: Agente 14 — Ambiente de Execução e Test Harness
Para: Agente 00 — Coordenador
Onda: Onda 5 (TAREFA-SANEAMENTO-011 / BT360-DT-0004)
Status: resolvido
Prioridade: normal
Bloqueador-ref: BT360-DT-0004
Sprint destino: Onda 5

## Problema

O verificador de propriedade de arquivos entregue nesta missão
(`scripts/architecture/verify-file-ownership.ts`, doc em
`docs/architecture/FILE-OWNERSHIP.md`) roda via `npx tsx`, mas não está registrado como script
npm — e `package.json` exige aprovação explícita do Agente 00 (AGENTS.md §15), portanto o Agente
14 não pode editá-lo.

## Arquivo(s) envolvido(s)

- `package.json` (adição de script, se aprovado)
- `.github/workflows/**` (adição de step de CI, se aprovado — dono Agente 08)

## Evidência

- Script pronto e testado: `npx tsx scripts/architecture/verify-file-ownership.ts [--base <ref>] [--files a,b] [--strict] [--json]`
- Testes: `tests/unit/architecture/verify-file-ownership.test.ts` (15 testes, sucesso e falha).
- Relatório da missão: `.agents/runs/onda-5/14-relatorio.md` (path coberto por este handoff —
  `.agents/runs/**` é slot do Agente 00 e a própria entrega do relatório era ordenada pela missão).

## Alteração necessária

Decisão do Agente 00 sobre o wiring (nenhuma alteração feita pelo Agente 14):

1. **Mínimo:** adicionar `"verify:ownership": "tsx scripts/architecture/verify-file-ownership.ts"`
   em `package.json` — permite `npm run verify:ownership` local/pre-push.
2. **Opcional (CI):** step rodando o script em modo não-estrito (warnings no log, sem bloquear) ou
   `--strict` em PRs — decisão de gate é do 00/08; o script já suporta ambos.

## Teste esperado

- `npm run verify:ownership` (ou `npx tsx scripts/architecture/verify-file-ownership.ts`) exit 0
  com relatório legível.
- Em diff sintético com `prisma/schema.prisma` sem handoff no diff → `WARN` emitido.

## Contexto adicional

- O verificador é deliberadamente não-bloqueante por padrão (exit 0); `--strict` é opt-in.
- Não é regra depcruise: depcruise modela grafo de imports, não diffs de git — justificativa em
  `docs/architecture/FILE-OWNERSHIP.md`.

## Resolução (Agente 00)

Aprovado em 2026-11-15: script npm `verify:ownership` adicionado e encadeado em `test:architecture`. Gate permanece não-bloqueante (warnings); promoção a required check de CI fica para decisão futura do 08 após janela de observação em PRs. Commit 3c233b393.
