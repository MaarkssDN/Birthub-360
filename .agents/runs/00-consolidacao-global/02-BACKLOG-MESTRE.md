# 02 — BACKLOG MESTRE CONSOLIDADO
Data: 2026-11-19 · IDs globais `BG-*` · IDs locais preservados entre parênteses
Legenda confiança: V=VERIFICADO · R=RELATADO · C=DECLARADO-CHAT

## P0 — Bloqueadores de release

| ID Global | Tarefa | Área | Agente | Status | Prio | Dependências | Evidências | Fontes | Última verif. | Próxima ação | Aceite | Aprovação |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BG-REL-001 | Deploy com migration+healthcheck (P0-0001) | Release/Infra | 08A/10 | ABERTO | P0 | decisão deploy | release-readiness-state.json | reconciliação 19/11 | 19/11 | missão 08A/10 | deploy c/ migration+healthcheck verde | SIM (deploy) |
| BG-REL-002 | Backup/restore real (P0-0002) | Infra | 10 | ABERTO | P0 | — | idem | idem | 19/11 | missão 10 | restore testado | SIM |
| BG-REL-003 | Consumers worker topology (P0-0003) | Runtime | 16 | ABERTO | P0 | — | idem | idem | 19/11 | missão 16 | consumers registrados/saudáveis | SIM |
| BG-REL-004 | Escopo mobile no release (P0-0004) | Produto | HUMANO | DECISÃO-PENDENTE | P0 | — | idem | idem | 19/11 | decisão do usuário | escopo definido | OBRIGATÓRIA |

## P1 — Release readiness (da reconciliação forense)

| ID | Tarefa | Agente | Status | Detalhe |
|---|---|---|---|---|
| BG-REL-005 | ~11 pendentes P1 acionáveis | vários | ABERTO | Lista completa em `release-readiness-audit-state.json`/`00-reconciliacao-release-readiness-20261119.md` — requer leitura do relatório-fonte antes de detalhar |
| BG-REL-006 | 4 itens P1 dependem de decisão humana | humano | DECISÃO-PENDENTE | escopo voz/mobile, consentimento IA |

## UX — Onda B (WB-1)

| ID | Tarefa | Agente | Status | Conf. | Detalhe |
|---|---|---|---|---|---|
| BG-UX-001 | UX-05a remover auth components mortas | 01 | ABERTO | V | preservar ResetPassword/ChangePasswordGate/GoogleLoginModal; testes c/ 08 |
| BG-UX-002 | UX-05b remover outbound SPA | 05+08 | ABERTO | V | preservar `outbound/server/cnpj.ts` (consumido por duckdbCnpj.service) |
| BG-UX-003 | UX-09 perfil editável (UI) | 02 | ABERTO | V | backend better-auth já suporta update/change-password |
| BG-UX-004 | UX-08 abas settings placeholder | 02 | DECISÃO-PENDENTE | V | preview honesto atual; decidir remover vs manter |
| BG-UX-005 | UX-06 SelfDrivingCrm órfão | 17 | BLOQUEADO | V | NO-GO cadência DEBT-0008…0011 |
| BG-UX-006 | UX-N1 4ª objeção War Room inalcançável | 02/00 | ABERTO-P3 | V | decidir 4ª rodada ou remover amostra |
| BG-UX-007 | UX-N3 comentário stale tabMeta | 02 | CONCLUÍDO-VERIFICADO | V | incluído em `5d6448811` |
| BG-UX-008 | Hardening: status HTTP em `src/lib/api.ts` | 04/18 | ABERTO-P3 | R | evita classificação por texto de erro |
| BG-UX-009 | Smoke e2e `/app/roteiros` + `?lead=` inválido | 08/14 | PENDENTE-VALIDAÇÃO | R | pós-correções UX-02/11 |
| BG-UX-010 | Gate MSW pipelineValue null/0 | 08 | PENDENTE-VALIDAÇÃO | R | pós-UX-07 |

## UX — já concluído (não reabrir)

