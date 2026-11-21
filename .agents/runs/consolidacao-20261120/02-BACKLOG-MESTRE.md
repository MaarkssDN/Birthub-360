# 02 ‚Äî BACKLOG MESTRE CONSOLIDADO
**IDs globais G-xx ¬∑ gerado 2026-11-20**
Status: `VERIFICADO` = confirmado em git/GitHub; `REPORTADO` = evid√™ncia de agente/relat√≥rio; `PENDENTE` = n√£o verificado.

| ID | Tarefa | √Årea | Resp. (legado‚Üínovo aprox.) | Status can√¥nico | Prio | Depend√™ncias | Evid√™ncia | Pr√≥xima a√ß√£o | Aceite |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | Merge Wave E idempotencyKey restante | Backend | 02/04/06/07/09/10/12/17 | **Aprovado 24**; #447,#450‚Äì#453 aguardam CI | P1 | CI verde | `waveE-outbox-idempotency-24.md` | Mergear em leva | Todos produtores com chave est√°vel |
| G-02 | Mergear #441 guardrails PII anti-encoding | IA | 07‚Üísquad70 | Aprovado c/ ressalvas; CI pendente | P1 | CI | PR #441, parecer #443 | Mergear | Testes 85/85 + integra√ß√£o no CI |
| G-03 | Mergear #386 QA handoffs + schemathesis fix | QA | 08‚Üísquad00 | CI pendente | P1 | CI | commits pushed | Mergear | Schemathesis roda com `--url`/`--max-examples` |
| G-04 | Mergear #415 ErrorBoundary + fixes P0 do #310 | Seguran√ßa/UX | 02 | BLOCKED (CI) | P1 | CI + revis√£o | handoff onda-review | CI ‚Üí 24 ‚Üí merge | Stack trace n√£o exposto |
| G-05 | Deploy com migrate+healthcheck | Infra | 08/10‚Üí94/90 | ABERTO | **P0** | decis√£o deploy | DEBT-0001 (24 confirmou) | Miss√£o dedicada | Deploy roda migrate e healthcheck |
| G-06 | Escopo mobile no release | Produto | **humano** | DECIS√ÉO PENDENTE | **P0** | ‚Äî | DEBT-0004 | **Aprova√ß√£o humana** | Decis√£o documentada |
| G-07 | Paleta oficial #368 (100 arquivos) | Design | 03‚Üísquad30 | BLOCKED, devolvido p/ remediar | P1 | decis√£o produto/marca | decis√£o 00 registrada | Remediar gates ou abandonar | Gates verdes + QA visual |
| G-08 | Backup/restore/DR real | Infra | 10‚Üí90 | PR #435 mergeado ‚Äî **verificar cobertura** | P0 | staging | merge 19:46 | Validar DEBT-0002 | Restore testado |
| G-09 | Worker consumers outbox | Runtime | 16‚Üí23 | PR #440 mergeado ‚Äî **verificar cobertura** | P0 | staging | merge 20:28 | Validar DEBT-0003 | Consumers dedicados ativos |
| G-10 | Docker 2375 sem auth + rota√ß√£o segredos | SecOps | **humano/host** | A√á√ÉO HUMANA | **P0** | acesso host | 2 handoffs | Executar no host 192.168.0.116 | Porta fechada/autenticada; segredos rotacionados |
| G-11 | Renova√ß√µes: 13 exce√ß√µes hotspot + ~30 waivers Trivy | SecOps | 15‚Üí99 | **PRAZO 2026-11-30** | P1 | ‚Äî | parecer 24 | Agendar renova√ß√£o | Zero exce√ß√µes expiradas |
| G-12 | Scanner real ContinuousSecurityAudit | Seguran√ßa | 10+15 | ABERTO | P2 | ‚Äî | handoff 00‚Üí10 | Onda futura | `simulated:false`, dados reais |
| G-13 | `piiDetection.service.ts` sem anti-encoding | IA | 07 | Handoff criado | P2 | #441 mergeado | ressalva 24 | Despachar | PII codificada detectada |
| G-14 | Outbox: ressalvas de chave (forecast mensal, briefing, barge-in) | Backend | donos | Documentadas, n√£o bloqueantes | P3 | ‚Äî | parecer waveE | Backlog futuro | Revisar se necess√°rio |
| G-15 | ~20 PRs de outras sess√µes (#347‚Äì#437, #459‚Äì#466) | V√°rios | v√°rios | BLOCKED/CI | P1 | CI + revis√£o por PR | `gh pr list` | Triagem em levas | Cada PR revisado e mergeado/fechado |
| G-16 | Handoffs abertos remanescentes | Gov. | por dono | **36** abertos/em-andamento | P2 | triagem | grep Status | Triagem cont√≠nua | Fila <10 ou zerada |
| G-17 | Orquestra√ß√£o sem demo (itens 02/08) | Produto/QA | 02/08 | EM-ANDAMENTO (07,17 resolvidos) | P2 | ‚Äî | handoff 00‚Üí17-07 | E2E overview real vs vazio | Empty state honesto |
| G-18 | Gate ownership prosa (server.ts/package.json) | Gov. | 00/08 | ABERTO | P3 | ‚Äî | handoff 00‚Üí00 | Estender manifest | Gate cobre regras de prosa |
| G-19 | UX-05a/b c√≥digo morto, UX-09 perfil, UX-08 decis√£o | UX | 01/02/05 | PRONTO / decis√£o | P2‚ÄìP3 | ‚Äî | mem√≥ria central | Miss√µes pequenas | Crit√©rios por item |
| G-20 | Invent√°rio omiss√µes (DB-02, PRO-06/07, IA-07, UX-05/06/11) | Dados/Prod. | m√∫ltiplos | PENDENTE corre√ß√£o do plano | P2 | ‚Äî | parecer 24 | Incorporar Etapa 0 | Itens no plano |
| G-21 | PRs stale/conflitantes (#361/#366/#368/#310/#372/#378) | Gov. | 00 | STALE | P1 | ‚Äî | checklist GO-LIVE | Reconciliar ou fechar | Zero PRs zumbis |
| G-22 | Coverage SonarQube 80% (DEBT-0026) | QA | 08 | PR #430 aberto | P2 | CI | ‚Äî | CI + merge | Gate verde |
| G-23 | A11y Onda 1 (labels settings, contraste) | Design | 02/03 | PRs #462/#463 abertos | P2 | CI | ‚Äî | CI + revis√£o | WCAG AA |
| G-24 | Consentimento IA (DEBT-0013) + escopo voz/proposals/design-lab/outbound | Produto/Jur√≠dico | humano | DECIS√ÉO PENDENTE | P1 | ‚Äî | parecer 24 | **Decis√£o humana** | Decis√£o documentada |
| G-25 | Cad√™ncia DEBT-0008/09/10 | Cad√™ncia | 17 | PR #439 mergeado ‚Äî verificar | P2 | ‚Äî | merge 19:50 | Validar | Testes verdes em main |
| G-26 | CRM Trilha E (DEBT-0017/18/19) | CRM | 04 | PR #434 aberto | P1 | CI | ‚Äî | CI + merge | Status can√¥nico |
| G-27 | Cold-email persist√™ncia (DEBT-0011) | Prospec√ß√£o | 05 | PR #437 aberto | P1 | CI | ‚Äî | CI + merge | Persist√™ncia+LGPD |
| G-28 | AUD-1 seguran√ßa por dom√≠nio (#396/#397/#401) | Seguran√ßa | 05/06/15 | Abertos | P1 | CI | ‚Äî | CI + merge | Sanitiza√ß√£o/RBAC |
| G-29 | Envelope erro unificado + OpenAPI (#399) | Contratos | 18 | Aberto | P2 | CI | ‚Äî | CI + merge | Contrato √∫nico |
| G-30 | Flaky e2e (#403), Schemathesis noturno (#400 merged?) | QA | 14/08 | #403 aberto; #400 mergeado | P2 | CI | git log | CI + merge #403 | Suite est√°vel |

---

## 2. Backlog Mestre Reconciliado ó 20 Atividades Rumo ‡ HomologaÁ„o

| ID | Prioridade | DomÌnio / Squad | Agente Dono | Tarefa TÈcnica | Origem / PR | Status Verificado | CritÈrio de Aceite |
|:---|:---:|:---|:---:|:---|:---|:---:|:---|
| **BM-P0-01** | **P0** | Squad 90 (Infra/CI) | 94 Tess | FormataÁ„o Biome em LeadUseCases.ts e CopilotoIaUseCases.ts | PR #511 | **BLOQUEADO** (Dependency Cruiser) | Prettier/Biome verde no CI em main |
| **BM-P0-02** | **P0** | Squad 90 (AppSec) | 99 Vito | RemediaÁ„o de Achados Semgrep / SAST (TLS e Bitrix) | PR #507 (Draft) | **EM_ANDAMENTO** | Semgrep SAST 100% verde sem waivers |
| **BM-P0-03** | **P0** | Squad 10/00 (Dados/LGPD) | 11 Pietro / 07 Õris | Auditoria e DeliberaÁ„o SwarmAuditLog (DEC-H01) | PR #487 (Draft) | **AGUARDANDO_APROVACAO** | DeliberaÁ„o formal (RESTRICT + AnonimizaÁ„o) |
| **BM-P0-04** | **P0** | Squad 90 (SecOps) | 90 HÈlio / Humano | Portas Docker Host (2375) e RotaÁ„o de Segredos | Host / DEBT-0005 | **PENDENTE** | Porta 2375 fechada / TLS m˙tuo; chaves rotacionadas |
| **BM-P1-01** | **P1** | Squad 40 (CRM) | 41 Cadu | IntegraÁ„o CRM Trilha E (DEBT-0017/18/19) | PR #434 | **CONCLUÕDO_SEM_VALIDACAO** | Conflito em PrismaContactRepository 100% sanado |
| **BM-P1-02** | **P1** | Squad 40 (ProspecÁ„o) | 43 Amon | PersistÍncia e DeduplicaÁ„o Cold-Email (DEBT-0011) | PR #437 | **EM_ANDAMENTO** | Hash SHA-256 e deduplicaÁ„o no banco |
| **BM-P1-03** | **P1** | Squad 90/20 (SeguranÁa) | 96 Nera / 97 Rocco | Pacote AUD-1 SeguranÁa (SSRF, cookies seguros, RBAC) | PRs #396, #397, #401 | **CONCLUÕDO_SEM_VALIDACAO** | Cookies com SameSite=Strict e rotas protegidas |
| **BM-P1-04** | **P1** | Squad 20/00 (Contratos) | 21 Zara / 04 TÈo | PadronizaÁ„o RFC 7807 e Runner Schemathesis | PR #399 | **CONCLUÕDO_SEM_VALIDACAO** | Erros no formato pplication/problem+json |
| **BM-P1-05** | **P1** | Squad 00 (QA) | 04 TÈo | Saneamento de Handoffs de QA e Schemathesis CLI | PR #386 | **CONCLUÕDO_SEM_VALIDACAO** | CLI executa sem flags depreciadas |
| **BM-P1-06** | **P1** | Squad 00 (AutomaÁ„o E2E) | 05 Luma | EstabilizaÁ„o de Testes Flaky E2E | PR #403 | **EM_ANDAMENTO** | 10 execuÁıes Playwright consecutivas verdes |
| **BM-P1-07** | **P1** | Squad 90 (SecOps) | 99 Vito | RenovaÁ„o de ExceÁıes Hotspot e Waivers Trivy | Config / DEBT-0020 | **PENDENTE** | Waivers renovados atÈ 2026-12-31 |
| **BM-P2-01** | **P2** | Squad 90/10 (SeguranÁa) | 99 Vito / 10 Mara | Scanner Real no ContinuousSecurityAudit (EXP-06) | PR #484 / Branch 10 | **EM_ANDAMENTO** | Flag simulated: false e persistÍncia de auditoria |
| **BM-P2-02** | **P2** | Squad 70/00 (IA/LGPD) | 77 Gaia / 07 Õris | DetecÁ„o Anti-Encoding em piiDetection.service.ts | Branch 07 | **EM_ANDAMENTO** | SanitizaÁ„o contra base64/hex encoding |
| **BM-P2-03** | **P2** | Squad 00 (QA) | 03 Nina | Cobertura de Testes SonarQube 80% (DEBT-0026) | PR #430 | **EM_ANDAMENTO** | Quality gate SonarQube verde em CI |
| **BM-P2-04** | **P2** | Squad 30 (Acessibilidade) | 34 Ari | Acessibilidade WCAG 2.2 AA (labels e contraste) | PRs #462, #463 | **CONCLUÕDO_SEM_VALIDACAO** | Zero violaÁıes axe-core em p·ginas crÌticas |
| **BM-P2-05** | **P2** | Squad 90 (Auth) | 96 Nera | Desconex„o Google OAuth e RelatÛrio B-02 | PR #505 (Draft) | **CONCLUÕDO_SEM_VALIDACAO** | RevogaÁ„o de tokens e testes de /disconnect |
| **BM-P2-06** | **P2** | Squad 00 (GovernanÁa) | 00 Astra / 01 ”ria | ReconciliaÁ„o do Acervo de Handoffs (607 arquivos) | PR #524 / PR #528 | **CONCLUÕDO_VERIFICADO** | Acervo de handoffs 100% rastreado no git |
| **BM-P3-01** | **P3** | Squad 00 (GovernanÁa) | 00 Astra / 02 Bento | Extens„o do Gate de Ownership de Prosa | Script / Manifest | **PENDENTE** | Bloqueio de commits sem agente propriet·rio |
| **BM-P3-02** | **P3** | Squad 30 (UX/UI) | 31 Noa / 37 Suri | Limpeza Residual UX e Avatar de Perfil | Branches UX | **CONCLUÕDO_SEM_VALIDACAO** | Limpeza de cÛdigo morto e upload de avatar |
| **BM-P3-03** | **P3** | Squad 00 (QA) | 04 TÈo | AutomaÁ„o Noturna de Schemathesis Fuzzing | Workflow / CI | **CONCLUÕDO_VERIFICADO** | Cron noturno executando em ambiente staging |
