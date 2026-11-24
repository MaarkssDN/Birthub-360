# RELATÓRIO 7 — CANDIDATOS À LIMPEZA
**Nada foi removido.** Lista de candidatos com evidências, aguardando autorização humana (§7 e §14 da missão).

## 7.1 Descartáveis com alta confiança (classe G)

| Item | Evidência | Condição para remoção |
|---|---|---|
| `D:\Github\Birthub-360-wt\nul` e `C:\Github\wt-395-fix\` (só `node_modules`+`nul`) | arquivo `nul` é artefato de redirect Windows mal direcionado; dir sem `.git` | confirmar que `nul` não contém dados (0 bytes esperado) |
| `D:\Github\wt-466-fix\` | worktree vazio, HEAD detached, admin dir existe mas vazio | confirmar ausência de arquivos |
| `C:\Github\Central-de-Auditoria-e-Handoffs-wt\` | diretório vazio | trivial |
| `refs/remotes/local/audit` (clone C:) | remote `local` não configurado; commits contidos em branches locais | `git remote prune` ou deixar — inócuo |
| Cópias físicas C: dos worktrees `agente-01-waveF-ux05a`, `agente-02-waveF-ux09`, `wt-handoff-devin-central` | deleções em massa = conteúdo já no Git; D: tem cópia íntegra | remoção só após push das branches |

## 7.2 Órffãos cujo conteúdo precisa de decisão (não são G puros)

| Item | Destino provável |
|---|---|
| `agente-05-cold-email`, `agente-07-waveE-outbox`, `agente-08-handoffs`, `agente-14-repro-500`, `agente-16-worker-outbound`, `agente-17-waveE`, `agente-99-prisma`, `consolidacao-20261120`, `genesis-brand` | tar já preserva; decidir se vira commit em `preserve/*` ou arquivo morto |
| `wt-08-dsr`, `wt-15-cve-tools`, `wt-310-extract`, `wt-368-rebase`, `wt-399-fix`, `wt-402-fix`, `wt-cadence-fix` | provável duplicata dos órfãos acima (verificar manifestos) |
| `agente-17-cadence-debts`, `agente-04-waveE`, `dem-20261123-consolidacao/wt-00-candidato` | parciais — triagem fina |
| `Birthub-360-audit-main` | detached HEAD `0d790443d` prunable — verificar se commit está em alguma ref antes de podar |

## 7.3 NÃO candidatos (apesar de antigos)

- Qualquer branch com commits não publicados (253 SHAs) — classe B.
- Worktrees registrados limpos — seus commits podem não estar em `origin/*`.
- `Birthub-360-backups/` — manter até todos os restores testados.
- `leases/` e `.agents/runs/` — evidência de governança.
- Repos duplicados C:/D: de handoffs (`Central de Handoff de IA` ×2 etc.) — o sujo tem trabalho exclusivo; apenas o par **limpo** redundante pode ser candidato futuro, após diff.

## 7.4 Regra aplicada

Nenhum item foi classificado G apenas por ser antigo. Todos os candidatos exigem: (a) prova de conteúdo equivalente em Git/backup, (b) autorização humana, (c) execução fora desta fase.
