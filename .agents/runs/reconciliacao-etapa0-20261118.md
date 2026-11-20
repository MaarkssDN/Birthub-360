# Reconciliação Etapa 0 — PRs × Achados (Release Readiness)
**Data:** 2026-11-18 · **Executor:** Agente 00 (sessão Devin) · **Base:** `origin/main @ 8b40cdb9`
**Fontes:** `inventario-mestre.md`, `plano-saneamento.md`, `gh pr list/diff/view` ao vivo, diffs de `LeadUseCases.ts`/`LeadController.ts` em main.

## 0. Snapshot do momento

- **Onda de merges em curso ("Leva 3")**: durante esta reconciliação, #381, #382, #383, #384, #385, #387, #388, #389 foram **mergeados** em main (~15:13Z). Estado é móvel — revalidar antes de cada merge.
- **PRs abertos agora (33):** 310, 347, 353, 361, 366, 367, 368, 372, 378, 379, 386, 390, 391, 392, 393, 394, 395–405, 406–412.
- **Correção aplicada nesta sessão:** PR #410 estava poluído (base local antiga arrastou ~99 handoffs). Rebase limpo sobre `origin/main` + force-with-lease → diff agora = exatamente os 11 pareceres.

## 1. Matriz DEBT P0/P1 × cobertura

Legenda: ✅ EM MAIN · 🔶 PR ABERTO · ⬜ SEM COBERTURA · 🟡 PARCIAL · 🔷 DECISÃO HUMANA

