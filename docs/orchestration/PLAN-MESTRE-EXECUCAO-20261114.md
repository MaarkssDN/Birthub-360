# PLAN-MESTRE-EXECUCAO-20261114 — Plano de execução do consolidado geral

**Autoridade:** Agente 00 (Orquestrador)
**Data:** 2026-11-14
**Fonte canônica de itens:** `docs/orchestration/handoffs-verificacao/CONSOLIDADO-GERAL-20261114.html`
**Status:** AUTORIZADO pelo usuário em 2026-11-14 (Fases 0–4 + inclusão de A-01..A-03 como onda pós-segurança)

---

## 1. Objetivo

Zerar o trabalho designado identificado no consolidado, na ordem de risco:
1. Reconciliar o que foi marcado como feito mas não está (verdade antes de volume).
2. Fechar bloqueadores de segurança/dados/tenancy.
3. Executar o backlog de produto em ondas.
4. Manter gates e revisão independente (24) em tudo que toca schema, LGPD, tenancy ou segurança.

## 2. Fase 0 — Reconciliação (antes de qualquer onda nova)

**Por quê primeiro:** 50 itens constam RESOLVIDO sem evidência ou com evidência duvidosa; 3 "resolvidos" são na verdade adiamentos. Sem isso, o plano executa sobre um mapa falso.

| # | Ação | Dono | Verificação |
|---|------|------|-------------|
| 0.1 | Reclassificar os "resolvido=postponed" (downloads-blob, voice-command, redesign-plataforma) para ADIADO/BLOQUEADO | 00 | `_MATRIX.csv` + handoffs atualizados |
| 0.2 | Abrir handoffs de correção para DUVIDA com defeito real confirmado (heatmap findMany+costUsd, double-cast forense, filtro tenant forense-17, regressões brand-2/live-browser.js/social-selling) | 00 | handoffs criados em `.agents/handoffs/` |
| 0.3 | Resolver os 12 SEM-EVIDENCIA (exigir seção Resolução ou rebaixar status) | 00 + destinatários | cada item com veredicto final |
| 0.4 | Fechar pendências de processo da DEM-20261114-002 (itens que dizem "pendente de parecer 24") | 00 | pareceres do 24 emitidos |

**Gate Fase 0:** os 50 itens com veredicto final (CONFIRMADO / REABERTO / ADIADO) e DEM-20261114-002 → CONCLUÍDA.

## 3. Fase 1 — Ondas de execução de handoffs (já em andamento)

Plano já montado em `_gen_ondas_html.py` / seção D do consolidado. Máx. 5 agentes/onda, domínios disjuntos, slots exclusivos respeitados.

| Onda | Tema | Agentes | Status |
|------|------|---------|--------|
| 1 | Bloqueadores segurança/dados (schema-adapters voicehub, RLS documentembedding, tenancy outbound, docker 2375, form-lead-fake) | 01, 05, 10, 02 | **EM EXECUÇÃO** (worktrees wt-01/05/10/02, subagentes lançados 2026-11-14) |
| 2 | Produto, voz, LGPD e dados altos (tenancy-audit, verdade-no-copy, CTA light, sonar coverage, voicehub reativação, hotspots voz, portal titular, consentimento) | 01A, 02, 03, 12, 17, 21 | aguardando gate da Onda 1 |
| 3 | Backend, IA, infra e prospecção (orquestração sem demo, trace consent, safeFetch, exports duplicados, warroom SSE, opt-out cadência, hotspots CRM, relatórios/forecast, rotação segredos) | 07, 16, 05, 04, 10, 08, 15 | após Onda 2 |
| 4 | QA, revisão e decisões (cobertura testes, E2E mesa tratamento, gate RLS CI, revisões 24, decisão k8s, settings persistentes) | 08, 01, 15, 24, 10, 02 | após Onda 3 |
| — | Trilha do 00 (5 itens: gaps de aceite, offline-sqlite, sync matriz propriedade, prompt coordenação, proposta navegação) | 00 | paralelo |

**Gate por onda:** gates locais verdes + evidência + status do handoff atualizado + notificação ao 00 via bus. Itens de schema/LGPD/tenancy/security exigem parecer do 24 antes de fechar.

## 4. Fase 2 — Backlog de 17 ondas (DEM-20261113-002)

Ondas 1 e 2 já mergeadas. Ondas 3–17 pendentes (105 itens). Regra: máx. 8 agentes/onda (AGENTS.md §13), uma onda de cada vez, gates entre ondas.

