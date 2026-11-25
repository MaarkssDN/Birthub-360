# Handoff — Agente 00 (Astra) → Agente 100 (Catarina) · Diagnóstico CI main

**Data:** 2026-11-25 · **Demanda:** DEM-20261123-001 · **SHA analisado:** `9a3c2182b2` (= main = integracao/onda-3)
**Status:** DIAGNÓSTICO ENTREGUE — correção é atribuição do Squad 100 (OPERAÇÃO PHOENIX).
Não duplicar trabalho; este documento é insumo, não missão executada.

## 1. Falhas confirmadas no run `45623045642` (Release) e `45623045671` (SonarQube)

Ambos falham no **mesmo ponto**: suíte de testes de integração.

### Causa raiz primária (alta confiança)

`tests/integration/prospecting-rls.test.ts` — **5 testes falhando**:

- `updateCompanyProfileEmbedding / computeLookalikeScore` (3 testes)
- `findExistingCompany (dedupe por CNPJ) via promoteToCrm` (2 testes)

Erro: `PrismaClientKnownRequestError P2010` → `42501` →
**`AuditLog é append-only (DELETE bloqueado)`**.

Local exato: `hardDeleteOrgData()` em `tests/integration/prospecting-rls.test.ts:70`:

```sql
DELETE FROM "AuditLog" WHERE "tenantId" = ${organizationId}
```

### Por que apareceu agora

O commit `c33f06f40a` ("cleanup prospecting-rls roda com tenant da org, não bypass")
corrigiu o cleanup para rodar com `asTenant(org)` em vez de `asBypass()`. Antes, com
bypass + tenant vazio, as policies RLS tornavam as linhas invisíveis e o DELETE era
**no-op silencioso** (AuditLog incluído). Agora o DELETE executa de verdade e bate no
trigger append-only do AuditLog.

### Decisão de design pendente (para o executor do Squad 100)

AuditLog é append-only por trigger — DELETE nunca vai funcionar. Opções:

1. **Remover a linha 70** e aceitar que AuditLog da org de teste permanece. Atenção:
   `afterEach` faz `prisma.organization.deleteMany` — se houver FK RESTRICT de
   AuditLog→Organization, a org não será apagada. Verificar cardinalidade/FK e
   decidir: manter orgs de teste (IDs fixos `test-org-prospecting-rls-a/b`, inócuo)
   ou usar orgs únicas por run.
2. Usar tenant/org únicos por execução (sufixo timestamp) — elimina dependência de
   cleanup do AuditLog e evita contaminação entre runs.
3. Se for indispensável limpar AuditLog em teste: somente via role/migration de teste
   que desabilite o trigger — **não recomendado** (enfraquece a garantia append-only).

Recomendação técnica: opção 2 (orgs únicas por run) + remoção do DELETE de AuditLog.

## 2. Falhas secundárias no mesmo job (podem ser cascata ou independentes)

No job `application gate` (run 45623045642) também falharam os steps:

- `Smoke test do build de produção (/health/live, /health/ready, /health/version)`
- `Run E2E Tests` — `Error: Timed out waiting 60000ms from config.webServer` e
  `TypeError: Cannot set property query of #[IncomingMessage] which has only a getter`
  (repetido ~30× — provável middleware/test setup do Playwright/E2E).

**Hipótese:** o webServer do E2E pode depender do mesmo ambiente de teste quebrado
ou de porta/serviço indisponível. Investigar se é cascata do item 1 ou defeito
independente (o TypeError de `IncomingMessage.query` sugere incompatibilidade de
versão Node/Express no setup E2E — não relacionado ao prospecting-rls).

## 3. Estado dos demais gates (run 45623045659/45622695502)

- Security CodeQL: **success**
- Security Semgrep: **success**
- Frontend Bundle Budget: **success**
- Trivy scan / secret scan / dependency review: success/skipped

## 4. O que já foi tentado

- `c33f06f40a` — fix do cleanup com tenant (resolveu o no-op, expôs o DELETE real).
- `9a3c2182b2` — merge do fix na main.
- O problema **persiste** no SHA `9a3c2182b` — a linha 70 continua lá.

## 5. Entregável esperado do Squad 100

1. Correção do cleanup (opção recomendada acima) + regressão verde em PG real.
2. Diagnóstico dos steps E2E/smoke (cascata vs. independente).
3. Re-run dos workflows no SHA candidato e evidência de verde.

Canal de retorno: `.agents/handoffs/squad-100/` + run doc `.agents/runs/`.
Sou o Agente 00 — integra o resultado ao global após parecer do Silas, se houver código.
