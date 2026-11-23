# 02 — BACKLOG MESTRE CONSOLIDADO
**Birthub 360° — Backlog Canônico Unificado**
**Autor:** Agente 00 — Astra · **Revisão:** 2026-11-23 · **Base:** `origin/main @ 0d790443d`
Status: `VERIFICADO` = confirmado em git/GitHub; `REPORTADO` = evidência documental de agente; `PENDENTE` = aguarda execução.

---

## 1. Backlog Mestre Reconciliado — 25 Atividades Rumo à Homologação

| ID | Prio | Domínio / Squad | Proprietário | Tarefa Técnica | Origem / PR | Status Comprovado | Critério de Aceite | Próxima Ação |
|:---|:---:|:---|:---:|:---|:---|:---:|:---|:---|
| **BM-P0-01** | **P0** | Squad 90 (Infra/CI) | 94 Tess | Formatação Biome em `LeadUseCases.ts` e `CopilotoIaUseCases.ts` | PR #511 | **BLOQUEADO** (Dependency Cruiser) | Prettier/Biome verde no CI em `main` | Corrigir import cruzado em `LeadUseCases.ts:16` e baselines |
| **BM-P0-02** | **P0** | Squad 90 (AppSec) | 99 Vito | Remediação de Achados Semgrep SAST (TLS e Bitrix) | PR #507 (Draft) | **EM_ANDAMENTO** | Semgrep SAST 100% verde sem waivers | Sincronizar branch após destrave do CI |
| **BM-P0-03** | **P0** | Squad 10/00 (Dados/LGPD) | 11 Pietro / 07 Íris | Auditoria e Deliberação SwarmAuditLog (DEC-H01) | PR #487 (Draft) | **AGUARDANDO_APROVACAO** | Deliberação formal (RESTRICT + Anonimização) | Decisão formal do Orquestrador Humano |
| **BM-P0-04** | **P0** | Squad 90 (SecOps) | 90 Hélio / Humano | Portas Docker Host (2375) e Rotação de Segredos | Host / DEBT-0005 | **PENDENTE** | Porta 2375 fechada / mTLS ativo; chaves rotacionadas | Executar intervenção no host 192.168.0.116 |
| **BM-P0-05** | **P0** | Squad 10/90 (Integridade) | 19 Bruno / 94 Tess | Reparo e Integridade do Git Object Store Local | PR #537 / PRES-005 | **EM_ANDAMENTO** | `git fsck` limpo e bundles de backup autossuficientes | Executar limpeza de `tmp_pack_*` órfãos |
| **BM-P0-06** | **P0** | Squad 00 (QA/Testes) | 03 Nina / 02 Bento | Saneamento dos 32/33 Testes Unitários com Falha em `main` | PR #537 / SonarQube | **EM_ANDAMENTO** | Vitest 100% verde no step de cobertura do Sonar | Corrigir mocks em `errorHandler.test.ts` e `/tools` |
| **BM-P1-01** | **P1** | Squad 40 (CRM) | 41 Cadu | Integração CRM Trilha E (DEBT-0017/18/19) | PR #434 | **CONCLUÍDO_SEM_VALIDACAO** | Conflito em `PrismaContactRepository` 100% sanado | Merge no Lote 2 após destravar CI |
| **BM-P1-02** | **P1** | Squad 40 (Prospecção) | 43 Amon | Persistência e Deduplicação Cold-Email (DEBT-0011) | PR #437 | **EM_ANDAMENTO** | Hash SHA-256 e deduplicação no PostgreSQL | Merge assistido no Lote 3 |
| **BM-P1-03** | **P1** | Squad 90/20 (Segurança) | 96 Nera / 97 Rocco | Pacote AUD-1 Segurança (SSRF, cookies, RBAC) | PRs #396, #397, #401 | **CONCLUÍDO_SEM_VALIDACAO** | Cookies com SameSite=Strict e rotas protegidas | Merge assistido no Lote 3 |
| **BM-P1-04** | **P1** | Squad 20/00 (Contratos) | 21 Zara / 04 Téo | Padronização RFC 7807 e Runner Schemathesis | PR #399 | **CONCLUÍDO_SEM_VALIDACAO** | Erros no formato `application/problem+json` | Merge assistido no Lote 3 |
| **BM-P1-05** | **P1** | Squad 00 (QA) | 04 Téo | Saneamento de Handoffs de QA e Schemathesis CLI | PR #386 | **CONCLUÍDO_SEM_VALIDACAO** | CLI executa sem flags depreciadas | Merge assistido no Lote 3 |
| **BM-P1-06** | **P1** | Squad 00 (Automação E2E) | 05 Luma | Estabilização de Testes Flaky E2E | PR #403 | **EM_ANDAMENTO** | 10 execuções Playwright consecutivas verdes | Validação final e merge no Lote 3 |
| **BM-P1-07** | **P1** | Squad 90 (SecOps) | 99 Vito | Renovação de Exceções Hotspot e Waivers Trivy | Config / DEBT-0020 | **PENDENTE** | Waivers renovados até 31/12/2026 | Despacho do Agente 99 antes de 30/11 |
| **BM-P1-08** | **P1** | Squad 20/50 (Contratos/API)| 22 Hugo / 51 Bela | Triagem e Correção de Erros 5xx Schemathesis ST101 | Genesis / Doc 12 | **EM_ANDAMENTO** | Zero 5xx não documentados em Prisma e Bitrix | Corrigir tratamento de exceção em rotas webhooks |
| **BM-P1-09** | **P1** | Squad 30/60 (UX/Voz) | 31 Noa / 65 Lena | Redirect Voice-Hub 503 e Acessibilidade Kanban | PR #538 / Exp-360 | **EM_ANDAMENTO** | Redirect em `AppLayout.tsx:465-478` ativo | Aplicar redirect gracioso para rotas 503 |
| **BM-P1-10** | **P1** | Squad 90 (SRE/Deps) | 94 Tess / 99 Vito | Atualização OpenTelemetry e Lockfiles Duality | PR #530 / Dependabot | **EM_ANDAMENTO** | `@opentelemetry/instrumentation-http` >=0.222.0 | Resolver alertas 111/112 e dualidade pnpm |
| **BM-P2-01** | **P2** | Squad 90/10 (Segurança) | 99 Vito / 10 Mara | Scanner Real no ContinuousSecurityAudit (EXP-06) | PR #484 / Branch 10 | **EM_ANDAMENTO** | `simulated: false` e persistência no banco | Finalizar testes unitários do scanner |
| **BM-P2-02** | **P2** | Squad 70/00 (IA/LGPD) | 77 Gaia / 07 Íris | Detecção Anti-Encoding em `piiDetection.service.ts` | Branch 07 | **EM_ANDAMENTO** | Detecção de PII em base64/hex | Implementação e testes de regressão |
| **BM-P2-03** | **P2** | Squad 20/00 (APIs/Docs) | 21 Zara | Declaração de Erros Sistêmicos 401/403/400 (ST103) | Genesis / Doc 12 | **EM_ANDAMENTO** | OpenAPI spec cobre 531 respostas sistêmicas | Declarar respostas de auth no `openapi.yaml` |
| **BM-P2-04** | **P2** | Squad 30 (UX/UI) | 31 Noa / 34 Ari | Saneamento de Rotas Órfãs e Contraste A11y | PR #538 / Exp-360 | **EM_ANDAMENTO** | Contraste >=4.5:1 em `/app/characters` | Ajustar cores neon e títulos de página |
| **BM-P2-05** | **P2** | Squad 90 (Auth) | 96 Nera | Desconexão Google OAuth e Relatório B-02 | PR #505 (Draft) | **CONCLUÍDO_SEM_VALIDACAO** | Revogação de token na API Google e purge | Merge assistido no Lote 4 |
| **BM-P2-06** | **P2** | Squad 30 (A11y) | 34 Ari | Acessibilidade WCAG 2.2 AA (labels e contraste) | PRs #462, #463 | **CONCLUÍDO_SEM_VALIDACAO** | Zero violações críticas no axe-core | Merge assistido no Lote 4 |
| **BM-P3-01** | **P3** | Squad 00 (Governança) | 00 Astra / 02 Bento | Extensão do Gate de Ownership de Prosa | Script / Manifest | **PENDENTE** | CI barra commits sem atribuição de agente | Atualizar script `check-ownership.ts` |
| **BM-P3-02** | **P3** | Squad 30 (Design System) | 33 Célia / 65 Lena | Unificação das Duas Design Systems Paralelas | PR #538 / Exp-360 | **PENDENTE** | Convergência entre `ui/` e `voice-hub/design-system` | Desacoplar componentes duplicados |
| **BM-P3-03** | **P3** | Squad 00 (QA) | 04 Téo / 02 Bento | Automação Noturna Schemathesis e Fixtures Auth | Genesis / Doc 12 | **CONCLUÍDO_VERIFICADO** | Cron noturno executando com fixtures de role | Adicionar seeds autenticadas ao runner CI |