Ordem sugerida (já definida pelo backlog, mantida):
- **Onda 3** — Banco de Dados e Arquitetura (8 itens; agentes 01, 16, 08)
- **Onda 4** — Qualidade Frontend e Performance (8; 23, 09, 03, 08, 02)
- **Onda 5** — UX, Formulários e Acessibilidade (8; 02, 03)
- **Onda 6** — APIs, Filas e Resiliência (8; 16, 14, 06, 08)
- **Onda 7** — Observabilidade, Docs e Operação (8; 10, 23, 18, 08A, 17)
- **Onda 8** — Produto, Billing e Plataforma (4; 17, 01, 09, 04)
- **Ondas 9–16** — Domínios novos (dados/governança, receita, IA copiloto, IA automação, vendas, canais, mobile/voz, engajamento) — 8 itens cada
- **Onda 17** — Fechamento, Demo e Gate Final (2; 02, 08, 24)

Dependência externa: a Fase 1 e a Fase 2 se sobrepõem em temas (ex.: RLS, consentimento, hotspots). Regra de convivência: handoffs da Fase 1 têm prioridade; a onda de backlog que tocar o mesmo arquivo espera o merge do handoff correspondente.

## 5. Fase 3 — Plano Mestre de Saneamento (52 dívidas)

49/52 já têm handoff RESOLVIDO. Pendentes reais: BT360-DT-0001, BT360-DT-0004 (trilha 00) e BT360-DT-0063 (hotspots voz, Agente 12 — já coberto pelo handoff da Onda 2 de execução). Ação: acompanhar pelo plano de handoffs; nenhuma onda dedicada necessária, exceto re-verificação amostral dos CONFIRMADOS (onda 2 da DEM-002, prioritizando clusters A, C, E).

## 6. Fase 4 — Outros planos e decisões

| Item | Dono | Natureza |
|------|------|----------|
| Plano IA Open Source — fechar lacunas (langgraph/coqui/llamaindex ou declarar fora de escopo) | 07 | decisão de escopo + execução |
| Plano RECONST fase-02 (6 ondas) | 00 | reconciliar com saneamento já executado antes de qualquer execução |
| Ações pré-produção A-01..A-03 (autorização humana, deploy staging, smoke 6 jornadas) | humano/08A/08/10 | **bloqueia produção** — depende de decisão do usuário |
| B-02 hotspots >800L (NewLoginScreen 1591L, Landing360 1951L) | 02/03 | prazo 2026-11-30 |
| B-03 deriva índices DATA-007 | 01 | prazo 2026-11-30 |
| B-04 sonar coverage no CI | 08 | próxima onda de CI |
| DEM-20261114-001 — auditoria design/UX (subagentes + consolidação + relatório) | 00/02/03/22 | em andamento |
| DEM-20261113-003 — correções do protocolo mestre (divergência PROTOCOLO_QUALIDADE) | 00 | correção documental |
| DEM-20261113-004† — identidade visual V2 (PR #300 aberto) | 00 | aguarda merge/revisão |

## 7. Regras transversais

- Concorrência: máx. 8 especialistas; >3 exige matriz de propriedade e gates a cada 2–3 merges.
- Slots exclusivos: 01↔01A, 06↔06A; 16↔06/07 em `src/lib/queue/**`.
- `server.ts`, `package.json`, lockfile: aprovação explícita do 00.
- Toda entrega: evidência verificável (comando/teste/commit) + journal + status no handoff/demand.
- Schema/migrations: somente Agente 01; integrações abrem handoff, não criam migração.
- LGPD/tenancy/segurança: parecer do 24 obrigatório antes de declarar resolvido.

## 8. Sequência executiva resumida

```
Fase 0 (reconciliação)  ──►  Fase 1 ondas 1→4 (handoffs)  ──►  Fase 2 backlog ondas 3→17
        │                        │                              │
        └── Fase 3 dívidas ───────┴── Fase 4 planos/decisões ────┘
              (transversal, sem onda própria)
```

**Execução Fase 0 (2026-11-14):**
- 0.1 concluído: 3 itens "resolvido=postponed" reclassificados para ADIADO (`downloads-blob`, `voice-command` → Agente 02; `redesign-plataforma` → 02/03) e `_MATRIX.csv` atualizado.
- 0.2/0.3 concluído: 15 handoffs de reconciliação criados em `.agents/handoffs/reconciliacao-20261114/` (00→01,02,03,04,05,06,08,09,10,12,14,15,17,24 + auto-handoff do 00), cobrindo os 50 itens com veredicto problemático.
- Pendente: destinatários executam os handoffs; 00 acompanha via bus/journal.

**Próxima ação:** acompanhar Onda 1 de handoffs até o gate; despachar onda seguinte; A-01..A-03 entram como onda de release após as ondas de segurança/dados.
