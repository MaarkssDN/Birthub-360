# 03 — MATRIZ DE AGENTES
Data: 2026-11-20 · Governança vigente: AGENTS.md "Arquitetura 100 Agentes"

## Conflito de regime (CRÍTICO)
Dois sistemas de numeração coexistem:
- **LEGADO (00–24)**: usado por todos os handoffs, reviews, branches e PRs até 19/11 (inclusive os 9 PRs de débitos mergeados ontem).
- **VIGENTE (00–99 squads)**: adotado por #455/#456 em 19/11. §4: auditoria independente migrou de 24→**09 Silas**; slots 19/20 ativados (19 Bruno, 20 Ciro).

**Decisão pendente:** mapa de equivalência oficial. Proposta em elaboração por subagente → `.agents/runs/00-proposta-mapa-agentes-20261120.md`. Até aprovação, tratar IDs em handoffs como LEGADO e rotear pelo domínio, não pelo número.

## Roster vigente (resumo por squad)
| Squad | Escopo | IDs |
|---|---|---|
| 00 | Comando/QA/LGPD/Auditoria | 00 Astra(coord), 01 Ória(QA), 02 Bento(harness), 03 Nina(unit), 04 Téo(integration), 05 Luma(E2E), 06 Gael(realidade), 07 Íris(LGPD), 08 Dora(titular), 09 Silas(auditor) |
| 10 | Dados/Banco/Tenancy | 10 Mara(coord), 11 Pietro(schema), 12 Vera(migrations), 13 Nilo(RLS), 14 Bia(seeds), 15 Olavo(retenção), 16 Cora(queries), 17 Remo(cache), 18 Ayla(lineage), 19 Bruno(integridade/backup) |
| 20 | Backend/APIs/Billing | 20 Ciro(coord), 21 Zara(contratos), 22 Hugo(HTTP), 23 Pina(queue/workers), 24 Ivo(resiliência), 25 Tália(rate-limit), 26 Dália(billing), 27 Vic(entitlements), 28 Milo(import), 29 Lia(export/webhooks) |
| 30 | Produto/UX/Design/Marca | 30 Violeta(coord), 31 Noa(app-shell), 32 Ema(estados UI), 33 Célia(design-system), 34 Ari(a11y), 35 Mia(motion), 36 Léo(landing), 37 Suri(UX research), 38 Nara(dashboards), 39 Tina(marca) |
| 40 | CRM/Pipeline | 40 Ravi(coord), 41 Cadu(leads), 42 Lívia(pipeline), 43 Amon(prospecção), 44 Lola(cadências), 45 Otto(tarefas), 46 Sofia(forecast), 47 Dante(playbooks), 48 Jade(dedup), 49 Malu(BI) |
| 50 | Integrações/Bitrix | 50 Atlas(coord), 51 Bela(auth), 52 Lino(extrações), 53 Vega(sync), 54 Rita(mapeamento), 55 Ícaro(email), 56 Luna(whatsapp), 57 Nico(calendário), 58 Elisa(enrichment), 59 Ruy(sync observ.) |
| 60 | Voz/Mensageria | 60 Aurora(coord), 61 Nando(VoIP), 62 Sol(áudio), 63 Lira(STT), 64 Tito(comandos voz), 65 Lena(voice-hub UI), 66 Kiko(inbox), 67 Teca(templates), 68 Paco(notificações), 69 Eli(opt-out) |
| 70 | IA/Enxame | 70 Orion(coord), 71 Clara(runtime), 72 Ada(tools), 73 Numa(RAG), 74 Luca(copiloto), 75 Yara(sentimento), 76 Dex(automações), 77 Gaia(guardrails), 78 Oz(FinOps), 79 Mina(evals) |
| 80 | Mobile | 80 Navi(coord), 81 Enzo(capacitor), 82 Davi(android), 83 Ceci(iOS), 84 Pia(push/deeplink), 85 Bóris(offline), 86 Alana(UI), 87 Tomás(voz nativo), 88 Sasha(segurança), 89 Zico(perf) |
| 90 | Infra/SRE/Segurança | 90 Hélio(coord), 91 Terra(IaC), 92 Kora(k8s), 93 Max(docker), 94 Tess(CI/CD), 95 Íon(observabilidade), 96 Nera(auth), 97 Rocco(RBAC), 98 Safira(segredos), 99 Vito(AppSec) |

## Ownership que MUDOU (risco de handoffs desatualizados)
| Arquivo/domínio | Dono legado | Dono vigente |
|---|---|---|
| prisma/schema.prisma | 01 | **11 Pietro** |
| prisma/migrations/** | 01 | **12 Vera** |
| src/lib/queue/** | 16 | **23 Pina** |
| .github/workflows/** | 08 | **94 Tess** |
| android/ios/capacitor | 09 | **80–89 (Navi…)** |
| charts/infrastructure | 10 | **91–93 (Terra/Kora/Max)** |
| src/features/landing/** | 02/36? | **36 Léo** |
| mobile decisão Day-1 | 09 | **80 Navi** |
| auditoria (.agents/reviews) | 24 | **09 Silas** |
| .agents/runs | 00 | **00 Astra** (mantido) |
| .agents/handoffs | cada agente | cada agente (mantido) |

## Trabalho recente por agente (legado, evidência = PRs)
00: coordenação, 9 reviews consolidadas (#446), reconciliações, brand-system (#449). 02/03: Onda 1 a11y (#462,#463,#464,#459,#466,#453). 04: CRM debts #434 (aberto). 05: cold email #437 (aberto), SSRF #401. 06: Bitrix #432✅. 07: IA #431✅, waveD guardrails #441✅, waveE #447. 08: deploy #427✅, sonar #430✅, E2E #426/#428, handoffs #386, baseline #442. 09(mobile): waveE #451. 10: backup #435✅, waveE #452. 12: waveE #450. 14: repro/testes #403/#459. 15: segurança #397. 16: workers #440✅, waveE origem. 17: cadência #439✅, waveE #444. 18: API #399. 23/24 equivalentes: parity test no #440.

## Conflitos de ownership detectados
1. **IDs ambíguos**: "04" agora é Téo (testes integração) mas PR #434 é do CRM legado — handoffs futuros devem usar squad+nome.
2. **schema.prisma**: handoffs 17→01 e 05→01 citam dono antigo; novo dono é 11 Pietro (+12 Vera p/ migration).
3. **queue/**: handoff 16→00 (waveE) — novo dono 23 Pina; conflito de slot legado 16↔06/07 pode não se aplicar mais.
4. **workflows**: #430 (sonar gate) e #466 (ownership test) tocaram CI sob dono legado 08 → agora 94 Tess.
5. **Prompts**: legado arquivado em `.agents/prompts/legacy_v1/`; novos por squad — agentes devem ler o prompt do squad correto.
