# 10 — CHECKLIST MESTRE DE EVOLUÇÃO E HOMOLOGAÇÃO
**Birthub 360° — Central de Inteligência e Comando Operacional**  
**Autor:** Agente 00 — Astra (Coordenador Global)  
**Data:** 2026-11-21 · **Base Canônica:** `origin/main @ 0d790443d`  
**Governança Oficial:** AGENTS.md (Arquitetura 100 Agentes) | **Auditoria Independente:** Agente 09 — Silas  

---

## 1. Governança e Orquestração
- [x] **CHK-GOV-01:** Roster oficial de 100 agentes e 10 squads adotado no `AGENTS.md`.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #455 (`6e80c9e4c`) | *Resp.:* 00 Astra
- [x] **CHK-GOV-02:** Auditoria independente formalmente atribuída ao Agente 09 (Silas).  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `AGENTS.md` §3 e §4 | *Resp.:* 09 Silas
- [x] **CHK-GOV-03:** Prompts específicos instalados em `.agents/prompts/<squad>/`.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #455 | *Resp.:* 00 Astra
- [ ] **CHK-GOV-04:** Registro e assinatura formal das decisões reservadas DEC-H01 a DEC-H04.  
  *Estado:* AGUARDANDO_APROVACAO | *Evidência:* `11-REGISTRO-DECISOES-HUMANAS.md` | *Resp.:* Orquestrador Humano
- [ ] **CHK-GOV-05:** Reconciliação completa da planilha mestra de handoffs `_MATRIX.csv`.  
  *Estado:* EM_ANDAMENTO | *Evidência:* Handoff HO-07 | *Resp.:* 00 Astra

## 2. Código e Arquitetura
- [x] **CHK-ARC-01:** `npm run typecheck` (`tsc --noEmit`) executando com zero erros de compilação.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Execução local e CI exit code 0 | *Resp.:* 03 Nina
- [x] **CHK-ARC-02:** Grafo de dependências livre de ciclos e violações de fronteira de camada.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `dependency-cruiser` (0 violações em 2.022 módulos) | *Resp.:* 03 Nina
- [x] **CHK-ARC-03:** Zero arquivos produtivos acima de 1.000 linhas sem justificativa formal.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `check:hotspots` | *Resp.:* 00 Astra
- [ ] **CHK-ARC-04:** Restauração do check de formatação Biome/Prettier no CI da `main`.  
  *Estado:* PRONTO_PARA_DESPACHO | *Evidência:* PR #511 | *Resp.:* 94 Tess

## 3. Backend e APIs
- [x] **CHK-BCK-01:** Autenticação unificada via Better Auth com sessões seguras e rota de disconnect.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #505 e testes de autenticação | *Resp.:* 96 Nera
- [x] **CHK-BCK-02:** Next Best Action IA implementado com DTO estrito e rota `/next-best-action`.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `da814442c` | *Resp.:* 74 Luca
- [x] **CHK-BCK-03:** Distribuição Round-Robin ponderada por score em tempo real.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `da814442c` | *Resp.:* 47 Dante
- [ ] **CHK-BCK-04:** Padronização RFC 7807 de envelope de erro e runner Schemathesis.  
  *Estado:* EM_ANDAMENTO | *Evidência:* PR #399 | *Resp.:* 21 Zara
- [ ] **CHK-BCK-05:** Healthcheck `/health/ready` fail-closed validando conexão com Postgres e Redis.  
  *Estado:* PENDENTE | *Evidência:* BM-P0-01 | *Resp.:* 22 Hugo

## 4. Banco de Dados e Multi-Tenancy
- [x] **CHK-DAT-01:** RLS forçado em todas as tabelas PostgreSQL com isolamento por `tenantId`.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `scripts/security/rls-coverage.ts` | *Resp.:* 13 Nilo
- [x] **CHK-DAT-02:** Migrações Prisma aditivas sem bloqueio de leitura/escrita em produção.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #485 e #503 | *Resp.:* 12 Vera
- [x] **CHK-DAT-03:** Guarda multi-tenant em `PrismaContactRepository.ts` sanando conflito do PR #434.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* 5/5 testes unitários passando | *Resp.:* 41 Cadu
- [ ] **CHK-DAT-04:** Migração e ativação da tabela `SwarmAuditLog` com RLS por tenant.  
  *Estado:* AGUARDANDO_APROVACAO | *Evidência:* PR #487 | *Resp.:* 11 Pietro
