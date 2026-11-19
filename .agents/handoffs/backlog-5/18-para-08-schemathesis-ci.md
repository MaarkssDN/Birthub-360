# Handoff 18 → 08 — Avaliar Schemathesis como gate de CI (MEL-39)

```
De: 18 — Contratos, API e Documentação Viva
Para: 08 — QA e Release
Onda: backlog-5 (DEM-20261116-001)
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-39
Sprint destino: Onda 5 backlog
```

## Problema

`verify:openapi-drift` passa (80 prefixos, 506 paths, 0 deriva). O script
`test:api-schema` já existe (`.\.venv-opensource\Scripts\schemathesis.exe run
docs/openapi.yaml --url http://127.0.0.1:3000`) mas exige venv Python + app no
ar — não roda em CI hoje.

## Alteração necessária

Decidir se Schemathesis entra no CI: precisaria de job que suba app de teste
(Postgres+Redis `_test`) e rode schemathesis. Se aprovado, é trabalho do 08
(workflows + harness). Alternativa mais leve: manter drift-check (já verde) como
gate e Schemathesis como job noturno/manual.

## Evidência

`npm run verify:openapi-drift` → ✅ 0 deriva (2026-11-16).
