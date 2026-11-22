# 02 — BACKLOG MESTRE CONSOLIDADO
**IDs globais G-xx · gerado 2026-11-20**
Status: `VERIFICADO` = confirmado em git/GitHub; `REPORTADO` = evidência de agente/relatório; `PENDENTE` = não verificado.

| ID | Tarefa | Área | Resp. (legado→novo aprox.) | Status canônico | Prio | Dependências | Evidência | Próxima ação | Aceite |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | Merge Wave E idempotencyKey restante | Backend | 02/04/06/07/09/10/12/17 | **Aprovado 24**; #447,#450–#453 aguardam CI | P1 | CI verde | `waveE-outbox-idempotency-24.md` | Mergear em leva | Todos produtores com chave estável |
| G-02 | Mergear #441 guardrails PII anti-encoding | IA | 07→squad70 | Aprovado c/ ressalvas; CI pendente | P1 | CI | PR #441, parecer #443 | Mergear | Testes 85/85 + integração no CI |
| G-03 | Mergear #386 QA handoffs + schemathesis fix | QA | 08→squad00 | CI pendente | P1 | CI | commits pushed | Mergear | Schemathesis roda com `--url`/`--max-examples` |
| G-04 | Mergear #415 ErrorBoundary + fixes P0 do #310 | Segurança/UX | 02 | BLOCKED (CI) | P1 | CI + revisão | handoff onda-review | CI → 24 → merge | Stack trace não exposto |
| G-05 | Deploy com migrate+healthcheck | Infra | 08/10→94/90 | ABERTO | **P0** | decisão deploy | DEBT-0001 (24 confirmou) | Missão dedicada | Deploy roda migrate e healthcheck |
| G-06 | Escopo mobile no release | Produto | **humano** | DECISÃO PENDENTE | **P0** | — | DEBT-0004 | **Aprovação humana** | Decisão documentada |
| G-07 | Paleta oficial #368 (100 arquivos) | Design | 03→squad30 | BLOCKED, devolvido p/ remediar | P1 | decisão produto/marca | decisão 00 registrada | Remediar gates ou abandonar | Gates verdes + QA visual |
| G-08 | Backup/restore/DR real | Infra | 10→90 | PR #435 mergeado — **verificar cobertura** | P0 | staging | merge 19:46 | Validar DEBT-0002 | Restore testado |
| G-09 | Worker consumers outbox | Runtime | 16→23 | PR #440 mergeado — **verificar cobertura** | P0 | staging | merge 20:28 | Validar DEBT-0003 | Consumers dedicados ativos |
| G-10 | Docker 2375 sem auth + rotação segredos | SecOps | **humano/host** | AÇÃO HUMANA | **P0** | acesso host | 2 handoffs | Executar no host 192.168.0.116 | Porta fechada/autenticada; segredos rotacionados |
| G-11 | Renovações: 13 exceções hotspot + ~30 waivers Trivy | SecOps | 15→99 | **PRAZO 2026-11-30** | P1 | — | parecer 24 | Agendar renovação | Zero exceções expiradas |
| G-12 | Scanner real ContinuousSecurityAudit | Segurança | 10+15 | ABERTO | P2 | — | handoff 00→10 | Onda futura | `simulated:false`, dados reais |
| G-13 | `piiDetection.service.ts` sem anti-encoding | IA | 07 | Handoff criado | P2 | #441 mergeado | ressalva 24 | Despachar | PII codificada detectada |
| G-14 | Outbox: ressalvas de chave (forecast mensal, briefing, barge-in) | Backend | donos | Documentadas, não bloqueantes | P3 | — | parecer waveE | Backlog futuro | Revisar se necessário |
| G-15 | ~20 PRs de outras sessões (#347–#437, #459–#466) | Vários | vários | BLOCKED/CI | P1 | CI + revisão por PR | `gh pr list` | Triagem em levas | Cada PR revisado e mergeado/fechado |
| G-16 | Handoffs abertos remanescentes | Gov. | por dono | **36** abertos/em-andamento | P2 | triagem | grep Status | Triagem contínua | Fila <10 ou zerada |
| G-17 | Orquestração sem demo (itens 02/08) | Produto/QA | 02/08 | EM-ANDAMENTO (07,17 resolvidos) | P2 | — | handoff 00→17-07 | E2E overview real vs vazio | Empty state honesto |
| G-18 | Gate ownership prosa (server.ts/package.json) | Gov. | 00/08 | ABERTO | P3 | — | handoff 00→00 | Estender manifest | Gate cobre regras de prosa |
| G-19 | UX-05a/b código morto, UX-09 perfil, UX-08 decisão | UX | 01/02/05 | PRONTO / decisão | P2–P3 | — | memória central | Missões pequenas | Critérios por item |
| G-20 | Inventário omissões (DB-02, PRO-06/07, IA-07, UX-05/06/11) | Dados/Prod. | múltiplos | PENDENTE correção do plano | P2 | — | parecer 24 | Incorporar Etapa 0 | Itens no plano |
| G-21 | PRs stale/conflitantes (#361/#366/#368/#310/#372/#378) | Gov. | 00 | STALE | P1 | — | checklist GO-LIVE | Reconciliar ou fechar | Zero PRs zumbis |
| G-22 | Coverage SonarQube 80% (DEBT-0026) | QA | 08 | PR #430 aberto | P2 | CI | — | CI + merge | Gate verde |
| G-23 | A11y Onda 1 (labels settings, contraste) | Design | 02/03 | PRs #462/#463 abertos | P2 | CI | — | CI + revisão | WCAG AA |
| G-24 | Consentimento IA (DEBT-0013) + escopo voz/proposals/design-lab/outbound | Produto/Jurídico | humano | DECISÃO PENDENTE | P1 | — | parecer 24 | **Decisão humana** | Decisão documentada |
| G-25 | Cadência DEBT-0008/09/10 | Cadência | 17 | PR #439 mergeado — verificar | P2 | — | merge 19:50 | Validar | Testes verdes em main |
| G-26 | CRM Trilha E (DEBT-0017/18/19) | CRM | 04 | PR #434 aberto | P1 | CI | — | CI + merge | Status canônico |
| G-27 | Cold-email persistência (DEBT-0011) | Prospecção | 05 | PR #437 aberto | P1 | CI | — | CI + merge | Persistência+LGPD |
| G-28 | AUD-1 segurança por domínio (#396/#397/#401) | Segurança | 05/06/15 | Abertos | P1 | CI | — | CI + merge | Sanitização/RBAC |
| G-29 | Envelope erro unificado + OpenAPI (#399) | Contratos | 18 | Aberto | P2 | CI | — | CI + merge | Contrato único |
| G-30 | Flaky e2e (#403), Schemathesis noturno (#400 merged?) | QA | 14/08 | #403 aberto; #400 mergeado | P2 | CI | git log | CI + merge #403 | Suite estável |

---

## 2. Backlog Mestre Reconciliado — 20 Atividades Rumo à Homologação

| ID | Prioridade | Domínio / Squad | Agente Dono | Tarefa Técnica | Origem / PR | Status Verificado | Critério de Aceite |
|:---|:---:|:---|:---:|:---|:---|:---:|:---|
| **BM-P0-01** | **P0** | Squad 90 (Infra/CI) | 94 Tess | Formatação Biome em LeadUseCases.ts e CopilotoIaUseCases.ts | PR #511 | **BLOQUEADO** (Dependency Cruiser) | Prettier/Biome verde no CI em main |
| **BM-P0-02** | **P0** | Squad 90 (AppSec) | 99 Vito | Remediação de Achados Semgrep / SAST (TLS e Bitrix) | PR #507 (Draft) | **EM_ANDAMENTO** | Semgrep SAST 100% verde sem waivers |
| **BM-P0-03** | **P0** | Squad 10/00 (Dados/LGPD) | 11 Pietro / 07 Íris | Auditoria e Deliberação SwarmAuditLog (DEC-H01) | PR #487 (Draft) | **AGUARDANDO_APROVACAO** | Deliberação formal (RESTRICT + Anonimização) |
| **BM-P0-04** | **P0** | Squad 90 (SecOps) | 90 Hélio / Humano | Portas Docker Host (2375) e Rotação de Segredos | Host / DEBT-0005 | **PENDENTE** | Porta 2375 fechada / TLS mútuo; chaves rotacionadas |
| **BM-P1-01** | **P1** | Squad 40 (CRM) | 41 Cadu | Integração CRM Trilha E (DEBT-0017/18/19) | PR #434 | **CONCLUÍDO_SEM_VALIDACAO** | Conflito em PrismaContactRepository 100% sanado |
| **BM-P1-02** | **P1** | Squad 40 (Prospecção) | 43 Amon | Persistência e Deduplicação Cold-Email (DEBT-0011) | PR #437 | **EM_ANDAMENTO** | Hash SHA-256 e deduplicação no banco |
| **BM-P1-03** | **P1** | Squad 90/20 (Segurança) | 96 Nera / 97 Rocco | Pacote AUD-1 Segurança (SSRF, cookies seguros, RBAC) | PRs #396, #397, #401 | **CONCLUÍDO_SEM_VALIDACAO** | Cookies com SameSite=Strict e rotas protegidas |
| **BM-P1-04** | **P1** | Squad 20/00 (Contratos) | 21 Zara / 04 Téo | Padronização RFC 7807 e Runner Schemathesis | PR #399 | **CONCLUÍDO_SEM_VALIDACAO** | Erros no formato pplication/problem+json |
| **BM-P1-05** | **P1** | Squad 00 (QA) | 04 Téo | Saneamento de Handoffs de QA e Schemathesis CLI | PR #386 | **CONCLUÍDO_SEM_VALIDACAO** | CLI executa sem flags depreciadas |
| **BM-P1-06** | **P1** | Squad 00 (Automação E2E) | 05 Luma | Estabilização de Testes Flaky E2E | PR #403 | **EM_ANDAMENTO** | 10 execuções Playwright consecutivas verdes |
| **BM-P1-07** | **P1** | Squad 90 (SecOps) | 99 Vito | Renovação de Exceções Hotspot e Waivers Trivy | Config / DEBT-0020 | **PENDENTE** | Waivers renovados até 2026-12-31 |
| **BM-P2-01** | **P2** | Squad 90/10 (Segurança) | 99 Vito / 10 Mara | Scanner Real no ContinuousSecurityAudit (EXP-06) | PR #484 / Branch 10 | **EM_ANDAMENTO** | Flag simulated: false e persistência de auditoria |
| **BM-P2-02** | **P2** | Squad 70/00 (IA/LGPD) | 77 Gaia / 07 Íris | Detecção Anti-Encoding em piiDetection.service.ts | Branch 07 | **EM_ANDAMENTO** | Sanitização contra base64/hex encoding |
| **BM-P2-03** | **P2** | Squad 00 (QA) | 03 Nina | Cobertura de Testes SonarQube 80% (DEBT-0026) | PR #430 | **EM_ANDAMENTO** | Quality gate SonarQube verde em CI |
| **BM-P2-04** | **P2** | Squad 30 (Acessibilidade) | 34 Ari | Acessibilidade WCAG 2.2 AA (labels e contraste) | PRs #462, #463 | **CONCLUÍDO_SEM_VALIDACAO** | Zero violações axe-core em páginas críticas |
| **BM-P2-05** | **P2** | Squad 90 (Auth) | 96 Nera | Desconexão Google OAuth e Relatório B-02 | PR #505 (Draft) | **CONCLUÍDO_SEM_VALIDACAO** | Revogação de tokens e testes de /disconnect |
| **BM-P2-06** | **P2** | Squad 00 (Governança) | 00 Astra / 01 Ória | Reconciliação do Acervo de Handoffs (607 arquivos) | PR #524 / PR #528 | **CONCLUÍDO_VERIFICADO** | Acervo de handoffs 100% rastreado no git |
| **BM-P3-01** | **P3** | Squad 00 (Governança) | 00 Astra / 02 Bento | Extensão do Gate de Ownership de Prosa | Script / Manifest | **PENDENTE** | Bloqueio de commits sem agente proprietário |
| **BM-P3-02** | **P3** | Squad 30 (UX/UI) | 31 Noa / 37 Suri | Limpeza Residual UX e Avatar de Perfil | Branches UX | **CONCLUÍDO_SEM_VALIDACAO** | Limpeza de código morto e upload de avatar |
| **BM-P3-03** | **P3** | Squad 00 (QA) | 04 Téo | Automação Noturna de Schemathesis Fuzzing | Workflow / CI | **CONCLUÍDO_VERIFICADO** | Cron noturno executando em ambiente staging |
