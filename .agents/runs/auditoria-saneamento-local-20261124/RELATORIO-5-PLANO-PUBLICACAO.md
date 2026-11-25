# RELATÓRIO 5 — PLANO DE PUBLICAÇÃO
**Status:** PREPARADO — **nenhum push ou PR executado** (aguardando autorização humana específica, conforme missão §9).

## 5.1 Estado atual de publicação

- Remote: `github.com/MaarkssDN/Birthub-360` (autenticado via `gh` como `MaarkssDN`).
- `origin` possui 657 refs remotas conhecidas — o remote já contém grande parte do trabalho das ondas via pushes anteriores.
- **253 SHAs únicos permanecem fora de `origin/*`** (união dos dois clones).
- PRs abertos relevantes: #530–#539 (preservação/handoffs/pareceres).

## 5.2 Estratégia de publicação (proposta)

### Fase P1 — Branches de preservação (imediata, sem integração)
1. Criar branches espelho `preserve/local-20261124/<nome>` para cada branch local com commits não publicados, a partir do clone C: (fonte primária) e do clone D: (4 exclusivos).
2. Push para `origin` das ~83+57 branches — **somente após autorização**.
3. Alternativa de menor risco: push das branches já com upstream primeiro (3 branches `ahead`), depois as demais por squad.

### Fase P2 — Reconciliação de divergências
4. Para as 10 branches homônimas divergentes: merge ou escolha de SHA vencedor documentada; push somente do vencedor.
5. `integracao/consolidacao-dem20261123-candidato` (+210 commits): candidata natural a PR de integração → revisar contra `main`/branch de release antes de propor merge.
6. Resolver os 4 commits exclusivos do clone D: (cherry-pick para branch preserve ou merge).

### Fase P3 — Trabalho não commitado
7. Checkouts principais (74 untracked, handoffs/docs): commitar em branch `chore/handoff-00-saneamento-20261124` por tipo de conteúdo (handoffs → docs; scripts `.cjs` → chore).
8. `Central de Handoff de IA` (repo separado): commitar em branch própria do repo, push para o remote correspondente.
9. `DEFININDO OS AGENTES` e `RETOMADA GLOBAL…`: commitar untracked em branches `preserve/*` dos respectivos repos.
10. Worktrees órfãos: conteúdo é file-level (sem `.git`) → decidir por worktree se vira (a) commit em branch nova de um clone, ou (b) permanece como arquivo morto documentado.

### Fase P4 — Pull Requests e gates
11. PRs de integração por squad (10 squads) com gates de CI obrigatórios.
12. Merge somente após revisão do Agente 09 (Silas) — auditoria independente obrigatória (AGENTS.md §40).
13. Fechar/substituir PRs #531–#539 conforme decisão.

## 5.3 Verificação de segredos antes de qualquer push

- `git secrets`/gitleaks ou `gh secret scanning` sobre os diffs das 253 branches antes do push.
- `.env`, `.env.test`, dumps, SQLite e bancos locais: **NUNCA** publicar (classe H) — vão para cofre (§6 do Relatório 6).
- Worktrees órfãos podem conter `.env`/configs locais nos 10–13 mil arquivos — triagem obrigatória antes de qualquer commit derivado.

## 5.4 Gates de CI

- Workflows existentes em `.github/workflows/` — verificar quais gates rodam em PR (lint, typecheck, testes, visual regression).
- Branch `chore/handoff-00-despacho-wave-a-b-20261120` já é base de PRs #538 — consolidar saneamento nela ou criar `integration/saneamento-20261124`.

## 5.5 Riscos do plano

- Push de ~140 branches de uma vez pode disparar CI massivo → escalonar por squad.
- 253 commits incluem branches de agentes com WIP incompleto → branches `preserve/` isolam o risco de não quebrar `main`.
- Divergência C:×D: exige decisão humana sobre o SHA vencedor em 10 branches.
