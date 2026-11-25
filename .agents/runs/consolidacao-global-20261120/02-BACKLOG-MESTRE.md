# 02 — BACKLOG MESTRE CONSOLIDADO
Data: 2026-11-20 · IDs globais G-xx · Status verificado via gh/git

Status: ✅ mergeado/main · 🔄 PR aberto · 🟡 parcial · ⬜ pendente · 🔷 bloqueado (decisão humana) · 📦 PR aberto cobrindo

| ID | Tarefa | Área | Resp. (legado→novo) | Status | Prioridade | Depende de | Evidência | Próxima ação |
|---|---|---|---|---|---|---|---|---|
| G-01 | DEBT-0001 deploy migrate+healthcheck | ops | 08/10→94 Tess/90 Hélio | ✅ | P0 | ensaio staging humano | #427 `2b748ad4a` | ensaiar em staging; paridade .ps1 |
| G-02 | DEBT-0002 backup/restore/DR real | ops | 10→19 Bruno | ✅ | P0 | envs+cron prod | #435 `b3f5709ee` | agendar backup; secrets; rejeitar dump cluster antes de BACKUP_ALL_DATABASES=1 |
| G-03 | DEBT-0003 worker outbound consumers | runtime | 16→23 Pina | ✅ | P0 | topologia deploy | #440 `2d595db6` | wiring worker-crm/extracoes no deploy |
| G-04 | DEBT-0004 mobile backend/DNS | mobile | 09→80-89 | 🔷 | P0 | decisão escopo Day-1 | — | decidir: backend+TLS ou remover mobile |
| G-05 | DEBT-0005 SSRF /enrich + crawler | segurança | 05/15→43 Amon/99 Vito | 📦 | P0 | merge #401 | PR #401 aberto | merge #401 + revisão 09 Silas |
| G-06 | DEBT-0006 fallback BITRIX24_WEBHOOK_URL | segurança | 01/06→11/50 | 🔷 | P1 | env prod | LeadUseCases.ts:575 | confirmar env; remover fallback |
| G-07 | DEBT-0007 segredo 3CX global | segurança | 12/01→61 Nando/11 | 🔷 | P1 | env prod | threecx.routes.ts:35 | segredo por conexão |
| G-08 | DEBT-0008 hasLeadReplied sem `since` | cadência | 17→44 Lola | ✅ | P1 | — | #439 `8a77792cf` | — |
| G-09 | DEBT-0009 pending voice touch sem TTL | cadência | 17→44/64 | ✅ | P1 | enum Pending (G-26) | #439 | workaround ativo até G-26 |
| G-10 | DEBT-0010 sufixo opt-out outbound | cadência | 17/05→44/69 Eli | ✅ | P1 | List-Unsubscribe residual | #439 | header List-Unsubscribe (follow-up) |
| G-11 | DEBT-0011 cold email persistência | prospecção | 05→43/55 | 🔄 | P1 | #465 mergeado→re-run | PR #437 `54a114a7f` | re-run checks → merge |
| G-12 | DEBT-0012 loop ReAct fora do gateway | IA | 07/13→71/72 | ⬜ | P1 | decisão arquitetura | handoff 07→00 | onda dedicada adapter BaseChatModel |
| G-13 | DEBT-0013 consentimento IA | LGPD | 13/21→07 Íris/08 Dora | 🔷 | P1 | decisão jurídica | — | persistido por org vs env allowlist |
| G-14 | DEBT-0014 TokenQuota fail-open | IA | 07→78 Oz | ✅ | P1 | alerta métrica (G-25?) | #431 `c97d89a47` | alerta Prometheus p/ 95 Íon |
| G-15 | DEBT-0015 scriptAndPromptTool fallback | IA | 07→72/77 | ✅ | P1 | — | #431 | — |
| G-16 | DEBT-0016 batchUpdate atômico | CRM | 04→41/42 | ✅ | P1 | adendo 24 (formalizar) | #390+#395 | registrar aceite do trade-off |
| G-17 | DEBT-0017 status fora fluxo canônico | CRM | 04→41/42 | 🔄 | P1 | start_cadence (G-19) | PR #434 `28f08e478` | re-run → merge; executar G-19 |
| G-18 | DEBT-0018 companyId sem tenant | CRM | 04→41 | 🔄 | P1 | — | PR #434 | idem |
| G-19 | DEBT-0019 hard delete Company | CRM | 04→41 | ✅ | P1 | — | já era soft delete (interceptor) | comentário anti-regressão em #434 |
| G-20 | DEBT-0020 import Bitrix não atômico | integrações | 06→52/28 | ✅ | P1 | — | #432+#454 | teste integração rollback (sugestão 24) |
| G-21 | DEBT-0021 retentionPurge dead code | dados | 01A→15 Olavo | 🔷 | P1 | janelas retenção + caller | sem caller em src | decisão janelas (21) + worker |
| G-22 | DEBT-0022 voz persiste sem consentimento | voz | 12→62/69 | 🔷 | P1 | escopo voz Day-1 | threecx.service.ts:725 | junto de G-23 |
| G-23 | DEBT-0023 executeVoiceCommand falso sucesso | voz | 12→64 Tito | 🔷 | P1 | escopo voz + cluster | voice-command-executor | idem |
| G-24 | DEBT-0024 sem criação manual lead/deal | UX | 02/04→30/41 | 🟡 | P2 | decisão produto | ação morta removida (#438) | LeadForm/DealForm ou aceitar remoção |
| G-25 | DEBT-0025 clusters mortos (voice/ai-voice/etc) | voz | 00→70/60 | 🔷 | P2 | escopo voz | typecheck passa, código morto | remover×reintegrar |
| G-26 | DEBT-0026 sonar só unitário/verify fora gate | CI | 08→94 Tess | ✅ | P1 | observar verify:ai | #430 `345152168` | monitorar flakes LLM/BrasilAPI |
| G-27 | start_cadence status canônico | IA/CRM | handoff 04→07 | ⬜ | P1 | — | handoff c/ snippet | novo agente executa |
| G-28 | Enum CadenceTouchResult.Pending | schema | handoff 17→01 | ⬜ | P1 | migration (12 Vera) | handoff trilha-c | 11 Pietro + 12 Vera |
| G-29 | Colunas EmailMessage (campaignId/legalBasis/etc) | schema | handoff 05→01 | ⬜ | P2 | migration | handoff onda-liquidacao | 11 Pietro |
| G-30 | CRM-08 contacts where sem organizationId | CRM | não atribuído | ⬜ | P2 | — | sinalizado PR #434 | abrir missão p/ 41 Cadu |
| G-31 | Wave E idempotencyKey DomainEventMesh | runtime | vários→24 Ivo | 🔄 | P1 | PRs #447,#450-453,#460 | handoff 16→00 | revisar+mergear restantes |
| G-32 | AUD-1 segurança residual | segurança | 05/15/06→99/43/50 | 🔄 | P0 | ordem de merge | PRs #396,#397,#401,#415 | merge ordenado + Silas |
| G-33 | Onda 1 a11y/labels/contraste | UX | 02/03→34 Ari | 🔄 | P1 | CI | PRs #459,#462,#463,#464 | CI + Silas |
| G-34 | Ownership manifest × AGENTS.md 100 agentes | governança | 03→09 Silas? | 🔄 | P0 | — | PR #466 (teste falhava) | merge #466 → destrava tudo |
| G-35 | Remap IDs legado→100 agentes | governança | 00 | ⬜ | P0 | proposta subagente | .agents/runs/00-proposta-* | aprovação humana do mapa |
| G-36 | PRs stale/conflitantes (#361,366,368,310,372,378,379,353,347,367,386,399,402,403,415) | governança | 00 | 🔶 | P1 | triagem | audit state + gh | close/merge por PR |
| G-37 | Faxina worktrees/branches (46 wt) | higiene | 00/94 | 🔶 | P2 | pós-merges | git worktree list | inventário→remoção segura |
| G-38 | Re-reconciliação release-readiness | governança | 00 | 🔄 | P0 | subagente rodando | .agents/runs/00-reconciliacao-20261120 | novo veredito NO-GO/GO |
| G-39 | Alerta Prometheus ai_token_quota_fail_open | observab. | 10→95 Íon | ⬜ | P3 | — | #431 métrica criada | regra de alerta |
| G-40 | deploy-ec2.ps1/aws.ps1 paridade | ops | 08→94 | ⬜ | P2 | — | achado revisão #427 | follow-up script |
| G-41 | restore-test rejeitar dump cluster | ops | 10→19 | ⬜ | P2 | antes de BACKUP_ALL_DATABASES=1 | achado Silas #435 | fix pequeno |
| G-42 | openssl -pass env: (não pass:) | ops | 10→98 Safira | ⬜ | P3 | — | achado Silas #435 | follow-up |
| G-43 | List-Unsubscribe header cold/cadence | compliance | 05/17→69 Eli | ⬜ | P2 | endpoint unsubscribe | decisão #439 | implementar quando endpoint existir |
| G-44 | Testes flaky "Round 1 de 3" (UI) | QA | não atribuído | ⬜ | P2 | — | falhou SonarQube #437 | debitar p/ 03 Nina |
| G-45 | billing webhook idempotência (Wave E restante) | billing | — | 🔄 | P1 | dentro de G-31 | PRs waveE | — |

## Contagem
- P0: 6 (G-01✅, G-02✅, G-03✅, G-04🔷, G-05📦, G-32🔄, G-34🔄, G-35⬜, G-38🔄) — naive: 4 resolvidos, 1 PR aberto, 1 decisão, 3 em andamento
- P1: ~20 · P2: ~10 · P3: 2
- Método: conta itens da tabela; "resolvido" exige merge em main verificado, não relato.
