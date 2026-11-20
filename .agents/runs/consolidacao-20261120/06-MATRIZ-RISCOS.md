# 06 — MATRIZ DE RISCOS

| # | Risco | Severidade | Probabilidade | Mitigação / Dono |
|---|---|---|---|---|
| R-01 | **Docker 192.168.0.116:2375 sem autenticação** — daemon exposto na LAN; segredos devstack possivelmente vazados | **P0** | Alta (exposição ativa) | Ação humana no host + rotação de segredos (handoffs 00→10, 15→00) |
| R-02 | **Memória operacional não commitada** — `.agents/runs/00-memoria-operacional-central-20261119.md` untracked; única cópia | **P0** | Média | Commitar em `.agents/runs/` (autorização pendente) |
| R-03 | **NO-GO release** — deploy sem migrate/healthcheck confirmado; backup/workers mergeados mas não validados | **P0** | Certa até validação | Missões 10/16 + staging |
| R-04 | **Transição de governança 24→100 agentes** — ownerships divergentes; handoffs endereçados a números mortos | P1 | Alta | Reconciliação §15 antes de novos despachos |
| R-05 | **~26 PRs BLOCKED** concorrendo merges — fadiga de CI, risco de merge cego | P1 | Alta | Levas pequenas + gate + revisão por leva |
| R-06 | **Waivers/exceções expirando 2026-11-30** — 13 hotspot + ~30 Trivy | P1 | Alta | Renovação agendada (15/99) |
| R-07 | **PR #368 paleta** — 100 arquivos, retrabalho alto se decisão mudar | P2 | Média | Decisão de produto antes de investir |
| R-08 | **Merge "dirty" anterior** — alertmanager blackhole quase entrou; merges com pais incorretos | P1 | Baixa | Auditoria de merges do dia pelo revisor |
| R-09 | **Duplicidade de coordenação** — duas sessões 00; risco de comandos conflitantes | P1 | Média | Este consolidado como fonte única; declarar sessão ativa |
| R-10 | **Worktrees órfãos** (~20 dirs) — confusão de branch, disco | P3 | Alta | Inventário + limpeza pós-merge |
| R-11 | **`git stash@{0}` não identificado** na working tree principal | P3 | Baixa | Verificar antes de limpar |
| R-12 | **Cobertura SonarQube <80%** em código novo | P2 | Média | DEBT-0026 / PR #430 |
| R-13 | **PII detection service sem anti-encoding** — bypass residual | P2 | Média | Handoff 00→07 criado |
| R-14 | **E-mail DSR mockado** — sem SMTP local; jornada real não exercitada | P3 | Baixa | Aceito com limitação declarada (D-08) |
