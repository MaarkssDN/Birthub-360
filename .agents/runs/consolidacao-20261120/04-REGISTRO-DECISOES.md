# 04 — REGISTRO GLOBAL DE DECISÕES

## D-01 · SSRF IPv6 — parser canônico único
- **Decisão vigente**: `src/shared/security/ipv6.ts` é o parser canônico; guards consomem `embeddedIpv4FromIpv6` byte-level (RFC 4291 §2.5.5.2).
- **Fonte**: PRs #381, #413, #436 · 2026-11-17/19 · justificativa: eliminar duplicação ~140 linhas entre #381 e #394.
- **Substituída**: implementação duplicada do #394 (fechado).

## D-02 · Command Palette — sem ações no-op
- **Decisão**: remoção de "Nova oportunidade"/intents `open-create`→CRM (decisão UX-01: leads só via prospecção). `open-create` remanescentes têm consumidores reais.
- **Fonte**: commits `3356c2e65`, PRs #390, #438 · auditoria do Agente 03 confirmou zero ações mortas.

## D-03 · Outbox `idempotencyKey` — contrato do coordenador
- **Decisão**: chave determinística `dominio:{entityId}` derivada do fato de negócio; **nunca `randomUUID()`**; eventos por execução usam id da execução/recomendação.
- **Fonte**: decisão do 00 em 2026-11-19, aplicada nos PRs #444–#453. Casos de borda documentados pelo revisor (forecast mensal, briefing-access, barge-in).

## D-04 · Branch protection de `main` — required checks
- **Decisão aplicada**: required status checks = `Visual Regression Gate` + `Central Birth Hub 360 / application gate` (substituiu `Visual Regression`, que ficava `skipped` fora de escopo).
- **Fonte**: alterado via API GitHub pelo coordenador em 2026-11-19 (handoff `onda-4/08-para-00-visual-gate-branch-protection.md`).
- **Status**: **PENDENTE DE APROVAÇÃO RETROATIVA** do Orquestrador Humano.

## D-05 · Visual baselines — branch efêmera com force-with-lease
- **Decisão**: `visual-baseline-update.yml` usa `git fetch` + `push --force-with-lease` (branch 100% regenerada).
- **Fonte**: PR #442, handoff `00-para-08-visual-baseline-workflow-nonff.md`.

## D-06 · Paleta oficial #368 — NÃO integra no estado atual
- **Decisão**: PR #368 (100 arquivos, +7768/−2238, 5 gates vermelhos) devolvido ao dono para remediar gates + QA visual antes de nova revisão.
- **Fonte**: `00-decisao-achados-revisao-02-20261119.md` · 2026-11-19.
- **Pendente**: decisão de produto/identidade (possível divergência intencional doc×implementação).

## D-07 · Ownership UX (sessão paralela)
- **Vigentes**: `landing/**`→02; gamification→02; sales-orchestration→17; CrmBoard→04; auth morta→01; perfis 02A–02D oficiais; tokens canônicos `identidade-visual→official-identity.css→globals.css`; UX-01 prospecção-only.
- **Fonte**: `.agents/runs/00-memoria-operacional-central-20261119.md` §7.

## D-08 · DSR público aceito com limitação declarada
- **Decisão**: jornada DSR aceita; e-mail mockado (sem SMTP local), jornada browser↔API não executada ponta a ponta — limitação registrada, não bloqueante.
- **Fonte**: PR #428 + handoff de aceite `08-para-00-aceite-dsr-publico.md`.

## D-09 · Governança — transição para 100 agentes
- **Decisão**: PR #455 mergeado adotou arquitetura de 100 agentes; prompts migraram para `.agents/prompts/<squad>/NN-papel.md`; auditoria independente = 09 Silas.
- **Status**: **vigente em main**, mas reconciliação com handoffs/ownerships legados **pendente de confirmação formal**.
- **Conflito**: sessões paralelas ainda despacham pelo roster legado (PRs #459–#466 usam numeração antiga).

## D-10 · Release NO-GO
- **Decisão**: manter NO-GO até P0-0001 (deploy), P0-0002 (backup — #435 mergeado, validar), P0-0003 (workers — #440 mergeado, validar), P0-0004 (mobile — decisão humana).
- **Fonte**: `release-readiness-audit-state.json` + parecer 24.

## D-11 · Pendentes de aprovação (não decididas)
- Escopo mobile no release · War Room executivo vs arena · Win/Loss autopsy estatístico · telas demo na nav · consentimento IA (DEBT-0013) · escopo voz/proposals/design-lab/outbound · UX-08 abas settings · `.agents/experience/**` no §15 · canonização landing · remoções de código morto.
