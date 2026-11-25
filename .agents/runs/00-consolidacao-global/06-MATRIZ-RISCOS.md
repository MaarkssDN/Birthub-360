# 06 — MATRIZ DE RISCOS
Data: 2026-11-19

| ID | Risco | Sev | Prob | Impacto | Mitigação |
|---|---|---|---|---|---|
| R-01 | Release NO-GO mantido — P0 deploy/backup/worker sem dono executando | P0 | Alta | Release bloqueado indefinidamente | decisões DEC-P02/P07 + missões 08A/10/16 |
| R-02 | ~30 PRs abertos acumulando conflitos (4 já CONFLICTING) | P1 | Alta | Integração caótica, retrabalho | levas ordenadas §05 + gate a cada 2–3 |
| R-03 | Working tree compartilhado por múltiplas sessões — WIP alheio, stash, rebase inesperados (já ocorreu: governança revertida no disco, dirty merge quase entrou) | P1 | Alta | Perda/corrupção de trabalho | worktrees obrigatórios; commits seletivos; verificar `git stash list` antes de pop |
| R-04 | Decisões humanas bloqueiam 4+ itens P0/P1 | P1 | Certa | Frentes paradas | apresentar lista DEC-P* consolidada |
| R-05 | Merge "dirty" de WIP alheio (precedente: alertmanager blackhole, testes deletados no PR #421 v1) | P1 | Média | Regressões silenciosas em main | 24 audita diff real do merge (não só commits); verificar pais |
| R-06 | `.agents/experience/**` sem dono §15 | P3 | Baixa | Edições sem responsável | DEC-P05 |
| R-07 | Coverage SonarQube 76→80% (issue #200) + 11 visual snapshots (issue #201) | P2 | Média | Quality gate falha em PRs novos | #404/#403 + baseline Linux |
| R-08 | Estado de 147 handoffs não triados exaustivamente | P2 | Média | Handoffs órfãos/zumbis | triagem Wave D já removeu 8; continuar |
| R-09 | Conversas-fonte das outras frentes não recebidas — consolidação baseada em artefatos, não em relatórios completos | P1 | Alta | Lacunas de contexto | Orquestrador enviar relatórios; marcar confiança R/C |
| R-10 | `stash@{0}` contém WIP misto meu+alheio — pop pode conflitar | P2 | Média | Conflito/duplicação | não dar pop sem triagem; registrar |
| R-11 | Branch `agente/00-integracao-skills` divergente de main (commits de consolidação local não mergeados?) | P2 | Média | Trabalho não integrado | verificar se `5d6448811` está em origin/main |
| R-12 | Testes/e2e pesados e flaky (#403) | P2 | Média | Gates instáveis | Onda 6 flaky em PR |

## Riscos de perda de trabalho (registro §6 do protocolo)
- **Não commitados (WIP alheio):** docker-compose, alertmanager.yml, globals.css, domainEventMesh, skills novas, fonts, testes de outras frentes — NÃO apagar/commitar sem dono.
- **Untracked relevantes:** `identidade-visual/brand-system/`, scripts coverage, reviews avulsos.
- **Commits locais possivelmente não pushados:** verificar `git log origin/main..HEAD` em cada branch de agente antes de arquivar conversas.
- **Decisões só em chat:** DEC-P01…P07 aguardam resposta — se a conversa for perdida, decisões se perdem → por isso este registro existe.
- **Worktrees:** 20+ worktrees de agentes + wt-base — verificar branches não publicadas antes de limpeza.
- **Relatórios de ferramentas:** outputs longos truncados — evidência primária são os arquivos `.agents/**` commitados.
