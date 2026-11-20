# Parecer Agente 24 — Revisão Independente do Pacote Release-Readiness (audit-2026-11-18)
**Revisor:** subagente Agente 24 | **Base:** `main @ b54060ad1` | **Data:** 2026-11-18

## Vereditos
- (a) Diagnóstico NO-GO: **APROVADO** — sustentado mesmo sem os DEPENDE DE DECISÃO.
- (b) Inventário mestre: **APROVADO COM RESSALVAS** — dedup majoritariamente correto; omissões confirmadas.
- (c) Plano de saneamento: **APROVADO COM RESSALVAS** — checklist objetivo mas incompleto em 3 pontos.

## Amostragem 12/12 CONFIRMADOS
DEBT-0001 (deploy-ec2.sh:32-49 sem migrate/healthcheck/tag), 0003 (worker.ts sem 2 consumers; workers.ts:192-193 só embedded), 0005 (isSafeUrl string-compare, webScraper.service.ts:42-69,131), 0006 (LeadUseCases.ts:570-576 env cru), 0008 (hasLeadReplied.ts:12-31 sem createdAt nas 3 queries), 0009 (pending sem sweeper), 0012 (AgentExecutor.ts:219-276 fora do gateway), 0015 (scriptAndPromptTool.ts:127 approved:true incondicional), 0019 (company.delete hard, PrismaCompanyRepository.ts:181-185), 0022 (voiceResult.webhook.ts:250-287 persiste incondicional; consent só gateia Copiloto), 0024 (CrmBoard sem intent; palette navega open-create), 0026 (sonar só coverage/unit/lcov).

## Deduplicação
- SEC-02=CRM-09 ✓; VOZ-03/04+SEC-08 ✓ merge (ressalva: P2+P3→P1, inflação menor justificável); PRO-04/API-04 parcial — tratar como UM handoff (mesmos arquivos); CRM-01/DB-04 guarda-chuva citado em 3 DEBTs (rastreio ok, não 1:1).

## DEPENDE DE DECISÃO — avaliação
0003/0006/0007 sustentados (código confirmado, env-dependente declarado). 0013 levemente superestimado na forma (fail-closed erra p/ seguro; risco real é alegação de conformidade) — rebaixar p/ P2 se decisão jurídica aceitar env por ora. **Ressalva DEBT-0023×0025:** executeVoiceCommand está em cluster MORTO (voice/) — risco é "se reativado", cruzar explicitamente no plano.

## NO-GO sustentado
Sem DEPENDE DE DECISÃO restam: 0001, 0002, 0008/09/10/11, 0015, 0019, 0024, 0026. Domínios sem cobertura (03/06/22) não invalidam — nenhum P0/P1 depende deles; re-auditar se entrarem no escopo.

## OMISSÕES no inventário (corrigir antes da Etapa 0)
1. **DB-02** outbound legado sem tenant canônico/RLS (normalizeTenantCompany colapsa) — incluir P2/P3 "não reativar sem organizationId+RLS".
2. **PRO-06** AdaptiveMultichannelCadenceService.executeNextStep simula envio success:true — incluir P2.
3. **PRO-07/UX-06** SelfDrivingCrmService InMemoryOptOutRepository fail-open — incluir.
4. IA-07, UX-05/06/11 residuais — listar p/ rastreabilidade.

## Checklist — faltam 3 itens
1. Resolução explícita dos PRs conflitantes/stale (#361/#366/#368; #310/#372/#378).
2. Renovação das 13 exceções hotspot + ~30 waivers Trivy antes de 2026-11-30.
3. Decisão formal documentada por módulo gated (voz/proposals/design-lab/outbound).

## Recomendações
- DEBT-0011+0044 = um único handoff (prospecting.routes.ts/cold-email.service.ts).
- Manter Trava de Mutação; ordem de merge plausível mas validar diff-a-diff na Etapa 0.