| DEBT | Status | Evidência |
|---|---|---|
| 0001 deploy migrate/healthcheck | ⬜ | Nenhum PR toca deploy-ec2.sh |
| 0002 backup real | ⬜ | Nenhum PR |
| 0003 workers outbound s/ consumidor | 🟡 | #408 aberto (domainEventMesh.service) — parcial; registrar consumers em worker.ts segue pendente |
| 0004 mobile backend/DNS | 🔷 | Decisão de escopo pendente |
| 0005 SSRF residual | 🟡 | Infra mergeada (#381: ssrfGuard/urlGuard/ipv6); #394 aberto (dedup 15→01); #401 aberto (/enrich+RBAC). Residual: crawler/demais fetch — verificar após merges |
| 0006 fallback BITRIX24_WEBHOOK_URL | 🟡 | #383 mergeado (outbound tenancy gated); fallback global na importação Bitrix principal — verificar |
| 0007 webhook 3CX segredo global | ⬜ | #384 mergeado era só testes/handoffs voicehub |
| 0008 hasLeadReplied sem `since` | ⬜ | #389 mergeado NÃO tocou (grep vazio no diff) |
| 0009 toque voz pending s/ TTL | ⬜ | — |
| 0010 sufixo opt-out nas mensagens | ⬜ | #389 tratou optOutRepo durável, NÃO o sufixo SAIR/List-Unsubscribe |
| 0011 cold-email sem persistência | ⬜ | — |
| 0012 ReAct fora do gateway | 🟡 | #388 mergeado (tokenBudget/executionLimits/concurrencyControl em src/lib/agents) — parcial |
| 0013 consentimento IA | 🔷 | Rebaixável a P2 se env allowlist aceita (decisão 21/13) |
| 0014 quota fail-open/bypass tenant | 🟡 | #388 parcial — confirmar fail-closed |
| 0015 fallback IA fabricado approved:true | ⬜ | #409 é só teste PII guardrails |
| 0016 batchUpdate atômico | ✅/🔶 | Núcleo mergeado via #390→main (extraFields, escrita única); #390 aberto c/ delta de 18 arquivos; #395 conflita |
| 0017 mesa/start_cadence status canônico | 🟡 | #389 (cadence) + #390 mergeados — verificar se todos os caminhos usam updateLeadStatus |
| 0018 Contact.companyId tenant | 🟡 | #390 (tenancy-fks) mergeado parcial — validar cobertura |
| 0019 Company hard delete s/ guarda | ⬜ | — |
| 0020 importação Bitrix não atômica | 🟡 | #406 aberto (outboundSync dedup + eventMeshBridge propaga erros) — parcial |
| 0021 retentionPurge RLS | ✅? | #387 mergeado tocou retentionPurge.service.ts + crossTenantIsolation.test — confirmar worker-por-org/requestContext |
| 0022 voz persiste s/ consentimento/retenção | ⬜ | — |
| 0023 executeVoiceCommand falso sucesso | ⬜ | + decisão cluster voice/ morto (mesmo pacote) |
| 0024 criar lead/oportunidade UI | 🟡 | #391 aberto (CommandPalette); #310 aberto (P0 auditoria c/ deep link) |
| 0026 Sonar cobertura integration | ⬜ | #386 aberto é schemathesis+testes, não lcov |

## 2. Conflitos e duplicações detectados (ação necessária)

| PR | Problema | Ação recomendada |
|---|---|---|
| **#395** | Main já contém o fix batchUpdate via merge de #390 (commits aaf0cc0f0, 54b117f53). Diff do #395 vs main atual = **17 marcadores de conflito**. Delta único restante: `statusChangedLeads` + gatilhos de automação por lead no LeadController (main NÃO tem — batchUpdate não dispara 'Lead mudou de status'). | **Rebase cirúrgico**: recriar sobre main atual mantendo só o delta de automação (statusChangedLeads + fireAutomations no controller). OU fechar se 00 decidir que automação batch não é necessária. Não mergear como está. |
| **#390** | Branch mergeada parcialmente em main (da9b42da6), mas PR segue OPEN com diff de 18 arquivos — delta real por determinar. | Verificar `gh pr diff 390` pós-rebase: se delta for só handoffs/docs → merge; se houver código → revisar delta. |
| **#394** | Toca `ssrfGuard.ts`/`urlGuard.ts` — mesmos arquivos que #381 mergeou. Parecer #411 chamou de "dedup". | Rebase sobre main; provável que grande parte já esteja em main — merge só do delta real. |
| **#407** | Superset de #381 (mesmas migrations/schema/rotas + docs/lgpd). #381 já mergeado; diff do #407 ainda lista 42 arquivos por estar desatualizado. | Rebase: delta real deve ser só `docs/lgpd/**` — considerar split ou merge direto se limpo. |
| **#402** | Estava CONFLICTING; mergeable=UNKNOWN agora. Toca package.json (aprovado pelo 00 via handoff) + .agents/runs|reviews de outros slots. | Rebase + confirmação 00 dos artefatos .agents (condição do parecer 24). |
| **#366/#368/#361** | CONFLICTING/UNKNOWN, grandes (onda-6, paleta, depcruise). | 08A: rebase ou close justificado — paleta (#368) tem decisão pendente do 24. |
| **#310** | P0 auditoria antigo (paleta+deep link+design-lab) — sobrepõe #368 e DEBT-0024/0052. | Avaliar contra main atual: partes podem já estar cobertas. |
| **#372/#378** | Checks falhos segundo plano; #378 é fix real pequeno (findUnique soft-delete). | #378: verificar CI e mergear se verde. #372: CodeQL suppression — revisar se ainda necessário. |
| **#410** | ✅ CORRIGIDO nesta sessão (era 110 arquivos, agora 11). | Merge como docs. |
| **#411** | Pareceres 24 de #381/#383/#394 — complementa #410. | Merge como docs. |

## 3. Ordem de merge atualizada (pós-Leva-3)

1. **Docs primeiro:** #410, #411, #405, #347, #353, #367, #379, #392, #393 (handoffs/docs — baixo risco)
2. **Segurança:** #401 (SSRF /enrich) → #394 (após rebase/dedup) → #397 (após aprovação 00 p/ server.ts) → #396
3. **Contratos:** #399 → #400 (dependência dura)
4. **Dados/CRM:** #390 (delta real) → #395-rebase (só automação) → #402 (após rebase+00) → #378 (fix pequeno)
5. **Testes/QA:** #403, #404 (após CI coverage verde), #386, #409, #408, #406, #407 (após rebase)
6. **Mobile:** #398 (após CI; smoke nativo antes de release)
7. **Grandes/conflitantes por último:** #361, #366, #368, #310 — decisão 08A/00/24
8. **Limpeza:** após merges → Fase 7 do plano (descarte branches/worktrees)

## 4. Decisões humanas pendentes (bloqueiam trilhas)

1. **Envs EC2**: `BITRIX24_WEBHOOK_URL`, `THREECX_WEBHOOK_SECRET`, `EXPOSE_METRICS`, `ENABLE_QUEUES`/topologia worker, encryption keys → determina severidade real de DEBT-0003/0006/0007/0038.
2. **Escopo Day-1**: mobile (DEBT-0004) e voz (DEBT-0022/0023/0046) — sim/não define Trilha 3 e vários P1.
3. **Janelas de retenção oficiais** (DEBT-0021/0022) — com Agente 21.
4. **Consentimento IA**: persistido vs env allowlist temporário (DEBT-0013 → P2?).
5. **#395**: automação por lead no batchUpdate é requisito ou o fix já mergeado basta?
6. **#368 paleta vs #310**: qual caminho de design oficial prevalece?

## 5. Verificações recomendadas antes do próximo merge (checklist do 00)

- [ ] Re-checar `gh pr list` — a onda de merges está ativa; números acima são snapshot de ~15:30Z.
- [ ] #390: diff real restante após merge parcial.
- [ ] #394/#407: rebase e delta real.
- [ ] #402: mergeable + aprovação 00 dos artefatos .agents.
- [ ] #395: rebase cirúrgico ou close (decisão item 5 acima).
- [ ] DEBT-0021: confirmar se #387 cobriu worker-por-org ou só o service.
- [ ] DEBT-0006: grep `BITRIX24_WEBHOOK_URL` fallback em main atual.