- [ ] **CHK-DAT-05:** Automação e drill real de backup/restore criptografado em base efêmera.  
  *Estado:* PENDENTE | *Evidência:* BM-P0-02 | *Resp.:* 19 Bruno

## 5. Segurança da Informação
- [x] **CHK-SEC-01:** Guarda de proteção na rota `/tools` impedindo bypass não autorizado.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #486 (`e7a50a4ff`) | *Resp.:* 99 Vito
- [x] **CHK-SEC-02:** Parser IPv6 canônico byte-level eliminando vulnerabilidades de SSRF.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #436 | *Resp.:* 99 Vito
- [ ] **CHK-SEC-03:** Eliminação de bypass TLS e proibição de `rejectUnauthorized: false` em produção.  
  *Estado:* AGUARDANDO_APROVACAO | *Evidência:* PR #507 (DEC-H02) | *Resp.:* 99 Vito
- [ ] **CHK-SEC-04:** Fechamento da porta Docker 2375 e rotação de credenciais de bancada.  
  *Estado:* BLOQUEADO | *Evidência:* BM-P0-04 (Handoff HO-11) | *Resp.:* 98 Safira / Orquestrador

## 6. Privacidade e LGPD
- [x] **CHK-LGP-01:** Redação em voo de dados PII (CPF, telefone, e-mail) em transcrições de voz.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `da814442c` em `callRecord.service.ts` | *Resp.:* 07 Íris
- [x] **CHK-LGP-02:** Canal público de direitos do titular (DSR) com validação ponta a ponta.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #428 (`dsr-public-journey.test.ts`) | *Resp.:* 08 Dora
- [ ] **CHK-LGP-03:** Validação e sanitização em lote de listas de supressão opt-out.  
  *Estado:* PENDENTE | *Evidência:* BM-P3-03 | *Resp.:* 08 Dora

## 7. Integrações Externas (Bitrix24, WhatsApp e E-mail)
- [x] **CHK-INT-01:** Fallback seguro e mapeamento de campos customizados Bitrix24 (`UF_CRM`).  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #476 | *Resp.:* 54 Rita
- [x] **CHK-INT-02:** Resiliência de sessão Baileys WhatsApp com tratamento anti-ban.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #396 | *Resp.:* 56 Luna
- [ ] **CHK-INT-03:** Persistência e deduplicação de envio de cold-emails com guarda LGPD.  
  *Estado:* PRONTO_PARA_DESPACHO | *Evidência:* PR #437 | *Resp.:* 55 Ícaro / 43 Amon

## 8. Infraestrutura e SRE
- [x] **CHK-INF-01:** Runbook operacional de rollback documentado e versionado.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #473 | *Resp.:* 90 Hélio
- [ ] **CHK-INF-02:** Script `deploy-ec2.sh` rodando `prisma migrate deploy` antes do restart do container.  
  *Estado:* PENDENTE | *Evidência:* BM-P0-01 | *Resp.:* 94 Tess
- [ ] **CHK-INF-03:** Trava de rollback acionada automaticamente caso `/health/ready` falhe após deploy.  
  *Estado:* PENDENTE | *Evidência:* BM-P0-01 | *Resp.:* 94 Tess

## 9. Testes e CI/CD
- [x] **CHK-TST-01:** Suíte unitária executando mais de 7.360 asserções sem falhas.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `vitest.unit.config.ts` | *Resp.:* 03 Nina
- [x] **CHK-TST-02:** Cenário k6 Cockpit Analytics autenticado com thresholds p95 < 500ms.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `ed5dce387` | *Resp.:* 04 Téo
- [ ] **CHK-TST-03:** Estabilização de testes flaky E2E em CI.  
  *Estado:* EM_ANDAMENTO | *Evidência:* PR #403 | *Resp.:* 05 Luma

## 10. UX, UI e Design System
- [x] **CHK-UI-01:** Identidade canônica Genesis Brand System implementada; `elegance.css` removido.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #471 (`d8843ed6e`) | *Resp.:* 33 Célia
- [x] **CHK-UI-02:** Zero overflow horizontal medido em 70 rotas `/app/*` em resolução mobile de 390px.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Inventário 14 de rotas | *Resp.:* 31 Noa
- [ ] **CHK-UI-03:** Correção de contraste WCAG AA no H1 de `/app/characters` (>= 4,5:1).  
  *Estado:* PENDENTE | *Evidência:* BM-P2-05 | *Resp.:* 34 Ari
