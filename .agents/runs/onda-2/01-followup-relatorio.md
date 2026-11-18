# Follow-up Onda 2 — DEM-20261114-003 (retomada de trabalho interrompido)

- Agente: 01 — Plataforma, Segurança e Dados
- Onda: 2 (follow-up)
- Data: 2026-11-14
- Branch: `agente/01-followup-audit` (base `origin/main`)
- Worktree: `C:\Github\Birthub-360-worktrees\agente-01-followup-audit`

## Escopo revisado

Trabalho não commitado de sessão anterior do Agente 01, retomado e auditado nesta sessão:

| Item | Arquivo(s) | Veredito |
|---|---|---|
| Imutabilidade AuditLog | `prisma/migrations/20261114160000_auditlog_append_only_immutability/migration.sql` | Correta — classificada ADITIVA (só `CREATE FUNCTION` + `CREATE TRIGGER`), padrão idêntico a `consent_audit_immutable()` |
| Teste de integração | `tests/integration/auditlog-immutability.test.ts` | Correto — roda como owner/migrator (BYPASSRLS) de propósito; BEGIN/ROLLBACK; skip limpo sem env |
| Cobertura auditoria exports/PII | 7 rotas + `auditLog.middleware.ts` | Correta e completa para o escopo declarado |
| dealItems over-fetch (MEL-16) | `PrismaCrm360Repository.ts` (`getDeals`, `getBoardLeads`) | Tratado — include removido, `updateLeadStage` mantido justificado |
| Evidência MEL-16 | `.agents/runs/onda-2/01-mel16-auditoria-n1.md` | Revisada — tabela por listagem, evidência de segurança da remoção |
| Handoff 01→04 | `.agents/handoffs/onda-2/01-para-04-companies-audit-fix.md` | Regularização documental correta (status: resolvido) |

## Verificações executadas nesta sessão

- `npx prisma validate` → schema válido.
- `npx tsc --noEmit` → limpo (exit 0).
- `npm run lint` (biome lint src) → exit 0; 1520 warnings pré-existentes, nenhum nos arquivos alterados (biome nos 8 arquivos alterados: 0 diagnósticos).
- `vitest run -c vitest.unit.config.ts tests/unit/lib/security/auditLog.middleware.test.ts` → 2/2 pass.
- `vitest run -c vitest.unit.config.ts Crm360Controller.deals + api-regression-17` → 31/31 pass.
- `vitest run -c vitest.integration.config.ts tests/integration/auditlog-immutability.test.ts` → **não executável neste ambiente**: sem Docker/Postgres (portas 5432–5435 fechadas, `docker` indisponível). A trava `_test` de `tests/helpers/integration-setup.ts` aborta sem `.env.test` — comportamento esperado. O teste está corretamente escrito para rodar em CI (`describe.skipIf(!pool)` sem env; com `DIRECT_URL`/`MIGRATOR_DATABASE_URL` de `.env.test` executa de verdade).

## Análise de correção

### 1. Migration AuditLog append-only

- Trigger `BEFORE UPDATE OR DELETE` (FOR EACH ROW) + `BEFORE TRUNCATE` (FOR EACH STATEMENT) — sintaxe correta para triggers de TRUNCATE em Postgres.
- Função `audit_log_immutable()` levanta `ERRCODE = 'insufficient_privilege'` — mesmo padrão de `consent_audit_immutable()`.
- Decisão trigger vs REVOKE está **correta e justificada**: `scripts/db/create-app-role.sql` re-concede DML em toda tabela não listada a cada bootstrap; REVOKE seria desfeito. O trigger dispara para qualquer papel, inclusive owner/superuser.
- Classificação ADITIVA correta: nenhuma linha existente é lida/alterada/removida; INSERTs não afetados. O `-- ROLLBACK:` está presente como comentário (conforme runbook `docs/security/runbooks/MIGRATION_ROLLBACK.md` — destrutivas exigem o marcador; proteção não exige, mas documentar é correto).
- Verificado por grep: nenhum caminho em `src/`, `scripts/`, `server.ts`, `worker*.ts` faz `auditLog.update/delete/updateMany/deleteMany` — `AuditService.log` só faz INSERT. Retenção futura exigirá migration explícita que derrube os triggers (comportamento desejado).

### 2. Cobertura auditoria exports/PII

`auditAccessMiddleware(entity, action?)` ganhou parâmetro opcional `action` (retrocompatível — union `AuditAction` já incluía `'EXPORT'`) e `entityId` derivado do primeiro `req.params`.

Montagens adicionadas:
- `GET /api/analytics/export/csv` e `/unified-timeline/export` → `EXPORT/Analytics`
- `GET /api/commercial-intelligence/export` → `EXPORT/CommercialIntelligence`
- `GET /api/companies/:id` e `GET /api/contacts/:id` → `EXPORT` com entityId (PII de detalhe)
- `POST /api/leads/export/bitrix24` → `EXPORT` explícito (POST seria rotulado UPDATE)
- `POST /api/integrations/bitrix/leads/:leadId/export` e `/leads/export-batch` → `EXPORT/BitrixLeadExport`
- `GET /api/integrations/bitrix/extractions/:id/download` → `EXPORT/BitrixExtractionDownload`

Ordem de middleware consistente com o padrão existente (`managementRoles`/`importRoles` antes do audit — negação de papel não gera log, igual ao export de leads já homologado).

**Cobertura residual (observação, fora de escopo deste follow-up):**
- `GET /api/attachments/:attachmentId/download-url` — emite URL assinada de anexo do tenant; candidato natural a auditoria futura (decisão de produto: URL temporária ≠ dump de PII).
- `POST /api/agent/ecosystem/office/generate` (universalEcosystem) — gera artefatos doc/xlsx a partir de conteúdo do request (não é dump de dados do tenant); não classificado como export.
- Nenhum outro endpoint `export|csv|xlsx|download` sem `auditAccessMiddleware` foi encontrado em `src/features/**/routes/`.

### 3. dealItems over-fetch (MEL-16)

- `getDeals` e `getBoardLeads` (`PrismaCrm360Repository.ts` ~L410 e ~L451): `dealItems: true` removido dos `findMany` de listagem, com comentário MEL-16.
- `updateLeadStage` mantém o include — escrita em registro único, custo limitado a 1 lead (justificado no relatório MEL-16).
- `PrismaCommercialIntelligenceRepository` já usa `select` enxuto em `dealItems` para agregação — não é over-fetch.
- Grep confirma: nenhum consumidor em `src/**/*.tsx` ou testes asserta `dealItems` nessas respostas; existe `GET /api/crm/deals/:leadId/items` dedicado.

## Commits

Ver `git log` da branch — commits separados por tema: migration+teste, rotas/middleware, crm360+docs.

## Pendências / handoffs

- Teste de integração `auditlog-immutability` precisa rodar em CI ou ambiente com Postgres (`_test`) para evidência real — registrar no acompanhamento da onda.
- Handoff retroativo `01-para-04-companies-audit-fix.md` permanece `resolvido` (regularização documental da alteração da Onda 2 em arquivos do 04).
- Sem push/merge — aguardando revisão do Agente 24 e integração pelo 00.
