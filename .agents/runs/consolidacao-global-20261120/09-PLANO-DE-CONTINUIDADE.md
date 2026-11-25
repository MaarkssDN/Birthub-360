# 09 — PLANO DE CONTINUIDADE
Data: 2026-11-20 · Sequência priorizada por impacto/urgência/dependência

## Fase 0 — Destravar CI (hoje)
1. Aguardar CI do **#466** (ownership manifest) → merge normal quando verde.
2. Re-run checks de **#434** e **#437** → merge (auditor já aprovou ambos).
3. Verificar `main` verde: format, audit-waivers, unit tests, SonarQube.

## Fase 1 — Consolidação de governança
4. Aprovar **mapa de equivalência de agentes** (proposta do subagente) → publicar em `.agents/` e re-rotear handoffs abertos.
5. Commitar esta consolidação (`consolidacao-global-20261120/`) + adendos (re-reconciliação, mapa) na `agente/00-integracao-skills`.
6. Arqivar conversa C1 (esta) — apta conforme 07.

## Fase 2 — Decisões humanas (checklist para o Orquestrador)
7. D-P2 mobile Day-1 · D-P3 voz · D-P4 envs EC2 · D-P5 retenção · D-P6 consentimento IA · D-P7 triagem PRs · D-P8 verify:ai · D-P9/D-P10 backup prod · D-P11 adendo 24 · D-P12 veredito release.

## Fase 3 — Fechar débitos restantes (pós-decisões)
8. Handoffs schema (11 Pietro/12 Vera): enum `CadenceTouchResult.Pending`, colunas `EmailMessage`.
9. Missões novas: DEBT-0012 ReAct→gateway (onda dedicada 70/71/72/78), CRM-08, start_cadence, List-Unsubscribe, flaky tests UI, docs SRE, deploy .ps1 parity, restore-test cluster-dump guard, openssl -pass env.
10. Backup prod: envs + cron/systemd + destino off-site + primeiro restore drill real.

## Fase 4 — Integração das waves paralelas
11. Mergear Wave E restante (#447,#450-#453,#460) após revisão do auditor.
12. Mergear Onda 1 a11y (#459,#462,#463,#464) após CI.
13. Mergear AUD-1 em ordem (#401 → #396/#397/#415) após auditoria.
14. Triagem PRs stale: resgatar trabalho único ou fechar.

## Fase 5 — Faxina e veredito
15. Inventário→remoção segura de worktrees mergeados; branches órfãs.
16. Re-reconciliar release-readiness final → emitir veredito GO/NO-GO documentado.
17. Atualizar `release-readiness-audit-state.json` e este painel.

## O que NÃO fazer
- Não despachar novas frentes dependentes de D-P* antes das decisões.
- Não fechar PRs stale sem verificar trabalho único dentro.
- Não remover worktree sujo ou com commits não mergeados.
- Não usar --admin sem justificativa registrada.
