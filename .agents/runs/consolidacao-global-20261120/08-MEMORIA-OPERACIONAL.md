# 08 — MEMÓRIA OPERACIONAL (snapshot autocontido)
Data: 2026-11-20 · Propósito: continuidade sem depender dos chats

## Quem é quem (resumo operacional)
- **Orquestrador Humano**: autoridade final; aprova merges críticos, escopo, decisões D-P*.
- **Agente 00 (eu/Devin)**: coordenação, consolidação, .agents/runs, despacho de subagentes.
- **Auditor**: AGENTS.md vigente → **09 Silas** (era 24 no legado). Pareceres em `.agents/reviews/`.
- **Governança**: 100 agentes/squads — mapa de equivalência legado EM PRODUÇÃO (ver 03).

## Estado em uma página
- `main` recebeu ~50 merges em 18–20/11. Healthchecks instáveis por: advisory GHSA-7589 (resolvido #465), ownership test × AGENTS.md 100ag (aguarda #466), flakes UI "Round 1 de 3".
- Débitos release-readiness: maioria atacada; veredito formal pendente de re-reconciliação (subagente rodando → `.agents/runs/00-reconciliacao-release-readiness-20261120.md` + state JSON atualizado).
- PRs abertos críticos: **#466** (destrava tudo), **#434**, **#437** (débitos, aprovados pelo auditor), #401 (SSRF), #396/#397/#415 (AUD-1), Wave E ~8, Onda 1 ~5, stale ~10.

## Comandos úteis
```bash
gh pr list --repo MaarkssDN/Birthub-360 --state open
gh pr checks <N> --repo MaarkssDN/Birthub-360
gh run view --repo MaarkssDN/Birthub-360 --job <JOBID> --log-failed
git worktree list
```

## Regras de ouro desta casa
1. Nunca mergear sem checks verdes + parecer do auditor, salvo `--admin` justificado (registro em 05).
2. `biome format` ANTES de push (2 quebras de main por isso — lição registrada).
3. Worktree isolado por agente; nunca compartilhar working tree.
4. schema.prisma → 11 Pietro; migrations → 12 Vera; queue/** → 23 Pina; workflows → 94 Tess; reviews → 09 Silas; runs → 00 Astra.
5. `.agents/handoffs/` formato §18; `.agents/reviews/` vereditos APROVADO/REPROVADO/BLOQUEADO.
6. Decisões humanas pendentes: lista D-P1..D-P12 em `04-REGISTRO-DECISOES.md` — NÃO despachar frentes dependentes antes.

## Pendências operacionais vivas
- Re-run checks #434/#437 após #466 mergear → merge.
- Envs EC2 + agendamento backup + destino off-site (bloqueado em decisão).
- Handoffs schema: enum Pending, EmailMessage cols.
- CRM-08, start_cadence, DEBT-0012 (onda dedicada), List-Unsubscribe, flaky tests, docs SRE, deploy .ps1.
- Faxina de 46 worktrees e PRs stale.

## Onde está o quê
- Consolidação: `.agents/runs/consolidacao-global-20261120/` (10 docs)
- Re-reconciliação: `.agents/runs/00-reconciliacao-release-readiness-20261120.md` (em produção)
- Mapa agentes: `.agents/runs/00-proposta-mapa-agentes-20261120.md` (em produção)
- Reviews 24: `.agents/reviews/debt00*-24.md` (9 arquivos commitados `730fa7b63`, mergeados via #446)
- Audit state: `.agents/runs/release-readiness-audit-state.json`
