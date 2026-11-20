# MEMÓRIA OPERACIONAL CENTRAL — Birthub 360
**Data:** 2026-11-19 · **Autor:** Agente 00 (Orquestrador Central) · **Autoridade:** Orquestrador Humano
**Escopo:** consolidação de contexto de múltiplas frentes. Fontes: sessão UX/US-E-UX master (2026-11-18/19), `AGENTS.md` vigente, `release-readiness-audit-state.json`, `audit-2026-11-18/*`, handoffs/runs/reviews do repo, `gh pr list`.

---

## 1. DIAGNÓSTICO GLOBAL

O Birthub 360 é um CRM/prospecção multi-tenant (React+TS+Vite frontend, backend modular em `src/features/*`, Prisma/Postgres, Bitrix24, WhatsApp, voz/3CX, IA) governado por um sistema multi-agente formal (AGENTS.md §§1–41, 20+ agentes oficiais + especialistas de slot). **Veredito de release vigente: NO-GO** (`release-readiness-audit-state.json`, reconciliado 2026-11-19, origin/main na época `1bca0a9e4`; hoje main avançou para `5174664b2`+).

- **Bloqueadores P0 de código abertos:** deploy sem migration/healthcheck (0001), sem backup/restore real (0002), possível gap de consumers worker (0003); 0004 mobile bloqueado por decisão humana.
- **P1:** ~6 parciais, ~11 pendentes acionáveis; 4 dependem de decisões humanas (escopo voz/mobile, consentimento IA).
- **UX:** auditoria WB-1 concluída e aprovada; correções UX-02/03/07/10/11/N3 mergeadas; restam UX-05a/b, UX-09, UX-08 (decisão), UX-06 (NO-GO).
- **Governança UX entregue em main:** perfis 02A–02D oficiais, `.agents/experience/` (diagnóstico, arquitetura, protocolo, roadmap A–F), AGENTS.md locais para landing/gamification/sales-orchestration/components.
- **PRs abertos:** ~30 (lista em `gh pr list`), incluindo ondas de handoffs, Wave D/E idempotencyKey, AUD-1 segurança por domínio, correções CRM, baseline visual CI.

## 2. MAPA DE FRENTES DE TRABALHO

