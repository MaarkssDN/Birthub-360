# Reconciliação Release-Readiness — 2026-11-19
**Executor:** Agente 00 (Coordenador) · **Missão:** reconciliar `release-readiness-audit-state.json` + `audit-2026-11-18/` (veredito NO-GO, 4 P0, 22 P1) contra `origin/main @ 1bca0a9e4`.
**Base do audit:** `main @ b54060ad1` (18/11). **Delta:** merges #381–#393, #395, #398, #404, #406–#414, #416–#419, #421, #422 + PRs abertos #399–#403, #415, #423.
**Complementa:** `reconciliacao-etapa0-20261118.md` (feito durante a onda de merges; este documento é o estado pós-onda).
**Método:** `git log origin/main`, `gh pr list`, `git grep`/`git show` em `origin/main` para cada DEBT. Nenhum fix de produto implementado.

## 1. Resumo executivo

| Classe | Resolvido em main | Parcial | Pendente (acionável) | Bloqueado por decisão humana |
|---|---|---|---|---|
| P0 (4) | 0 | 0 | 3 (0001, 0002, 0003-código) | 1 (0004 escopo mobile) |
| P1 (22) | 1 (0016) | 5 (0005, 0012, 0014, 0017, 0024, 0026→6) | ~11 | 4 (0013 + 0004/0022/0023 dependem de escopo voz/mobile) |

**Veredito se mantido NO-GO** — nenhum P0 foi corrigido em código; os merges fecharam débito de handoffs/testes, não os bloqueadores de deploy/backup/worker/mobile. A Trava de Mutação do plano pode ser considerada **cumprida quanto à Etapa 0** (reconciliação PRs×achados executada em 18/11 e agora atualizada), mas os bloqueadores de código P0/P1 seguem abertos.

## 2. P0 — estado atual

| ID | Achado | Status em origin/main | Evidência | Dono | Próximo passo |
|---|---|---|---|---|---|
| DEBT-0001 | Deploy EC2 sem `prisma migrate deploy` nem healthcheck | ⬜ PENDENTE | `deploy-ec2.sh` inalterado: scp dist/node_modules + `docker restart birthhub-app`, sem migrate, sem healthcheck fail-closed, sem tag de imagem | 08/10 | Implementar migrate deploy + `/health/ready` no script; ensaiar em staging |
| DEBT-0002 | Zero backup real; stubs reportam sucesso falso | ⬜ PENDENTE | `scripts/db/backup-encrypted.sh` ainda grava placeholder `"-- Birth Hub 360 Backup Placeholder --"` e imprime "Backup gerado com sucesso"; `scripts/backup.sh` é pg_dump local/dev (./backups, retenção 14d) sem evidência de agendamento/backup externo em prod | 10/01A | pg_dump real agendado → destino externo criptografado; restore drill com evidência (`BACKUP-RESTORE-DRILL-RESULT.json`) |
| DEBT-0003 | Worker dedicado sem consumidores `bitrix-outbound-sync`/`external-crm-outbound-sync` | ⬜ PENDENTE (código) / 🟡 severidade depende de env | `worker.ts`, `worker-core.ts`, `worker-crm.ts`, `worker-ia.ts`, `worker-mercado.ts`, `worker-prospecting.ts`, `worker-extracoes.ts` **não** registram `createBitrixOutboundWorker`/`createExternalCrmOutboundWorker` — só existem em `src/bootstrap/workers.ts:192-193` sob `embeddedWorkersEnabled` (modo embedded). #408 (mergeado) cobriu só domainEventMesh/outboundSync dedup | 16 | Registrar consumers nos workers dedicados + parity test; **severidade real depende de `ENABLE_QUEUES`/topologia EC2 (decisão humana)** |
| DEBT-0004 | Mobile aponta p/ backend sem DNS (`app.birthhub360.com.br`) | 🔷 BLOQUEADO | #398 (mergeado) corrigiu permissões iOS/Android, safe-area e paridade de abas — **não** resolve backend/DNS/App Links. Nenhum PR cobre backend real+TLS+assetlinks | humano/09 | Decisão de escopo Day-1; se sim: provisionar backend+TLS+assetlinks; se não: remover mobile do lançamento |

## 3. P1 — estado atual (22 itens)

