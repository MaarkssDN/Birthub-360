# 04 — REGISTRO DE DECISÕES
Data: 2026-11-20 · IDs D-xx

## Decisões vigentes
| ID | Assunto | Decisão | Fonte/data | Impacto |
|---|---|---|---|---|
| D-01 | Arquitetura de agentes | **100 agentes em 10 squads com nomes**; auditoria = 09 Silas; slots 19/20 ativos | AGENTS.md via #455/#456, 19/11 | Toda governança futura; prompts legados arquivados |
| D-02 | Login retorno rota protegida | Honrar `location.state.from` com guarda anti open-redirect, `pathname+search`, fallback `/app`, `postLoginTargetRef` | #412, 19/11 | mergeado |
| D-03 | Batch CRM atômico | Escrita única por item (status+owner+tags na mesma `prisma.lead.update`) | #390+#395, 19/11 | mergeado; adendo 24 formalizar |
| D-04 | Backup real | pg_dump→gzip→AES-256 pipeline, fail-closed, restore drill com JSON, DR simulado honesto | #435, 19/11 | mergeado; falta agendamento prod |
| D-05 | Deploy fail-closed | migrate deploy antes do restart + healthcheck `/health/ready` 90s + DEPLOY_VERSION | #427, 19/11 | mergeado; ensaio staging pendente |
| D-06 | Worker outbound | consumers registrados em worker.ts/worker-extracoes/worker-crm; parity test cobre *.queue.ts | #440, 19/11 | mergeado; topologia deploy pendente |
| D-07 | Cadência débitos | `since`=run.startedAt; pending→Skipped+providerMessageId workaround (enum sem Pending); TTL 24h sweeper 5min; sufixo opt-out WhatsApp/email | #439, 19/11 | mergeado; List-Unsubscribe adiado |
| D-08 | IA débitos | fallback scriptAndPromptTool removido (fail-loud); métrica `ai_token_quota_fail_open_total`; ReAct fora do gateway = gap estrutural documentado | #431, 19/11 | mergeado; DEBT-0012 → onda dedicada |
| D-09 | Bitrix import | `runInTransaction` por item em leads+deals; enrichment pós-commit | #432, 19/11 | mergeado |
| D-10 | Sonar coverage | lcov unit+integration no Sonar; verify:integrations/verify:ai bloqueantes no gate | #430, 19/11 | mergeado; risco custo/latência LLM a observar |
| D-11 | Cold email | persistência EmailMessage+Activity/TimelineEvent pós-SMTP; dedupe `cold-email:{campaignId}:{target}`; legalBasis em texto livre até colunas do 01 | #437 APROVADO 24, aberto | aguardando merge |
| D-12 | CRM débitos | mesaTratamento via LeadUseCases canônico; assertContactCompanyInTenant; Company delete já é soft delete via interceptor | #434 APROVADO 24, aberto | aguardando merge |
| D-13 | Prisma advisory | override effect ^3.22.5 p/ GHSA-7589-6FVF-X4PW | #465, 20/11 | mergeado via --admin (impasse circular c/ #466) |

## Decisões substituídas/históricas
| ID | Assunto | Versão anterior | Substituída por |
|---|---|---|---|
| D-H1 | Numeração agentes 00–24 | roster funcional até 18/11 | D-01 (100 agentes) |
| D-H2 | Auditoria independente = agente 24 | §40 antigo | 09 Silas (AGENTS.md §4) |
| D-H3 | slots 19/20 reservados | AGENTS.md antigo | ativos: 19 Bruno, 20 Ciro |
| D-H4 | CadenceTouchResult sem Pending | mapping pending→Skipped | workaround #439; enum real pendente (G-28) |
| D-H5 | backup-encrypted placeholder | stub com sucesso falso | D-04 backup real |
| D-H6 | deploy-ec2.sh restart cego | scp+restart sem migrate | D-05 fail-closed |

## Decisões NÃO aprovadas / pendentes do Orquestrador Humano
| ID | Assunto | Opções | Bloqueia |
|---|---|---|---|
| D-P1 | Mapa equivalência agentes legado→100 | proposta subagente → aprovação | re-roteamento de handoffs, novos despachos |
| D-P2 | Escopo mobile Day-1 (DEBT-0004) | backend+TLS+assetlinks × remover do lançamento | squad 80, release |
| D-P3 | Escopo voz/telefonia (DEBT-0022/23/25) | incluir × remover clusters mortos | squads 60-64, DEBT-0021 |
| D-P4 | Envs EC2 produção | BITRIX24_WEBHOOK_URL, THREECX_WEBHOOK_SECRET, EXPOSE_METRICS, ENABLE_QUEUES, chaves backup | severidade G-06/G-07, topologia G-03, backup prod |
| D-P5 | Janelas retenção oficiais | com agente de dados (15 Olavo/21 legado) | DEBT-0021, DSR |
| D-P6 | Consentimento IA (DEBT-0013) | tabela persistida por org × env allowlist (rebaixa P2?) | squad 70/07 Íris |
| D-P7 | Triagem PRs antigos | merge #401/#415/#399? fechar #361/#366/#368/#310/#372/#378/#379/#353/#347/#367/#386/#402/#403? | fila de merges |
| D-P8 | verify:ai bloqueante ou continue-on-error | manter × flexibilizar | flakiness LLM no gate |
| D-P9 | Agendamento backup prod | cron/systemd × externo | lastro do D-04 |
| D-P10 | Destino off-site backup | scp × storage (R2 recusado 02/11) | D-04 completo |
| D-P11 | DEBT-0016 adendo 24 | confirmar aceite trade-off atomicidade | fechamento formal |
| D-P12 | Release-readiness veredito | aguardar re-reconciliação 20/11 | GO/NO-GO oficial |
