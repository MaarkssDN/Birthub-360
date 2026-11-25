# 00 — ÍNDICE DA CONSOLIDAÇÃO GLOBAL
**Birthub 360 · Central de Inteligência Operacional · Protocolo V2.0**
Data: 2026-11-19 · Autor: Agente 00 · Autoridade: Orquestrador Humano

## Documentos
| # | Arquivo | Conteúdo |
|---|---|---|
| 00 | `00-INDICE-CONSOLIDACAO.md` | Este índice |
| 01 | `01-ESTADO-GLOBAL-BIRTHUB360.md` | Diagnóstico global verificado |
| 02 | `02-BACKLOG-MESTRE.md` | Tarefas únicas com ID global e proveniência |
| 03 | `03-MATRIZ-AGENTES.md` | Agentes, ownership, handoffs, conflitos |
| 04 | `04-REGISTRO-DECISOES.md` | Decisões vigentes/substituídas/pendentes |
| 05 | `05-MAPA-DEPENDENCIAS.md` | Ordem lógica e bloqueios |
| 06 | `06-MATRIZ-RISCOS.md` | Riscos técnicos/operacionais/governança |
| 07 | `07-ARQUIVAMENTO-CONVERSAS.md` | Controle de arquivamento por conversa |
| 08 | `08-MEMORIA-OPERACIONAL.md` | Contexto autocontido p/ continuidade |
| 09 | `09-PLANO-DE-CONTINUIDADE.md` | Próximas ações priorizadas |
| 10 | `10-PROVENIENCIA-E-EVIDENCIAS.md` | Fontes, confiança, lacunas |
| 11 | `11-DELTA-VERIFICACAO-20261120.md` | Delta verificado 20/11: 100 agentes, merges, PRs, riscos |

## Convenções
- **ID Global:** `BG-<AREA>-<NNN>` (BACKLOG GLOBAL). IDs locais de origem preservados.
- **Nível de confiança:** VERIFICADO (evidência em repo/git agora) · RELATADO (declarado em relatório) · DECLARADO-CHAT (apenas conversa, sem artefato).
- **Status canônico:** ABERTO · EM-PR · EM-EXECUÇÃO · CONCLUÍDO-VERIFICADO · CONCLUÍDO-RELATADO · BLOQUEADO · DECISÃO-PENDENTE · SUBSTITUÍDO.
- Escopo: somente leitura + documentação em `.agents/runs/`. Nenhuma alteração de código.

## Conversas registradas
| Conversa | Relatório | Protocolo | Status |
|---|---|---|---|
| C-01 | Esta sessão (missão US/UX master + consolidações) | v2.0 | PROCESSADA |
| C-02…Cn | Não recebidas | — | PENDENTE — evidência indireta via artefatos |

## Fontes de evidência indireta (não são relatórios de conversa)
`.agents/runs/*` (incl. `release-readiness-audit-state.json`, `audit-2026-11-18/*`, `auditorias-ux/WB-1/*`, `00-memoria-operacional-central-20261119.md`), `.agents/reviews/24-*`, `.agents/handoffs/**`, `AGENTS.md` vigente, `gh pr list`, `git log origin/main`.