Legenda: ✅ resolvido em main · 🟡 parcial · ⬜ pendente acionável · 🔷 bloqueado por decisão humana · 📦 já coberto por PR aberto aguardando merge.

| ID | Achado | Status | Evidência / cobertura | Dono | Próximo passo |
|---|---|---|---|---|---|
| 0005 | SSRF residual `/prospecting/enrich` + crawler | 📦/⬜ | Infra mergeada: `src/shared/security/urlGuard.ts` robusto (#381, #413 `fe80::/10`+`::ffff`). **MAS** `prospecting.routes.ts:585` `/enrich` segue sem `requireRole` e usa `webScraper.service.ts:42 isSafeUrl` fraco (sem DNS pinning, sem CGNAT 100.64/10, sem IPv6 ULA/link-local, sem revalidação de redirect). **PR #401 ABERTO cobre exatamente isso** (AUD-1 SSRF guard + RBAC /enrich) | 05/15 | Mergear #401 (revisão 24 pendente); depois auditar crawler/demais fetches |
| 0006 | Fallback global `BITRIX24_WEBHOOK_URL` | ⬜ + 🔷 severidade | `LeadUseCases.ts:575-578` e `integrations/bitrix/service/settings.ts:15` ainda fazem fallback p/ env global. #383 (mergeado) tratou tenancy de outbound, não este fallback | 01/06 | Remover fallback ou allowlist; **depende de verificar se env está setada em prod (decisão/ops)** |
| 0007 | Webhook 3CX segredo global compartilhado | ⬜ + 🔷 severidade | `threecx.routes.ts:35` usa `env.THREECX_WEBHOOK_SECRET` global; `threecx.service.ts:498` documenta o problema. #384 era só testes/handoffs | 12/01 | Segredo por conexão (`ThreeCXConnection.webhookSecret`) + connectionId na rota; severidade depende de >1 org com 3CX |
| 0008 | `hasLeadReplied` sem corte temporal | ⬜ | `cadence/infra/hasLeadReplied.ts` — 3 queries sem `since`/`createdAt >= run.startedAt`; assinatura `(organizationId, leadId)` inalterada | 17 | Adicionar `since` (run.startedAt) nas 3 queries (WhatsApp, EmailMessage, VoiceCallLog) |
| 0009 | Toque de voz `pending` sem TTL/sweeper | ⬜ | Nenhum TTL/expiração/sweeper para attempts `pending` em cadence (grep ttl/sweep/expir vazio); `CadenceDispatchers.ts:435` grava `result:'pending'` | 17/12 | TTL pending → failed/skipped ou re-dispatch agendado |
| 0010 | Nenhuma mensagem outbound instrui opt-out | ⬜ | Sem sufixo "responda SAIR"/footer/List-Unsubscribe nos dispatchers e no `sendColdEmail` (body vai cru p/ `sendEmail`). #389 tratou optOutRepo durável, não o sufixo | 17/05 | Sufixo opt-out obrigatório (e-mail/WhatsApp/cold-email) + List-Unsubscribe header |
| 0011 | `sendColdEmail` sem persistência/idempotência/legalBasis gravada | ⬜ | `cold-email.service.ts:72-140`: checa legalBasis/dataSource/opt-out/MX, chama `sendEmail`, retorna bool — **não grava Activity/EmailMessage, sem dedupe, legalBasis não persistida**. #383 melhorou opt-out/batch, não persistência | 05 | Persistir disparo (Activity+EmailMessage), dedupe por campaignId+target, gravar legalBasis/dataSource (handoff conjunto c/ DEBT-0044 — nota do parecer 24) |
| 0012 | Loop ReAct do enxame fora do gateway (sem quota/budget/circuit) | 🟡 | #388 mergeado criou `src/lib/agents/{tokenBudget,executionLimits,concurrencyControl}.ts` e `agentOrchestrator` os usa. Falta confirmar: iteração do ReAct passa por quota/budget/AILog/circuit por chamada | 07/13 | Verificar `executeWithTools`/ReAct loop → rotear por iteration ou documentar budget enforcement; teste de custo teto |
| 0013 | "Consentimento LGPD" de IA é env allowlist, não consentimento persistido | 🔷 | Sem mudança; decisão jurídica pendente (pode rebaixar a P2 se env allowlist aceita — nota parecer 24) | 13/21 | **Decisão humana**; se persistido: tabela+audit por org/titular |
| 0014 | TokenQuota fail-open + bypass sem tenantId | 🟡 | Parcial via #388 (tokenBudget). Fail-open em DB down e producers sem requestContext.run precisam revalidação | 07 | Auditar TokenQuota fail-mode; garantir requestContext.run em todos os producers de IA |
| 0015 | `scriptAndPromptTool` fallback fabrica prompt + `approved:true` | ⬜ | `tools/scriptAndPromptTool.ts:~127` — fallback inline gera conteúdo e `prisma.prompt.create({ approved: true })` persiste como aprovado | 07 | Remover fallback fabricado ou flag `generatedByFallback`+`approved:false`; não salvar como aprovado |
| 0016 | `batchUpdateLeads` não atômico / failedCount | ✅ (c/ ressalva) | #390 mergeado (escrita única status+extraFields, `PrismaLeadRepository.ts:379`) + **#395 mergeado 19/11** (automação por lead que mudou de status). Ressalva: adendo 24 sobre nota de atomicidade — verificar se emitido | 04 | Confirmar/registrar adendo 24; se trade-off aceito → fechar DEBT-0016 |
| 0017 | Mesa de Tratamento + `start_cadence` alteram status fora do fluxo canônico | 🟡 | `mesaTratamento.routes.ts:~290-330` melhorou: Bitrix-first, status local só em desqualificar/converter — mas ainda `prisma.lead.update` direto (sem LeadStageHistory/pipeline/closedAt canônicos). `aiPendingAction.service.ts:251` start_cadence idem a verificar | 04/07 | Rotear por `updateLeadStatus` canônico ou registrar exceção justificada |
| 0018 | `Contact.companyId` sem validação de tenant | ⬜ | `contactSchema.companyId` é `z.string()` puro; `ContactUseCases`/`PrismaContactRepository` não validam que a company pertence à org | 04/01 | Validar companyId tenant em create/update; FK composta via 01 se necessário |
| 0019 | Exclusão de Company hard delete sem guarda | ⬜ | `PrismaCompanyRepository.ts:184` — `prisma.company.delete({ where: { id, organizationId } })` sem preflight de dependências; schema tem `deletedAt` não usado nesse caminho | 04 | Soft delete ou preflight bloqueante (contacts/leads/deals) |
| 0020 | Importação Bitrix não atômica → órfãos parciais | ⬜ | `bitrix/service/leads.ts:322-370` — `company.create`/`contact.create`/`lead.create` sequenciais por item, sem `$transaction`/`runInTransaction`. #406 cobriu outboundSync dedup, não import | 06/01 | `runInTransaction` por item; enrichment pós-commit |
| 0021 | `retentionPurge.service.ts` dead code + incompatível c/ RLS | ⬜ + 🔷 janelas | `executeRetentionPurge` **não tem nenhum caller** em `src/`/`worker*.ts` (grep vazio fora do próprio service) — #387 tocou o service mas não o conectou. Janelas oficiais de retenção = decisão humana pendente | 01A | Worker por org com `requestContext.run({tenantId})` + política de janelas (após decisão 21) |
| 0022 | Voz persiste transcrição/áudio/rawPayload sem consentimento/retenção; DSR não cobre ThreeCXCallEvent | ⬜ + 🔷 escopo voz | `threecx.service.ts:725-734` grava `ThreeCXCallEvent` sem gate de consentimento DECLINED; sem anonimização/retenção | 12/21 | **Depende do escopo voz Day-1**; se sim: gate por consentimento, anonimizar, incluir em retenção+DSR |
| 0023 | `executeVoiceCommand` falso sucesso (HANGUP verified sem efeito etc.) | ⬜ + 🔷 escopo voz | `voice-command-executor.service.ts:54-60` — HANGUP retorna `executed:true, verified:true` sem efeito real. Mesmo pacote que DEBT-0025 (cluster `voice/` morto — decidir remover×reincluir) | 12 | **Depende do escopo voz**; corrigir junto da decisão do cluster morto |
| 0024 | Sem criação manual de lead/oportunidade na UI | 🟡 | Palette: ação morta "Nova oportunidade" **removida** (`CommandPalette.tsx:307,324` — comentários documentam). Porém segue sem formulário de criação de lead/deal no CrmBoard | 02/04 | LeadForm/DealForm + intent `open-create` no CrmBoard (ou aceitar remoção e documentar) |
| 0025 | Clusters mortos sob typecheck (`ai-voice/`, `voice/`, `proposals/`, `temporal-workers/`, `crawlee/`) | 🔷 | Sem mudança; decisão remover×reintegrar pendente (pacote c/ DEBT-0023, DEBT-0046) | 00 | Decisão humana de escopo; executar remoção ou reintegração conforme decidido |
| 0026 | SonarQube mede ~só unitário; verify:integrations/ai fora do CI gate | 🟡 | `ci.yml:319` roda `test:integration -- --coverage`, mas `sonar-project.properties` só consome `coverage/unit/lcov.info` + coverage python — lcov de integration não alimenta o Sonar. `verify:integrations`/`verify:ai` só em `onda-2.5-validation.yml` (não é gate). #404 adicionou coverage gate por domínio (parcial) | 08 | Merge do lcov integration no Sonar + verify:integrations/ai no gate (job ou manual documentado) |

## 4. Decisões que precisam do usuário (bloqueiam trilhas)

1. **Envs EC2 de produção** — `BITRIX24_WEBHOOK_URL` (severidade DEBT-0006), `THREECX_WEBHOOK_SECRET` (DEBT-0007), `EXPOSE_METRICS` (DEBT-0038), `ENABLE_QUEUES`/topologia worker dedicado×embedded (DEBT-0003 severidade real), encryption keys.
2. **Escopo Day-1: mobile** — DEBT-0004. Sim → backend+TLS+assetlinks; não → remover do lançamento.
3. **Escopo Day-1: voz/telefonia** — DEBT-0022, DEBT-0023, DEBT-0025 (cluster morto), DEBT-0046. Define se Trilha 3 de voz executa ou se clusters são removidos.
4. **Janelas de retenção oficiais** — DEBT-0021/0022, com Agente 21.
5. **Consentimento IA** — DEBT-0013: tabela persistida por org ou env allowlist temporário aceito (rebaixa a P2)?
6. **Fechamento de PRs restantes** — #401 (SSRF, recomendo merge após revisão 24), #415 (P0 security fixes do #310), #423 (escopo visual), #399/#400/#402/#403/#386 (onda-6/contratos/testes), e os antigos conflitantes/stale #361/#366/#368/#310/#372/#378/#379/#347/#353/#367/#379: merge, rebase ou close justificado.
7. **Adendo 24 — DEBT-0016**: confirmar se o trade-off de atomicidade do batchUpdate foi aceito (evidência de merge #390+#395 já em main).

## 5. Ordem de execução proposta (pós-decisões)

- **Trilha A — Deploy/ops (P0):** DEBT-0001 (08/10) ∥ DEBT-0002 (10/01A) ∥ DEBT-0003 código (16) — podem iniciar já; severidade final depende do item 1 acima.
- **Trilha B — Segurança/SSRF:** merge #401 → revalidar DEBT-0005; DEBT-0006/0007 após confirmação de envs.
- **Trilha C — Cadência/prospecção:** DEBT-0008→0009→0010→0011 (17/05, pacote coeso).
- **Trilha D — IA:** DEBT-0015 (rápido) → 0012/0014 (verificação) → 0013 (após decisão).
- **Trilha E — CRM/dados:** DEBT-0017→0018→0019→0020 (04/01/06).
- **Trilha F — Voz/mobile:** só após decisões 2 e 3.
- **Trilha G — Gates/QA:** DEBT-0026 (08) + fechamento de PRs abertos/conflitantes.
- Cada fix: worktree isolado, dono oficial, teste de aceite, revisão Agente 24 na revisão exata.

## 6. Estado do JSON

`.agents/runs/release-readiness-audit-state.json` atualizado com nota de reconciliação datada (fase → `RECONCILIADO_2026-11-19`); veredito NO-GO **mantido** — evidência insuficiente para rebaixar nenhum P0 e 11+ P1 seguem pendentes em código.
