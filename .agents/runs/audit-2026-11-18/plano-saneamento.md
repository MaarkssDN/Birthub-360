# Plano de Saneamento — Release Readiness 2026-11-18
**Regra:** Trava de mutação — reconciliar PRs abertos ANTES de corrigir. Cada correção em worktree isolado, dono oficial, teste de aceite, revisão Agente 24.

## Etapa 0 — Reconciliação PRs × achados (bloqueia tudo)
1. Para cada achado P0/P1 do `inventario-mestre.md`, verificar se já está coberto em #381–#393 (diff branch vs main). Evidência: vários tenancy de #383 e DSR de #381 **já estão em main**.
2. Ordem de merge sugerida (a validar por 24/08A): #387 (01A dados) → #381 (01 LGPD/DSR) → #383 (05) → #385 (02) → #384 (12) → #382 (07) → #386 (08) → #389 (17) → #390 (04) → #388 (13) → #391 (03) → #392/#393 (docs) → depois conflitantes #361/#366/#368 e antigos #310/#372/#378.
3. Decisões pendentes do 24: adendo #390 atomicidade batchUpdate; #368 paleta conflitante.
4. **Verificação de envs EC2 (humano/ops):** `BITRIX24_WEBHOOK_URL`, `THREECX_WEBHOOK_SECRET`, `EXPOSE_METRICS`, `ENABLE_QUEUES`/topologia worker, chaves encryption. Determina severidade real de DEBT-0003/0006/0007.

## Trilha 1 — Crítica (bloqueadores de exploração/perda de dados)
| DEBT | Correção mínima | Dono | Aceite |
|---|---|---|---|
| 0001 | deploy-ec2.sh: `docker exec birthhub-app npx prisma migrate deploy` + healthcheck `/health/ready` fail-closed; versionar imagem `birthhub-app:<sha>` | 08/10 | deploy de teste em staging: migrate roda, healthcheck falha o script se app não sobe |
| 0002 | pg_dump real agendado → destino externo criptografado; restore testado e evidência versionada; remover/reescrever stubs | 10/01A | `BACKUP-RESTORE-DRILL-RESULT.json` datado com restore real |
| 0003 | registrar `createBitrixOutboundWorker`/`createExternalCrmOutboundWorker` em worker.ts + parity test | 16 | teste: job enfileirado é consumido em modo worker dedicado |
| 0005 | trocar `isSafeUrl`+fetch por `safeFetch`/`assertSafeExternalUrl` em scraper+crawler; `requireRole` em /enrich | 05/15 | teste SSRF: 169.254.169.254, IPv6 ULA, redirect p/ privado → bloqueado |
| 0006 | remover fallback `BITRIX24_WEBHOOK_URL` ou allowlist; declarar env em env.ts | 01/06 | org sem conexão → erro explícito, nunca importa de portal global |
| 0007 | segredo webhook por conexão (`ThreeCXConnection.webhookSecret`) + connectionId na rota | 12/01 | evento forjado com segredo de outra org → rejeitado |
| 0019 | Company delete → soft delete ou preflight de dependências | 04 | teste: delete com contacts/leads → bloqueado ou deletedAt setado |
| 0020 | `runInTransaction` por item na importação Bitrix; enrichment pós-commit | 06/01 | falha injetada no lead → company/contact não ficam órfãos |
| 0022 | gate persistência por consentimento; anonimizar transcript/recordingUrl/rawPayload; incluir voz em retenção+DSR | 12/21 | DECLINED → nada persiste; DSR apaga ThreeCXCallEvent |
| 0023 | propagar falha real em OPT_OUT/TRANSFER/HANGUP; telefone derivado da sessão | 12 | comando com telefone inválido → executed:false |

## Trilha 2 — Lançamento (jornadas essenciais, migrations, integrações, gates)
| DEBT | Correção mínima | Dono |
|---|---|---|
| 0008 | `hasLeadReplied` recebe `since` (run.startedAt) filtra createdAt nas 3 queries | 17 |
| 0009 | TTL pending de toque de voz → failed/skipped ou re-dispatch | 17/12 |
| 0010 | sufixo opt-out obrigatório em dispatcher e-mail/WhatsApp + cold-email + List-Unsubscribe | 17/05 |
| 0011 | persistir disparo cold-email (Activity+EmailMessage), dedupe, gravar legalBasis/dataSource | 05 |
| 0016 | batchUpdate: resultado por campo ou transação; adendo 24 no #390 | 04 |
| 0017 | Mesa + start_cadence → `updateLeadStatus` canônico | 04/07 |
| 0018 | validar companyId tenant em Contact create/update (+FK composta via 01) | 04/01 |
| 0021 | retentionPurge → worker por org com requestContext.run; política oficial de janelas (decisão humana pendente) | 01A |
| 0024 | LeadForm/DealForm + intent open-create no CrmBoard (ou remover ação palette) | 02/04 |
| 0026 | lcov na suíte integration + merge no Sonar; verify:integrations/ai no CI (job ou manual documentado) | 08 |
| 0042/0043/0044 | OpenAPI doc-sem-código diff simétrico; envelope canônico; Idempotency-Key nos POSTs sensíveis | 18/donos |
| 0045 | requireRole+Zod nas rotas IA/prospecção que disparam LLM/provider | 18/05/07 |
| 0004 | **Decisão:** mobile no escopo? Se sim: backend real+TLS+assetlinks.json; se não: remover do lançamento | humano/09 |