| ID | Tarefa | Status | Evidência |
|---|---|---|---|
| BG-UX-C01 | Governança UX (prompts 02A–D, AGENTS.md, experience/, ownership) | CONCLUÍDO-VERIFICADO | PR #421 mergeado; review 24 v2+governança+pós-merge APROVADO |
| BG-UX-C02 | UX-01 decisão prospecção-only + intents palette removidos | CONCLUÍDO-VERIFICADO | decisão usuário; commit `3356c2e65` |
| BG-UX-C03 | UX-02 botão morto Playbooks | CONCLUÍDO-VERIFICADO | `5d6448811`; review 24 APROVADO |
| BG-UX-C04 | UX-03 erro≠empty state Gamificação | CONCLUÍDO-VERIFICADO | `5d6448811` |
| BG-UX-C05 | UX-07 KPI null→"—" vs 0→"R$ 0" | CONCLUÍDO-VERIFICADO | `f2d4d596b`/`bc061e229`; review 24 |
| BG-UX-C06 | UX-10 funil dinâmico `/api/crm/pipelines` | CONCLUÍDO-VERIFICADO | `5d6448811` |
| BG-UX-C07 | UX-11 deep link lead 404 vs rede + retry | CONCLUÍDO-VERIFICADO | `f2d4d596b`; review 24 |

## Integrações / Domínio (em PRs — status individual não auditado nesta consolidação)

| ID | Tarefa | Agente | PR(s) | Status |
|---|---|---|---|---|
| BG-INT-001 | Wave E idempotencyKey produtores | 02/07/09/10/12 | #447 #450 #451 #452 #453 | EM-PR |
| BG-INT-002 | Trilha E CRM DEBT-0017/18/19 | 04 | #434 | EM-PR |
| BG-INT-003 | cold-email persistência DEBT-0011 | 05 | #437 | EM-PR |
| BG-INT-004 | AUD-1 SSRF/RBAC | 05/06 | #401 #396 | EM-PR |
| BG-INT-005 | SECURE_COOKIES/sanitizeRequest | 15 | #397 | EM-PR |
| BG-INT-006 | Guardrails PII anti-bypass | 07 | #441 | EM-PR |
| BG-INT-007 | effect advisory GHSA | 99/15 | #465 | EM-PR |
| BG-INT-008 | Ownership manifest sync | 03 | #466 | EM-PR |
| BG-INT-009 | Onda1 a11y labels/contraste | 02/03 | #462 #463 | EM-PR |
| BG-INT-010 | Schemathesis noturno + CommandPalette | 08 | #400 | EM-PR |
| BG-INT-011 | Flaky e2e/integração | 14 | #403 | EM-PR |
| BG-INT-012 | Envelope erro + contrato Zod | 18 | #399 | EM-PR |
| BG-INT-013 | P0 security extract PR#310 | 00 | #415 | EM-PR |
| BG-INT-014 | Paleta oficial migração hex→var() | 11/03 | #368 | EM-PR (CONFLICTING histórico) |
| BG-INT-015 | Onda-5/6 integração resiliência | 00 | #366 #402 | EM-PR (CONFLICTING histórico) |
| BG-INT-016 | iOS permissions | 09 | (#399 listada como 18? verificar) | EM-PR — LACUNA: número a confirmar |
| BG-INT-017 | Repro 500/404 rotas agentes | 14 | #459 | EM-PR |
| BG-INT-018 | Handoffs saneamento waves | vários | #386 #367 | EM-PR |
| BG-INT-019 | Postman sync diagnóstico | 18/08 | #353 | EM-PR |
| BG-INT-020 | Review 24 PR#308 | 00 | #347 | EM-PR |
| BG-INT-021 | Onda1 B-14/B-04 + ciclos | 00 | #464 | EM-PR |
| BG-INT-022 | DEM-002 reconciliação | 00 | #379 mergeado | CONCLUÍDO |

## Bloqueados (NO-GO de domínio — não abrir trabalho)

| ID | Item | Motivo |
|---|---|---|
| BG-BLK-001 | Cadência DEBT-0008…0011 | NO-GO cadência |
| BG-BLK-002 | IA DEBT-0012/0015 | NO-GO IA |
| BG-BLK-003 | SelfDriving CRM (UX-06) | depende de cadência |

## Duplicidades eliminadas nesta consolidação
- UX-07: duas frentes corrigiram (agente 02 + `bc061e229`) → convergiu, registrado uma vez (BG-UX-C05).
- UX-03/UX-10: consolidação `5d6448811` de outra sessão executou antes do despacho planejado → marcados concluídos, missões não despachadas (sem duplicidade real).
- Handoffs WB-1 ↔ commits de correção: mesmo trabalho, fontes cruzadas preservadas.
