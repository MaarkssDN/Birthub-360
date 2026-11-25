# 08 — MEMÓRIA OPERACIONAL (snapshot autocontido)
Data: 2026-11-19 · Propósito: continuar gerenciando o Birthub 360 sem depender das conversas antigas.

## Quem é quem (resumo operacional)
- **Orquestrador Humano:** autoridade final; aprova decisões, merges, arquivos protegidos.
- **Agente 00 (eu):** coordenação, `.agents/runs/**`, backlog, esta consolidação.
- **Agente 24:** revisão independente obrigatória — sem APROVADO não há aceite/merge/release.
- Execução: agentes donos por domínio (ver `03-MATRIZ-AGENTES.md`).

## Verdades operacionais (não esquecer)
1. **Release = NO-GO.** P0: deploy+migration, backup real, worker consumers. Decisões humanas pendentes: escopo mobile, consentimento IA, escopo voz.
2. **UX governança ENTREGUE em main** (PR #421): perfis 02A–02D, `.agents/experience/`, ownership formalizado.
3. **WB-1 auditoria aprovada (24 v3):** UX-01…11 re-verificados em `main@8b40cdb90`. Correções UX-02/03/07/10/11/N3 mergeadas (`5d6448811` etc.).
4. **Decisão de produto:** leads NÃO têm criação manual — nascem de prospecção/Bitrix. Backend `POST /api/leads` preservado.
5. **~30 PRs abertos** precisam de integração em levas ordenadas (ver `05-MAPA-DEPENDENCIAS.md`). Vários com CONFLICTING.
6. **Working tree é disputado:** múltiplas sessões trabalham no mesmo clone. SEMPRE: worktree próprio, commits seletivos, nunca `stash pop` sem triagem.
7. **Handoffs/runs/reviews são a memória do sistema** — nada importante só no chat.
8. **Prompts e AGENTS.md são protegidos** — mudança só com autorização humana explícita.

## Como retomar o trabalho
1. Ler este diretório `00-consolidacao-global/` (começar por `02-BACKLOG-MESTRE.md` e `09-PLANO-DE-CONTINUIDADE.md`).
2. Verificar `git fetch && git log origin/main -10` e `gh pr list` para estado atual.
3. Apresentar ao usuário as decisões pendentes DEC-P01…P07 antes de novas execuções.
4. Para qualquer correção: missão §11 → worktree → gates (tsc/lint/build) → run report → handoff 24 → só então merge.

## Números de referência
- Main auditada WB-1: `8b40cdb90` · Main em 19/11: `5174664b2`+ · PR #421 merge: `db1d23170`
- Correções: `f2d4d596b`, `bc061e229`, `5d6448811`, `e1fa7e823`, `e8363f441`
- Issues abertas conhecidas: #200 (coverage), #201 (visual snapshots)
