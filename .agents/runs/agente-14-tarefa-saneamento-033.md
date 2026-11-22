# Run Report — Agente 14 — TAREFA-SANEAMENTO-033 / BT360-DT-0071

- **Data:** 2026-11-12
- **Branch:** `agente/14-w3-seed-compliance`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-14-falta-de-seed-automatico-de-entidades-de-compliance-e-opt-out-no-provi.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24

## Sumário

O provisionamento do banco de teste agora semeia um baseline determinístico de
compliance/opt-out, eliminando a fragilidade de testes de privacidade que dependiam
só de estrutura de tabelas.

## Mudanças

- `scripts/test/prepare-integration-env.js`
  - `COMPLIANCE_BASELINE_ORG_ID` + `buildComplianceSeedSql()` exportados.
  - Seed executado via `docker exec psql` (ON_ERROR_STOP) após o bootstrap de roles,
    dentro do caminho Docker local (!isCI).
- `tests/unit/scripts/test-harness-safety.test.ts` — 3 testes do seed (idempotência,
    org dedicada, cobertura de escopos/consentimento).

## Conteúdo do baseline

- `Organization` `compliance-baseline-org` ("Compliance Baseline Org") — dedicada,
  nunca `test-org-id`.
- `OrganizationAiConsent` granted (`consentVersion='baseline-v1'`).
- `OptOutRecord` ×3: scopes `Global`, `Email` (`baseline-optout@example.invalid`),
  `WhatsApp` (`+5500000000000`), `originChannel='seed'`.

## Gates

- `vitest run tests/unit/scripts/test-harness-safety.test.ts` → 12/12 ✅
- `node --check` no script → ✅
- **Verificação real**: seed executado 2× via `pg` contra `prospectordb_test`
  (Docker remoto 192.168.0.116) — 1ª: 1 org/1 consent/3 opt-outs; 2ª: idempotente ✅
- `npx tsc --noEmit` / `npm run lint` → sem regressão (arquivo .js fora do tsc;
  lint cobre só `src/`).

## Riscos / Observações

- A cadeia de auditoria LGPD (`ConsentAuditChainHead`) NÃO foi semeada: exige
  genesis hash/sequence válidos do serviço; seed estático corromperia a verificação
  de integridade. Documentado no código e no handoff.
- Ciclo de vida: `afterAll` do integration-setup deleta todas as orgs ao fim de cada
  arquivo de teste — o baseline vive do provisioning até a primeira limpeza. Se um
  teste precisar do baseline por arquivo, follow-up: recriar em `seedDatabase()`.
- Caminho CI (service containers, `isCI`) não executa este bloco Docker — baseline
  de CI depende de eventual step equivalente no workflow (fora do escopo cirúrgico).
