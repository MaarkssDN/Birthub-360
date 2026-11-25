# 01 — ESTADO GLOBAL DO BIRTHUB 360
Data de verificação: 2026-11-19 · Verificação: git/gh somente-leitura

## Produto
CRM/prospecção multi-tenant: React+TS+Vite, backend modular `src/features/*`, Prisma/Postgres, integrações Bitrix24/WhatsApp/voz/IA. Governança multi-agente formal (AGENTS.md §§1–41; roster 00–18, 21–24 + especialistas de slot 01A/02A–D/03A–G/06A/08A).

## Estado de release: **NO-GO** (VERIFICADO)
Fonte: `.agents/runs/release-readiness-audit-state.json` — fase `RECONCILIADO_2026-11-19_NO_GO_MANTIDO`, origin/main de referência `1bca0a9e4` (main atual já avançou além).

### Bloqueadores P0 de código (RELATADO pela reconciliação; não reverificado item a item)
| ID | Item | Dono sugerido |
|---|---|---|
| P0-0001 | Deploy sem migration/healthcheck | 08A/10 |
| P0-0002 | Sem backup/restore real | 10 |
| P0-0003 | Gap de consumers worker (topology) | 16 |
| P0-0004 | Escopo mobile no release | DECISÃO HUMANA |

### P1 (resumo da reconciliação)
1 resolvido em main (0016 batchUpdate via #390+#395); ~6 parciais; ~11 pendentes acionáveis; 4 dependem de decisões humanas (escopo voz/mobile, consentimento IA).

## Estado git (VERIFICADO 2026-11-19)
- `origin/main` tip observado: `5174664b2` (docs DEM-002 #379) — histórico recente inclui merges de handoffs, idempotencyKey (#445/#448), brand system, wave E.
- PRs abertos: **30** (lista completa em `10-PROVENIENCIA` / `gh pr list`).
- `.agents/handoffs/`: 147 entradas; `.agents/reviews/`: 350 entradas (inclui histórico).
- Branch de trabalho da sessão: `agente/00-integracao-skills`; último push `5d6448811` (consolidação UX Onda A+B, com parecer 24).
- PR #421 mergeado (`db1d23170`) — governança UX + WB-1 em main. Verificação pós-merge 24: APROVADO.

## Entregas UX verificadas em main
- Perfis oficiais 02A–02D; `.agents/experience/` (diagnóstico, arquitetura, protocolo auditoria, roadmap A–F).
- AGENTS.md locais: landing→02, gamification→02, sales-orchestration→17, `src/components/` raiz (CrmBoard→04).
- Correções WB-1 mergeadas: UX-02, UX-03, UX-07, UX-10, UX-11, UX-N3 (commit `5d6448811` + anteriores; parecer 24 APROVADO).

## Lacunas de verificação
- Estado real de cada um dos 30 PRs (checks/mergeable) não auditado individualmente nesta consolidação.
- Working tree local tem WIP de múltiplas sessões (docker-compose, alertmanager, skills, testes) — não inspecionado exaustivamente; risco de perda registrado em `06-MATRIZ-RISCOS`.
