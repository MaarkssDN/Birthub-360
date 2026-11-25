# 00 — ÍNDICE DA CONSOLIDAÇÃO GLOBAL
Data: 2026-11-20 · Autor: Agente 00 (Devin) · Protocolo: V2.0

## Documentos
| Arquivo | Conteúdo |
|---|---|
| 00-INDICE-CONSOLIDACAO.md | Este índice |
| 01-ESTADO-GLOBAL-BIRTHUB360.md | Diagnóstico executivo e estado verificado |
| 02-BACKLOG-MESTRE.md | Tarefas únicas G-01…G-30+ com status canônico |
| 03-MATRIZ-AGENTES.md | Roster vigente (100 agentes) + remapeamento pendente |
| 04-REGISTRO-DECISOES.md | Decisões vigentes, substituídas e pendentes |
| 05-MAPA-DEPENDENCIAS.md | Ordem lógica de execução e bloqueios |
| 06-MATRIZ-RISCOS.md | Riscos técnicos, operacionais e de governança |
| 07-ARQUIVAMENTO-CONVERSAS.md | Situação de arquivamento por conversa |
| 08-MEMORIA-OPERACIONAL.md | Contexto autocontido para continuidade |
| 09-PLANO-DE-CONTINUIDADE.md | Sequência priorizada de próximas ações |
| 10-PROVENIENCIA-E-EVIDENCIAS.md | Fontes, verificações e níveis de confiança |

## Fontes processadas
1. Conversa "débitos/login/CRM + onda saneamento" (esta sessão, 19–20/11) — relatórios completos de 8 subagentes + 3 revisões do Agente 24.
2. Evidência indireta de conversas paralelas via GitHub/git: Waves D/E (idempotencyKey, guardrails, SSRF), Onda 1 (a11y/labels), AUD-1 (segurança), adoção da arquitetura 100 agentes (#455/#456), triagem de handoffs (#433), brand-system (#449), auditoria de dívidas técnicas (#456).
3. Estado autoritativo verificado: `gh pr list/view/checks`, `git log origin/main`, `git worktree list`, `.agents/runs/release-readiness-audit-state.json`, `AGENTS.md` vigente.

## Nível de confiança
- ALTO: tudo verificado via gh/git nesta sessão (PRs, merges, commits, checks).
- MÉDIO: conteúdo de waves paralelas inferido de títulos/branches de PRs — relatórios forenses originais não recebidos.
- PENDENTE: re-reconciliação release-readiness 2026-11-20 (subagente em execução) e mapa de equivalência de agentes (subagente em execução) — resultados serão anexados como adendo.
