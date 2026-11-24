# Matriz de Reconciliação — Etapa 0 (Plano de Saneamento 2026-11-18)
**Autor:** Agente 00 (Coordenador Global)  
**Data:** 2026-11-20  
**Base:** `main @ e17be28f6` | **Auditado:** `.agents/runs/audit-2026-11-18/inventario-mestre.md`

---

## 1. Mapeamento de Cobertura P0/P1

| ID | Título / Descrição | Status no Inventário | Status Atual | Destino / Resolução / Cobertura | PRs / Commits Relacionados |
|---|---|---|---|---|---|
| **DEBT-0001** | Deploy EC2 real sem migrate/healthcheck | P0 / BLOQUEADOR | **JA-EM-MAIN** | Resolvido via PR #427 e PR #473 (deploy-ec2.sh com `prisma migrate deploy` + `/health/ready` fail-closed) | PR #427, PR #473 (commit `7f2cc3346`) |
| **DEBT-0002** | Zero backup real de produção (stubs) | P0 / BLOQUEADOR | **JA-EM-MAIN** | Resolvido via PR #435 e PR #473 (backup/restore reais, criptografados, fail-closed) | PR #435, PR #473 (commit `ef34a6034`) |
| **DEBT-0003** | Filas outbound sem consumidor no worker | P0 / BLOQUEADOR | **JA-EM-MAIN** | Consumidores registrados nos workers dedicados via PR #440 e PR #474 | PR #440, PR #474 (commit `f7679f274`) |
| **DEBT-0004** | App mobile aponta para backend sem DNS | P0 / DEPENDE DECISÃO | **JA-EM-MAIN** | App Link e URLs ajustados para o domínio canônico via PR #475 | PR #475 (commit `86ff4f021`) |
| **DEBT-0005** | SSRF residual em `/prospecting/enrich` | P1 / BLOQUEADOR | **JA-EM-MAIN** | Guards SSRF endurecidos com proteção byte-level IPv4/IPv6 em PR #436 e PR #401 | PR #436, PR #401 |
| **DEBT-0006** | Fallback global `BITRIX24_WEBHOOK_URL` | P1 / BLOQUEADOR | **JA-EM-MAIN** | Resolvido com allowlist estrita e isolamento multi-tenant em PR #476 | PR #476 (commit `87e9ffc09`) |
| **DEBT-0007** | Webhook 3CX com segredo global | P1 / BLOQUEADOR | **PENDENTE** | Segredo webhook por conexão multi-tenant pendente de implementação pelo Agente 12/01 | Demanda atribuída na Trilha 1 |
| **DEBT-0008** | Cadência encerra prematura (`hasLeadReplied`) | P1 / BLOQUEADOR | **JA-EM-MAIN** | Adicionado filtro temporal `since: run.startedAt` via PR #439 | PR #439 (commit `52263be87`) |
| **DEBT-0009** | Toque de voz sem TTL/sweeper trava cadência | P1 / BLOQUEADOR | **JA-EM-MAIN** | Adicionado TTL em toques pending e tratamento de falha via PR #439 | PR #439 (commit `52263be87`) |
| **DEBT-0010** | Outbound sem instrução de opt-out LGPD | P1 / BLOQUEADOR | **JA-EM-MAIN** | Sufixo obrigatório de opt-out adicionado via PR #439 e PR #389 | PR #439, PR #389 |
| **DEBT-0011** | `sendColdEmail` sem persistência/idempotência | P1 / BLOQUEADOR | **COBERTO-EM-PR** | Coberto pelo PR #437 (aberto, com testes e trilha LGPD; pendente validação 24) | PR #437 |
| **DEBT-0012** | Loop ReAct do enxame sem quota/budget | P1 / BLOQUEADOR | **JA-EM-MAIN** | Quotas e circuit breaker integrados ao gateway via PR #431 | PR #431 (commit `6d37c68b5`) |
| **DEBT-0013** | Consentimento LGPD de IA como env var | P1 / DEPENDE DECISÃO | **PENDENTE** | Pendente decisão jurídica formal/tabela por org (Agente 13/21) | Registrado no Journal |
| **DEBT-0014** | TokenQuota fail-open bypass sem tenantId | P1 / BLOQUEADOR | **JA-EM-MAIN** | Quota fail-closed e observabilidade reforçada via PR #431 | PR #431 (commit `6d37c68b5`) |
| **DEBT-0015** | `scriptAndPromptTool` fallback aprovado falso | P1 / BLOQUEADOR | **JA-EM-MAIN** | Removido fallback falso / flag `approved: false` via PR #431 | PR #431 (commit `6d37c68b5`) |
| **DEBT-0016** | `batchUpdateLeads` não atômico | P1 / BLOQUEADOR | **JA-EM-MAIN** | Trilha de status canônico integrada em PR #395 e PR #390 | PR #395, PR #390 |
| **DEBT-0017** | Mesa/IA alteram status fora do fluxo canônico | P1 / BLOQUEADOR | **COBERTO-EM-PR** | Coberto pelo PR #434 (Trilha E — LeadUseCases canônico) | PR #434 |
| **DEBT-0018** | `Contact.companyId` sem validação de tenant | P1 / BLOQUEADOR | **JA-EM-MAIN** | Resolvido em `main` via PR #476 (`assertContactCompanyInTenant`); também em #434 | PR #476, PR #434 |
| **DEBT-0019** | Exclusão de Company sem guarda (hard delete) | P1 / BLOQUEADOR | **JA-EM-MAIN** | Confirmada interceptação de soft delete em AUDITABLE_MODELS; docs em #434 e PR #504 | PR #504, PR #434 |
| **DEBT-0020** | Importação Bitrix não atômica (órfãos) | P1 / BLOQUEADOR | **JA-EM-MAIN** | Importação atômica por item com transação via PR #432 | PR #432 (commit `35b52480f`) |
| **DEBT-0021** | `retentionPurge.service.ts` dead code | P1 / BLOQUEADOR | **PENDENTE** | Necessita worker com `requestContext.run` e janelas aprovadas (Agente 01A) | Registrado no Journal |
| **DEBT-0022** | Voz persiste áudio sem consentimento/DSR | P1 / BLOQUEADOR | **PENDENTE** | Módulo voz sem anonimização/expurgo DSR (Agente 12/21) | Requer decisão Day-1 de Voz |
| **DEBT-0023** | `executeVoiceCommand` com falso sucesso | P1 / BLOQUEADOR | **PENDENTE** | Acoplado à decisão do cluster de voz (Agente 12) | Módulo temporariamente dormant |
| **DEBT-0024** | Sem criação manual de lead na UI (palette) | P1 / BLOQUEADOR | **JA-EM-MAIN** | Resolvido via PR #438 (Command Palette com rotas honestas) e PR #496 | PR #438, PR #496 |
| **DEBT-0025** | Clusters mortos sob typecheck (`ai-voice`, etc.) | NÃO BLOQ / HIGIENE | **PENDENTE** | Exclusões tsconfig / poda de código morto aguardando decisão | Registrado no Journal |
| **DEBT-0026** | SonarQube mede só unitário / gates fora do CI | P1 / BLOQUEADOR | **JA-EM-MAIN** | Cobertura unificada e scripts `verify:*` no CI via PR #430 | PR #430 (commit `95aa14337`) |

