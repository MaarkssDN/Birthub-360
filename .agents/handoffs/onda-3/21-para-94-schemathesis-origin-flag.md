# Handoff 21 → 94 — Schemathesis em falha na main: `-u` descarta o base path `/api` do spec

```
De: 21 — Zara (Contratos de API, OpenAPI e Schemathesis Zod)
Para: 94 — Tess (CI/CD e Operações Git/Deploy) — cc: 08 — Dora (QA e Release)
Onda: 3 (demanda DEM-20261123-001, missão ONDA3-21-API-CONTRACTS)
Status: aberto
Prioridade: alta (Schemathesis é check visível na main e está 100% vermelho)
Bloqueador-ref: DEM-20261123-001 ("Schemathesis em falha" nos required checks)
```

## Problema

O workflow `.github/workflows/api-schema-fuzz.yml` roda:

```
schemathesis run docs/openapi.yaml \
  -u http://127.0.0.1:3000 \
  ...
```

`docs/openapi.yaml` declara `servers: [{ url: /api }]` e paths **sem** o prefixo
`/api` (convenção do `verify:openapi-drift`). A flag `-u/--url` do Schemathesis
**substitui integralmente a base URL**, ignorando o path do `servers` — todo
request vai para `http://127.0.0.1:3000/<path>` em vez de
`http://127.0.0.1:3000/api/<path>`.

Sem o `/api`, cada uma das 571 operações cai no fallback SPA (HTML 200 do
frontend), o que gera falhas em massa nos checks:

- ST401 "API accepts requests without authentication" (~235 ops)
- ST105 "Undocumented Content-Type" (recebe `text/html`, doc diz `application/json`) (~227 ops)
- ST201 "Schema-violating request accepted" (~221 ops)
- ST103 "Undocumented status code" (~286 ops — ex.: DELETE retorna 404 do
  catch-all por não existir rota fora de `/api`)

Run de referência (main, schedule, falha): `45340347872` —
"26.453 passed / 3.264 failed" em Stateful; 571/571 ops falharam em Coverage.

## Evidência (reproduzido localmente, sem stack)

Servidor echo trivial em `127.0.0.1:8899` + Schemathesis 4.32.7 local:

- `schemathesis run docs/openapi.yaml -u http://127.0.0.1:8899 ...` →
  requests em `GET /organization-modules` (**sem** `/api`)
- `schemathesis run docs/openapi.yaml --origin http://127.0.0.1:8899 ...` →
  requests em `GET /api/organization-modules` (**correto** — `--origin`
  preserva o base path do `servers` do spec)

## Alteração necessária (fora do ownership do 21 — workflow é do 94/08)

Em `.github/workflows/api-schema-fuzz.yml`, step "Rodar Schemathesis":

```diff
-          .venv-schemathesis/bin/schemathesis run docs/openapi.yaml \
-            -u http://127.0.0.1:3000 \
+          .venv-schemathesis/bin/schemathesis run docs/openapi.yaml \
+            --origin http://127.0.0.1:3000 \
```

Alternativa equivalente: manter `-u` mas apontar para
`http://127.0.0.1:3000/api`. `--origin` é preferível porque mantém o path
derivado do próprio spec (se o mount `/api` mudar, o spec continua fonte
única da verdade).

O mesmo ajuste vale para o script local `npm run test:api-schema`
(`package.json` — hoje `schemathesis run docs/openapi.yaml --url
http://127.0.0.1:3000`), se ele for mantido/usado: trocar `--url` por
`--origin`. (package.json está fora do meu ownership — incluído aqui para o
mesmo executor avaliar.)

## Ressalvas

- Após a correção da flag, é esperado que o Schemathesis revele findings
  **reais** de contrato (status codes não documentados, schemas de resposta
  divergentes, etc.) que hoje estão mascarados pelo falso 200/HTML. A primeira
  execução pós-fix provavelmente continuará vermelha — isso é triagem nova,
  não regressão. Sugestão já registrada no handoff 18→08
  (`.agents/handoffs/backlog-5/18-para-08-schemathesis-ci.md`): baseline +
  `--exclude-checks` progressivo.
- Não enfraquecer checks nem remover o job: o gate bloqueante de contrato
  continua sendo `npm run verify:openapi-drift` (verde).

## Evidências

- Diagnóstico completo: `.agents/runs/onda-3/21-relatorio.md`
- `docs/openapi.yaml` já estava correto (servers `/api` + paths sem prefixo);
  nenhuma alteração de spec é necessária para este fix.
- `npm run verify:openapi-drift` → ✅ 0 deriva (após limpeza de paths
  fantasma, 495 paths / 555 operações).
