# Handoffs — Auditoria Release-Readiness 2026-11-18
**De:** Agente 00 | **Para:** todos os agentes com achados P0/P1 | **Status:** ABERTO — aguardando Etapa 0 (reconciliação PRs×achados) e decisões humanas

## Contexto obrigatório antes de executar
1. Ler `auditoria/inventario-mestre.md` (IDs DEBT-XXXX), `auditoria/relatorio-executivo.md` e o relatório de domínio correspondente em `auditoria/`.
2. **Trava de Mutação:** nenhum fix antes da reconciliação dos PRs #381–#393 (vários achados podem já estar em branches). Verificar diff do PR dono do domínio antes de codar.
3. Worktree isolado por agente; respeitar slots exclusivos (01/01A, 06/06A, 08/08A) e propriedade de arquivos.
4. Toda entrega → revisão Agente 24 na revisão exata antes de merge.
5. Veredito base: **NO-GO** (parecer 24 em `auditoria/24-revisao-release-readiness-audit-2026-11-18.md`).

## Handoffs por agente
| Arquivo | Agente | Achados P0/P1 principais |
|---|---|---|
| 00-para-00-decisoes-e-higiene.md | 00 | DEBT-0004, 0025, 0052–0055, decisões pendentes |
| 00-para-01-schema-rls-migrations.md | 01 | DEBT-0006, 0018, 0020, 0056–0058 |
| 00-para-01A-retencao.md | 01A | DEBT-0021 (+janelas retenção) |
| 00-para-02-ux-crm.md | 02 | DEBT-0024, UX-02..11 |
| 00-para-04-crm-integridade.md | 04 | DEBT-0016–0019, 0028, 0030–0032 |
| 00-para-05-prospeccao-cold-email.md | 05 | DEBT-0005, 0010, 0011(+0044), 0035, 0045 |
| 00-para-06-integracoes-bitrix.md | 06 | DEBT-0006, 0020, DB-02 |
| 00-para-07-ia-gateway-custos.md | 07 | DEBT-0012, 0014, 0015, 0036, 0017(co) |
| 00-para-08-qa-gates.md | 08 | DEBT-0026, INF-01(co 10), QA-03..09 |
| 00-para-10-infra-backup-deploy.md | 10 | DEBT-0001, 0002, 0037, 0038, INF-05/06/08/09 |
| 00-para-12-voz-lgpd-workers.md | 12 | DEBT-0007, 0022, 0023, VOZ-04..07, WRK-04(co) |
| 00-para-13-enxame-consentimento.md | 13 | DEBT-0012(co), 0013, IA-07 |
| 00-para-15-seguranca-rotas.md | 15 | DEBT-0005(co), SEC-04/05/06 |
| 00-para-16-workers-filqs.md | 16 | DEBT-0003, WRK-02/03/05/06 |
| 00-para-17-cadencia.md | 17 | DEBT-0008, 0009, 0010(co), 0034 |
| 00-para-18-contratos-api.md | 18 | DEBT-0042–0045(co), API-05/06/09–12 |
| 00-para-21-lgpd-voz-consentimento.md | 21 | DEBT-0013(co), 0022(co), janelas retenção |
| 00-para-09-mobile-decisao.md | 09/00 | DEBT-0004, INF-05, INF-06 (depende decisão de escopo) |

## Decisões humanas pendentes (NÃO prosseguir sem resposta)
1. Envs EC2: `BITRIX24_WEBHOOK_URL`, `THREECX_WEBHOOK_SECRET`, `EXPOSE_METRICS`, `ENABLE_QUEUES`/topologia worker, chaves encryption.
2. Escopo Day-1: mobile/Capacitor, voz, enxame IA autônomo.
3. Janelas oficiais de retenção (AuditLog, AILog, BitrixSyncLog, ExternalCrmSyncLog, AgentMemory, WhatsAppMessage, ConversationSignal, TimelineEvent, EnrichmentLog).
4. Consentimento IA: env allowlist temporária (DEBT-0013→P2) ou persistido por titular.
5. Módulos gated: registro formal do veredito por módulo (voz/proposals/design-lab/outbound).
