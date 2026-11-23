# 12 — Triagem das 571 Falhas Schemathesis (Run 45083747478)

> Data: 2026-11-22 · Fonte: `schemathesis-report.json` + `schemathesis-junit.xml`
> do artifact `schemathesis-report-45083747478` (run real no GitHub Actions).
> Deliberação ChatGPT/Orquestrador: agrupar por causa-raiz, separar
> bug de produto × doc OpenAPI × seed × harness. SEM editar código de owners.

## 1. Contagem: ocorrências × causas-raiz

As 571 `unique_failures` agregam em **7 checks ST** → **5 causas-raiz sistêmicas**
+ 2 clusters de endpoints de autenteração Better Auth.

| Check | Count | Causa-raiz dominante | Classe |
|---|---|---|---|
| ST103 Undocumented status code | 531 | spec não declara 401/403/400 em massa | **Doc OpenAPI** (sistêmico) |
| ST204 Wrong response to undeclared method | 12 | TRACE retorna 404; spec implica 405 | Harness/spec (baixo) |
| ST101 Server error | 12 | 5xx reais em webhooks/SSO/agente | **Bug de produto** (prioridade) |
| ST201 Schema-violating accepted | 6 | endpoints aceitam payload inválido | Bug de produto (médio) |
| ST202 Schema-valid rejected | 5 | validação mais estrita que o spec | Doc×produto (médio) |
| ST108 Response violates schema | 3 | shape Better Auth ≠ spec | Doc OpenAPI |
| ST401 IgnoredAuth | 2 | `/auth/get-session`, `/auth/sign-out` sem auth | Revisão semântica Better Auth |

## 2. Causa-raiz 1 — ST103 (531 findings): o grosso é documentação, não bug

Detalhamento dos status codes recebidos nas falhas ST103 (extraído do JUnit):

| Status recebido | Ocorrências | Leitura |
|---|---|---|
| **401** | **499** | spec não declara 401 na maioria das operações autenticadas |
| 400 | 24 | spec não declara 400 (validação) em algumas operações |
| 404 | 6 | idem para 404 |
| 500 | 2 | idem para 500 |

