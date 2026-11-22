De: 15 — Segurança Aplicada
Para: 08 — QA e Release
Onda: 1 (backlog DEM-20261113-002, item MEL-03)
Status: resolvido
Prioridade: alto
Bloqueador-ref: nenhum
Sprint destino: Onda 1

## Problema
Criado gate estático de cobertura RLS (`scripts/security/check-rls-coverage.ts`,
`npm run verify:rls-coverage`) que falha se um model com `organizationId` não
tiver ENABLE ROW LEVEL SECURITY + CREATE POLICY nas migrations. Precisa ser
ligado no CI (`.github/workflows/ci.yml` é propriedade do Agente 08).

## Arquivo(s) envolvido(s)
- `.github/workflows/ci.yml` (dono: 08)
- `scripts/security/check-rls-coverage.ts` (já criado, dono: 15/01)
- `package.json` (script `verify:rls-coverage` já adicionado)

## Evidência
```
$ npx tsx scripts/security/check-rls-coverage.ts
check-rls-coverage: OK — 133 tabelas tenant-bearing com RLS + policy verificadas (4 allowlist).
```
Sem node_modules no worktree o comando usa tsx do repo principal se necessário;
em CI roda após `npm ci` + `prisma generate` (não precisa de banco).

## Alteração necessária
Adicionar step no job de quality gates do ci.yml, junto dos outros `verify:*`:
```yaml
- name: RLS coverage gate
  run: npm run verify:rls-coverage
```

## Teste esperado
- CI verde na branch com o step adicionado.
- Regressão: remover uma policy em migration de teste deve falhar o step (opcional validar localmente).

## Contexto adicional
Allowlist no script cobre `user/session/account/verification` (better-auth,
global). Models novos com `organizationId` entram no gate automaticamente.

## Resolução (Agente 08, Onda 4, 2026-11-15, branch `agente/08-onda4-qa`)

- Step `RLS coverage gate` (`npm run verify:rls-coverage`) adicionado ao
  `.github/workflows/ci.yml`, logo após `verify:openapi-drift` e antes dos
  testes unitários — junto dos demais gates `verify:*`, sem banco necessário
  (análise estática de `prisma/schema.prisma` + `prisma/migrations`).
- Evidência local: `npx tsx scripts/security/check-rls-coverage.ts` →
  `check-rls-coverage: OK — 136 tabelas tenant-bearing com RLS + policy
  verificadas (4 allowlist).` (exit 0).
- Commit: `eb750d1a4` (`ci(08): adiciona gate verify:rls-coverage no pipeline`).
- Pendente apenas a confirmação do CI verde no PR — o step é determinístico e
  não depende de serviço externo.
