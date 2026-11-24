# Relatório — Agente 21 (Zara) · ONDA3-21-API-CONTRACTS

- Missão: DEM-20261123-001, Onda 3 — diagnosticar drift OpenAPI ↔ implementação
  e corrigir dentro do ownership (`docs/openapi.yaml`; `src/api/schemas/**`
  não existe no repo — schemas Zod vivem por feature, fora do ownership).
- Branch: `agente/21-api-contracts-onda3` · Baseline: `32d07c375`
- Runtime: Devin subagent (worktree `wt-21-api-contracts`)

## 1. Diagnóstico do drift

### 1.1 Gate estático oficial — VERDE

`npm run verify:openapi-drift` → ✅ 0 deriva (81 prefixos, 495 paths
documentados, 79 routers resolvidos). Sem endpoints reais sem documentação
(Passe 2, recursivo).

### 1.2 Schemathesis na main — causa raiz identificada (NÃO é drift de spec)

Run `45340347872` (main, schedule): 571/571 ops falharam em Coverage,
3.264 falhas em Stateful. Análise do log + reprodução local:

- `docs/openapi.yaml` declara `servers: [{ url: /api }]` e paths sem prefixo.
- O workflow `.github/workflows/api-schema-fuzz.yml` usa
  `schemathesis run -u http://127.0.0.1:3000`. A flag `-u/--url` **substitui a
  base URL inteira** e descarta o path `/api` do `servers`.
- Resultado: todas as requests iam para `/<path>` (sem `/api`) → fallback SPA
  devolve HTML 200 → falhas em massa ST401/ST105/ST201/ST103.
- Reproduzido localmente com servidor echo + Schemathesis 4.32.7:
  `-u` → `GET /organization-modules`; `--origin` → `GET /api/organization-modules`.
- Correção pertence ao workflow (`.github/workflows/**`, dono 94/08):
  trocar `-u` por `--origin` (ou `-u http://127.0.0.1:3000/api`).
  Handoff: `.agents/handoffs/onda-3/21-para-94-schemathesis-origin-flag.md`.

### 1.3 Varredura inversa doc→código — 16 operações fantasma removidas

O gate oficial só verifica código→doc. Estendi a mesma técnica estática
(imports estáticos, `router.METHOD` literais, mounts `router.use` aninhados)
para o sentido documentado→real. Após descartar falsos positivos
(routers-factory, handler better-auth, `app.get` inline), 15 path items
confirmadamente sem rota foram removidos de `docs/openapi.yaml`:

- `/market-intelligence/companies{,/{cnpj},/{cnpj}/approve-to-pipeline}` (3 ops)
  — duplicata defasada; rotas reais vivem em `/companies/market-intelligence*`.
- `/agent/{chat,groq,roleplay,qualification}` (4 ops)
- `/usage/quota`, `/usage/quota/alert` (2 ops)
- `/cadence/opt-outs/check`, `/cadence/runs/{id}/events` (2 ops)
- `/intelligence/swarm/{schedule,status}` (2 ops — scheduler é worker BullMQ)
- `/copiloto-ia/conversations/{id}/live-insights` (GET+POST),
  `/copiloto-ia/live-hud/{callId}` (3 ops)

Detalhes e pedido de contestação: `.agents/handoffs/onda-3/21-para-00-paths-fantasma-openapi.md`.

## 2. Correções commitadas (ownership)

- `docs/openapi.yaml`: −357 linhas, somente remoção dos 15 path items
  fantasma. Nenhum path real foi alterado; nenhum schema renomeado/removido.
- Handoffs: `21-para-94-schemathesis-origin-flag.md`,
  `21-para-00-paths-fantasma-openapi.md`.

## 3. Validação executada

| Verificação | Resultado |
|---|---|
| `npm run verify:openapi-drift` (após edição) | ✅ 0 deriva; 495 paths / 555 ops |
| Parse YAML (`yaml` npm, mesmo do gate) | ✅ ok |
| Schemathesis load do spec (local 4.32.7, echo server) | ✅ "Loaded specification", 555 operations |
| Resolução URL `-u` vs `--origin` (echo server) | ✅ evidência do handoff 94 |
| Varredura inversa doc→código | 19 "phantoms" restantes = todos falsos positivos verificados manualmente |
| Schemathesis contra stack real | ⛔ não executado — exige Postgres+Redis+build+seed (~1h de CI); reproduzir localmente fora do escopo da sessão. Registrado como pendência pós-fix da flag. |

## 4. Observações

- `docs/AGENTS.md` declara Agente 08 dono de `docs/`; a missão ONDA3-21
  concedeu explicitamente `docs/openapi.yaml` ao Agente 21 — edição
  restrita a esse arquivo, nenhuma outra doc tocada.
- PyYAML (Python) falha ao parsear `docs/openapi.yaml` na linha ~9589
  (erro de scanner), enquanto `yaml` (npm) e o loader do Schemathesis
  aceitam o arquivo — divergência de parser pré-existente, provavelmente
  strictness YAML 1.1 vs 1.2. Não bloqueia nenhum gate do repo; registrado
  como observação para o dono do spec (21/18) avaliar em onda futura.
- Após o fix da flag no workflow, espera-se que o Schemathesis exponha
  findings reais (status codes não documentados, schemas divergentes).
  Isso é triagem nova — recomendo baseline/`--exclude-checks` progressivo
  (ver handoff 18→08 backlog-5).

## 4.1 Commits preexistentes no branch (execução paralela do 21)

Durante a sessão, o branch recebeu dois commits de outra execução da mesma
missão (ONDA3-21), que este trabalho complementa sem conflito:

- `ae5988377` — `security: []` em 13 operações públicas/webhook + ressincronia
  do spec Postman (`postman/specs/.../openapi.yaml`).
- `e73b17c91` — run report `.agents/runs/onda3-21-api-contracts.md` + handoff
  `21-para-08-teste-conformidade-security-openapi.md`.

Este relatório (`21-relatorio.md`) cobre o diagnóstico Schemathesis/CI e a
limpeza de paths fantasma — frentes não abordadas por aquela execução.

## 5. Arquivos alterados

- `docs/openapi.yaml` (modificado)
- `.agents/handoffs/onda-3/21-para-94-schemathesis-origin-flag.md` (novo)
- `.agents/handoffs/onda-3/21-para-00-paths-fantasma-openapi.md` (novo)
- `.agents/runs/onda-3/21-relatorio.md` (novo)