**Mecânica:** o usuário de teste não possui organização/permissões → a API
retorna 401/403 em massa (warning do run: "549 operations returned only
401/403"). O `docs/openapi.yaml` não declara 401/403 na maioria dos
endpoints → cada resposta gera ST103. **Uma única correção sistêmica**
(declarar respostas de auth de forma consistente, ex.: componente
reutilizável `Unauthorized`/`Forbidden`) elimina ~93% dos findings —
sem tocar código de produto.

**NÃO é defeito de produto**: 401/403 são respostas corretas de autorização.
Classificação: **débito de documentação OpenAPI** — owner Agente 21 (Zara),
com revisão de escopo pelo 22 (Hugo) se adotarem componente global.

## 3. Causa-raiz 2 — ST101 Server error (12 findings): prioridade máxima

Endpoints com 5xx reais — candidatos a bug de produto:

| Operação | Resposta | Evidência |
|---|---|---|
| `POST /agent/ecosystem/connectors/{provider}/test` | 500 | `prisma.slackConnection.findFirst()` invocation error — campo `enabled` na query (possível drift schema×código) |
| `POST /integrations/3cx/webhook` | 503 | "Webhook não configurado" — ambiente sem credencial; 503 pode ser comportamento correto mas gera ST101 |
| `POST /integrations/birth-voice/webhook` | 5xx | webhook sem config/assinatura válida |
| `POST /integrations/chatwoot/webhook` | 5xx | idem |
| `POST /integrations/stripe/webhook/{connectionId}` | 5xx | "Configuração de rota inválida" 500 |
| `POST /webhooks/email/webhook` | 5xx | idem família webhook |
| `POST /webhooks/signature/webhook` | 5xx | idem |
| `POST /webhooks/voice-result` | 5xx | idem |
| `POST /auth/sso-discover` | 5xx | SSO discovery com payload fuzzado |
| `TRACE /auth/sso-discover`, `TRACE /auth/sso-providers` | 5xx | TRACE reaching handler? |

**Subdivisão necessária pelo owner:**
- **5xx com exceção Prisma/código** (ex.: `slackConnection.findFirst`) →
  **bug real de produto** — prioridade P0.
- **503 "webhook não configurado"** → provável comportamento correto de
  ambiente; avaliar se spec deve declarar 503 ou se deve retornar 404/400.
- **TRACE em rotas** → Express pode não ter handler; verificar se cai em
  middleware que quebra.

Owners prováveis: Agente 22 (Hugo — rotas/middlewares), Agente 51 (Bela —
credenciais/webhooks Bitrix/integrações), Agente 96 (Nera — auth/SSO),
Agente 50 (Atlas — coordenação integrações).

## 4. ST204 (12) — TRACE → 404 em vez de 405

12 operações retornam 404 para `TRACE` onde o spec (ou convenção) implica
405. Causa: o app não implementa handler de método explícito; o fallback
responde 404. **Classe: harness/spec** — correção possível: middleware de
método não permitido (405) ou declarar TRACE no spec como não suportado.
Owner: Agente 22. Severidade baixa — não bloqueia segurança.

## 5. ST401 (2, severidade critical no relatório) — revisar semântica

- `GET /auth/get-session` — Better Auth retorna sessão vazia/nula sem
  credencial; provavelmente **comportamento correto** (endpoint de leitura
  de sessão). Provável falso positivo → documentar no spec que 200 com
  `null` é esperado, ou ajustar check.
- `POST /auth/sign-out` — sign-out sem sessão é no-op idempotente;
  idem.
**Ação:** Agente 96 (Nera) + Agente 21 decidir se é falso positivo de
semântica Better Auth ou finding real. NÃO tratar como breach — o check
ST401 assume que "sem auth ⇒ 401", o que não se aplica a endpoints de
sessão por design.

## 6. ST201/ST202/ST108 — auth Better Auth × spec (14 findings)

- ST108 (3): `GET /auth/get-session`, `POST /auth/sign-up/email` — shape da
  resposta Better Auth difere do declarado no spec.
- ST202 (5): sign-up/sso-discover/bitrix-webhook/demo-leads/lead-capture —
  request válido pelo spec rejeitado (validação mais estrita no código).
- ST201 (6): get-session, swarm/learn, api-keys, auth-extra/* — request
  inválido aceito.
**Classe: contrato auth Better Auth** — owner Agente 96 (Nera) com Zara (21)
para alinhar spec ao comportamento real do better-auth.

## 7. Classificação final para handoff

| Prioridade | Cluster | Findings | Owner sugerido | Tipo de ação |
|---|---|---|---|---|
| P0 | ST101 5xx reais (Prisma/webhook/SSO) | ~12 | 22/51/96/50 | corrigir código ou tratar erro → 4xx |
| P1 | ST103 doc gap (401/403/400/404/500 não declarados) | 531 | 21 (+22) | declarar respostas no OpenAPI (componente global) |
| P1 | ST201/ST202/ST108 contrato auth | 14 | 96+21 | alinhar spec×better-auth |
| P2 | ST204 TRACE→405 | 12 | 22 | middleware 405 ou doc |
| P2 | ST401 semântica sessão | 2 | 96+21 | classificar falso-positivo×real |

## 8. Fixtures e reexecução (proposta — não implementada)

Para reduzir ruído e medir cobertura funcional real:

1. **Org context:** provisionar organização + membership para o usuário de
   teste (seed no step "Provisionar sessão" ou fixture dedicada) — deve
   derrubar a maioria dos 401/403 e permitir que mutações alcancem handlers.
2. **Roles:** testar com role admin/member para separar 403-de-permissão
   de 401-de-auth.
3. **Seeds mínimas:** criar entidades referenciadas por path params
   (lead, company, connection) via API ou Prisma seed — resolve os 5 ops
   com 404 e os webhooks `{connectionId}`.
4. **Métricas de reexecução:** reportar `operations.tested`,
   `test_cases.generated`, warnings (auth/ratelimit/missing-data) e
   `unique_failures` por check — comparar com baseline 571.
5. **Critério de aceite do gate:** definição de quais checks são
   bloqueantes (ex.: ST101 server error) vs informativos — decisão do
   Orquestrador, não do workflow.

## 9. MINORs da auditoria independente — proposta de correção

| # | MINOR | Proposta |
|---|---|---|
| 1 | `schemathesis-report/` no artifact path provavelmente vazio | remover o path do upload ou garantir `--report-dir` — cosmético |
| 2 | credenciais efêmeras em `--data` do curl (visível em `ps`) | usar `--data @/tmp/payload.json` ou env var — higiene |
| 3 | `pull_request.paths` não cobre `package.json`/`package-lock.json` | adicionar ao paths — decisão 08A |
| 4 | `server.log` dump pode conter dados de request | sanitizar tail (grep -v cookie/auth) antes de imprimir — ou aceitar risco efêmero documentado |
| 5 | flake teórico no controle negativo (orçamento compartilhado) | `--phases coverage,fuzzing` no controle negativo para isolar orçamento — opcional |

Todas são mudanças em `.github/workflows/api-schema-fuzz.yml` — exigem
aprovação 08A/00 antes de editar (ownership de workflows).
