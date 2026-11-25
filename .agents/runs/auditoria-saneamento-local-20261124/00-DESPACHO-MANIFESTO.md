# Manifesto de Despacho — Auditoria de Saneamento Local 2026-11-24

Coordenador: Agente 00 — Astra
Data de despacho: 2026-11-24
Ambiente: Windows, Git Bash. Clone C: `C:\Github\Birthub-360`, Clone D: `D:\Github\Birthub-360` (repo do coordenador).
Capacidade observada no despacho: 12 núcleos lógicos, ~5,5 GB RAM livre, D: ~138 GB livres, C: ~20 GB livres.

## Sessões executoras (8/8 ativas em paralelo)

| Despacho | Agente | agent_id | Escopo | Arquivo de entrega |
|---|---|---|---|---|
| 01 | 19 — Bruno | bc705853 | Backups, worktrees órfãos, bundles, restauração | despacho-01-agente-19-preservacao.md |
| 02 | 04 — Téo | 6d2b65b6 | Reconciliação git C:×D: (253 commits, 10 branches, 4 commits D:) | despacho-02-agente-04-reconciliacao.md |
| 03 | 02 — Bento | e7dda0fb | Alterações não commitadas, patches, inventário | despacho-03-agente-02-nao-commitadas.md |
| 04 | 06 — Gael | e2c2229b | Integridade de dados, PII, dumps, bancos locais | despacho-04-agente-06-integridade-dados.md |
| 05 | 98 — Safira | 69ad0435 | Inventário sanitizado de segredos e credenciais | despacho-05-agente-98-segredos.md |
| 06 | 99 — Vito | 9e67b936 | Segurança do histórico git das refs candidatas | despacho-06-agente-99-historico-git.md |
| 07 | 90 — Hélio | 240546dc | Dependências locais e plano de transição para nuvem | despacho-07-agente-90-infra-nuvem.md |
| 08 | 94 — Tess | fa45c4fd | Plano de publicação controlada (sem push/PR) | despacho-08-agente-94-publicacao.md |

## Regras aplicadas a todos os despachos

- Ownership exclusivo: cada agente escreve apenas arquivos `despachoNN-*` neste diretório.
- Sem sobreposição de escrita nos repositórios fonte; inspeção majoritariamente read-only.
- Proibido: reset destrutivo, exclusão de worktrees, force push, merge na main, deploy, rotação de segredos, push/PR.
- Segredos: nunca reproduzir valores; somente caminho + SHA256 + tipo.
- Cada agente registra ID de sessão, início/fim e estado real.

## Auditoria independente

Agente 09 — Íris/Silas (auditoria independente) será despachado após o recebimento das 8 entregas, antes da consolidação final e de qualquer declaração de liberação.

## Estado

- Ambiente local: **NÃO LIBERADO**.
- Aguardando conclusão dos 8 despachos.
