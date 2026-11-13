# Run Report — Agente 01 · TAREFA-SANEAMENTO-044 / BT360-DT-0009

- **Data:** 2026-11-12
- **Onda:** W3 (saneamento-20261110)
- **Branch:** `agente/01-w3-firstuser-count` (base `main`)
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-01-logica-de-criacao-de-primeiro-usuario-executa-user-count-redundante-pa.md`
- **Modo de execução:** sequencial pelo operador único (Devin), sem worktrees paralelos — branches por missão conforme §12/§17.

## Veredito sobre a dívida

**A causa raiz já estava eliminada antes desta wave.** O `user.count` redundante em
`src/lib/auth.ts` foi removido no commit `5709caaa2` ("fix(audit): remedia 21 dívidas
técnicas remanescentes do inventário 2026-10-14 — onda-saneamento-20261015 wave 2"):

```
- const userCount = await prisma.user.count();
- role: isFirstUser ? 'ADMIN' : 'ADMIN',
+ role: 'ADMIN', // Fundador de org sempre é ADMIN
```

Estado atual (`src/lib/auth.ts`, `databaseHooks.user.create.before`): quando
`!user.organizationId`, o hook cria `Organization` + `Setting('organization.modules')`
e retorna `role: 'ADMIN'` — sem nenhuma consulta de contagem. `grep "user.count" src/`
não retorna ocorrência no fluxo de auth (somente `team.service.ts`/`PrismaTeamRepository.ts`,
fora de escopo e não relacionados).

Nenhuma alteração em `src/lib/auth.ts` foi necessária — fabricar diff violaria P3
(alteração cirúrgica) e §30 (verdade operacional).

## Entrega

- `tests/integration/auth-founder-admin.test.ts` (novo) — trava de regressão do
  critério de aceite nº 3:
  1. **Sucesso:** fundador recebe `ADMIN`, organização criada, `Setting`
     `organization.modules` inicializado.
  2. **Sucesso/semântica:** segundo fundador consecutivo também recebe `ADMIN` da
     própria organização — prova que não há gate de contagem global residual
     (o ADMIN é por-fundador-de-org, não "primeiro usuário do sistema").
  3. **Falha:** segundo sign-up com o mesmo e-mail é rejeitado.

## Suposições

- `tests/**` é área do Agente 08 (§15/AGENTS.md local), mas o handoff exige testes da
  área afetada e o arquivo é **aditivo** (nenhum teste existente alterado). Registrado
  para ciência do 24/08.
- A semântica vigente "fundador de org nova = ADMIN" é a correta para SaaS multi-tenant;
  a redação antiga "primeiro usuário do sistema" estava obsoleta desde a introdução de
  organizações por cadastro.

## Gates

- `npx tsc --noEmit`: _pendente — node_modules em instalação (`npm ci`)_
- `npm run lint`: _pendente_
- `npx vitest run -c vitest.integration.config.ts tests/integration/auth-founder-admin.test.ts`:
  **BLOQUEADO por infra** — não há `.env.test` nem Docker daemon nesta estação
  (`docker: command not found`); o teste exige Postgres real via
  `tests/helpers/integration-setup.ts`. Execução fica para o gate de integração do 00/08.

## Evidências

- `git log -S "user.count" -- src/lib/auth.ts` → `5709caaa2`, `177a55fb0`.
- `git show 5709caaa2 -- src/lib/auth.ts` → remoção do `userCount`/`isFirstUser`.
- `grep -n "count" src/lib/auth.ts` → zero ocorrências.

## Status do handoff

Atualizado para `em-andamento` → aguardando parecer do Agente 24 (não marcar
`resolvido` — §18).
