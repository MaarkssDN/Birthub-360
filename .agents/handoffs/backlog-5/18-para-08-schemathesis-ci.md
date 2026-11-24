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

- **Workflow de CI implementado:** pipeline Schemathesis consolidado em `.github/workflows/api-schema-fuzz.yml` (consolidação Genesis 2026-11-21 — o `schemathesis-fuzzing.yml` proposto foi fundido neste arquivo para eliminar duplicação; inclui gatilho PR smoke + schedule/dispatch deep, URL `/api` corrigida, rate-limit overrides, cobertura efetiva e controle negativo).
- **Estratégia de execução (dupla cadência, consolidada):**
  1. *Pull Requests com alteração de API:* Disparo automático quando houver modificações em `docs/openapi.yaml`, `server.ts`, `src/bootstrap/**`, `src/features/**/routes/**`, `src/shared/**`, `prisma/schema.prisma`, `prisma/migrations/**` ou no próprio workflow. Executa smoke fuzzing com 15 exemplos por endpoint e `--max-time 900`.
  2. *Noturno / Manual:* Agendamento diário via cron (`37 5 * * *`) e sob demanda via `workflow_dispatch` com `max_examples`/`max_time` configuráveis (default 50 exemplos / 3600s), gerando artefatos JUnit XML + JSON.
- **Correções Genesis (pós-auditoria Agente 09):** base URL `-u http://127.0.0.1:3000/api` (rotas montam sob `/api`); headers `Origin`+`Referer` para o `csrfGuard`; overrides de todos os rate limiters (`API/AI/BUG_REPORT/EXPORT/PUBLIC_LEAD/PUBLIC_BOOKING=100000`, `AUTH=5000`); verificação de cobertura via `operations.tested`/`test_cases.generated` (zero = reprova); controle negativo com URL sem `/api` em PR; sanity anti-HTML da SPA; sessão real via sign-up+sign-in better-auth com cookies capturados (sem Bearer fictício, sem echo de Set-Cookie).
- **Harness e Infraestrutura:** Pipeline sobe containers Postgres (`pgvector`), Redis e Meilisearch, aplica migrations (`prisma migrate deploy`), executa build do Express, inicializa o servidor de teste em background e executa `schemathesis run` com autenticação e validação estrita.
- **Status:** resolvido.
