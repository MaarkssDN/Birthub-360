# 03 — MATRIZ DE AGENTES E OWNERSHIP
**Alerta central: duas governanças coexistem.** Ver `04-REGISTRO-DECISOES.md` D-09.

## A. Roster LEGADO (00–24) — usado em todo o trabalho Waves A–E

| Agente | Domínio | Propriedade-chave | Trabalho em voo |
|---|---|---|---|
| 00 | Coordenação, `.agents/runs/**` | runs, decisões de dono | Este consolidado |
| 01/01A | Plataforma, schema, tenancy, RLS | `prisma/**`, shared security | — |
| 02 | Produto/UX, App.tsx, nav | `src/App.tsx`, gamification, landing | #415, #453 |
| 03 | Design/a11y | tokens, `src/styles/` | #438 (docs), paleta #368 |
| 04 | CRM/BI | commercial-intelligence, proposals | #445 merged, #434 |
| 05 | Prospecção/outbound | `prospecting/**` | #401, #437 |
| 06/06A | Integrações/Bitrix | `integrations/**` | #448 merged, #396 |
| 07 | IA/automações | `intelligence/`, `knowledge/`, guardrails | #441, #447 |
| 08/08A | QA, release, `.github/workflows/**` | workflows, testes | #386, #430, #459–#466 |
| 09 | Mobile | `android/`, capacitor | #451, #399 |
| 10 | Infra/SRE | `charts/`, `infrastructure/` | #452, #435 |
| 12 | Voz/telefonia | voice, ai-voice | #450 |
| 14 | Test harness/flaky | e2e, integração | #403 |
| 15 | Segurança aplicada/segredos | config, rotação | #397, #465 |
| 16 | Runtime/workers/filas | `src/lib/queue/**` | #440, #408 |
| 17 | Cadência/ciclo receita | `features/cadence/` | #444, #439, #416 |
| 18 | Contratos/API | OpenAPI, envelope | #399 |
| 21 | LGPD/privacidade | DSR, consentimento | #407 |
| 22 | Verificação de realidade | evidência PII/persistência | — |
| 23 | Custo/performance IA | tokens, N+1 | — |
| 24 | **Revisão independente obrigatória** | `.agents/reviews/**` | pareceres Wave D/E emitidos |

## B. Roster NOVO (100 agentes, 10 squads) — mergeado em main (PR #455)

| Squad | Agentes (nº — nome — papel) |
|---|---|
| 00 Comando/QA/LGPD | 00 Astra (coord.), 01 Ória (QA/DoD), 02 Bento (test harness), 03 Nina (testes unit.), 04 Téo (integração), 05 Luma (E2E/visual), 06 Gael (verificação realidade), 07 Íris (LGPD), 08 Dora (titular), **09 Silas (auditor independente/gate final)** |
| 10 Dados/Tenancy | 10 Mara (coord.), 11 Pietro (schema), 12 Vera (migrações), 13 Nilo (RLS), 14 Bia (seeds/demo), 15 Olavo (retenção), 16 Cora (queries), 17 Remo (cache), 18 Ayla (lineage), 19 Bruno (backup/integridade) |
| 20 Backend/APIs | 20 Ciro (coord.), 21 Zara (contratos), 22 Hugo (HTTP), **23 Pina (`src/lib/queue/**`)**, 24 Ivo (resiliência/DLQ), 25 Tália (rate limit), 26 Dália (billing), 27 Vic (entitlements), 28 Milo (import), 29 Lia (webhooks saída) |
| 30 Produto/UX/Design | 30 Violeta (coord.), 31 Noa (app shell/nav), 32 Ema (estados UI), 33 Célia (design system), 34 Ari (a11y), 35 Mia (motion), 36 Léo (landing), 37 Suri (onboarding), 38 Nara (dashboards), 39 Tina (marca/docs) |
| 40 CRM/Receita | 40 Ravi (coord.), 41 Cadu (leads), 42 Lívia (pipeline), 43 Amon (prospecção/scoring), 44 Lola (cadências), 45 Otto (tarefas), 46 Sofia (forecast), 47 Dante (playbooks), 48 Jade (dedup), 49 Malu (BI/cohort) |
| 50 Integrações/Bitrix | 50 Atlas (coord.), 51 Bela (auth Bitrix), 52 Lino (extrações), 53 Vega (sync/webhooks), 54 Rita (mapeamento), 55 Ícaro (e-mail), 56 Luna (WhatsApp), 57 Nico (calendário), 58 Elisa (enriquecimento/ERP), 59 Ruy (reconciliação) |
| 60 Voz/Omnichannel | 60 Aurora (coord.), 61 Nando (VoIP/SIP), 62 Sol (gravação), 63 Lira (STT), 64 Tito (comandos voz), 65 Lena (Voice Hub UI), 66 Kico (inbox), 67 Teca (templates/sanitize), 68 Paco (notificações), 69 Eli (opt-out) |
| 70 IA/Automações | 70 Orion (coord.), 71 Clara (runtime enxame), 72 Ada (tool calling), 73 Numa (RAG), 74 Luca (copiloto), 75 Yara (sentimento), 76 Dex (automações), 77 Gaia (guardrails), 78 Oz (FinOps), 79 Mina (evals) |
| 80 Mobile | 80 Navi (coord.), 81 Enzo (Capacitor), 82 Davi (Android), 83 Ceci (iOS), 84 Pia (push/deep links), 85 Bóris (offline), 86 Alana (UI mobile), 87 Tomás (voz/contatos), 88 Sasha (segurança mobile), 89 Zico (perf/crash) |
| 90 Infra/SRE/Sec | 90 Hélio (coord.), 91 Terra (IaC AWS), 92 Kora (K8s/Helm), 93 Max (containers), **94 Tess (`.github/workflows/**`, deploy)**, 95 Íon (observabilidade), 96 Nera (auth/sessões), 97 Rocco (RBAC), 98 Safira (segredos), 99 Vito (AppSec/scanners) |

## C. Conflitos de ownership identificados

1. **Numeração ambígua**: PRs #459–#466 usam "Agente 02/03" — sob o roster novo esses números são Bento/Nina (testes), mas o conteúdo (a11y settings, contraste, hooks) corresponde ao **legado** 02/03. Provável uso do roster antigo por sessão paralela. **Aguardando confirmação do Orquestrador Humano.**
2. **Auditor independente**: era 24; agora 09 Silas. Pareceres Wave D/E emitidos pelo "24" são evidência válida, mas o gate formal deve migrar.
3. **`src/lib/queue/**`**: legado 16 ↔ novo 23 Pina — handoffs outbox endereçados ao 16 precisam re-endereçamento.
4. **`.agents/experience/**`**: sem dono declarado no §15 (registrado como pendência).
