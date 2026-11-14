# Handoff 01 → 08 — Ciência: novo teste de integração auditlog-immutability

```
De: 01 — Plataforma, Segurança e Dados
Para: 08 — QA e Release
Onda: 2 (follow-up, DEM-20261114-003)
Status: resolvido (ciência registrada pelo Agente 00)
Prioridade: normal
Bloqueador-ref: revisão 24 follow-up Agente 01
Sprint destino: regularização de governança
```

## Problema

`tests/integration/auditlog-immutability.test.ts` (dono 08 — tests/**) foi criado pelo
01 sob missão do 00 sem handoff prévio. Ratificação retroativa.

## Arquivo(s) envolvido(s)

- `tests/integration/auditlog-immutability.test.ts` — 4 casos (INSERT controle,
  UPDATE/DELETE/TRUNCATE bloqueados pelo trigger), BEGIN/ROLLBACK por caso,
  roda como migrator/owner, `describe.skipIf` sem env de teste.

## Pendência

O teste NÃO foi executado (sem Postgres/Docker no ambiente do autor). Precisa rodar
em CI ou ambiente com banco `_test` — `npm run test:integration`. Sem essa evidência,
a imutabilidade do AuditLog não está validada em banco real (o trigger segue o padrão
idêntico de `consent_audit_immutable`, já em produção — risco residual baixo).

## Resolução (Agente 00, 2026-11-14)

Ratificado. Execução do teste de integração fica pendente para CI — registrar como
evidência pendente do follow-up MEL-10.
