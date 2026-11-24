# RELATÓRIO 6 — TRANSIÇÃO PARA A NUVEM
**Objetivo da missão:** desenvolvimento exclusivo na nuvem sem perda de trabalho local.

## 6.1 Dependências do ambiente local identificadas

| Dependência | Onde | Risco se desligar | Substituição proposta |
|---|---|---|---|
| Clone C: `C:\Github\Birthub-360` (.git ≈1,1 GB) | fonte primária de 164 commits + branches | perda total se sem backup | push de `preserve/*` → GitHub; clone cloud (GitHub Codespaces/Devin cloud) passa a ser fonte |
| Clone D: `D:\Github\Birthub-360` (.git ≈3,9 GB) | espelho divergente + 4 commits exclusivos | idem | reconciliar 4 commits → aposentar ou arquivar |
| Worktrees físicos C:/D: (~110 dirs) | checkouts de branches | perda de não commitados | já preservados; push das branches torna worktrees dispensáveis |
| Worktrees órfãos (~11 dirs, ~130 mil arquivos) | sem `.git` | perda irreversível | tar em `_backups` + decisão de commit seletivo |
| PostgreSQL local | não verificado nesta sessão (fora do escopo git) | dados de dev perdidos | dump para storage seguro ou descarte se só demo |
| Redis/Docker local | idem | filas/cache de dev | recriar em cloud (docker-compose já no repo?) |
| `.env` / `.env.test` | gitignored nos checkouts | segredos perdidos ou vazados | cofre de segredos (GitHub Secrets/1Password); nunca no Git |
| Caminhos absolutos Windows em scripts | a auditar (missão §10) | quebra em Linux cloud | parametrizar ou rodar em container Windows/WSL |
| `leases/`, `.agents/runs/` | estado de sessões de agentes | perda de coordenação | commitar como docs (já parcialmente untracked) |
| `Birthub-360-backups/` (ambos discos) | bundles históricos | perda de restores | subir para release/assets ou storage off-machine |

## 6.2 Critérios de saída (checklist de transição)

- [ ] Todos os 253 SHAs publicados em `origin` (ou equivalentes mergeados)
- [ ] Todas as branches `preserve/*` pushed e verificáveis no GitHub
- [ ] Teste de restauração dos bundles novos: `git clone` a partir do bundle em diretório isolado ✅ pendente
- [ ] Handoffs e governança (`.agents/`, `docs/orchestration/`) versionados no remote
- [ ] Segredos migrados para cofre; `.env` fora do Git
- [ ] CI executando gates obrigatórios em PRs vindos da nuvem
- [ ] Ambientes cloud reproduzíveis (Codespaces/devcontainer ou equivalente)
- [ ] Matriz de ownership dos 100 agentes disponível no remote
- [ ] Plano de recuperação documentado (este relatório + Relatório 5)
- [ ] Parecer do Agente 09 (Silas) emitido

## 6.3 Bloqueios atuais para a transição

1. **253 commits não publicados** — sem push, a nuvem não vê o trabalho das ondas/squads.
2. **Divergência C:×D:** — sem reconciliação, risco de publicar linhagem errada.
3. **~150 mil arquivos de worktrees órfãos** — sem `.git`, precisam de triagem antes de qualquer uso na nuvem.
4. **Não commitados dos checkouts principais e repos auxiliares** — handoffs documentais ainda só em disco/patch.
5. **Serviços locais (DB/Redis)** — não inventariados nesta sessão; necessário dump ou decisão de descarte antes de desligar a máquina.
6. **Autorização humana pendente** para todo push/commit corretivo.

## 6.4 Recomendação de sequência

1. Autorização → push das branches `preserve/*` (Fase P1 do Relatório 5).
2. Teste de restore dos bundles em clone isolado (prova de independência).
3. Reconciliação das 10 branches divergentes + 4 commits do clone D:.
4. Commit dos não commitados em branches `chore/`/`preserve/` por repo.
5. Revisão Silas → PRs de integração → merge.
6. Só então: plano de desligamento do ambiente local.