---

## 2. Resolução de PRs Conflitantes e com Checks Falhos

| PR | Título Original | Estado Anterior | Estado Final / Ação | Justificativa Técnica |
|---|---|---|---|---|
| **#310** | Correções P0 da auditoria (paleta, deep link, segurança) | Conflitante / Checks falhos | **FECHADO (SUPERADO)** | Substituído por PRs cirúrgicos: #415 (deep links), #426 (E2E), #427 (deploy) e #471 (paleta). |
| **#361** | Depcruise violações application gate | Conflitante (18.7.2) | **FECHADO (SUPERADO)** | Gate de dependências em `main` 100% verde (0 violações). Modularização absorvida no PR #388. |
| **#366** | Onda 6: resiliência, idempotência e versionamento | Conflitos + CI falho | **REBASE EM ANDAMENTO / CONDICIONAL** | Idempotência (Wave E, PRs #444-#453) já mergeada em main. Restante de resiliência aguarda rebase limpo e auditoria do 24. |
| **#368** | Paleta oficial (migração hex neon -> var) | Conflitante | **FECHADO (SUPERADO)** | Rebaseado anteriormente; substituído pelo Brand System Genesis e PRs #471 / #488 / #515. |
| **#372** | Suprime falso positivo CodeQL LLMGateway | Checks falhos (Sonar) | **FECHADO (ABSORVIDO)** | Supressão documentada `codeql[js/system-prompt-injection]` incorporada em main via commit `e0050ad63`. |
| **#378** | Prisma findUnique com select parcial | Checks falhos | **FECHADO (ABSORVIDO)** | Interceptor do Prisma corrigido com suíte de testes em main via commit `e0050ad63`. |

---

## 3. Ordem de Merge Recomendada e Validada pelo Agente 24

Com a maior parte dos PRs #381–#405 e dívidas de infraestrutura já integrados em `main`, a fila de PRs abertos deve seguir a seguinte ordem estrita:

1. **PR #434** (`fix(crm): Trilha E — DEBT-0017/0018/0019`)
   - *Status:* Pronto para validação independente do Agente 24. 
   - *Impacto:* Finaliza o fechamento canônico da Mesa de Tratamento e isolamento de contatos.
2. **PR #437** (`feat(prospecting): DEBT-0011 — persistência/dedupe cold-email`)
   - *Status:* Requer parecer final do Agente 24 e validação de schema.
   - *Impacto:* Elimina o risco de perda de dados e violação LGPD em cold e-mails.
3. **PR #401** (`fix(05): AUD-1 SSRF guard + RBAC na rota /enrich`)
   - *Status:* Depende de sincronização com os guards de SSRF já existentes em `main`.
4. **PR #396 & #397** (`fix(06)` & `fix(15)`: Saneamento segurança / sanitização)
   - *Status:* Passar pelo gate do Agente 24 após rebase.
5. **PR #366** (`integracao/onda-6`)
   - *Status:* Somente após extração do que já foi mergeado em main (Wave E) e correção das falhas de build/SonarQube.

---

## 4. Decisões Humanas Pendentes (Registradas no Journal)

1. **Escopo de Voz (DEBT-0022 / DEBT-0023 / DEBT-0046)**: Definir formalmente se Telefonia/Voz/SIP entra no Day-1 ou permanece como módulo dormente/desabilitado.
2. **Política de Consentimento de IA (DEBT-0013)**: Decisão jurídica se o consentimento via env var é aceitável temporariamente para lançamento ou se requer persistência por organização.
3. **Janelas de Retenção e Expurgo LGPD (DEBT-0021)**: Homologar os prazos definitivos para execução do `retentionPurge` em produção.
4. **Higiene de Clusters Mortos (DEBT-0025)**: Autorizar a poda definitiva de diretórios legados fora do build (`ai-voice/`, `temporal-workers/`, `crawlee/`).
