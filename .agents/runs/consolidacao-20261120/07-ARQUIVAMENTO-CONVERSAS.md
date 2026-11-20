# 07 — SITUAÇÃO DE ARQUIVAMENTO POR CONVERSA/FONTE

| Conversa/Fonte | Relatório recebido? | Contexto integrado? | Evidências preservadas? | Pendências transferidas? | Classificação | Arquivamento? |
|---|---|---|---|---|---|---|
| **A — Orquestração handoffs Waves A–E** (esta sessão) | Sim (resumo + trabalho ao vivo) | Sim — backlog G-01…G-30 | Sim — PRs #381–#466 verificados via gh/git | Sim — G-05…G-30 | **COMPLETA** | ✅ Recomendo arquivar após commit deste pacote |
| **B — Sessão UX/US-E-UX + memória central** | Sim — `.agents/runs/00-memoria-operacional-central-20261119.md` | Sim — decisões D-07, riscos, backlog parcial | Parcial — doc **untracked** | Sim — UX-05/08/09, P0-0004 | **COM RESSALVAS** | ⚠️ Arquivar somente após commitar o doc-fonte |
| **C — Sessões paralelas de débitos** (PRs #415–#466, audits #455/#456) | Não — apenas evidência indireta (PRs) | Parcial — backlog cobre os PRs, não os relatórios | Parcial — `.agents/runs/audit-2026-11-18/*` no repo | Sim — verificação de cobertura #435/#440 | **NÃO APTA** | ❌ Aguardar relatórios das sessões |
| **D — Conversas anteriores à onda handoffs-20261117** (ondas 1–6, forense, reconciliação) | Não — apenas handoffs/runs no repo | Parcial — via `.agents/handoffs/**` e `.agents/runs/**` | Sim — artefatos versionados | Sim — 36 handoffs abertos | **NÃO APTA** | ❌ Handoffs ainda ativos |

## Critérios de arquivamento (protocolo §10)

- **A**: todos os critérios atendidos → apta.
- **B**: falta apenas persistir o doc-fonte → apta após commit.
- **C/D**: não recomendo arquivar — contexto essencial ainda não recuperável sem as conversas.

## Informação que precisa ser recuperada antes de arquivar C/D

- Relatórios de conclusão dos agentes das ondas de débitos (AUD-1, DEBT-*, 100-agentes).
- Decisões tomadas na sessão UX sobre perfis 02A–02D e canonização landing.
- Estado de validação de #435 (backup) e #440 (workers) contra DEBT-0002/0003.
