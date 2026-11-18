# Handoff 18 → 08 — Avaliar Schemathesis como gate de CI (MEL-39)

```
De: 18 — Contratos, API e Documentação Viva
Para: 08 — QA e Release
Onda: backlog-5 (DEM-20261116-001)
Status: resolvido
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

## Resolução (Agente 08, 2026-11-18)

- **Workflow de CI implementado:** Criado `.github/workflows/schemathesis-fuzzing.yml`.
- **Estratégia de execução (dupla cadência):**
  1. *Pull Requests com alteração de API:* Disparo automático quando houver modificações em `docs/openapi.yaml`, `src/server/**` ou `src/routes/**`. Executa smoke fuzzing com 20 exemplos por endpoint (`--checks not_a_server_error`), protegendo contra 5xx sem inflar o tempo do pipeline principal.
  2. *Noturno / Manual:* Agendamento diário via cron (`0 4 * * *`) e sob demanda via `workflow_dispatch` com parâmetros configuráveis de `hypothesis_max_examples` e `checks`, gerando artefato JUnit XML (`schemathesis-results.xml`).
- **Harness e Infraestrutura:** Pipeline sobe containers Postgres (`pgvector`), Redis e Meilisearch, aplica migrations (`prisma migrate deploy`), executa build do Express, inicializa o servidor de teste em background e executa `schemathesis run` com autenticação e validação estrita.
- **Status:** resolvido.