- [ ] **CHK-UI-04:** Painel lateral de Lead exibindo Next Best Action (C.1).  
  *Estado:* PENDENTE | *Evidência:* BM-P2-01 | *Resp.:* 31 Noa
- [ ] **CHK-UI-05:** Tabela de equipe em Settings exibindo campo de peso de Round-Robin (C.2).  
  *Estado:* PENDENTE | *Evidência:* BM-P2-02 | *Resp.:* 47 Dante

## 11. Voz e Telefonia
- [x] **CHK-VOZ-01:** Telemetria de chamadas com diarização e redação PII em voo.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `da814442c` | *Resp.:* 63 Lira
- [ ] **CHK-VOZ-02:** Player de supervisão do Voice Hub exibindo turnos e sentimento.  
  *Estado:* PENDENTE | *Evidência:* BM-P2-03 | *Resp.:* 65 Lena

## 12. Inteligência Artificial
- [x] **CHK-IA-01:** Regras determinísticas de Next Best Action operando sem chamadas externas lentas.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Commit `da814442c` | *Resp.:* 74 Luca
- [x] **CHK-IA-02:** Particionamento HNSW PgVector e controle atômico de tokens Redis.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #503 | *Resp.:* 73 Numa / 78 Oz

## 13. Mobile e PWA
- [x] **CHK-MOB-01:** Build PWA precache com 296 assets cacheados com sucesso.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `verify:pwa-precache` | *Resp.:* 85 Bóris
- [x] **CHK-MOB-02:** Universal App Links configurados e canônicos no Capacitor.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PR #475 | *Resp.:* 81 Enzo
- [ ] **CHK-MOB-03:** Deliberação formal de escopo mobile Day-1.  
  *Estado:* AGUARDANDO_APROVACAO | *Evidência:* DEC-H03 | *Resp.:* Orquestrador Humano

## 14. Filas e Workers
- [x] **CHK-WKR-01:** Chaves de idempotência determinísticas `dominio:{entityId}` para outbox (Wave E).  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* PRs #447, #451–#453 | *Resp.:* 23 Pina
- [ ] **CHK-WKR-02:** Worker BullMQ com agendamento diário do Security Sweep.  
  *Estado:* PENDENTE | *Evidência:* BM-P2-04 | *Resp.:* 23 Pina

## 15. Homologação e Staging
- [ ] **CHK-STG-01:** Execução da suíte k6 de carga com exportação de relatório JSON sob Better Auth.  
  *Estado:* PENDENTE | *Evidência:* Onda 4 | *Resp.:* 04 Téo
- [ ] **CHK-STG-02:** Execução de jornada E2E completa contra staging sem mocks sintéticos.  
  *Estado:* PENDENTE | *Evidência:* Onda 4 | *Resp.:* 05 Luma

## 16. Auditoria Independente
- [x] **CHK-AUD-01:** Hashes criptográficos SHA-256 de 454 pareceres em `.agents/reviews/` íntegros.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* Script de verificação de pareceres | *Resp.:* 09 Silas
- [x] **CHK-AUD-02:** Parecer APROVADO emitido por Silas para o PR #528.  
  *Estado:* CONCLUÍDO_VERIFICADO | *Evidência:* `.agents/reviews/09-pr528-*.md` | *Resp.:* 09 Silas
- [ ] **CHK-AUD-03:** Pareceres de Silas emitidos para PRs #507, #487, #434 e #437 antes de merge.  
  *Estado:* PENDENTE | *Evidência:* Ondas 1 e 2 | *Resp.:* 09 Silas

## 17. Release Readiness (GO/NO-GO)
- [ ] **CHK-REL-01:** Todos os 4 bloqueadores P0 sanados com evidências comprovadas.  
  *Estado:* PENDENTE | *Evidência:* Onda 5 | *Resp.:* 00 Astra
- [ ] **CHK-REL-02:** Laudo final `RELEASE_READY / GO-LIVE` emitido pelo Agente 09 (Silas).  
  *Estado:* PENDENTE | *Evidência:* Onda 5 | *Resp.:* 09 Silas
- [ ] **CHK-REL-03:** Aprovação formal assinada pelo Orquestrador Humano para abertura pública.  
  *Estado:* PENDENTE | *Evidência:* Onda 5 | *Resp.:* Orquestrador Humano