| Frente | Domínio | Estado |
|---|---|---|
| Release readiness forense | 00+todos | NO-GO; P0 deploy/backup/worker pendentes |
| Governança UX/Design | 00/02/03 | Entregue em main (PR #421); correções WB-1 em andamento |
| Auditoria UX-01…11 | 02A→donos | 7 CONF/2 PARC/2 REF; correções parciais mergeadas |
| Cadência/ciclo receita | 17 | Módulos NO-GO (DEBT-0008…0011); UX-02 corrigido |
| CRM/BI | 04 | Trilha E em PRs (#434 DEBT-0017/18/19); UX-10/11 corrigidos |
| Prospecção/outbound | 05 | AUD-1 SSRF em PR #401; cold-email DEBT-0011 em PR #437 |
| Bitrix/integrações | 06/06A | Wave E idempotencyKey PRs #447–453 |
| IA/automações | 07 | Guardrails PII PR #441; DEBT-0012/0015 NO-GO |
| QA/testes | 08/14 | Schemathesis noturno #400; flaky e2e #403; coverage gate #404 |
| Mobile | 09 | iOS permissions PR #399; decisões de escopo pendentes |
| Infra/SRE | 10 | Wave E idempotencyKey PR #452; backup real P0-0002 pendente |
| Marca | 11 | Genesis Brand System mergeado (ddb55b4d6) |
| Voz/telefonia | 12 | idempotencyKey PR #450; escopo voz pendente decisão |
| Governança agentes | 13 | "100 agentes" merge em main (12b2978fb) |
| LGPD/privacidade | 21 | DSR resolvido (#381/#385); consentimento IA pendente decisão |
| Contratos/API | 18 | Envelope erro unificado PR #399 |
| Segurança | 15 | SECURE_COOKIES PR #397; effect advisory PR #465 |
| Ownership/governança | 00/08 | Manifesto sincronização PR #466 |

## 3. BACKLOG MESTRE (consolidado — ver detalhes nos relatórios-fonte)

| ID | Item | Prioridade | Dono | Status | Dependências |
|---|---|---|---|---|---|
| P0-0001 | Deploy com migration+healthcheck | P0 | 08/10 | ABERTO | decisão deploy |
| P0-0002 | Backup/restore real | P0 | 10 | ABERTO | — |
| P0-0003 | Consumers worker topology | P0 | 16 | ABERTO | — |
| P0-0004 | Escopo mobile release | P0 | humano | DECISÃO PENDENTE | — |
| UX-05a | Remover auth components mortas | P2 | 01 | PRONTO p/ missão | testes c/ 08 |
| UX-05b | Remover outbound SPA | P2 | 05+08 | PRONTO | preservar cnpj.ts |
| UX-08 | Abas settings placeholder | P3 | 02 | DECISÃO PRODUTO | usuário |
| UX-09 | Perfil editável (UI) | P2 | 02 | PRONTO | backend better-auth ok |
| UX-06 | SelfDrivingCrm órfão | P3 | 17 | BLOQUEADO NO-GO | cadência |
| DEBT-0011 | cold-email persistência | P1 | 05 | EM PR #437 | — |
| DEBT-0017/18/19 | CRM trilha E | P1 | 04 | EM PR #434 | — |
| WaveE-idem | idempotencyKey produtores | P1 | 02/07/09/10/12 | EM PRs #447–453 | merge ordenado |
| AUD-1 SSRF/config | segurança por domínio | P1 | 05/06/15 | EM PRs #396/397/401 | — |
| Coverage gate | sonar 76→80% | P2 | 08 | issue #200 | — |
| Visual baselines | 11 snapshots divergentes | P2 | 14/08 | PARCIAL (CI #419) | issue #201 |
| UX-N1/N2/N3 | cosméticos | P3 | 00 decide | N3 pode ir c/ 02 | — |

## 4. MATRIZ DE AGENTES (ativa nesta fase)

- **00** — orquestração, `.agents/runs/**`, decisões de dono pendentes.
- **02** — produto/UX + perfis 02A–02D (UX research, jornadas, IA, landing). Dono: App.tsx/nav/layout, dashboard, settings, gamification, landing.
- **03** (+enxame 03A–03G) — design/a11y/UI compartilhada.
- **04** — CRM/BI + CrmBoard (decidido 2026-11-18).
- **05** — prospecção/outbound.
- **06/06A** — integrações Bitrix.
- **07** — IA/automações (NO-GO parcial DEBT-0012/15).
- **08/08A** — QA/release/git/deploy.
- **09** — mobile. **10** — infra/SRE. **11** — marca. **12** — voz.
- **14** — test harness. **15** — segurança/segredos. **16** — runtime/workers.
- **17** — cadência (dono sales-orchestration, decidido). **18** — contratos/API.
- **21** — LGPD. **22** — verificação realidade. **23** — custo IA. **24** — revisão independente obrigatória.

## 5. MATRIZ DE RISCOS

| Risco | Sev | Mitigação |
|---|---|---|
| NO-GO release mantido (P0 deploy/backup/worker) | P0 | decisões humanas + missões 08/10/16 |
| ~30 PRs abertos concorrendo merges | P1 | integração em levas c/ gate; ordem §19 |
| Working tree compartilhado c/ WIP de múltiplas sessões | P1 | worktrees p/ paralelo; commits seletivos |
| Merges "dirty" já ocorreram (alertmanager blackhole quase entrou) | P1 | revisão 24 por diff real; verificar pais do merge |
| Conflitos PRs #361/#366/#368 | P1 | reconciliar ou fechar superseded |
| `.agents/experience/**` sem dono no §15 | P3 | proposta futura (registrada) |
| Decisões humanas pendentes (UX-08, P0-0004, consentimento IA, escopo voz/mobile) | P1 | lista consolidada p/ usuário |

## 6. MAPA DE DEPENDÊNCIAS (ordem lógica)

1. Decisões humanas pendentes (desbloqueiam P0-0004, UX-08, consentimento IA).
2. P0 release: deploy/migration (08/10), backup real (10), worker consumers (16).
3. Integração de PRs por dependência: security/advisories (#465) → AUD-1 → WaveE idempotencyKey (ordem por módulo) → Trilha E CRM → handoffs waves.
4. UX restante: UX-09 (02) → UX-05a (01) → UX-05b (05+08) → UX-08 após decisão.
5. Gates: tsc/lint/build + verify:* + parecer 24 por leva; release gate final.

## 7. DECISÕES CONSOLIDADAS

**Vigentes (aprovadas pelo usuário):**
- Perfis 02A–02D oficiais (P-01…P-05 aplicadas 2026-11-18).
- `src/features/landing/**`→02; gamification→02; sales-orchestration→17; CrmBoard→04; auth morta→01.
- UX-01 = prospecção-only (sem criação manual de lead).
- Tokens canônicos: identidade-visual→official-identity.css→globals.css.

**Substituídas/históricas:** intents palette open-create→CRM (removidos, decisão UX-01); variantes landing não canonizadas (inventário pendente Onda E).

**Não aprovadas/propostas:** `.agents/experience/**` no §15; canonização landing; remoções de código morto (aguardam missões).

## 8. PLANO DE EXECUÇÃO (próximas ações)

1. **Usuário decide:** UX-08, P0-0004 mobile, consentimento IA, escopo voz.
2. **00 emite missões:** UX-09 (02), UX-05a (01), UX-05b (05+08) — pequenas e desbloqueadas.
3. **Integração PRs:** segurança (#465 advisory, #397, #401) → WaveE idem (#447–453) → CRM (#434) → demais, gate a cada leva + 24.
4. **P0 release:** missões 08/10/16 para deploy/backup/worker.
5. **Onda E UX:** canonização landing (02D) após release estável.

## 9. PAINEL DE CONTROLE

- **Concluído+mergeado:** governança UX (PR #421 + verificação 24), correções WB-1 UX-02/03/07/10/11/N3, Genesis Brand System, DSR LGPD.
- **Em execução:** consolidação PRs (~30 abertos), WaveD/E idempotencyKey.
- **Pendente:** UX-05a/b, UX-09, UX-08(decisão), P0 release blockers.
- **Bloqueado:** UX-06 (NO-GO cadência), IA features (DEBT-0012/15), cadência (DEBT-0008…11).
- **Aguardando validação:** smoke e2e `/app/roteiros` e `?lead=`; gate MSW pipelineValue; baselines visuais.

## 10. FONTES

- `.agents/runs/audit-2026-11-18/*` (auditoria forense NO-GO)
- `.agents/runs/release-readiness-audit-state.json` + `00-reconciliacao-release-readiness-20261119.md`
- `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` (+v1)
- `.agents/runs/00-missao-maestra-us-ux-20261118.md` (adendos 1–7)
- `.agents/experience/**` (diagnóstico, arquitetura, protocolo, roadmap)
- `.agents/reviews/24-*` (pareceres: arquitetura v2, governança, WB-1 v3, PR421, pós-merge, correções WB-1)
- `.agents/handoffs/onda-WB1/` (9 handoffs)
- `gh pr list` (30 PRs abertos em 2026-11-19)
