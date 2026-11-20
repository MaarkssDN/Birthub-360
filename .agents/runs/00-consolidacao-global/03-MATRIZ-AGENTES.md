# 03 — MATRIZ DE AGENTES
Data: 2026-11-19 · Fonte: `AGENTS.md` vigente (revisão 2026-10-09) + decisões do Orquestrador Humano

## Roster oficial (VERIFICADO em AGENTS.md)
| Agente | Domínio | Propriedade-chave |
|---|---|---|
| 00 | Coordenação/orquestração | `.agents/runs/**`, decisões de encaminhamento |
| 01 | Plataforma/Segurança/Dados | prisma/schema+migrations; remoção auth legada (decisão) |
| 01A | Confiabilidade dados/RLS/retenção | slot 01 (exclusivo) |
| 02 | Produto/UX | App.tsx, nav, layout, dashboard, settings, gamification, landing |
| 02A–02D | Especialistas slot 02 | UX research, jornadas, IA, landing/conversão (prompts oficiais) |
| 03 | Design/Acessibilidade | `src/components/ui/**`, styles; enxame 03A–03G homologado |
| 04 | CRM/BI | features crm/bi + `CrmBoard*`/hooks (decisão 18/11) |
| 05 | Prospecção | outbound/cold-email |
| 06/06A | Integrações/Bitrix | slot exclusivo |
| 07 | IA/Automações | NO-GO parcial DEBT-0012/15 |
| 08/08A | QA/Release/Git/Deploy | tests, CI, workflows, deploy (pós-24) |
| 09 | Mobile | android/, capacitor |
| 10 | Infra/Observabilidade/SRE | charts/, infrastructure/ |
| 11 | Marca | identidade-visual/, documentacao-aplicacao/ |
| 12 | Voz/Telefonia | voice-hub (exceção landing `/landing-new`) |
| 13 | Enxame runtime/governança | agentes de runtime |
| 14 | Ambiente/test harness | e2e, visual specs |
| 15 | Segurança aplicada/segredos | SECURE_COOKIES, sanitização |
| 16 | Runtime/workers/escala | filas, consumers |
| 17 | Cadência/ciclo receita | sales-orchestration (dono decidido) |
| 18 | Contratos/API/docs | envelopes, Schemathesis |
| 21 | LGPD | DSR, consentimento, retenção |
| 22 | Verificação de realidade | evidência E2E persistência/PII |
| 23 | Custo/performance IA | orçamento tokens |
| 24 | Revisão independente | parecer obrigatório `.agents/reviews/` |
| 19/20 | INEXISTENTES — reservados | — |

## Ownership decidido pelo Orquestrador Humano (2026-11-18)
- `src/features/landing/**` → 02 (exceção voice-hub `/landing-new` → 12)
- `src/features/gamification/**` → 02
- `src/features/sales-orchestration/**` → 17
- `src/components/CrmBoard.tsx` + toolbar/hooks → 04
- Remoção auth legada → 01
- UX-01 produto: prospecção-only (sem criação manual de lead)

## Conflitos de ownership
- **Resolvidos:** CrmBoard (era ambíguo 02/04), gamification, sales-orchestration — formalizados via AGENTS.md locais + manifesto.
- **Aberto (P3):** `.agents/experience/**` sem dono no §15 — proposta registrada, não aplicada.
- **Regra:** nunca executar 01↔01A, 06↔06A, 16↔06/07 em `src/lib/queue/**` simultâneos; máx. 8 especialistas, >3 exige matriz publicada.

## Handoffs abertos relevantes (amostra — 147 entradas totais)
- `02a-para-04-*` (UX-01/UX-10) — resolvidos via correções mergeadas.
- `00-para-03-remover-intents-*` — resolvido (`3356c2e65`).
- `02a-para-17-selfdrivingcrm-orfao` — aberto, BLOQUEADO NO-GO.
- Handoffs 05/01 para remoções UX-05a/b — prontos, aguardam missão.
- Wave D/E handoffs de idempotencyKey — em PRs.

## Revisões pendentes
- ~30 PRs abertos: cada um exige parecer 24 antes de merge (§40). Estado de parecer por PR não auditado exaustivamente nesta consolidação — LACUNA.