## Trilha 3 — IA no escopo (se enxame/IA externa for Day-1)
| DEBT | Correção mínima | Dono |
|---|---|---|
| 0012 | rotear executeWithTools pelo gateway ou logAiUsage+quota+budget por iteração + recursionLimit | 07/13 |
| 0013 | consentimento persistido por org (tabela+audit) — decisão jurídica | 13/21 |
| 0014 | quota fail-closed ou fallback modelo econômico; requestContext.run em todos producers | 07 |
| 0015 | remover fallback fabricado / flag generatedByFallback+approved:false | 07 |
| 0036 | aprovação por disparo ou maxExecutionsPerDay+validação `to` em automações e-mail | 07 |

## Trilha 4 — Pós-lançamento / débito rastreado
P2/P3 do inventário: envelopes, paginação, tipos duplicados, deps mortas (rodar `npx knip`), framer-motion/motion unificar, hotspots (renovar exceções ou modularizar antes de 2026-11-30), design-lab público, agente-codigo-local, clusters mortos (remover após decisão), docs stale (PRODUCTION-READINESS re-emitir), mobile se fora de escopo.

## GO-LIVE checklist objetivo
- [ ] Todos DEBT-0001..0004 resolvidos ou formalmente descartados por decisão humana registrada.
- [ ] P1 dos módulos NO ESCOPO resolvidos + teste de regressão + revisão 24 APROVADO na revisão exata.
- [ ] Envs EC2 verificadas (BITRIX24_WEBHOOK_URL, THREECX_WEBHOOK_SECRET, EXPOSE_METRICS, ENABLE_QUEUES/topologia, encryption keys).
- [ ] Backup real agendado + restore drill com evidência versionada.
- [ ] Deploy ensaiado em staging: migrate deploy + healthcheck + rollback documentado.
- [ ] CI verde no SHA candidato; verify:migration-drift sem continue-on-error ou com baseline de drift conhecido; verify:integrations/ai executados (CI ou manual registrado).
- [ ] E2E jornadas essenciais executadas: login→CRM criar/editar/mover→conversão; prospecção→promoção; cadência opt-out/reply; LGPD DSR ponta a ponta; voice (se escopo).
- [ ] RLS exercida com role NOSUPERUSER (já no harness — confirmar nos gates do SHA).
- [ ] SonarQube quality gate passa no PR de release (após QA-01).
- [ ] Varredura de segredos no diff acumulado limpa (gitleaks).
- [ ] Decisões humanas pendentes respondidas: janelas de retenção oficiais; escopo mobile/voz Day-1; consentimento IA; política de módulos gated (registro formal por módulo: voz/proposals/design-lab/outbound).
- [ ] PRs conflitantes/stale resolvidos: #361/#366/#368 (CONFLICTING) e #310/#372/#378 (checks falhos) — merge, rebase ou close justificado.
- [ ] Exceções de hotspot (13) e waivers Trivy (~30) renovadas ou saneadas antes de 2026-11-30 — `check:hotspots` verde no SHA candidato.
- [ ] Agente 24 emite GO formal sobre a revisão exata do candidato.

## Notas do parecer 24 (2026-11-18)
- DEBT-0011+DEBT-0044 = **um único handoff** (mesmos arquivos `prospecting.routes.ts`/`cold-email.service.ts`) — dono 05 com 18 consultivo.
- DEBT-0023 × DEBT-0025: correção de `executeVoiceCommand` só faz sentido junto da decisão remover×reincluir do cluster `voice/` morto — tratar no mesmo pacote.
- DEBT-0013 pode ser rebaixado a P2 se decisão jurídica aceitar env allowlist temporariamente (registrar formalmente).

## Paralelização sem conflito
- ∥ Deploy/backup (10/08/01A) × Segurança envs/rotas (15/05/12) × Cadência (17) × CRM/dados (04/01/06) × IA (07/13) × UX (02) × Higiene mortos (00 coordenado, decisório).
- Conflitos prováveis: `bootstrap/routes.ts` (vários), `schema.prisma`+migrations (só 01), `package.json`/lock (só 00), `globals.css`/tokens (só com aprovação).
- Slots exclusivos: 01/01A, 06/06A, 08/08A — nunca concurrentes no mesmo domínio.
